-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`GrantClinicScope` (
  `grant_id` CHAR(36) NOT NULL,
  `clinic_id` BIGINT NOT NULL,
  PRIMARY KEY (`grant_id`, `clinic_id`)
) ENGINE=InnoDB;
