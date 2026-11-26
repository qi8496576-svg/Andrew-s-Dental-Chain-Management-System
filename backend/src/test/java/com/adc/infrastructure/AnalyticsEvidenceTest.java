package com.adc.infrastructure;
import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;
class AnalyticsEvidenceTest {
    @Test void confirmedCalendarExcludesWeekendsAndItsExplicitHolidays(){var calendar=new AnalyticsEvidence.Calendar("2026-01-01T00:00:00+08:00","2027-01-01T00:00:00+08:00","FICTIONAL calendar source, not a production policy","2025-12-01T00:00:00Z","09:00","17:00",List.of());var ready=OffsetDateTime.parse("2026-11-06T16:00:00+08:00").toInstant();var published=OffsetDateTime.parse("2026-11-09T10:00:00+08:00").toInstant();assertEquals("0.250000",AnalyticsEvidence.workingDays(ready,published,calendar));var holiday=new AnalyticsEvidence.Calendar(calendar.start(),calendar.end(),calendar.reference(),calendar.verified_at(),calendar.day_start(),calendar.day_end(),List.of("2026-11-09"));assertEquals("0.125000",AnalyticsEvidence.workingDays(ready,published,holiday));}
    @Test void absentProductionEvidenceDoesNotInventAnOperatingRosterOrCalendar(){var evidence=new AnalyticsEvidence(new org.springframework.mock.env.MockEnvironment());assertTrue(evidence.roster(Instant.EPOCH,Instant.now(),Instant.now()).isEmpty());assertTrue(evidence.calendar(Instant.EPOCH,Instant.now(),Instant.now()).isEmpty());}
}
