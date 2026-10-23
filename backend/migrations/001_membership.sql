-- Membership applications + manual payments.
-- Run ONCE per database:  psql club_hub -v ON_ERROR_STOP=1 -f backend/migrations/001_membership.sql
-- Additive only: no tables dropped, no rows deleted, no ids changed.

BEGIN;

-- 1. Each club decides its own membership fee and where bKash money goes
ALTER TABLE clubs
    ADD COLUMN membership_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    ADD COLUMN bkash_number TEXT,
    ADD CONSTRAINT clubs_membership_fee_check CHECK (membership_fee >= 0);

-- 2. The application itself (a new row per attempt, so history is kept)
CREATE TABLE membership_applications (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id BIGINT NOT NULL REFERENCES clubs(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    motivation TEXT NOT NULL,
    experience TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    decided_by BIGINT REFERENCES users(id),     -- the leader who approved/rejected
    decided_at TIMESTAMPTZ,
    decision_comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT membership_applications_status_check
        CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),

    -- approved/rejected must say who decided; pending/cancelled must not
    CONSTRAINT membership_applications_decision_check
        CHECK ((status IN ('approved', 'rejected')) = (decided_by IS NOT NULL))
);

-- A student can have only ONE open application per club
CREATE UNIQUE INDEX one_pending_application_per_student_club
    ON membership_applications (club_id, user_id) WHERE status = 'pending';

CREATE INDEX membership_applications_club_status_idx
    ON membership_applications (club_id, status);
CREATE INDEX membership_applications_user_idx
    ON membership_applications (user_id);

-- 3. Let the existing payments table also belong to a membership application
ALTER TABLE payments
    ALTER COLUMN registration_id DROP NOT NULL,
    ADD COLUMN membership_application_id BIGINT REFERENCES membership_applications(id),
    ADD COLUMN verified_by BIGINT REFERENCES users(id),   -- leader who confirmed it (NULL = automatic, e.g. a future gateway)
    ADD COLUMN verified_at TIMESTAMPTZ;

-- Exactly one target: an event registration OR a membership application
ALTER TABLE payments
    ADD CONSTRAINT payments_one_target_check
    CHECK ((registration_id IS NOT NULL)::int + (membership_application_id IS NOT NULL)::int = 1);

-- One payment per application
CREATE UNIQUE INDEX one_payment_per_application
    ON payments (membership_application_id) WHERE membership_application_id IS NOT NULL;

-- Only these methods from now on (NOT VALID = existing rows are not re-checked)
ALTER TABLE payments
    ADD CONSTRAINT payments_method_check CHECK (method IN ('bkash', 'cash')) NOT VALID;

COMMIT;