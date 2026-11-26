-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`AccessGrant` (
  `grant_id` CHAR(36) NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `role_code` VARCHAR(24) NOT NULL,
  `granted_by` CHAR(36) NOT NULL,
  `valid_from` TIMESTAMP(6) NOT NULL,
  `valid_until` TIMESTAMP(6) NULL,
  `revoked_at` TIMESTAMP(6) NULL,
  `revoked_by` CHAR(36) NULL,
  `reason` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (`grant_id`)
) ENGINE=InnoDB;
