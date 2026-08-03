-- DigitABEL — E-postlogg for automatiske utsendelser
-- Run this in your Supabase project: SQL Editor → New Query → Paste → Run
--
-- Holder styr på hvilke automatiske e-poster (velkomstmail + planlagte
-- veiledningspåminnelser) som er sendt til hvilke studenter, slik at
-- ingen får samme e-post to ganger.

create table if not exists email_log (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  email_type text not null,
  sent_at    timestamptz default now(),
  unique (student_id, email_type)
);

alter table email_log enable row level security;

create policy "Allow all" on email_log for all using (true) with check (true);
