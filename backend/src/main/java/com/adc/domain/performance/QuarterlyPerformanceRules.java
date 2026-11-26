package com.adc.domain.performance;

import com.adc.domain.shared.BusinessValues;
import java.math.*;
import java.time.*;
import java.util.*;

/** R1 uses integer cents and minutes, including for negative public expense pools. */
public final class QuarterlyPerformanceRules {
    private QuarterlyPerformanceRules(){}
    public record Quarter(LocalDate first,LocalDate until,Instant start,Instant end){}
    public static Quarter quarter(String start,String end,Instant now){var first=LocalDate.parse(start);var until=LocalDate.parse(end);var zone=ZoneId.of("Asia/Shanghai");if(first.getDayOfMonth()!=1 || (first.getMonthValue()-1)%3!=0 || !until.equals(first.plusMonths(3)) || until.atStartOfDay(zone).toInstant().isAfter(now))throw new IllegalArgumentException("An ended natural quarter is required");return new Quarter(first,until,first.atStartOfDay(zone).toInstant(),until.atStartOfDay(zone).toInstant());}
    public static BigDecimal incentive(BigDecimal profit){return BusinessValues.incentive(BusinessValues.money(profit.toPlainString()).toPlainString());}
    public static Map<Long,BigDecimal> allocate(BigDecimal amount,Map<Long,Long> minutes){
        amount=BusinessValues.money(amount.toPlainString());var cents=amount.abs().movePointRight(2).toBigIntegerExact();var total=BigInteger.ZERO;for(var entry:minutes.entrySet()){if(entry.getKey()<=0 || entry.getValue()<0)throw new IllegalArgumentException("Invalid allocation basis");total=total.add(BigInteger.valueOf(entry.getValue()));}if(total.signum()==0 && amount.signum()!=0)throw new IllegalArgumentException("Missing allocation minutes");
        record Share(long dentist,BigInteger cents,BigInteger remainder){}var shares=new ArrayList<Share>();var allocated=BigInteger.ZERO;for(long dentist:new TreeSet<>(minutes.keySet())){var quotient=total.signum()==0?new BigInteger[]{BigInteger.ZERO,BigInteger.ZERO}:cents.multiply(BigInteger.valueOf(minutes.get(dentist))).divideAndRemainder(total);shares.add(new Share(dentist,quotient[0],quotient[1]));allocated=allocated.add(quotient[0]);}shares.sort(Comparator.comparing(Share::remainder).reversed().thenComparingLong(Share::dentist));int remainder=cents.subtract(allocated).intValueExact();var result=new TreeMap<Long,BigDecimal>();for(int i=0;i<shares.size();i++){var share=shares.get(i);result.put(share.dentist,new BigDecimal(share.cents.add(i<remainder?BigInteger.ONE:BigInteger.ZERO).multiply(BigInteger.valueOf(amount.signum())),2));}if(result.values().stream().reduce(BigDecimal.ZERO,BigDecimal::add).compareTo(amount)!=0)throw new IllegalStateException("Allocation conservation failure");return Collections.unmodifiableMap(result);
    }
}
