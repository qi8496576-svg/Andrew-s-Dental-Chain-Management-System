-- Run once as the database operator before migrations. No business tables are created here.
CREATE DATABASE IF NOT EXISTS adc_business CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs;
CREATE DATABASE IF NOT EXISTS adc_identity CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs;
CREATE DATABASE IF NOT EXISTS adc_audit CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs;
CREATE ROLE IF NOT EXISTS 'adc_migration_role', 'adc_runtime_role';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON adc_business.* TO 'adc_migration_role';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON adc_identity.* TO 'adc_migration_role';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES ON adc_audit.* TO 'adc_migration_role';
GRANT SELECT, INSERT, UPDATE, DELETE ON adc_business.* TO 'adc_runtime_role';
GRANT SELECT ON adc_identity.* TO 'adc_runtime_role';
GRANT SELECT, INSERT ON adc_audit.* TO 'adc_runtime_role';
-- Identity writes are table-specific and granted only after migrations; never grant identity.* writes.
