-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Dentist` (
  `dentist_id` BIGINT NOT NULL,
  `employee_number` VARCHAR(30) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `home_address` VARCHAR(255) NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(254) NULL,
  `hire_date` DATE NOT NULL,
  `is_active` BOOLEAN NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  `termination_date` DATE NULL,
  PRIMARY KEY (`dentist_id`)
) ENGINE=InnoDB;
