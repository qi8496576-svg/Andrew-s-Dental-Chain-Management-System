-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`StaffAccount` (
  `subject_id` CHAR(36) NOT NULL,
  `username` VARCHAR(100) NOT NULL,
  `staff_reference` VARCHAR(100) NOT NULL,
  `dentist_id` BIGINT NULL,
  `password_hash` VARCHAR(255) NULL,
  `requires_reset` BOOLEAN NOT NULL,
  `credential_changed_at` TIMESTAMP(6) NULL,
  `verification_reference` VARCHAR(200) NOT NULL,
  PRIMARY KEY (`subject_id`)
) ENGINE=InnoDB;
