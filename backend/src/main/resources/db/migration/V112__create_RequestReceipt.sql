-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_identity.`RequestReceipt` (
  `subject_id` CHAR(36) NOT NULL,
  `operation_id` VARCHAR(80) NOT NULL,
  `request_key` VARCHAR(64) NOT NULL,
  `content_hash` BINARY(32) NOT NULL,
  `request_id` CHAR(36) NOT NULL,
  `result_refs` JSON NOT NULL,
  `response_summary` JSON NOT NULL,
  `response_status` SMALLINT NOT NULL,
  `created_at` TIMESTAMP(6) NOT NULL,
  `completed_at` TIMESTAMP(6) NOT NULL,
  PRIMARY KEY (`subject_id`, `operation_id`, `request_key`)
) ENGINE=InnoDB;
