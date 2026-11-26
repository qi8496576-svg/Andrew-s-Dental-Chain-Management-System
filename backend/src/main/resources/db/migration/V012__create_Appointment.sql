-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`Appointment` (
  `appointment_id` BIGINT NOT NULL,
  `patient_id` BIGINT NOT NULL,
  `clinic_id` BIGINT NOT NULL,
  `dentist_id` BIGINT NOT NULL,
  `schedule_id` BIGINT NOT NULL,
  `scheduled_at` TIMESTAMP NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `problems_or_special_needs` TEXT NULL,
  `completed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP NOT NULL,
  `updated_at` TIMESTAMP NOT NULL,
  `attended_at` TIMESTAMP NULL,
  `cancelled_at` TIMESTAMP NULL,
  `cancellation_reason` VARCHAR(255) NULL,
  `cancellation_kind` VARCHAR(30) NULL,
  `rescheduled_from_id` BIGINT NULL,
  PRIMARY KEY (`appointment_id`)
) ENGINE=InnoDB;
