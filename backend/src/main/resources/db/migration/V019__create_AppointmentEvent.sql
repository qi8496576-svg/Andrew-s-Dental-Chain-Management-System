-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`AppointmentEvent` (
  `appointment_event_id` BIGINT NOT NULL,
  `appointment_id` BIGINT NOT NULL,
  `event_type` VARCHAR(30) NOT NULL,
  `from_status` VARCHAR(20) NULL,
  `to_status` VARCHAR(20) NOT NULL,
  `occurred_at` TIMESTAMP NOT NULL,
  `actor_role` VARCHAR(30) NOT NULL,
  `actor_reference` VARCHAR(100) NOT NULL,
  `reason` VARCHAR(255) NULL,
  `request_key` VARCHAR(64) NOT NULL,
  `details` JSON NULL,
  PRIMARY KEY (`appointment_event_id`)
) ENGINE=InnoDB;
