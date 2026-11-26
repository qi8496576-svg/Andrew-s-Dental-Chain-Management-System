-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`TreatmentQualification` (
  `treatment_id` BIGINT NOT NULL,
  `qualification_id` BIGINT NOT NULL,
  `is_mandatory` BOOLEAN NOT NULL,
  PRIMARY KEY (`treatment_id`, `qualification_id`)
) ENGINE=InnoDB;
