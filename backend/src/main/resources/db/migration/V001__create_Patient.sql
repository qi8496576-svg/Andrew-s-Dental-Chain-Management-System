-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Patient` (
  `patient_id` BIGINT NOT NULL,
  `patient_number` VARCHAR(30) NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `billing_address` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NOT NULL,
  `email` VARCHAR(254) NULL,
  `emergency_contact_name` VARCHAR(100) NOT NULL,
  `emergency_contact_phone` VARCHAR(30) NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP NOT NULL,
  `allergy_review_status` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`patient_id`)
) ENGINE=InnoDB;
