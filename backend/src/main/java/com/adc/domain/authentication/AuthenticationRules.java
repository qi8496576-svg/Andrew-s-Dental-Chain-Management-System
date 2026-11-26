package com.adc.domain.authentication;

import java.time.Instant;

public final class AuthenticationRules {
    private AuthenticationRules() { }
    public record Throttle(int failures,Instant blockedUntil) { }
    public static boolean blocked(Throttle state,Instant now) {return state.blockedUntil!=null && now.isBefore(state.blockedUntil);}
    public static Throttle failed(Throttle state,Instant now) {
        if(blocked(state,now))return state;
        int count=state.blockedUntil==null?state.failures+1:1;
        return new Throttle(count,count>=5?now.plusSeconds(900):null);
    }
}
