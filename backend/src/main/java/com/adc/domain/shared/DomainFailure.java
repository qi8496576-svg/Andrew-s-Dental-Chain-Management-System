package com.adc.domain.shared;

/** Stable public error metadata. Internal exceptions must never become response messages. */
public class DomainFailure extends RuntimeException {
    private final int status;
    private final String code;
    public DomainFailure(int status,String code) { super(code);this.status=status;this.code=code; }
    public int status() { return status; }
    public String code() { return code; }
}
