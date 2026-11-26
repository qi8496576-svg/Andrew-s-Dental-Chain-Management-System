package com.adc.identity;

/** Only the server-to-server adapter supplies a trusted external account. */
public interface WechatCodeExchange {
    TrustedIdentity exchange(String code);
    record TrustedIdentity(String appId,String openId) {
        @Override public String toString(){return "TrustedWechatIdentity[external identifiers redacted]";}
    }
}
