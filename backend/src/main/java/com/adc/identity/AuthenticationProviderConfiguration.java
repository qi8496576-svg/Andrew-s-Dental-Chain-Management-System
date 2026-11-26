package com.adc.identity;

import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

@Configuration(proxyBeanMethods=false)
public class AuthenticationProviderConfiguration {
    public AuthenticationProviderConfiguration(Environment environment,WechatCodeExchange provider) {
        if(environment.matchesProfiles("prod") && !(provider instanceof OfficialWechatClient))throw new IllegalStateException("Production requires the official WeChat adapter");
    }
}
