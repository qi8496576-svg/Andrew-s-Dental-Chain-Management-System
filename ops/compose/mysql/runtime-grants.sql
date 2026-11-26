-- Apply after successful migrations, before starting the application.
GRANT INSERT, UPDATE ON adc_identity.Subject TO 'adc_runtime_role';
GRANT INSERT, UPDATE ON adc_identity.ExternalIdentity TO 'adc_runtime_role';
GRANT INSERT, UPDATE ON adc_identity.StaffAccount TO 'adc_runtime_role';
GRANT INSERT, UPDATE, DELETE ON adc_identity.Session TO 'adc_runtime_role';
GRANT INSERT, UPDATE, DELETE ON adc_identity.LoginThrottle TO 'adc_runtime_role';
GRANT INSERT, UPDATE ON adc_identity.BindingRequest TO 'adc_runtime_role';
GRANT INSERT, UPDATE, DELETE ON adc_identity.CurrentPatientBinding TO 'adc_runtime_role';
GRANT INSERT ON adc_identity.BindingEvent TO 'adc_runtime_role';
GRANT INSERT, UPDATE ON adc_identity.AccessGrant TO 'adc_runtime_role';
GRANT INSERT, UPDATE, DELETE ON adc_identity.GrantClinicScope TO 'adc_runtime_role';
GRANT INSERT, UPDATE, DELETE ON adc_identity.GrantCapability TO 'adc_runtime_role';
GRANT INSERT ON adc_identity.RequestReceipt TO 'adc_runtime_role';
-- No retention DELETE grant or cleanup job before TD-01 governance is approved.
-- flyway_schema_history deliberately inherits SELECT only.
