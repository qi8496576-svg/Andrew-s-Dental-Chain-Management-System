-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Clinic` (
  `clinic_id` BIGINT NOT NULL,
  `clinic_code` VARCHAR(20) NOT NULL,
  `postal_address` VARCHAR(255) NOT NULL,
  `manager_name` VARCHAR(100) NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(254) NULL,
  `office_area_sqm` DECIMAL(8,2) NULL,
  `is_active` BOOLEAN NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`clinic_id`)
) ENGINE=InnoDB;
