package com.adc.domain.model;

/** Immutable row projection; business mutations belong to application services. */
public record InvoiceItem(
    Long invoice_item_id,
    Long invoice_id,
    Long applied_treatment_id,
    Integer line_number,
    String treatment_name,
    java.math.BigDecimal standard_units,
    java.math.BigDecimal unit_price,
    java.math.BigDecimal subtotal
) { }
