-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`Subject` (
  `subject_id` CHAR(36) NOT NULL,
  `subject_type` VARCHAR(16) NOT NULL,
  `is_enabled` BOOLEAN NOT NULL,
  `created_at` TIMESTAMP(6) NOT NULL,
  `disabled_at` TIMESTAMP(6) NULL,
  PRIMARY KEY (`subject_id`)
) ENGINE=InnoDB;
