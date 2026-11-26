package com.adc.infrastructure;

import com.sun.net.httpserver.*;
import jakarta.annotation.PreDestroy;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.*;
import javax.sql.DataSource;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/** Plan's private operator port, deliberately separate from all business HTTP routes. */
@Component
@ConditionalOnProperty(name="adc.management.enabled",havingValue="true")
public final class OperationalHealth implements AutoCloseable{
    private final DataSource dataSource;private final String address;private final int configuredPort;
    private HttpServer server;private ExecutorService executor;
    public OperationalHealth(DataSource dataSource,Environment environment){this.dataSource=dataSource;address=environment.getProperty("adc.management.address","127.0.0.1");configuredPort=environment.getProperty("adc.management.port",Integer.class,9091);}
    @EventListener(ApplicationReadyEvent.class)
    public synchronized void start()throws IOException{
        if(server!=null)return;server=HttpServer.create(new InetSocketAddress(address,configuredPort),16);
        executor=new ThreadPoolExecutor(2,2,0,TimeUnit.SECONDS,new ArrayBlockingQueue<>(32),Thread.ofPlatform().name("operator-health-",0).daemon().factory(),new ThreadPoolExecutor.AbortPolicy());server.setExecutor(executor);server.createContext("/",this::handle);server.start();
    }
    private void handle(HttpExchange request)throws IOException{
        int status=200;String path=request.getRequestURI().getPath();
        if(!path.equals("/live") && !path.equals("/ready"))status=404;
        else if(!request.getRequestMethod().equals("GET"))status=405;
        else if(path.equals("/ready"))try(var connection=dataSource.getConnection();var query=connection.createStatement()){
            query.setQueryTimeout(2);try(var result=query.executeQuery("SELECT COUNT(*) FROM adc_identity.flyway_schema_history WHERE version='200' AND success=true")){if(!result.next() || result.getInt(1)!=1)status=503;}
        }catch(Exception unavailable){status=503;}
        byte[] body=(status==200?"{\"status\":\"UP\"}":"{\"status\":\"DOWN\"}").getBytes(StandardCharsets.UTF_8);request.getResponseHeaders().set("Content-Type","application/json");request.getResponseHeaders().set("Cache-Control","no-store");request.sendResponseHeaders(status,body.length);try(var output=request.getResponseBody()){output.write(body);}finally{request.close();}
    }
    public synchronized int port(){if(server==null)throw new IllegalStateException("Operator probe not started");return server.getAddress().getPort();}
    @Override @PreDestroy public synchronized void close(){if(server!=null){server.stop(0);server=null;}if(executor!=null){executor.shutdownNow();executor=null;}}
}
