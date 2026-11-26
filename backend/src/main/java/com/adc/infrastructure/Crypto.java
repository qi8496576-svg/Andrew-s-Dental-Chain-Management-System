package com.adc.infrastructure;

import java.nio.charset.StandardCharsets;
import java.security.*;
import java.util.Base64;

public final class Crypto {
    private static final SecureRandom RANDOM=new SecureRandom();
    private Crypto() { }
    public static byte[] sha256(String value) {
        try { return MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)); }
        catch(NoSuchAlgorithmException e) { throw new IllegalStateException(e); }
    }
    public static String token() { var bytes=new byte[32];RANDOM.nextBytes(bytes);return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes); }
    public static long id() { long id;do { id=RANDOM.nextLong() & Long.MAX_VALUE; } while(id==0);return id; }
}
