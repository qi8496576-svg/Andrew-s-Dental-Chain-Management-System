package com.adc.identity;

import com.adc.domain.shared.DomainFailure;
import java.net.*;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

@Component
public final class OfficialWechatClient implements WechatCodeExchange {
    private final URI endpoint;
    private final String appId,secret;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).followRedirects(HttpClient.Redirect.NEVER).build();
    @Autowired public OfficialWechatClient(Environment environment) {
        endpoint=URI.create("https://api.weixin.qq.com/sns/jscode2session");
        appId=environment.getProperty("adc.wechat.app-id","");
        String file=environment.getProperty("adc.wechat.app-secret-file");
        try {secret=file==null?environment.getProperty("adc.wechat.app-secret",""):Files.readString(Path.of(file)).strip();}
        catch(Exception e){throw new IllegalStateException("Unable to read WeChat configuration");}
        if(environment.matchesProfiles("prod") && (appId.isBlank() || secret.isBlank()))throw new IllegalStateException("Production WeChat configuration required");
    }
    /** Package-only test constructor; production endpoint is fixed and cannot be supplied by a request. */
    OfficialWechatClient(URI endpoint,String appId,String secret){this.endpoint=endpoint;this.appId=appId;this.secret=secret;}
    private static String encode(String value){return URLEncoder.encode(value,StandardCharsets.UTF_8);}
    @Override public TrustedIdentity exchange(String code) {
        if(appId.isBlank() || secret.isBlank())throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");
        var uri=URI.create(endpoint+"?appid="+encode(appId)+"&secret="+encode(secret)+"&js_code="+encode(code)+"&grant_type=authorization_code");
        try {
            var response=http.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(5)).GET().build(),HttpResponse.BodyHandlers.ofInputStream());
            try(var stream=response.body()) {
                if(response.statusCode()!=200)throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");
                var bytes=stream.readNBytes(65537);if(bytes.length>65536)throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");
                var json=JsonMapper.builder().build().readTree(bytes);
                if(!json.isObject())throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");
                int error=json.path("errcode").asInt(0);
                if(error!=0)throw new DomainFailure(error==-1 || error==45011?503:401,error==-1 || error==45011?"IDENTITY_UNAVAILABLE":"AUTH_REQUIRED");
                var open=json.path("openid");
                if(!open.isTextual() || open.asText().isBlank() || open.asText().getBytes(StandardCharsets.UTF_8).length>128)throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");
                // session_key / unionid / provider error messages never leave the adapter.
                return new TrustedIdentity(appId,open.asText());
            }
        } catch(DomainFailure failure){throw failure;}
        catch(InterruptedException e){Thread.currentThread().interrupt();throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");}
        catch(Exception e){throw new DomainFailure(503,"IDENTITY_UNAVAILABLE");}
    }
}
