package com.adc.identity;

import static org.junit.jupiter.api.Assertions.*;
import org.junit.jupiter.api.Test;

class PasswordHasherTest {
    @Test void matureArgon2idUsesApprovedParametersAndRandomSalts() {
        var hasher=new PasswordHasher();var password="fixture-only-long-password";
        var a=hasher.encode(password);var b=hasher.encode(password);
        assertNotEquals(a,b);assertTrue(a.startsWith("$argon2id$v=19$m=19456,t=2,p=1$"));
        assertTrue(hasher.matches(password,a));assertFalse(hasher.matches("wrong",a));
        assertFalse(hasher.matches(password,null));assertFalse(hasher.matches(password,"plain-password"));
    }
}
