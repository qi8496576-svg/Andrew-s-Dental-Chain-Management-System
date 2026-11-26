package com.adc.infrastructure;

import java.util.*;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** Stable recursive object ordering; array order remains meaningful. */
public final class CanonicalJson {
    private static final JsonMapper MAPPER=JsonMapper.builder().build();
    private CanonicalJson() { }
    public static String normalize(String json) { return MAPPER.writeValueAsString(value(MAPPER.readTree(json))); }
    private static Object value(JsonNode node) {
        if(node.isObject()) { var out=new TreeMap<String,Object>();for(String key:node.propertyNames())out.put(key,value(node.get(key)));return out; }
        if(node.isArray()) { var out=new ArrayList<Object>();for(var child:node)out.add(value(child));return out; }
        if(node.isNull())return null;
        if(node.isTextual())return node.asText();
        if(node.isBoolean())return node.asBoolean();
        if(node.isIntegralNumber())return node.bigIntegerValue();
        if(node.isNumber())return node.decimalValue();
        throw new IllegalArgumentException("Unsupported JSON value");
    }
    public static byte[] requestHash(String method,String path,String ifMatch,String json) {
        return Crypto.sha256(MAPPER.writeValueAsString(Map.of("method",method,"path",path,"if_match",Objects.requireNonNullElse(ifMatch,""),"body",value(MAPPER.readTree(json)))));
    }
    public static String etag(String json) { return "\""+java.util.HexFormat.of().formatHex(Crypto.sha256(normalize(json)))+"\""; }
    public static void requireMatch(String expected,String currentJson) {
        if(expected==null || expected.isBlank())throw new com.adc.domain.shared.DomainFailure(400,"INVALID_REQUEST");
        if(!etag(currentJson).equals(expected))throw new com.adc.domain.shared.DomainFailure(412,"PRECONDITION_FAILED");
    }
}
