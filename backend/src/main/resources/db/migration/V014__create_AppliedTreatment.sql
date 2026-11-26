-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`AppliedTreatment` (
  `applied_treatment_id` BIGINT NOT NULL,
  `appointment_id` BIGINT NOT NULL,
  `treatment_id` BIGINT NOT NULL,
  `dentist_id` BIGINT NOT NULL,
  `standard_units` DECIMAL(10,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(14,2) NOT NULL,
  `performed_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`applied_treatment_id`)
) ENGINE=InnoDB;
