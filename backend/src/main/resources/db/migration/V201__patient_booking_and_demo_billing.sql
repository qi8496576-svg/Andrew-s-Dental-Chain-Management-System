-- Owner-approved scope ADC-PB-20261125; existing migrations remain immutable.
ALTER TABLE adc_business.Patient
  MODIFY billing_address VARCHAR(255) NULL,
  MODIFY emergency_contact_name VARCHAR(100) NULL,
  MODIFY emergency_contact_phone VARCHAR(30) NULL;
ALTER TABLE adc_business.Dentist
  ADD professional_title VARCHAR(40) NULL,
  ADD specialty VARCHAR(255) NULL,
  ADD introduction VARCHAR(1000) NULL;

CREATE TABLE adc_business.RegistrationFeePolicy (
  clinic_id BIGINT NOT NULL,
  dentist_id BIGINT NOT NULL,
  amount_fen BIGINT NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (clinic_id,dentist_id),
  CONSTRAINT fk_fee_clinic FOREIGN KEY (clinic_id) REFERENCES adc_business.Clinic(clinic_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_fee_dentist FOREIGN KEY (dentist_id) REFERENCES adc_business.Dentist(dentist_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_fee_amount CHECK (amount_fen BETWEEN 0 AND 100000000)
) ENGINE=InnoDB;

-- Extend only corresponding current management/cashier grants, retaining clinic scopes.
INSERT IGNORE INTO adc_identity.GrantCapability (grant_id,capability_code)
 SELECT DISTINCT g.grant_id,'billing.read' FROM adc_identity.AccessGrant g JOIN adc_identity.GrantCapability c ON c.grant_id=g.grant_id
 WHERE g.revoked_at IS NULL AND ((g.role_code='HEADQUARTERS' AND c.capability_code='resource.write') OR (g.role_code='CASHIER' AND c.capability_code='invoiceAppointment'));
INSERT IGNORE INTO adc_identity.GrantCapability (grant_id,capability_code)
 SELECT grant_id,'billing.pay' FROM adc_identity.GrantCapability WHERE capability_code='billing.read';
INSERT IGNORE INTO adc_identity.GrantCapability (grant_id,capability_code)
 SELECT grant_id,'billing.refund' FROM adc_identity.GrantCapability WHERE capability_code='billing.read';
CREATE TABLE adc_business.BookingHold (
  hold_id BIGINT NOT NULL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  dentist_id BIGINT NOT NULL,
  schedule_id BIGINT NOT NULL,
  scheduled_at DATETIME(6) NOT NULL,
  slot_minutes SMALLINT NOT NULL,
  requested_treatment_ids JSON NOT NULL,
  confirmation_digest BINARY(32) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  status VARCHAR(20) NOT NULL,
  appointment_id BIGINT NULL UNIQUE,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  KEY ix_hold_occupancy (dentist_id,status,scheduled_at,expires_at),
  CONSTRAINT fk_hold_patient FOREIGN KEY (patient_id) REFERENCES adc_business.Patient(patient_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_hold_clinic FOREIGN KEY (clinic_id) REFERENCES adc_business.Clinic(clinic_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_hold_dentist FOREIGN KEY (dentist_id) REFERENCES adc_business.Dentist(dentist_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_hold_schedule FOREIGN KEY (schedule_id) REFERENCES adc_business.DentistSchedule(schedule_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_hold_appointment FOREIGN KEY (appointment_id) REFERENCES adc_business.Appointment(appointment_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_hold_status CHECK (status IN ('HELD','BOOKED','CLOSED','EXPIRED')),
  CONSTRAINT ck_hold_slot CHECK (slot_minutes>0 AND expires_at>created_at)
) ENGINE=InnoDB;
CREATE TABLE adc_business.PatientBill (
  bill_id BIGINT NOT NULL PRIMARY KEY,
  patient_id BIGINT NOT NULL,
  clinic_id BIGINT NOT NULL,
  kind VARCHAR(20) NOT NULL,
  hold_id BIGINT NULL UNIQUE,
  appointment_id BIGINT NULL,
  invoice_id BIGINT NULL UNIQUE,
  amount_fen BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_bill_patient FOREIGN KEY (patient_id) REFERENCES adc_business.Patient(patient_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_bill_clinic FOREIGN KEY (clinic_id) REFERENCES adc_business.Clinic(clinic_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_bill_hold FOREIGN KEY (hold_id) REFERENCES adc_business.BookingHold(hold_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_bill_appointment FOREIGN KEY (appointment_id) REFERENCES adc_business.Appointment(appointment_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT fk_bill_invoice FOREIGN KEY (invoice_id) REFERENCES adc_business.Invoice(invoice_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_bill_kind CHECK ((kind='REGISTRATION' AND hold_id IS NOT NULL AND invoice_id IS NULL) OR (kind='TREATMENT' AND invoice_id IS NOT NULL AND appointment_id IS NOT NULL AND hold_id IS NULL)),
  CONSTRAINT ck_bill_amount CHECK (amount_fen BETWEEN 0 AND 1000000000000),
  CONSTRAINT ck_bill_status CHECK (status IN ('PENDING','PAID','CLOSED','REFUNDED'))
) ENGINE=InnoDB;
CREATE TABLE adc_business.PaymentOrder (
  payment_id BIGINT NOT NULL PRIMARY KEY,
  bill_id BIGINT NOT NULL UNIQUE,
  amount_fen BIGINT NOT NULL,
  mode VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL,
  paid_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES adc_business.PatientBill(bill_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_payment_mode CHECK (mode='DEMO'),
  CONSTRAINT ck_payment_status CHECK (status IN ('SUCCEEDED','REFUNDED')),
  CONSTRAINT ck_payment_amount CHECK (amount_fen BETWEEN 0 AND 1000000000000)
) ENGINE=InnoDB;
CREATE TABLE adc_business.RefundOrder (
  refund_id BIGINT NOT NULL PRIMARY KEY,
  payment_id BIGINT NOT NULL UNIQUE,
  amount_fen BIGINT NOT NULL,
  reason VARCHAR(255) NOT NULL,
  actor_subject_id VARCHAR(36) NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at DATETIME(6) NOT NULL,
  CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id) REFERENCES adc_business.PaymentOrder(payment_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  CONSTRAINT ck_refund_status CHECK (status='SUCCEEDED'),
  CONSTRAINT ck_refund_amount CHECK (amount_fen BETWEEN 0 AND 1000000000000)
) ENGINE=InnoDB;
