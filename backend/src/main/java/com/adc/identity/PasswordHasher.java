package com.adc.identity;

import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public final class PasswordHasher {
    private final Argon2PasswordEncoder encoder=new Argon2PasswordEncoder(16,32,1,19456,2);
    public String encode(String password) {
        if(password==null || password.isEmpty())throw new IllegalArgumentException("Credential required");
        return encoder.encode(password);
    }
    public boolean matches(String password,String hash) {
        if(password==null || hash==null || !hash.startsWith("$argon2id$"))return false;
        try {return encoder.matches(password,hash);}
        catch(IllegalArgumentException e) {return false;}
    }
}
