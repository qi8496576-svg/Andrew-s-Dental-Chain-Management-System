package com.adc.identity;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.domain.shared.DomainFailure;
import com.sun.net.httpserver.HttpServer;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class OfficialWechatClientTest {
    @Test void realHttpAdapterAcceptsOnlySuccessfulTrustedOpenidAndDiscardsSessionKey() throws Exception {
        var body=new AtomicReference<>("{\"openid\":\"CaseSensitive-A\",\"session_key\":\"must-not-escape\"}");
        var query=new AtomicReference<String>();var server=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        server.createContext("/exchange",exchange->{query.set(exchange.getRequestURI().getRawQuery());var bytes=body.get().getBytes(StandardCharsets.UTF_8);exchange.sendResponseHeaders(200,bytes.length);exchange.getResponseBody().write(bytes);exchange.close();});
        server.start();
        try {
            var client=new OfficialWechatClient(URI.create("http://127.0.0.1:"+server.getAddress().getPort()+"/exchange"),"fixture-app","fixture-server-secret");
            var identity=client.exchange("code+with&reserved");assertEquals("CaseSensitive-A",identity.openId());assertEquals("fixture-app",identity.appId());
            assertTrue(query.get().contains("js_code=code%2Bwith%26reserved"));assertFalse(identity.toString().contains("must-not-escape"));
            body.set("{\"errcode\":40029,\"openid\":\"forged-success\"}");assertEquals(401,assertThrows(DomainFailure.class,()->client.exchange("code")).status());
            body.set("{\"errcode\":-1}");assertEquals(503,assertThrows(DomainFailure.class,()->client.exchange("code")).status());
            body.set("{}");assertEquals(503,assertThrows(DomainFailure.class,()->client.exchange("code")).status());
        } finally {server.stop(0);}
    }
    @Test void productionRejectsMissingConfigurationOrTestProvider() {
        var environment=new org.springframework.mock.env.MockEnvironment();environment.setActiveProfiles("prod");
        assertThrows(IllegalStateException.class,()->new OfficialWechatClient(environment));
        assertThrows(IllegalStateException.class,()->new AuthenticationProviderConfiguration(environment,code->new WechatCodeExchange.TrustedIdentity("fake","fake")));
    }
}
