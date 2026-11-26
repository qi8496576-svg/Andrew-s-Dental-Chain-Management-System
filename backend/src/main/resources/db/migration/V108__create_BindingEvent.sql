-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`BindingEvent` (
  `event_id` CHAR(36) NOT NULL,
  `action` VARCHAR(16) NOT NULL,
  `patient_id` BIGINT NOT NULL,
  `old_subject_id` CHAR(36) NULL,
  `new_subject_id` CHAR(36) NULL,
  `operator_subject_id` CHAR(36) NOT NULL,
  `binding_request_id` CHAR(36) NULL,
  `occurred_at` TIMESTAMP(6) NOT NULL,
  `reason` VARCHAR(255) NOT NULL,
  `verification_basis` JSON NOT NULL,
  `request_key` VARCHAR(64) NOT NULL,
  PRIMARY KEY (`event_id`)
) ENGINE=InnoDB;
