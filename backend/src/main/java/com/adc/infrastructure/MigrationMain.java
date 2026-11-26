package com.adc.infrastructure;

import java.nio.file.Files;
import java.nio.file.Path;
import org.flywaydb.core.Flyway;

/** Separate operator entry point; never invoked by application startup. */
public final class MigrationMain {
    private MigrationMain() { }
    public static void main(String[] args) throws Exception {
        if (args.length != 0) throw new IllegalArgumentException("Only migrate is supported; no clean/repair command");
        String password=Files.readString(Path.of(required("ADC_MIGRATION_PASSWORD_FILE"))).strip();
        if(password.isEmpty()) throw new IllegalArgumentException("Empty migration credential");
        var flyway=Flyway.configure().dataSource(required("ADC_MIGRATION_URL"),
                required("ADC_MIGRATION_USERNAME"),password)
                .defaultSchema("adc_identity").schemas("adc_business","adc_identity","adc_audit")
                .createSchemas(false).cleanDisabled(true).baselineOnMigrate(false)
                .validateOnMigrate(true).locations("classpath:db/migration").load();
        flyway.migrate();
    }
    private static String required(String name) {
        String value=System.getenv(name);
        if(value==null||value.isBlank()) throw new IllegalArgumentException("Missing configuration: "+name);
        return value;
    }
}
