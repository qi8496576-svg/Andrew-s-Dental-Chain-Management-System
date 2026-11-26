package com.adc.infrastructure;

import static org.junit.jupiter.api.Assertions.*;
import java.nio.file.*;
import java.sql.*;
import java.util.*;
import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/** T008 prepares the assertions; T043 supplies an isolated, migrated MySQL connection. */
class SchemaBaselineIT extends MigratedDatabaseTest {
    static final Path ROOT = repositoryRoot();
    private static Path repositoryRoot() {
        Path root=Path.of("..").toAbsolutePath().normalize();
        try {
            Files.createDirectories(root.resolve("tmp/build-temp"));
            Files.createDirectories(root.resolve("docs/verification/database"));
        } catch(java.io.IOException e) { throw new java.io.UncheckedIOException(e); }
        return root;
    }
    static JsonNode json(String path) throws Exception {
        return JsonMapper.builder().build().readTree(Files.readString(ROOT.resolve(path)));
    }
    static Set<String> query(Connection c, String sql, String... args) throws Exception {
        Set<String> values = new TreeSet<>();
        try (var s = c.prepareStatement(sql)) {
            for (int i=0;i<args.length;i++) s.setString(i+1,args[i]);
            try (var r=s.executeQuery()) { while(r.next()) values.add(r.getString(1)); }
        }
        return values;
    }
    static String type(String value) {
        return value.toLowerCase(Locale.ROOT).replace("boolean", "tinyint(1)")
                .replace("timestamp(0)", "timestamp").replace(" ", "");
    }
    static void table(Connection c, String schema, JsonNode t, boolean technical) throws Exception {
        String name=t.path("name").asText();
        Set<String> expected=new TreeSet<>();
        for(var f:t.path("fields")) expected.add(f.path("name").asText()+":"+type(f.path("type").asText())+":"+
                (f.path("nullable").asBoolean()?"YES":"NO"));
        assertEquals(expected, query(c,"SELECT CONCAT(COLUMN_NAME,':',COLUMN_TYPE,':',IS_NULLABLE) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",schema,name),schema+"."+name);
        assertEquals(Set.of(),query(c,"SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND GENERATION_EXPRESSION<>''",schema,name),"No hidden/generated columns");
        Set<String> pk=new TreeSet<>();
        if(technical) for(var f:t.path("primary_key")) pk.add(f.asText());
        else for(var f:t.path("fields")) if(f.path("pk").asBoolean()) pk.add(f.path("name").asText());
        assertEquals(pk,query(c,"SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND CONSTRAINT_NAME='PRIMARY'",schema,name));
        assertEquals(Set.of("InnoDB"),query(c,"SELECT ENGINE FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_NAME=?",schema,name));
    }
    @Test void exactTablesColumnsKeysAndReferenceBoundaries() throws Exception {
        var business=json("docs/diagrams/database/schema.json");
        var tech=json("specs/001-system-specification/technical-schema.json");
        assertEquals(24,business.size()); assertEquals(14,tech.path("technical_tables").size());
        Map<String,Set<String>> tables=new TreeMap<>();
        Set<String> refs=new TreeSet<>(); int businessFields=0,technicalFields=0,appRefs=0;
        try(var c=connection("inspector")) {
            for(var t:business) {
                table(c,"adc_business",t,false); businessFields+=t.path("fields").size();
                tables.computeIfAbsent("adc_business",k->new TreeSet<>()).add(t.path("name").asText());
                for(var f:t.path("fields")) if(!f.path("fk").isNull() && !f.path("fk").asText().isBlank())
                    refs.add("adc_business."+t.path("name").asText()+"."+f.path("name").asText()+"->adc_business."+f.path("fk").asText());
            }
            for(var t:tech.path("technical_tables")) {
                String schema=t.path("schema").asText(); table(c,schema,t,true);
                technicalFields+=t.path("fields").size();
                tables.computeIfAbsent(schema,k->new TreeSet<>()).add(t.path("name").asText());
                for(var f:t.path("fields")) {
                    if(!f.path("foreign_key").isNull()) refs.add(schema+"."+t.path("name").asText()+"."+f.path("name").asText()+"->"+f.path("foreign_key").asText().replace("FK:",""));
                    if(!f.path("application_reference").isNull()) appRefs++;
                }
            }
            assertEquals(209,businessFields); assertEquals(110,technicalFields); assertEquals(12,appRefs);
            assertEquals(63,refs.size());
            assertEquals(tables.keySet(),query(c,"SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME LIKE 'adc\\_%'"));
            for(var entry:tables.entrySet()) assertEquals(entry.getValue(),query(c,"SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?",entry.getKey()));
            assertEquals(refs,query(c,"SELECT CONCAT(TABLE_SCHEMA,'.',TABLE_NAME,'.',COLUMN_NAME,'->',REFERENCED_TABLE_SCHEMA,'.',REFERENCED_TABLE_NAME,'.',REFERENCED_COLUMN_NAME) FROM information_schema.KEY_COLUMN_USAGE WHERE REFERENCED_TABLE_NAME IS NOT NULL AND TABLE_SCHEMA IN ('adc_business','adc_identity','adc_audit')"));
            assertEquals(Set.of(),query(c,"SELECT version FROM adc_identity.flyway_schema_history WHERE success=0"));
            assertFalse(query(c,"SELECT version FROM adc_identity.flyway_schema_history WHERE success=1 AND version IS NOT NULL").isEmpty(),"Migrations must actually have run");
            assertEquals(Set.of("RESTRICT:RESTRICT"),query(c,"SELECT DISTINCT CONCAT(UPDATE_RULE,':',DELETE_RULE) FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA IN ('adc_business','adc_identity','adc_audit')"));
            var evidence=ROOT.resolve("docs/verification/database");
            Files.createDirectories(evidence);
            var ddl=new StringBuilder();
            for(var entry:tables.entrySet()) for(var name:entry.getValue()) {
                try(var s=c.createStatement(); var r=s.executeQuery("SHOW CREATE TABLE `"+entry.getKey()+"`.`"+name+"`")) {
                    assertTrue(r.next()); ddl.append(r.getString(2)).append(";\n\n");
                }
            }
            Files.writeString(evidence.resolve("show-create-tables.sql"),ddl);
            Files.writeString(evidence.resolve("baseline-comparison.json"),JsonMapper.builder().build().writeValueAsString(Map.of(
                "verified_at",java.time.Instant.now().toString(),"database","MySQL 8.4 / Testcontainers disposable",
                "business_tables",24,"business_fields",209,"business_foreign_keys",44,
                "technical_tables",14,"technical_fields",110,"technical_foreign_keys",19,"application_references",12,
                "columns_pk_fk_engine_schema_match",true)));
        }
    }
    @Test void ordinaryUniqueKeysAndMigrationVersionsAreExact() throws Exception {
        var unique=json("backend/src/test/resources/schema/unique-keys.json");
        try(var c=connection("inspector")) {
            for(String key:unique.propertyNames()) {
                String[] parts=key.split("\\."); Set<String> expected=new TreeSet<>();
                for(var columns:unique.path(key)) expected.add(columns.asText());
                assertEquals(expected,query(c,"SELECT GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ',') FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? AND TABLE_NAME=? AND NON_UNIQUE=0 AND INDEX_NAME<>'PRIMARY' GROUP BY INDEX_NAME",parts),key);
            }
            Set<String> versions=new TreeSet<>();
            try(var paths=Files.list(Path.of("src/main/resources/db/migration"))) {
                paths.map(p->p.getFileName().toString()).filter(n->n.matches("V[0-9]+__.*\\.sql"))
                    .forEach(n->versions.add(n.substring(1,n.indexOf("__"))));
            }
            assertFalse(versions.isEmpty());
            assertEquals(versions,query(c,"SELECT version FROM adc_identity.flyway_schema_history WHERE success=1 AND version IS NOT NULL"));
        }
    }
    @Test void singleRowChecksArePresentAndEnforced() throws Exception {
        var expected=json("backend/src/test/resources/schema/check-coverage.json");
        try(var c=connection("inspector")) {
            for(String key:expected.propertyNames()) {
                String[] parts=key.split("\\.");
                var clauses=query(c,"SELECT cc.CHECK_CLAUSE FROM information_schema.CHECK_CONSTRAINTS cc JOIN information_schema.TABLE_CONSTRAINTS tc ON cc.CONSTRAINT_SCHEMA=tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME=tc.CONSTRAINT_NAME WHERE tc.TABLE_SCHEMA=? AND tc.TABLE_NAME=? AND tc.ENFORCED='YES'",parts);
                assertFalse(clauses.isEmpty(),key+": missing enforced CHECK");
                String text=String.join(" ",clauses).toLowerCase(Locale.ROOT);
                for(var token:expected.path(key)) assertTrue(text.contains(token.asText().toLowerCase(Locale.ROOT)),key+": CHECK coverage missing "+token.asText());
            }
        }
    }
}
