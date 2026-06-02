-- DigitABEL — Initial schema
-- Run this in your Supabase project: SQL Editor → New Query → Paste → Run

-- ─── Students ───────────────────────────────────────────────────────────────
create table if not exists students (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  email      text,
  phone      text,
  created_at timestamptz default now()
);

-- ─── Assignments ─────────────────────────────────────────────────────────────
-- These are seeded from the app (src/data/assignments.js).
-- This table exists so the teacher dashboard can cross-reference IDs.
create table if not exists assignments (
  id              text primary key,  -- matches the id in assignments.js
  order_index     integer not null,
  title           text not null,
  supervision_date date,
  created_at      timestamptz default now()
);

-- ─── Student ↔ Assignment progress ──────────────────────────────────────────
create table if not exists student_assignments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid references students(id) on delete cascade,
  assignment_id text references assignments(id) on delete cascade,
  status        text not null default 'not_started'
                  check (status in ('not_started', 'in_progress', 'cleared')),
  started_at    timestamptz,
  cleared_at    timestamptz,
  created_at    timestamptz default now(),
  unique (student_id, assignment_id)
);

-- ─── Preparation answers ─────────────────────────────────────────────────────
create table if not exists prep_answers (
  id                     uuid primary key default gen_random_uuid(),
  student_assignment_id  uuid references student_assignments(id) on delete cascade,
  question_index         integer not null,
  question_text          text not null,
  answer                 text not null,
  created_at             timestamptz default now()
);

-- ─── Chat messages ───────────────────────────────────────────────────────────
create table if not exists chat_messages (
  id                     uuid primary key default gen_random_uuid(),
  student_assignment_id  uuid references student_assignments(id) on delete cascade,
  role                   text not null check (role in ('user', 'assistant')),
  content                text not null,
  created_at             timestamptz default now()
);

-- ─── Reflections ─────────────────────────────────────────────────────────────
create table if not exists reflections (
  id                     uuid primary key default gen_random_uuid(),
  student_assignment_id  uuid references student_assignments(id) on delete cascade unique,
  what_learned           text,
  what_changed           text,
  what_differently       text,
  created_at             timestamptz default now()
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
-- For simplicity, allow all operations with anon key.
-- Tighten these for production as needed.
alter table students            enable row level security;
alter table assignments         enable row level security;
alter table student_assignments enable row level security;
alter table prep_answers        enable row level security;
alter table chat_messages       enable row level security;
alter table reflections         enable row level security;

create policy "Allow all" on students            for all using (true) with check (true);
create policy "Allow all" on assignments         for all using (true) with check (true);
create policy "Allow all" on student_assignments for all using (true) with check (true);
create policy "Allow all" on prep_answers        for all using (true) with check (true);
create policy "Allow all" on chat_messages       for all using (true) with check (true);
create policy "Allow all" on reflections         for all using (true) with check (true);

-- ─── Seed assignments ────────────────────────────────────────────────────────
-- Insert the 6 assignments so foreign keys resolve.
insert into assignments (id, order_index, title) values
  ('assignment-1', 1, 'Briefing & Concept Development'),
  ('assignment-2', 2, 'Video Production — Pre-production'),
  ('assignment-3', 3, 'Podcast Production — Audio Storytelling'),
  ('assignment-4', 4, 'Social Media Campaign — Strategy & Content'),
  ('assignment-5', 5, 'Interactive Media — UX & Concept Design'),
  ('assignment-6', 6, 'Final Portfolio — Concept & Scope')
on conflict (id) do nothing;

-- ─── Enable realtime ─────────────────────────────────────────────────────────
-- Run in Supabase dashboard: Database → Replication → enable for student_assignments
-- Or uncomment:
-- alter publication supabase_realtime add table student_assignments;
