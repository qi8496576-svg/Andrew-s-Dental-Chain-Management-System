-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`LoginThrottle` (
  `throttle_key` BINARY(32) NOT NULL,
  `subject_id` CHAR(36) NULL,
  `consecutive_failures` INT NOT NULL,
  `blocked_until` TIMESTAMP(6) NULL,
  `last_failure_at` TIMESTAMP(6) NULL,
  `updated_at` TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (`throttle_key`)
) ENGINE=InnoDB;
