-- Event audience, primary host club, payment review notes.
-- Run ONCE: psql club_hub -v ON_ERROR_STOP=1 -f backend/migrations/003_events.sql
BEGIN;

-- Who may register
ALTER TABLE events
    ADD COLUMN audience TEXT NOT NULL DEFAULT 'all_students',
    ADD CONSTRAINT events_audience_check
        CHECK (audience IN ('members_only', 'all_students'));

-- Which host club is the main organizer (the others, later, are co-hosts)
ALTER TABLE event_clubs ADD COLUMN is_primary BOOLEAN NOT NULL DEFAULT FALSE;

-- Existing events: the lowest club id becomes primary
UPDATE event_clubs ec
SET is_primary = TRUE
WHERE ec.club_id = (SELECT MIN(club_id) FROM event_clubs WHERE event_id = ec.event_id);

CREATE UNIQUE INDEX one_primary_club_per_event
    ON event_clubs (event_id) WHERE is_primary;

-- Reason shown to the student when a payment is rejected
ALTER TABLE payments ADD COLUMN review_note TEXT;

-- One OPEN payment per registration. Failed ones stay as history,
-- so a student can resubmit after a rejection.
CREATE UNIQUE INDEX one_open_payment_per_registration
    ON payments (registration_id)
    WHERE registration_id IS NOT NULL AND status IN ('pending', 'success');

CREATE INDEX events_start_idx ON events (start_at);
CREATE INDEX event_clubs_club_idx ON event_clubs (club_id);
CREATE INDEX event_registrations_user_idx ON event_registrations (user_id);

COMMIT;