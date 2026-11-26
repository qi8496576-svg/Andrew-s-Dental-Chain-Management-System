package com.adc.domain.shared;

import java.time.*;

public final class BusinessTime {
    public static final ZoneId ZONE = ZoneId.of("Asia/Shanghai");
    private BusinessTime() { }
    public record Range(Instant start, Instant end) {
        public Range {
            if (start == null || end == null || !end.isAfter(start))
                throw new IllegalArgumentException("Invalid half-open interval");
        }
        public boolean contains(Instant time) { return !time.isBefore(start) && time.isBefore(end); }
    }
    private static Range range(LocalDate start, LocalDate end) {
        return new Range(start.atStartOfDay(ZONE).toInstant(),end.atStartOfDay(ZONE).toInstant());
    }
    public static Range day(LocalDate date) { return range(date,date.plusDays(1)); }
    public static Range quarter(LocalDate date) {
        LocalDate start = LocalDate.of(date.getYear(),((date.getMonthValue()-1)/3)*3+1,1);
        return range(start,start.plusMonths(3));
    }
    public static Instant timestamp(String text) {
        if (text == null) throw new IllegalArgumentException("Timestamp required");
        try { return OffsetDateTime.parse(text).toInstant(); }
        catch (java.time.format.DateTimeParseException e) {
            throw new IllegalArgumentException("Timestamp requires an explicit offset",e);
        }
    }
}
