-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`DentistClinicAssignment` (
  `assignment_id` BIGINT NOT NULL,
  `dentist_id` BIGINT NOT NULL,
  `clinic_id` BIGINT NOT NULL,
  `start_date` DATE NOT NULL,
  `end_date` DATE NULL,
  `availability_note` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL,
  PRIMARY KEY (`assignment_id`)
) ENGINE=InnoDB;
