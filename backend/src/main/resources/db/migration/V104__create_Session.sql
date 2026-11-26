-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`Session` (
  `session_id` CHAR(36) NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `token_hash` BINARY(32) NOT NULL,
  `client_type` VARCHAR(16) NOT NULL,
  `csrf_secret_hash` BINARY(32) NULL,
  `created_at` TIMESTAMP(6) NOT NULL,
  `last_activity_at` TIMESTAMP(6) NOT NULL,
  `absolute_expires_at` TIMESTAMP(6) NOT NULL,
  `revoked_at` TIMESTAMP(6) NULL,
  `revoked_reason` VARCHAR(128) NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB;
