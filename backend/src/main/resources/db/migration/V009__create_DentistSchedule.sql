-- Approved dictionary only. FK/UK/CHECK follow in V200; no conditional unique index.
CREATE TABLE adc_business.`DentistSchedule` (
  `schedule_id` BIGINT NOT NULL,
  `dentist_id` BIGINT NOT NULL,
  `clinic_id` BIGINT NOT NULL,
  `schedule_date` DATE NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `slot_minutes` SMALLINT NOT NULL,
  `schedule_status` VARCHAR(20) NOT NULL,
  `note` VARCHAR(255) NULL,
  `created_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`schedule_id`)
) ENGINE=InnoDB;
