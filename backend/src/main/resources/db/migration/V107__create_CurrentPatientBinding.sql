-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`CurrentPatientBinding` (
  `subject_id` CHAR(36) NOT NULL,
  `patient_id` BIGINT NOT NULL,
  `verified_by` CHAR(36) NOT NULL,
  `verified_at` TIMESTAMP(6) NOT NULL,
  `verification_reference` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`subject_id`)
) ENGINE=InnoDB;
