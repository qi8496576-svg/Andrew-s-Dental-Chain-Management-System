package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.domain.shared.DomainFailure;
import org.junit.jupiter.api.Test;

class CanonicalJsonTest {
    @Test void keyOrderingIsRecursiveAndIfMatchRemainsPartOfContent() {
        assertEquals(CanonicalJson.etag("{\"a\":{\"b\":1,\"c\":2},\"z\":\"1.00\"}"),CanonicalJson.etag("{\"z\":\"1.00\",\"a\":{\"c\":2,\"b\":1}}"));
        assertArrayEquals(CanonicalJson.requestHash("PUT","/patients/1","etag","{\"a\":1,\"b\":2}"),CanonicalJson.requestHash("PUT","/patients/1","etag","{\"b\":2,\"a\":1}"));
        assertFalse(java.util.Arrays.equals(CanonicalJson.requestHash("PUT","/patients/1","old","{}"),CanonicalJson.requestHash("PUT","/patients/1","new","{}")));
        assertEquals("412",Integer.toString(assertThrows(DomainFailure.class,()->CanonicalJson.requireMatch("old","{}")).status()));
        assertDoesNotThrow(()->CanonicalJson.requireMatch(CanonicalJson.etag("{}"),"{}"));
        assertNotEquals(CanonicalJson.etag("{\"a\":[1,2]}"),CanonicalJson.etag("{\"a\":[2,1]}"));
    }
}
