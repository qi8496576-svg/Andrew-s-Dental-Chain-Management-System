package com.adc.interfaces;

import com.adc.domain.shared.DomainFailure;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;

/** Channel is selected by server-validated credential transport, never by a client type header. */
public record RequestProof(String token,String client) {
    public static RequestProof from(HttpServletRequest request) {
        var tokens=new ArrayList<String>();
        if(request.getCookies()!=null)for(var cookie:request.getCookies())if(cookie.getName().equals("adc_session"))tokens.add(cookie.getValue());
        String authorization=request.getHeader("Authorization");
        if(tokens.size()>1 || (!tokens.isEmpty() && authorization!=null))throw new DomainFailure(403,"ACCESS_DENIED");
        if(authorization!=null) {
            if(request.getHeader("Origin")!=null || !authorization.startsWith("Bearer "))throw new DomainFailure(403,"ACCESS_DENIED");
            return new RequestProof(authorization.substring(7),"WECHAT");
        }
        if(tokens.isEmpty())throw new DomainFailure(401,"AUTH_REQUIRED");
        return new RequestProof(tokens.getFirst(),"WEB");
    }
    public static String requestId(HttpServletRequest request) {
        var id=(String)request.getAttribute("adc.request_id");
        if(id==null) {id=UUID.randomUUID().toString();request.setAttribute("adc.request_id",id);}
        return id;
    }
    @Override public String toString() {return "RequestProof[credentials redacted]";}
}
