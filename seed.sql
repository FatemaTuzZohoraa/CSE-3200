-- =====================================================
-- RUET Club Hub: development seed data
--
-- Where the data comes from
--   * clubs.docx                -> the 8 clubs, their descriptions and advisors
--   * eventnacheivement.docx    -> 2 events (Achievements have no table yet,
--                                  they still live in the frontend mock data)
--   * frontend/src/data/mockData.js -> the club presidents / team captains
--
-- How to run
--   psql "$DATABASE_URL" -c 'CREATE DATABASE ruet_club_db'   (first time only)
--   psql "$DATABASE_URL" -f schema.sql      (first time only, creates the tables)
--   psql "$DATABASE_URL" -f seed.sql        (safe to run again, it truncates)
--
-- Every account below uses the password: ruet1234
--   student : 2203032@student.ruet.ac.bd   (Fatema Tuz Zohora)
--   leader  : 2001045@student.ruet.ac.bd   (Anika Rahman, Cyber Club president)
--   admin   : dsw@ruet.ac.bd               (Prof. Dr. M. A. Samad, DSW)
--   admin   : dean@ruet.ac.bd              (Dr. Harun-ur Rashid, Dean of Engineering)
--
-- The admin review queue (/admin/review) opens with 4 pending clubs, so approve
-- and reject can be tested before creating anything by hand.
-- =====================================================

-- Wipe existing rows but keep the tables. RESTART IDENTITY lets us insert clean
-- explicit ids below, and CASCADE clears the rows that depend on the others.
TRUNCATE TABLE
    notifications, announcements, payments, event_registrations,
    event_clubs, events, club_leaderships, club_members,
    club_status_history, clubs, users
RESTART IDENTITY CASCADE;

-- ---------- 1. USERS ----------

