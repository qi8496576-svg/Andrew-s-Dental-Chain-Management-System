-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`InvoiceItem` (
  `invoice_item_id` BIGINT NOT NULL,
  `invoice_id` BIGINT NOT NULL,
  `applied_treatment_id` BIGINT NOT NULL,
  `line_number` INT NOT NULL,
  `treatment_name` VARCHAR(120) NOT NULL,
  `standard_units` DECIMAL(10,2) NOT NULL,
  `unit_price` DECIMAL(12,2) NOT NULL,
  `subtotal` DECIMAL(14,2) NOT NULL,
  PRIMARY KEY (`invoice_item_id`)
) ENGINE=InnoDB;
