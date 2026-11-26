package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import com.adc.support.MySqlFixture;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import java.nio.file.*;

class FlywayHistoryIT {
    @Test void actualToolOwnedHistoryMatchesApprovedDictionary() throws Exception {
        try(var fixture=MySqlFixture.start(); var c=fixture.administratorConnection()) {
            try(var s=c.createStatement()) {
                s.execute("CREATE DATABASE adc_identity");
                s.execute("CREATE DATABASE adc_audit");
            }
            var flyway=Flyway.configure().dataSource(fixture.jdbcUrl(),"root",fixture.isolatedRootPassword())
                    .defaultSchema("adc_identity").schemas("adc_business","adc_identity","adc_audit")
                    .createSchemas(false).cleanDisabled(true).locations("classpath:db/migration").load();
            var result=flyway.migrate(); assertEquals(34,result.migrationsExecuted);
            var expected=SchemaBaselineIT.json("specs/001-system-specification/technical-schema.json");
            var output=SchemaBaselineIT.query(c,"SELECT CONCAT(COLUMN_NAME,':',COLUMN_TYPE,':',IS_NULLABLE) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='adc_identity' AND TABLE_NAME='flyway_schema_history'");
            Files.createDirectories(SchemaBaselineIT.ROOT.resolve("docs/verification/database"));
            Files.writeString(SchemaBaselineIT.ROOT.resolve("docs/verification/database/flyway-history-actual.txt"),String.join("\n",output));
            for(var t:expected.path("technical_tables")) if(t.path("name").asText().equals("flyway_schema_history"))
                SchemaBaselineIT.table(c,"adc_identity",t,true);
            assertEquals(java.util.Set.of("success:1"),SchemaBaselineIT.query(c,"SELECT CONCAT(COLUMN_NAME,':',NON_UNIQUE) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA='adc_identity' AND TABLE_NAME='flyway_schema_history' AND INDEX_NAME<>'PRIMARY'"));
        }
    }
}
