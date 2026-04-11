-- +migrate Down
-- Rollback OTP fields

ALTER TABLE users DROP COLUMN IF EXISTS otp_code;
ALTER TABLE users DROP COLUMN IF EXISTS otp_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS is_email_verified;

DROP TABLE IF EXISTS temporary_signups;
DROP INDEX IF EXISTS idx_users_otp_code;
DROP INDEX IF EXISTS idx_temp_signups_email;
