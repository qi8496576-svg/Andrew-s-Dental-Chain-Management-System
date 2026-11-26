-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`ExternalIdentity` (
  `external_identity_id` BIGINT NOT NULL,
  `subject_id` CHAR(36) NOT NULL,
  `provider` VARCHAR(32) NOT NULL,
  `appid` VARBINARY(64) NOT NULL,
  `openid` VARBINARY(128) NOT NULL,
  `created_at` TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (`external_identity_id`)
) ENGINE=InnoDB;
