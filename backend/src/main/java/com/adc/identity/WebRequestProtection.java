package com.adc.identity;

import com.adc.domain.shared.DomainFailure;
import com.adc.infrastructure.Crypto;
import com.adc.interfaces.*;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import java.net.URI;
import java.security.MessageDigest;
import java.time.*;
import java.util.*;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseCookie;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.web.csrf.*;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/** Signed anonymous context plus server-side session digest, used by Spring Security's CsrfFilter. */
@Component
public final class WebRequestProtection implements CsrfTokenRepository {
    private final JdbcTemplate db;private final AuthSecrets secrets;private final Clock clock;private final String origin;
    public WebRequestProtection(JdbcTemplate db,AuthSecrets secrets,Clock clock,Environment environment) {
        this.db=db;this.secrets=secrets;this.clock=clock;
        origin=environment.getProperty("adc.web-origin",environment.matchesProfiles("prod")?"":"http://localhost:5173");
        try {var uri=URI.create(origin);if(uri.getHost()==null || !Set.of("http","https").contains(uri.getScheme()) || uri.getRawQuery()!=null || uri.getFragment()!=null || uri.getUserInfo()!=null || (uri.getPath()!=null && !uri.getPath().isEmpty()) || (environment.matchesProfiles("prod") && !uri.getScheme().equals("https")))throw new IllegalArgumentException();}
        catch(IllegalArgumentException e){throw new IllegalStateException("A precise Web origin is required; production must use HTTPS");}
    }
    public static String cookie(HttpServletRequest request,String name) {
        String value=null;
        if(request.getCookies()!=null)for(var cookie:request.getCookies())if(cookie.getName().equals(name)) {
            if(value!=null)throw new DomainFailure(403,"ACCESS_DENIED");value=cookie.getValue();
        }
        return value;
    }
    public static boolean nativeRequest(HttpServletRequest request) {
        if(request.getHeader("Origin")!=null || cookie(request,"adc_session")!=null)return false;
        if(request.getRequestURI().equals("/api/v1/auth/staff-sessions"))return false;
        return request.getRequestURI().equals("/api/v1/auth/wechat-sessions") || (request.getHeader("Authorization")!=null && request.getHeader("Authorization").startsWith("Bearer "));
    }
    public void checkOrigin(HttpServletRequest request) {
        if(Set.of("GET","HEAD","OPTIONS").contains(request.getMethod()))return;
        if(nativeRequest(request))return;
        if(!origin.equals(request.getHeader("Origin")))throw new DomainFailure(403,"ACCESS_DENIED");
        if(request.getHeader("Authorization")!=null)throw new DomainFailure(403,"ACCESS_DENIED");
    }
    public OncePerRequestFilter originFilter() {
        return new OncePerRequestFilter() {
            @Override protected void doFilterInternal(HttpServletRequest request,HttpServletResponse response,FilterChain chain)throws ServletException,java.io.IOException {
                try {checkOrigin(request);chain.doFilter(request,response);}catch(Exception error){if(response.isCommitted())throw new ServletException("Response already committed",error);ApiErrors.write(error,request,response);}
            }
        };
    }
    public String initializeAnonymous(HttpServletResponse response) {
        String token=Crypto.token();String body="v1."+clock.instant().plusSeconds(300).getEpochSecond()+"."+HexFormat.of().formatHex(Crypto.sha256(token))+"."+Crypto.token();
        String signed=body+"."+Base64.getUrlEncoder().withoutPadding().encodeToString(secrets.derive("csrf-preauth",body));
        response.addHeader("Set-Cookie",ResponseCookie.from("adc_preauth",signed).httpOnly(true).secure(true).sameSite("Lax").path("/api/v1/auth").maxAge(Duration.ofMinutes(5)).build().toString());
        return token;
    }
    @Override public CsrfToken generateToken(HttpServletRequest request){return new DefaultCsrfToken("X-CSRF-Token","_csrf",Crypto.token());}
    @Override public void saveToken(CsrfToken token,HttpServletRequest request,HttpServletResponse response) {
        // Explicit initialization/rotation endpoints persist the context. Missing/invalid contexts fail closed.
    }
    @Override public CsrfToken loadToken(HttpServletRequest request) {
        String token=request.getHeader("X-CSRF-Token");if(token==null)return null;
        String session=cookie(request,"adc_session");
        if(session!=null) {
            var rows=db.query("SELECT csrf_secret_hash,created_at,last_activity_at,absolute_expires_at FROM adc_identity.Session WHERE token_hash=? AND client_type='WEB' AND revoked_at IS NULL",(r,n)->new Object[]{r.getBytes(1),r.getObject(2,LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getObject(3,LocalDateTime.class).toInstant(ZoneOffset.UTC),r.getObject(4,LocalDateTime.class).toInstant(ZoneOffset.UTC)},Crypto.sha256(session));
            if(rows.isEmpty())return null;var row=rows.getFirst();var now=clock.instant();
            if(row[0]==null || !now.isBefore(((Instant)row[1]).plusSeconds(28800)) || !now.isBefore(((Instant)row[2]).plusSeconds(1800)) || !now.isBefore((Instant)row[3]) || !MessageDigest.isEqual((byte[])row[0],Crypto.sha256(token)))return null;
            return new DefaultCsrfToken("X-CSRF-Token","_csrf",token);
        }
        String signed=cookie(request,"adc_preauth");if(signed==null)return null;
        try {
            var parts=signed.split("\\.",-1);if(parts.length!=5 || !parts[0].equals("v1") || clock.instant().getEpochSecond()>=Long.parseLong(parts[1]))return null;
            String body=String.join(".",Arrays.copyOf(parts,4));
            if(!MessageDigest.isEqual(secrets.derive("csrf-preauth",body),Base64.getUrlDecoder().decode(parts[4])) || !MessageDigest.isEqual(HexFormat.of().parseHex(parts[2]),Crypto.sha256(token)))return null;
            return new DefaultCsrfToken("X-CSRF-Token","_csrf",token);
        } catch(IllegalArgumentException e){return null;}
    }
}
