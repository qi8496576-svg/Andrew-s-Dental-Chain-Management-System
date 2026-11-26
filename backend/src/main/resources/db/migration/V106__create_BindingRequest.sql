-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`BindingRequest` (
  `request_id` CHAR(36) NOT NULL,
  `applicant_subject_id` CHAR(36) NOT NULL,
  `patient_number_hint` VARCHAR(30) NOT NULL,
  `date_of_birth_hint` DATE NOT NULL,
  `service_clinic_id` BIGINT NOT NULL,
  `candidate_patient_id` BIGINT NULL,
  `status` VARCHAR(16) NOT NULL,
  `submitted_at` TIMESTAMP(6) NOT NULL,
  `reviewed_by` CHAR(36) NULL,
  `reviewed_at` TIMESTAMP(6) NULL,
  `verification_basis` JSON NULL,
  `reason` VARCHAR(255) NULL,
  PRIMARY KEY (`request_id`)
) ENGINE=InnoDB;
