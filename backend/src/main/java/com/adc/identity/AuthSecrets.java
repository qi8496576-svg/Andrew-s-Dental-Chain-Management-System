package com.adc.identity;

import java.nio.charset.StandardCharsets;
import java.util.*;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
public final class AuthSecrets {
    private final byte[] key;
    @Autowired public AuthSecrets(Environment environment) {
        String configured=environment.getProperty("adc.auth-secret");
        if(configured==null || configured.isBlank()) {
            if(environment.matchesProfiles("prod"))throw new IllegalStateException("Production authentication signing secret required");
            key=Base64.getUrlDecoder().decode(com.adc.infrastructure.Crypto.token());
        } else {
            try {key=Base64.getDecoder().decode(configured);}catch(IllegalArgumentException e){throw new IllegalStateException("Invalid authentication signing secret");}
            if(key.length<32)throw new IllegalStateException("Authentication signing secret must contain at least 32 bytes");
        }
    }
    public AuthSecrets(byte[] key) {if(key.length<32)throw new IllegalArgumentException("Signing key too short");this.key=key.clone();}
    public byte[] derive(String domain,String value) {
        try {var mac=Mac.getInstance("HmacSHA256");mac.init(new SecretKeySpec(key,"HmacSHA256"));return mac.doFinal((domain+"\0"+value).getBytes(StandardCharsets.UTF_8));}
        catch(java.security.GeneralSecurityException e){throw new IllegalStateException("Authentication signing unavailable");}
    }
}
