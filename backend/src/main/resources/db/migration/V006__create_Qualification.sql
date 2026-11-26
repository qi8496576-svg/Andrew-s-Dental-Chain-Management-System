-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Qualification` (
  `qualification_id` BIGINT NOT NULL,
  `qualification_name` VARCHAR(120) NOT NULL,
  `description` VARCHAR(255) NULL,
  `is_active` BOOLEAN NOT NULL,
  PRIMARY KEY (`qualification_id`)
) ENGINE=InnoDB;
