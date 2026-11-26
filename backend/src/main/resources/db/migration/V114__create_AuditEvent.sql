-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_audit.`AuditEvent` (
  `audit_id` BIGINT NOT NULL,
  `subject_id` CHAR(36) NULL,
  `actor_kind` VARCHAR(16) NOT NULL,
  `action` VARCHAR(80) NOT NULL,
  `object_kind` VARCHAR(48) NOT NULL,
  `object_id` VARCHAR(100) NULL,
  `clinic_scope` JSON NOT NULL,
  `occurred_at` TIMESTAMP(6) NOT NULL,
  `request_id` CHAR(36) NOT NULL,
  `result` VARCHAR(24) NOT NULL,
  `reason` VARCHAR(255) NULL,
  `change_summary` JSON NULL,
  `verification_reference` VARCHAR(200) NULL,
  PRIMARY KEY (`audit_id`)
) ENGINE=InnoDB;
