package com.adc.domain.invoicing;
import com.adc.domain.shared.*;
import java.math.BigDecimal;
import java.util.List;
public final class InvoiceRules {
    private InvoiceRules() { }
    public static void completed(String state,boolean hasRows){if(!state.equals("COMPLETED"))throw new DomainFailure(409,"COMPLETED_VISIT_REQUIRED");if(!hasRows)throw new DomainFailure(422,"ACTUAL_TREATMENT_REQUIRED");}
    public static void line(String units,String price,String subtotal){if(BusinessValues.subtotal(units,price).compareTo(BusinessValues.money(subtotal))!=0)throw new DomainFailure(422,"INVALID_TREATMENT_AMOUNT");}
    public static BigDecimal sum(List<BigDecimal> subtotals){BigDecimal sum=new BigDecimal("0.00");for(var subtotal:subtotals)sum=sum.add(subtotal);return BusinessValues.money(sum.toPlainString());}
}
