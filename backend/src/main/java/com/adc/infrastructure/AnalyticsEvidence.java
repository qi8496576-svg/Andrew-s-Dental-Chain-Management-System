package com.adc.infrastructure;

import java.nio.file.*;
import java.time.*;
import java.util.*;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import tools.jackson.databind.json.JsonMapper;

/** External, versioned operating roster/calendar evidence. No invented production defaults. */
@Component
public class AnalyticsEvidence {
    public record Roster(String start,String end,String reference,String verified_at,List<String> clinic_ids){}
    public record Calendar(String start,String end,String reference,String verified_at,String day_start,String day_end,List<String> holidays){}
    public record Evidence(String version,String reference,List<Roster> rosters,List<Calendar> calendars){}
    private final Evidence evidence;private final String digest;
    public AnalyticsEvidence(Environment environment){String path=environment.getProperty("adc.analytics.evidence-file");try{if(path==null || path.isBlank()){evidence=new Evidence("UNAVAILABLE","",List.of(),List.of());}else{var file=Path.of(path);if(!file.isAbsolute())throw new IllegalArgumentException("Evidence file must be absolute");evidence=JsonMapper.builder().build().readValue(Files.readString(file),Evidence.class);if(evidence.version==null || evidence.version.isBlank() || evidence.reference==null || evidence.reference.isBlank() || evidence.rosters==null || evidence.calendars==null)throw new IllegalArgumentException("Invalid analytics evidence");}digest=HexFormat.of().formatHex(Crypto.sha256(CanonicalJson.normalize(JsonMapper.builder().build().writeValueAsString(evidence))));}catch(java.io.IOException invalid){throw new IllegalStateException("Analytics evidence unavailable",invalid);}}
    public String reference(){return "evidence:"+evidence.version+":"+digest;}
    public Optional<Roster> roster(Instant start,Instant end,Instant cutoff){return evidence.rosters.stream().filter(r->r.reference!=null && !r.reference.isBlank() && r.clinic_ids!=null && !Instant.parse(r.verified_at).isAfter(cutoff) && !OffsetDateTime.parse(r.start).toInstant().isAfter(start) && !OffsetDateTime.parse(r.end).toInstant().isBefore(end)).findFirst();}
    public Optional<Calendar> calendar(Instant start,Instant end,Instant cutoff){return evidence.calendars.stream().filter(c->c.reference!=null && !c.reference.isBlank() && c.day_start!=null && c.day_end!=null && c.holidays!=null && !Instant.parse(c.verified_at).isAfter(cutoff) && !OffsetDateTime.parse(c.start).toInstant().isAfter(start) && !OffsetDateTime.parse(c.end).toInstant().isBefore(end)).findFirst();}
    public static String workingDays(Instant ready,Instant published,Calendar calendar){
        var zone=ZoneId.of("Asia/Shanghai");var begin=LocalTime.parse(calendar.day_start);var end=LocalTime.parse(calendar.day_end);long daily=Duration.between(begin,end).getSeconds();if(daily<=0 || published.isBefore(ready))throw new IllegalArgumentException("Invalid confirmed calendar");var holidays=new HashSet<>(calendar.holidays);long seconds=0;for(var day=ready.atZone(zone).toLocalDate();!day.isAfter(published.atZone(zone).toLocalDate());day=day.plusDays(1)){if(day.getDayOfWeek().getValue()>5 || holidays.contains(day.toString()))continue;var from=day.atTime(begin).atZone(zone).toInstant();var until=day.atTime(end).atZone(zone).toInstant();from=from.isBefore(ready)?ready:from;until=until.isAfter(published)?published:until;if(until.isAfter(from))seconds=Math.addExact(seconds,Duration.between(from,until).getSeconds());}return java.math.BigDecimal.valueOf(seconds).divide(java.math.BigDecimal.valueOf(daily),6,java.math.RoundingMode.HALF_UP).toPlainString();
    }
}
