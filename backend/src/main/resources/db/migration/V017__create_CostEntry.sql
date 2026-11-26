-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`CostEntry` (
  `cost_entry_id` BIGINT NOT NULL,
  `dentist_id` BIGINT NULL,
  `clinic_id` BIGINT NOT NULL,
  `appointment_id` BIGINT NULL,
  `applied_treatment_id` BIGINT NULL,
  `cost_type` VARCHAR(30) NOT NULL,
  `amount` DECIMAL(14,2) NOT NULL,
  `incurred_at` TIMESTAMP NOT NULL,
  `description` VARCHAR(255) NULL,
  `source_reference` VARCHAR(100) NOT NULL,
  `source_batch` VARCHAR(60) NOT NULL,
  `confirmed_at` TIMESTAMP NOT NULL,
  `confirmed_by` VARCHAR(100) NOT NULL,
  `reversal_of_id` BIGINT NULL,
  PRIMARY KEY (`cost_entry_id`)
) ENGINE=InnoDB;
