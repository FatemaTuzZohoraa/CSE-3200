-- Optional contact number on a membership application.
-- Run ONCE: psql club_hub -v ON_ERROR_STOP=1 -f backend/migrations/002_application_phone.sql
ALTER TABLE membership_applications ADD COLUMN phone TEXT;