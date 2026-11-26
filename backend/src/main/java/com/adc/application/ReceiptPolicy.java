package com.adc.application;

import com.adc.identity.IdentityGate.Identity;
import java.util.Set;

/** Each implemented module registers its original operations and current object authorization. */
public interface ReceiptPolicy {
    Set<String> operations();
    /** refs is null when no successful result exists; still check current functional access. */
    void authorize(Identity identity,String operation,String refs);
}
