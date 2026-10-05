-- =====================================================
-- University Club Hub: PostgreSQL schema
-- Rebuild everything with:  psql club_hub -f schema.sql
-- WARNING: the DROP line below wipes all data (dev only!)
-- =====================================================

DROP TABLE IF EXISTS
    notifications, announcements, payments, event_registrations,
    event_clubs, events, club_leaderships, club_members,
    club_status_history, clubs, users
CASCADE;

-- ---------- 1. WHO ----------

CREATE TABLE users (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                 TEXT        NOT NULL,
    email                TEXT        NOT NULL UNIQUE,
    password_hash        TEXT        NOT NULL,
    is_verified          BOOLEAN     NOT NULL DEFAULT FALSE,
    verification_token   TEXT,
    verification_expires TIMESTAMPTZ,
    role                 TEXT        NOT NULL DEFAULT 'student',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT users_role_check  CHECK (role IN ('student', 'admin')),
    CONSTRAINT users_email_lower CHECK (email = LOWER(email))
);

-- ---------- 2. CLUBS ----------

CREATE TABLE clubs (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name                TEXT        NOT NULL UNIQUE,
    description         TEXT        NOT NULL,
    category            TEXT        NOT NULL,
    logo_url            TEXT,
    advisor_name        TEXT        NOT NULL,
    advisor_email       TEXT,
    advisor_department  TEXT,
    status              TEXT        NOT NULL DEFAULT 'pending',
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT clubs_status_check
        CHECK (status IN ('pending', 'approved', 'rejected', 'suspended'))
);

-- The diary of everything that happened to a club (never edited, only added to)
CREATE TABLE club_status_history (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id    BIGINT      NOT NULL REFERENCES clubs(id),
    acted_by   BIGINT      NOT NULL REFERENCES users(id),
    action     TEXT        NOT NULL,
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT history_action_check
        CHECK (action IN ('submitted', 'resubmitted', 'approved',
                          'rejected', 'suspended', 'reinstated'))
);

-- Middle table: students <-> clubs
CREATE TABLE club_members (
    club_id   BIGINT      NOT NULL REFERENCES clubs(id),
    user_id   BIGINT      NOT NULL REFERENCES users(id),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at   TIMESTAMPTZ,              -- empty = still a member

    PRIMARY KEY (club_id, user_id),
    CONSTRAINT members_dates_check
        CHECK (left_at IS NULL OR left_at >= joined_at)
);

-- Who was president, and when (empty ended_at = current president)
CREATE TABLE club_leaderships (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    club_id    BIGINT      NOT NULL,
    user_id    BIGINT      NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at   TIMESTAMPTZ,

    -- president must be a row in club_members
    FOREIGN KEY (club_id, user_id) REFERENCES club_members(club_id, user_id),
    CONSTRAINT leadership_dates_check
        CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- Only ONE current president per club
CREATE UNIQUE INDEX one_current_president_per_club
    ON club_leaderships (club_id) WHERE ended_at IS NULL;

-- ---------- 3. EVENTS ----------

CREATE TABLE events (
    id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title                 TEXT          NOT NULL,
    description           TEXT,
    image_url             TEXT,
    venue                 TEXT          NOT NULL,
    start_at              TIMESTAMPTZ   NOT NULL,
    end_at                TIMESTAMPTZ   NOT NULL,
    registration_deadline TIMESTAMPTZ   NOT NULL,
    capacity              INTEGER,      -- empty = unlimited
    fee                   NUMERIC(10,2) NOT NULL DEFAULT 0,
    status                TEXT          NOT NULL DEFAULT 'published',
    created_by            BIGINT        NOT NULL REFERENCES users(id),
    created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT events_capacity_check CHECK (capacity IS NULL OR capacity >= 0),
    CONSTRAINT events_fee_check      CHECK (fee >= 0),
    CONSTRAINT events_time_check     CHECK (end_at > start_at),
    CONSTRAINT events_deadline_check CHECK (registration_deadline <= start_at),
    CONSTRAINT events_status_check
        CHECK (status IN ('published', 'cancelled', 'completed'))
);

-- Middle table: events <-> hosting clubs (collaboration!)
CREATE TABLE event_clubs (
    event_id BIGINT NOT NULL REFERENCES events(id),
    club_id  BIGINT NOT NULL REFERENCES clubs(id),
    PRIMARY KEY (event_id, club_id)
);

-- Middle table: students <-> events
CREATE TABLE event_registrations (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id      BIGINT      NOT NULL REFERENCES events(id),
    user_id       BIGINT      NOT NULL REFERENCES users(id),
    status        TEXT        NOT NULL DEFAULT 'registered',
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT one_registration_per_student UNIQUE (event_id, user_id),
    CONSTRAINT registrations_status_check
        CHECK (status IN ('pending_payment', 'registered', 'cancelled', 'attended'))
);

-- ---------- 4. PAYMENTS ----------

CREATE TABLE payments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    registration_id BIGINT        NOT NULL REFERENCES event_registrations(id),
    amount          NUMERIC(10,2) NOT NULL,
    method          TEXT          NOT NULL DEFAULT 'bkash',
    transaction_id  TEXT          UNIQUE,   -- empty until bKash gives one
    status          TEXT          NOT NULL DEFAULT 'pending',
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT payments_amount_check CHECK (amount > 0),
    CONSTRAINT payments_status_check
        CHECK (status IN ('pending', 'success', 'failed', 'refunded'))
);

-- ---------- 5. COMMUNICATION ----------

CREATE TABLE announcements (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title      TEXT        NOT NULL,
    body       TEXT        NOT NULL,
    created_by BIGINT      NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE notifications (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id         BIGINT      NOT NULL REFERENCES users(id),
    announcement_id BIGINT      REFERENCES announcements(id),  -- only for announcements
    type            TEXT        NOT NULL,
    title           TEXT        NOT NULL,
    message         TEXT        NOT NULL,
    link            TEXT,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT notifications_type_check
        CHECK (type IN ('club_event', 'registration_confirmed',
                        'payment_confirmed', 'club_review', 'announcement'))
);