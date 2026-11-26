package com.adc.application;

import com.adc.identity.*;
import com.adc.identity.AuthenticationTransactions.*;
import com.adc.domain.shared.DomainFailure;
import com.adc.infrastructure.CanonicalJson;
import java.util.*;
import org.springframework.stereotype.Service;

/** Rejections are raised after the identity transaction commits the failed-attempt counter. */
@Service
public class AuthenticationService {
    private final AuthenticationTransactions identities;private final WechatCodeExchange wechat;private final AtomicCommandExecutor commands;
    public AuthenticationService(AuthenticationTransactions identities,WechatCodeExchange wechat,AtomicCommandExecutor commands){this.identities=identities;this.wechat=wechat;this.commands=commands;}
    private static IssuedSession issued(Outcome outcome) {if(outcome.session()==null)throw new DomainFailure(outcome.status(),outcome.code());return outcome.session();}
    public IssuedSession staff(String username,String password,String oldToken,String request) {
        if(username==null || username.isBlank() || username.length()>100 || password==null || password.isEmpty())throw new DomainFailure(400,"INVALID_REQUEST");
        return issued(identities.staff(username,password,oldToken,request));
    }
    public IssuedSession wechat(String code,String source,String request) {
        if(code==null || code.isBlank())throw new DomainFailure(400,"INVALID_REQUEST");
        identities.checkAnonymousSource(source);
        WechatCodeExchange.TrustedIdentity external;
        try {external=wechat.exchange(code);}catch(DomainFailure error) {
            if(error.status()!=401){identities.providerFailure(request);throw error;}return issued(identities.anonymousFailure(source,request));
        }
        return issued(identities.wechat(external,source,request));
    }
    public Map<String,Object> me(String token,String client){return identities.me(token,client);}
    public void logout(String token,String client,String key,String request)throws Exception {
        commands.execute(new AtomicCommandExecutor.Command(token,client,"logout",key,CanonicalJson.requestHash("DELETE","/api/v1/auth/session",null,"{}"),request),identity->{},identity->{
            identities.revoke(identity);
            return new AtomicCommandExecutor.Result("[\"Session:"+identity.sessionId()+"\"]","{}",204,"Session",identity.sessionId(),List.of());
        });
    }
}
