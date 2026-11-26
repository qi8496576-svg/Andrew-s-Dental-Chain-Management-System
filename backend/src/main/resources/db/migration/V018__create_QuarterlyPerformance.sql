-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`QuarterlyPerformance` (
  `quarterly_performance_id` BIGINT NOT NULL,
  `dentist_id` BIGINT NOT NULL,
  `quarter_start` DATE NOT NULL,
  `quarter_end` DATE NOT NULL,
  `revenue` DECIMAL(14,2) NULL,
  `medical_supply_cost` DECIMAL(14,2) NULL,
  `operating_expense` DECIMAL(14,2) NULL,
  `net_profit` DECIMAL(14,2) NULL,
  `incentive_rate` DECIMAL(5,4) NOT NULL,
  `incentive_amount` DECIMAL(14,2) NULL,
  `calculation_status` VARCHAR(20) NOT NULL,
  `calculated_at` TIMESTAMP NULL,
  `calculation_version` INT NOT NULL,
  `source_snapshot` JSON NOT NULL,
  `input_hash` CHAR(64) NOT NULL,
  `published_at` TIMESTAMP NULL,
  PRIMARY KEY (`quarterly_performance_id`)
) ENGINE=InnoDB;
