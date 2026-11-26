-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Allergy` (
  `allergy_id` BIGINT NOT NULL,
  `allergy_name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL,
  PRIMARY KEY (`allergy_id`)
) ENGINE=InnoDB;
