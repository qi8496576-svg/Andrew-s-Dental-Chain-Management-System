package com.adc.domain.analytics;
import java.math.*;
import java.util.*;
public final class AnalyticsRules {
    private AnalyticsRules(){}
    public static String ratio(long numerator,long denominator){if(numerator<0 || denominator<0 || numerator>denominator)throw new IllegalArgumentException("Invalid ratio");return denominator==0?null:BigDecimal.valueOf(numerator).divide(BigDecimal.valueOf(denominator),6,RoundingMode.HALF_UP).toPlainString();}
    public static String weighted(BigDecimal subtotal,BigDecimal units){if(subtotal.signum()<0 || units.signum()<0)throw new IllegalArgumentException("Invalid weighted source");return units.signum()==0?null:subtotal.divide(units,2,RoundingMode.HALF_UP).toPlainString();}
    public static boolean traceable(List<?> facts){return facts!=null && facts.size()==7 && facts.stream().allMatch(f->f!=null && (!(f instanceof String s)||!s.isBlank()));}
}
