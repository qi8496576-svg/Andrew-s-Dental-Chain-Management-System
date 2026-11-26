package com.adc.infrastructure;
import static org.junit.jupiter.api.Assertions.*;
import java.net.*;
import java.net.http.*;
import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;

class OperationalHealthIT extends MigratedDatabaseTest {
    @Test void privateProbeDistinguishesProcessFromDatabaseReadinessWithoutExposingDetails()throws Exception{
        try(var pool=runtimeDataSource();var health=new OperationalHealth(pool,new MockEnvironment().withProperty("adc.management.address","127.0.0.1").withProperty("adc.management.port","0"))){
            health.start();var client=HttpClient.newHttpClient();String base="http://127.0.0.1:"+health.port();
            assertEquals(200,client.send(HttpRequest.newBuilder(URI.create(base+"/live")).GET().build(),HttpResponse.BodyHandlers.ofString()).statusCode());
            assertEquals(200,client.send(HttpRequest.newBuilder(URI.create(base+"/ready")).GET().build(),HttpResponse.BodyHandlers.ofString()).statusCode());
            assertEquals(405,client.send(HttpRequest.newBuilder(URI.create(base+"/ready")).POST(HttpRequest.BodyPublishers.noBody()).build(),HttpResponse.BodyHandlers.ofString()).statusCode());
            assertEquals(404,client.send(HttpRequest.newBuilder(URI.create(base+"/ready/anything")).GET().build(),HttpResponse.BodyHandlers.ofString()).statusCode());
            pool.close();var unavailable=client.send(HttpRequest.newBuilder(URI.create(base+"/ready")).GET().build(),HttpResponse.BodyHandlers.ofString());assertEquals(503,unavailable.statusCode());assertEquals("{\"status\":\"DOWN\"}",unavailable.body());assertFalse(unavailable.body().contains("jdbc"));
            assertEquals(200,client.send(HttpRequest.newBuilder(URI.create(base+"/live")).GET().build(),HttpResponse.BodyHandlers.ofString()).statusCode());
        }
    }
}
