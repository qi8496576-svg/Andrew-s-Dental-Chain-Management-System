-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`AppointmentRequestedTreatment` (
  `appointment_id` BIGINT NOT NULL,
  `treatment_id` BIGINT NOT NULL,
  `request_note` VARCHAR(255) NULL,
  PRIMARY KEY (`appointment_id`, `treatment_id`)
) ENGINE=InnoDB;
