-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Treatment` (
  `treatment_id` BIGINT NOT NULL,
  `treatment_code` VARCHAR(30) NOT NULL,
  `treatment_name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(255) NULL,
  `default_unit_price` DECIMAL(12,2) NOT NULL,
  `is_active` BOOLEAN NOT NULL,
  PRIMARY KEY (`treatment_id`)
) ENGINE=InnoDB;
