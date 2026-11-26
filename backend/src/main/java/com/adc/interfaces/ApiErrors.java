package com.adc.interfaces;

import com.adc.domain.shared.DomainFailure;
import com.adc.infrastructure.TransactionLocks;
import jakarta.servlet.http.HttpServletRequest;
import java.util.*;
import org.springframework.dao.DataAccessException;
import org.springframework.http.*;
import org.springframework.transaction.TransactionException;
import org.springframework.web.bind.annotation.*;

@RestControllerAdvice
public class ApiErrors {
    public static void write(Exception error,HttpServletRequest request,jakarta.servlet.http.HttpServletResponse response)throws java.io.IOException {
        var result=new ApiErrors().error(error,request);response.setStatus(result.getStatusCode().value());result.getHeaders().forEach((name,values)->values.forEach(value->response.addHeader(name,value)));response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write(tools.jackson.databind.json.JsonMapper.builder().build().writeValueAsString(result.getBody()));
    }
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String,Object>> error(Exception error,HttpServletRequest request) {
        int status;String code;
        if(error instanceof DomainFailure failure) {status=failure.status();code=failure.code();}
        else if(error instanceof TransactionLocks.LockUnavailableException) {status=503;code="LOCK_RETRY";}
        else if(error instanceof org.springframework.transaction.TransactionSystemException) {status=503;code="COMMIT_OUTCOME_UNKNOWN";}
        else if(error instanceof DataAccessException || error instanceof TransactionException) {status=503;code="PERSISTENCE_UNAVAILABLE";}
        else if(error instanceof IllegalArgumentException || error instanceof org.springframework.web.bind.ServletRequestBindingException
            || error instanceof org.springframework.web.method.annotation.MethodArgumentTypeMismatchException
            || error instanceof org.springframework.http.converter.HttpMessageNotReadableException
            || error instanceof org.springframework.web.bind.MethodArgumentNotValidException) {status=400;code="INVALID_REQUEST";}
        else {status=500;code="INTERNAL_ERROR";}
        var body=new LinkedHashMap<String,Object>();body.put("code",code);
        body.put("message",switch(status) {case 400->"请求格式无效";case 401->"请重新登录";case 403,404->"无法访问此操作或对象";case 409->"请求与当前记录冲突";case 412->"资料已更新，请重新核实";case 422->"业务条件不满足";case 429->"请稍后重试登录";default->"操作暂时无法确认，请按原请求标识查询或重试";});
        body.put("request_id",RequestProof.requestId(request));
        if(status>=500)body.put("retry_with_same_key",true);
        var response=ResponseEntity.status(status).cacheControl(CacheControl.noStore());
        if(status==401 && request.getCookies()!=null && Arrays.stream(request.getCookies()).anyMatch(cookie->cookie.getName().equals("adc_session")))
            response.header("Set-Cookie",org.springframework.http.ResponseCookie.from("adc_session","").path("/api/v1").httpOnly(true).secure(true).sameSite("Lax").maxAge(java.time.Duration.ZERO).build().toString());
        return response.body(body);
    }
}
