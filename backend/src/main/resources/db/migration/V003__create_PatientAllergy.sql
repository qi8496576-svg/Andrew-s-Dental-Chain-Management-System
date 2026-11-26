-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`PatientAllergy` (
  `patient_id` BIGINT NOT NULL,
  `allergy_id` BIGINT NOT NULL,
  `noted_at` TIMESTAMP NOT NULL,
  `severity_note` VARCHAR(100) NULL,
  `clinical_note` VARCHAR(255) NULL,
  `is_retracted` BOOLEAN NOT NULL,
  `audit_history` JSON NOT NULL,
  `updated_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`patient_id`, `allergy_id`)
) ENGINE=InnoDB;
