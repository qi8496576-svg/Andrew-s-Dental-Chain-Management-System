package com.adc.domain.staffaccounts;

import com.adc.domain.shared.DomainFailure;

public final class StaffAccountRules {
    private StaffAccountRules() { }
    public static void required(String value,int maximum) {
        if(value==null || value.isBlank())throw new DomainFailure(422,"FIELD_REQUIRED");
        if(value.codePointCount(0,value.length())>maximum)throw new DomainFailure(400,"INVALID_REQUEST");
    }
}
