-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`GrantCapability` (
  `grant_id` CHAR(36) NOT NULL,
  `capability_code` VARCHAR(80) NOT NULL,
  PRIMARY KEY (`grant_id`, `capability_code`)
) ENGINE=InnoDB;