-- One bcrypt hash for "ruet1234", reused so the file stays readable.
INSERT INTO users (id, name, email, password_hash, is_verified, role, created_at) OVERRIDING SYSTEM VALUE
VALUES
    -- University admins. This is the only way to get role = 'admin', because the
    -- signup form always forces 'student' on the server. Two accounts so the
    -- review queue can be tested from two different browsers or private windows.
    (1, 'Prof. Dr. M. A. Samad', 'dsw@ruet.ac.bd',
     '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'admin',
     NOW() - INTERVAL '3 years'),

    (15, 'Dr. Harun-ur Rashid', 'dean@ruet.ac.bd',
     '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'admin',
     NOW() - INTERVAL '2 years'),

    -- Club presidents / team captains. Their accounts are role = 'student';
    -- leadership comes from the club_leaderships table further down.
    (2, 'Tanvir Ahmed',       '2001042@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '4 years'),
    (3, 'Anika Rahman',        '2001045@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '3 years'),
    (4, 'Mahmudul Hasan',      '2003120@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '3 years'),
    (5, 'Sabbir Hossain',      '2010311@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '3 years'),
    (6, 'Arif Chowdhury',      '2002115@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '3 years'),
    (7, 'Naimul Islam',        '2004110@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '3 years'),
    (8, 'Kazi Ashfaq',         '2010334@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '2 years'),
    (9, 'Zubair Hossain',      '2010312@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '2 years'),

    -- Ordinary students. 2203032 is the demo student used across the frontend.
    (10, 'Fatema Tuz Zohora',  '2203032@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '2 years'),
    (11, 'Nafis Ahmed',        '2203042@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '2 years'),
    (12, 'Sumaiya Akter',      '2201015@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '2 years'),
    (13, 'Rafiul Hasan',       '2204055@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '1 year'),
    (14, 'Nusrat Jahan',       '2206077@student.ruet.ac.bd', '$2b$10$yRUZvkM4qOrO03RKvJsDOO0XBi8TBiP9xTTqvtx38/CKmisJhUDli', TRUE, 'student', NOW() - INTERVAL '1 year');

-- ---------- 2. CLUBS ----------
-- All 8 come from clubs.docx and are already approved, so they show up on the
-- public Clubs page straight away.
--
-- logo_url is left NULL on purpose. The schema has no file upload, so there is
-- nothing to point at yet. The frontend draws a placeholder icon for these.
INSERT INTO clubs (
    id, name, description, category, logo_url,
    advisor_name, advisor_email, advisor_department, status, created_at
) OVERRIDING SYSTEM VALUE
VALUES
    (1, 'RUET Computing Society',
     'RUET Computing Society is a student-led technology community at Rajshahi University of Engineering & Technology, focused on learning, innovation, and practical computing. It brings together students interested in technology through workshops, events, projects, and collaborative activities, creating a space to learn new skills, build ideas, and grow together.',
     'Technology', NULL,
     'Dr. Md. Shahid Uz Zaman', 'shahiduz@ruet.ac.bd', 'Computer Science and Engineering',
     'approved', NOW() - INTERVAL '4 years'),

    (2, 'RUET Cybersecurity Club',
     'The Cybersecurity Club is a student-led community dedicated to exploring cybersecurity, ethical hacking, digital safety, and emerging security technologies. It provides students with opportunities to learn, practice, collaborate, and develop practical skills for tackling real-world cybersecurity challenges.',
     'Technology', NULL,
     'Dr. Md. Nazrul Islam Mondal', 'nazrul@ruet.ac.bd', 'Computer Science and Engineering',
     'approved', NOW() - INTERVAL '3 years'),

    (3, 'Robotic Society of RUET',
     'Curious about robots, automation, electronics, or building things that actually move? Robotic Society of RUET is a place to learn, experiment, build, and turn ideas into working projects while collaborating with fellow tech enthusiasts.',
     'Robotics', NULL,
     'Advisor Not Announced Yet', NULL, 'Mechanical Engineering',
     'approved', NOW() - INTERVAL '3 years'),

    (4, 'Astronomy and Science Society of RUET',
     'Ever looked at the night sky and wondered what''s out there? Astronomy and Science Society of RUET brings together curious minds through stargazing, science activities, competitions, and exploration, making science something to experience, not just study.',
     'Science', NULL,
     'Dr. Md. Johirul Islam', 'johirul@ruet.ac.bd', 'Physics',
     'approved', NOW() - INTERVAL '3 years'),

    (5, 'Onuronon - RUET Cultural Club',
     'Love music, dance, drama, literature, or simply expressing yourself creatively? Onuronon is a vibrant space to discover your talents, share your creativity, and celebrate culture with the RUET community.',
     'Cultural', NULL,
     'Md Abu Ismail Siddique', 'ismail@ruet.ac.bd', 'Civil Engineering',
     'approved', NOW() - INTERVAL '3 years'),

    (6, 'RUET Debating Club - RUET DC',
     'Love a good argument, or want to become better at expressing your ideas? RUET DC helps you sharpen your thinking, speaking, and debating skills through engaging debates, discussions, and competitions.',
     'Cultural', NULL,
     'Md Abu Ismail Siddique', 'ismail@ruet.ac.bd', 'Electrical and Electronic Engineering',
     'approved', NOW() - INTERVAL '3 years'),

    (7, 'Team Crack Platoon',
     'Bangladesh''s first Formula SAE team, Team Crack Platoon was formed by a group of automotive enthusiasts from RUET. Bringing together passion, engineering, and innovation, the team designs and builds race cars while taking on the challenges of Formula SAE competitions.',
     'Technology', NULL,
     'Advisor Not Announced Yet', NULL, 'Mechanical Engineering',
     'approved', NOW() - INTERVAL '2 years'),

    (8, 'Team Ogrodoot - RUET Rover Team',
     'Fascinated by Mars and space exploration? Team Ogrodoot is a community of space enthusiasts working together to design and build Mars rovers, turning curiosity about the Red Planet into hands-on engineering, innovation, and adventure.',
     'Robotics', NULL,
     'Advisor Not Announced Yet', NULL, 'Mechanical Engineering',
     'approved', NOW() - INTERVAL '2 years');

-- Four clubs left pending on purpose, so the admin review queue is not empty the
-- first time /admin/review is opened and both Approve and Reject can be tried
-- without submitting anything by hand.
--
-- These are NOT in clubs.docx. They are realistic filler submissions from the
-- demo students, sitting between 1 hour and 9 days in the queue.
INSERT INTO clubs (
    id, name, description, category, logo_url,
    advisor_name, advisor_email, advisor_department, status, created_at
) OVERRIDING SYSTEM VALUE
VALUES
    (9, 'RUET Photographic Society',
     'A student run society for photographers of every level. Workshops on camera fundamentals, editing, darkroom work, plus photo walks around campus and inter-university photo contests.',
     'Cultural', NULL,
     'Md Abu Ismail Siddique', 'ismail@ruet.ac.bd', 'Civil Engineering',
     'pending', NOW() - INTERVAL '2 days'),

    (10, 'RUET Debate & Research Society',
     'A society for students who enjoy public speaking, parliamentary debate and academic research. Weekly practice sessions, mock parliament, and entry to inter-university and national debate circuits.',
     'Academic', NULL,
     'Dr. Md. Johirul Islam', 'johirul@ruet.ac.bd', 'Physics',
     'pending', NOW() - INTERVAL '4 days'),

    (11, 'RUET Football Club',
     'The official student football club of RUET. Regular weekend league matches, an annual inter-department tournament, and trials open to all students regardless of department.',
     'Sports', NULL,
     'Advisor Not Announced Yet', NULL, 'Physical Education',
     'pending', NOW() - INTERVAL '6 days'),

    (12, 'RUET Innovation and Startup Cell',
     'A student cell helping early stage ideas become real projects. Runs ideation jams, pitch clinics with alumni founders, and connects selected teams with mentors and university funding.',
     'Career', NULL,
     'Dr. Md. Nazrul Islam Mondal', 'nazrul@ruet.ac.bd', 'Computer Science and Engineering',
     'pending', NOW() - INTERVAL '9 days');

-- ---------- 3. MEMBERS ----------

-- Presidents first, because club_leaderships has a foreign key onto this table.
INSERT INTO club_members (club_id, user_id, joined_at) VALUES
    (1,  2, NOW() - INTERVAL '4 years'),   -- Tanvir Ahmed   -> RUET Computing Society
    (2,  3, NOW() - INTERVAL '3 years'),   -- Anika Rahman   -> RUET Cybersecurity Club
    (3,  4, NOW() - INTERVAL '3 years'),   -- Mahmudul Hasan -> Robotic Society of RUET
    (4,  5, NOW() - INTERVAL '3 years'),   -- Sabbir Hossain -> Astronomy and Science Society
    (5,  6, NOW() - INTERVAL '3 years'),   -- Arif Chowdhury -> Onuronon
    (6,  7, NOW() - INTERVAL '3 years'),   -- Naimul Islam   -> RUET DC
    (7,  8, NOW() - INTERVAL '2 years'),   -- Kazi Ashfaq    -> Team Crack Platoon
    (8,  9, NOW() - INTERVAL '2 years'),   -- Zubair Hossain -> Team Ogrodoot
    (9,  10, NOW() - INTERVAL '2 days'),   -- Fatema Tuz Zohora submitted club 9

    -- Regular members. These are the "joined an existing club" rows, which is
    -- what the student-facing /api/clubs/joined page reads.
    (1, 10, NOW() - INTERVAL '2 years'),
    (1, 11, NOW() - INTERVAL '1 year'),
    (2, 10, NOW() - INTERVAL '2 years'),
    (2, 12, NOW() - INTERVAL '1 year'),
    (2, 13, NOW() - INTERVAL '6 months'),
    (3, 11, NOW() - INTERVAL '1 year'),
    (3, 14, NOW() - INTERVAL '6 months'),
    (4, 13, NOW() - INTERVAL '8 months'),
    (5, 12, NOW() - INTERVAL '1 year'),
    (5, 14, NOW() - INTERVAL '5 months'),
    (6, 11, NOW() - INTERVAL '1 year'),
    (7, 13, NOW() - INTERVAL '6 months'),
    (8, 14, NOW() - INTERVAL '4 months'),

    -- Creators of the 4 pending clubs. club_leaderships below points at these
    -- same rows, which the foreign key requires.
    (10, 12, NOW() - INTERVAL '4 days'),   -- Sumaiya Akter  -> Debate & Research
    (11, 13, NOW() - INTERVAL '6 days'),   -- Rafiul Hasan   -> Football Club
    (12, 14, NOW() - INTERVAL '9 days');   -- Nusrat Jahan   -> Innovation Cell

-- ---------- 4. LEADERSHIPS ----------
-- ended_at stays NULL, which is how the database marks the one current
-- president per club. The partial unique index one_current_president_per_club
-- will reject a second NULL row for the same club.
INSERT INTO club_leaderships (club_id, user_id, started_at) VALUES
    (1, 2, NOW() - INTERVAL '4 years'),
    (2, 3, NOW() - INTERVAL '3 years'),
    (3, 4, NOW() - INTERVAL '3 years'),
    (4, 5, NOW() - INTERVAL '3 years'),
    (5, 6, NOW() - INTERVAL '3 years'),
    (6, 7, NOW() - INTERVAL '3 years'),
    (7, 8, NOW() - INTERVAL '2 years'),
    (8, 9, NOW() - INTERVAL '2 years'),
    (9, 10, NOW() - INTERVAL '2 days'),
    (10, 12, NOW() - INTERVAL '4 days'),
    (11, 13, NOW() - INTERVAL '6 days'),
    (12, 14, NOW() - INTERVAL '9 days');

-- ---------- 5. STATUS HISTORY ----------
-- The audit trail. Every club has a 'submitted' row by its creator and an
-- 'approved' row by the DSW (user 1). Clubs 9 to 12 stop at 'submitted', so the
-- admin review screen has 4 real rows to approve or reject.
INSERT INTO club_status_history (club_id, acted_by, action, comment, created_at) VALUES
    (1, 2, 'submitted', 'Submitted by Tanvir Ahmed for DSW/Admin review', NOW() - INTERVAL '4 years'),
    (1, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '4 years' + INTERVAL '7 days'),

    (2, 3, 'submitted', 'Submitted by Anika Rahman for DSW/Admin review',   NOW() - INTERVAL '3 years'),
    (2, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '3 years' + INTERVAL '5 days'),

    (3, 4, 'submitted', 'Submitted by Mahmudul Hasan for DSW/Admin review', NOW() - INTERVAL '3 years'),
    (3, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '3 years' + INTERVAL '3 days'),

    (4, 5, 'submitted', 'Submitted by Sabbir Hossain for DSW/Admin review', NOW() - INTERVAL '3 years'),
    (4, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '3 years' + INTERVAL '2 days'),

    (5, 6, 'submitted', 'Submitted by Arif Chowdhury for DSW/Admin review', NOW() - INTERVAL '3 years'),
    (5, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '3 years' + INTERVAL '2 days'),

    (6, 7, 'submitted', 'Submitted by Naimul Islam for DSW/Admin review',   NOW() - INTERVAL '3 years'),
    (6, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '3 years' + INTERVAL '1 day'),

    (7, 8, 'submitted', 'Submitted by Kazi Ashfaq for DSW/Admin review',    NOW() - INTERVAL '2 years'),
    (7, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '2 years' + INTERVAL '30 days'),

    (8, 9, 'submitted', 'Submitted by Zubair Hossain for DSW/Admin review', NOW() - INTERVAL '2 years'),
    (8, 1, 'approved',  'Approved by administrator',                       NOW() - INTERVAL '2 years' + INTERVAL '20 days'),

    (9, 10, 'submitted', 'Submitted by Fatema Tuz Zohora for DSW/Admin review', NOW() - INTERVAL '2 days'),

    (10, 12, 'submitted', 'Submitted by Sumaiya Akter for DSW/Admin review', NOW() - INTERVAL '4 days'),

    (11, 13, 'submitted', 'Submitted by Rafiul Hasan for DSW/Admin review',   NOW() - INTERVAL '6 days'),

    (12, 14, 'submitted', 'Submitted by Nusrat Jahan for DSW/Admin review',   NOW() - INTERVAL '9 days');

-- ---------- 6. EVENTS ----------
-- From eventnacheivement.docx. Times are Bangladesh time (+06). The schema needs
-- registration_deadline <= start_at and end_at > start_at.
--
-- created_by is the club president, matching what the app would store.
INSERT INTO events (
    id, title, description, image_url, venue,
    start_at, end_at, registration_deadline,
    capacity, fee, status, created_by
) OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Cyber Treasure Hunt 2.0',
     'Exclusive online CTF and cybersecurity treasure hunt organized by the RUET Cybersecurity Club. Challenges across web, crypto and forensics categories.',
     NULL, 'Online',
     '2026-09-18 10:00:00+06', '2026-09-18 16:00:00+06', '2026-09-17 23:59:00+06',
     200, 0, 'published', 3),

    (2, 'Sky Observation Event',
     'Night sky stargazing and astronomical observation gathering at Talaimari Shahid Minar, Rajshahi. Telescopes provided, beginners welcome.',
     NULL, 'Talaimari Shahid Minar, Rajshahi',
     '2026-09-24 20:00:00+06', '2026-09-24 23:00:00+06', '2026-09-24 19:00:00+06',
     300, 0, 'published', 5);

-- Hosting club for each event.
INSERT INTO event_clubs (event_id, club_id) VALUES
    (1, 2),   -- Cyber Treasure Hunt 2.0 -> RUET Cybersecurity Club
    (2, 4);   -- Sky Observation Event    -> Astronomy and Science Society of RUET

-- Students who registered. one_registration_per_student keeps this unique.
INSERT INTO event_registrations (event_id, user_id, status, registered_at) VALUES
    (1, 10, 'registered', NOW() - INTERVAL '10 days'),
    (1, 11, 'registered', NOW() - INTERVAL '9 days'),
    (1, 13, 'registered', NOW() - INTERVAL '7 days'),
    (1, 14, 'attended',   NOW() - INTERVAL '9 days'),
    (2, 10, 'registered', NOW() - INTERVAL '5 days'),
    (2, 12, 'registered', NOW() - INTERVAL '4 days'),
    (2, 13, 'registered', NOW() - INTERVAL '3 days');

-- ---------- 7. ANNOUNCEMENTS + NOTIFICATIONS ----------

INSERT INTO announcements (id, title, body, created_by, created_at) OVERRIDING SYSTEM VALUE
VALUES
    (1, 'Club Registration Is Open',
     'Students can now register for any approved club from the My Clubs page. Membership is recorded immediately and the club president is notified.',
     1, NOW() - INTERVAL '5 days'),

    (2, 'Submit Your Club For Approval',
     'Any RUET student can propose a new club. Fill in the Create Club form, and your club goes to the DSW office for review. Approved clubs appear on the public directory.',
     1, NOW() - INTERVAL '2 weeks'),

    (3, 'Cyber Treasure Hunt 2.0 Registration',
     'The RUET Cybersecurity Club is hosting Cyber Treasure Hunt 2.0 online. 200 seats, entry is free. Register before the deadline.',
     3, NOW() - INTERVAL '12 days'),

    (4, 'Sky Observation At Talaimari',
     'Join the Astronomy and Science Society of RUET at Talaimari Shahid Minar for an evening of telescope observation.',
     5, NOW() - INTERVAL '7 days');

INSERT INTO notifications (
    user_id, announcement_id, type, title, message, link, is_read, created_at
) VALUES
    (10, 1, 'announcement', 'Club Registration Is Open',
     'You can now register for any approved club from the My Clubs page.', '/my-clubs', FALSE, NOW() - INTERVAL '5 days'),

    (10, 3, 'club_event', 'Cyber Treasure Hunt 2.0',
     'The RUET Cybersecurity Club is hosting Cyber Treasure Hunt 2.0 online on 18 September 2026.', '/events', FALSE, NOW() - INTERVAL '12 days'),

    (10, NULL, 'registration_confirmed', 'Registration Confirmed',
     'Your registration for Sky Observation Event is confirmed.', '/events', TRUE, NOW() - INTERVAL '5 days'),

    (10, NULL, 'club_review', 'Your Club Is Under Review',
     'RUET Photographic Society has been submitted and is waiting for a DSW decision.', '/my-submissions', FALSE, NOW() - INTERVAL '2 days'),

    (1, 2, 'announcement', 'New Club Submissions',
     '4 new clubs are waiting in the review queue.', '/admin/review', FALSE, NOW() - INTERVAL '2 days'),

    (15, 2, 'announcement', 'New Club Submissions',
     '4 new clubs are waiting in the review queue.', '/admin/review', FALSE, NOW() - INTERVAL '2 days'),

    (3, NULL, 'club_review', 'Event Reminder',
     'Cyber Treasure Hunt 2.0 starts at 10:00 am on 18 September 2026.', '/events', FALSE, NOW() - INTERVAL '3 days');

-- ---------- 8. RESET IDENTITY SEQUENCES ----------
-- We inserted explicit ids with OVERRIDING SYSTEM VALUE, which leaves the
-- identity sequences behind. Move each one past the highest id we used, so the
-- next INSERT from the app does not hit a duplicate key.
SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1));
SELECT setval(pg_get_serial_sequence('clubs', 'id'), COALESCE((SELECT MAX(id) FROM clubs), 1));
SELECT setval(pg_get_serial_sequence('club_status_history', 'id'), COALESCE((SELECT MAX(id) FROM club_status_history), 1));
SELECT setval(pg_get_serial_sequence('club_leaderships', 'id'), COALESCE((SELECT MAX(id) FROM club_leaderships), 1));
SELECT setval(pg_get_serial_sequence('events', 'id'), COALESCE((SELECT MAX(id) FROM events), 1));
SELECT setval(pg_get_serial_sequence('event_registrations', 'id'), COALESCE((SELECT MAX(id) FROM event_registrations), 1));
SELECT setval(pg_get_serial_sequence('announcements', 'id'), COALESCE((SELECT MAX(id) FROM announcements), 1));
SELECT setval(pg_get_serial_sequence('notifications', 'id'), COALESCE((SELECT MAX(id) FROM notifications), 1));

-- ---------- DONE ----------
-- Quick sanity check, run this after seeding:
--
--   SELECT c.name, c.status, COUNT(m.user_id) AS members
--   FROM clubs c
--   LEFT JOIN club_members m ON m.club_id = c.id AND m.left_at IS NULL
--   GROUP BY c.id, c.name, c.status
--   ORDER BY c.id;