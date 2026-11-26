package com.adc.infrastructure;
import java.net.*;
import java.net.http.*;
import java.time.Duration;
/** Local operator readiness check. Prints no response or exception/connection metadata. */
public final class HealthProbeMain{
    private HealthProbeMain(){}
    public static void main(String[] args){
        if(args.length!=0){System.exit(2);return;}
        try{var client=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).followRedirects(HttpClient.Redirect.NEVER).build();var request=HttpRequest.newBuilder(URI.create("http://127.0.0.1:9091/ready")).timeout(Duration.ofSeconds(5)).GET().build();System.exit(client.send(request,HttpResponse.BodyHandlers.discarding()).statusCode()==200?0:1);}catch(Exception unavailable){System.exit(1);}
    }
}
