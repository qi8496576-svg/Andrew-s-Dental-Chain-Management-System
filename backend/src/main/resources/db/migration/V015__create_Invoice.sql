-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Invoice` (
  `invoice_id` BIGINT NOT NULL,
  `invoice_number` VARCHAR(40) NOT NULL,
  `appointment_id` BIGINT NOT NULL,
  `issued_at` TIMESTAMP NOT NULL,
  `total_amount` DECIMAL(14,2) NOT NULL,
  `invoice_status` VARCHAR(20) NOT NULL,
  `created_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`invoice_id`)
) ENGINE=InnoDB;
