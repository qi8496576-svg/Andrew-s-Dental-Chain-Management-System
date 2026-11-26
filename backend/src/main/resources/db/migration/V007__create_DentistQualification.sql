-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`DentistQualification` (
  `dentist_id` BIGINT NOT NULL,
  `qualification_id` BIGINT NOT NULL,
  `certificate_number` VARCHAR(60) NOT NULL,
  `granted_date` DATE NOT NULL,
  `expiry_date` DATE NULL,
  `verification_status` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`dentist_id`, `qualification_id`)
) ENGINE=InnoDB;
