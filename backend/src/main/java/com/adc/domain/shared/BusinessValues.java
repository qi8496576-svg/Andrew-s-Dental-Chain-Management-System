package com.adc.domain.shared;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Exact SQL decimal boundaries; never passes monetary values through floating point. */
public final class BusinessValues {
    private static final BigDecimal R1 = new BigDecimal("0.1000");
    private BusinessValues() { }
    private static BigDecimal decimal(String text, int precision, boolean negative, boolean positive) {
        if (text == null || !text.matches(negative ? "-?[0-9]+(?:\\.[0-9]{1,2})?" : "[0-9]+(?:\\.[0-9]{1,2})?"))
            throw new IllegalArgumentException("Invalid decimal format or scale");
        BigDecimal value = new BigDecimal(text).setScale(2, RoundingMode.UNNECESSARY);
        if (value.precision() > precision || (positive && value.signum() <= 0))
            throw new IllegalArgumentException("Decimal outside approved field range");
        return value;
    }
    public static BigDecimal money(String text) { return decimal(text,14,true,false); }
    public static BigDecimal unitPrice(String text) { return decimal(text,12,false,false); }
    public static BigDecimal units(String text) { return decimal(text,10,false,true); }
    public static BigDecimal subtotal(String units, String unitPrice) {
        return money(units(units).multiply(unitPrice(unitPrice)).setScale(2,RoundingMode.HALF_UP).toPlainString());
    }
    public static BigDecimal incentive(String netProfit) {
        return money(netProfit).max(BigDecimal.ZERO).multiply(R1).setScale(2,RoundingMode.HALF_UP);
    }
    public static long id(String text) {
        if (text == null || !text.matches("[1-9][0-9]*")) throw new IllegalArgumentException("Invalid identifier");
        return Long.parseLong(text);
    }
}
