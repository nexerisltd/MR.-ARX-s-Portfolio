-- Visitor analytics (v2). schema.sql age run kora thakte hobe (public.is_admin() lagbe).
-- Supabase > SQL Editor e eta run koro. Abar run korleo kono data jay na (idempotent) —
-- purano version theke upgrade korte o eta-i run koro.

create table if not exists public.visits (
  id uuid primary key,
  created_at timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  visitor_id text not null,
  session_id text not null,
  path text not null,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  device text,
  browser text,
  os text,
  screen text,
  language text,
  timezone text,
  duration_s int not null default 0,
  max_scroll int not null default 0
);
-- v2 columns
alter table public.visits add column if not exists country text;
alter table public.visits add column if not exists region text;
alter table public.visits add column if not exists city text;
alter table public.visits add column if not exists ip_hash text;
alter table public.visits add column if not exists is_bot boolean not null default false;
alter table public.visits add column if not exists bot_name text;
alter table public.visits add column if not exists bot_category text;
alter table public.visits add column if not exists user_agent text;
alter table public.visits add column if not exists link_code text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'visits_len') then
    alter table public.visits add constraint visits_len check (char_length(path) <= 200 and char_length(visitor_id) <= 64 and char_length(session_id) <= 64);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'visits_len2') then
    alter table public.visits add constraint visits_len2 check (
      char_length(coalesce(country, '')) <= 8 and char_length(coalesce(region, '')) <= 60 and char_length(coalesce(city, '')) <= 80
      and char_length(coalesce(ip_hash, '')) <= 32 and char_length(coalesce(bot_name, '')) <= 60 and char_length(coalesce(bot_category, '')) <= 30
      and char_length(coalesce(user_agent, '')) <= 300 and char_length(coalesce(link_code, '')) <= 40);
  end if;
end $$;
create index if not exists visits_created_idx on public.visits (created_at desc);
create index if not exists visits_visitor_idx on public.visits (visitor_id);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  visitor_id text,
  session_id text,
  path text,
  name text not null,
  label text,
  url text,
  constraint events_len check (char_length(name) <= 40 and char_length(coalesce(label, '')) <= 120 and char_length(coalesce(url, '')) <= 300)
);
create index if not exists events_created_idx on public.events (created_at desc);

-- JS na-chalano bot (middleware theke)
create table if not exists public.bot_hits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  path text,
  user_agent text,
  bot_name text,
  bot_category text,
  country text,
  region text,
  city text,
  ip_hash text,
  constraint bot_hits_len check (char_length(coalesce(path, '')) <= 200 and char_length(coalesce(user_agent, '')) <= 300 and char_length(coalesce(bot_name, '')) <= 60 and char_length(coalesce(country, '')) <= 8)
);
create index if not exists bot_hits_created_idx on public.bot_hits (created_at desc);

-- naamer tracking link (jemon ?v=recruiter-acme) — ke link khulche seta chena jay
create table if not exists public.track_links (
  code text primary key,
  label text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint track_links_len check (char_length(code) <= 40 and char_length(label) <= 120)
);

alter table public.visits enable row level security;
alter table public.events enable row level security;
alter table public.bot_hits enable row level security;
alter table public.track_links enable row level security;

drop policy if exists "anyone can log a visit" on public.visits;
drop policy if exists "admin reads visits" on public.visits;
drop policy if exists "admin deletes visits" on public.visits;
drop policy if exists "anyone can log an event" on public.events;
drop policy if exists "admin reads events" on public.events;
drop policy if exists "admin deletes events" on public.events;
drop policy if exists "anyone can log a bot hit" on public.bot_hits;
drop policy if exists "admin reads bot hits" on public.bot_hits;
drop policy if exists "admin deletes bot hits" on public.bot_hits;
drop policy if exists "admin manages links" on public.track_links;

-- visitor / bot ra shudhu INSERT korte pare; read/update/delete shudhu admin
create policy "anyone can log a visit" on public.visits for insert with check (true);
create policy "admin reads visits" on public.visits for select using (public.is_admin());
create policy "admin deletes visits" on public.visits for delete using (public.is_admin());
create policy "anyone can log an event" on public.events for insert with check (true);
create policy "admin reads events" on public.events for select using (public.is_admin());
create policy "admin deletes events" on public.events for delete using (public.is_admin());
create policy "anyone can log a bot hit" on public.bot_hits for insert with check (true);
create policy "admin reads bot hits" on public.bot_hits for select using (public.is_admin());
create policy "admin deletes bot hits" on public.bot_hits for delete using (public.is_admin());
create policy "admin manages links" on public.track_links for all using (public.is_admin()) with check (public.is_admin());

-- time-on-page / scroll update: shudhu nijer visit id jane tar row bariye dite pare
create or replace function public.track_heartbeat(p_id uuid, p_duration int, p_scroll int)
returns void language sql security definer set search_path = public as $$
  update public.visits
     set duration_s = greatest(duration_s, least(coalesce(p_duration, 0), 86400)),
         max_scroll = greatest(max_scroll, least(coalesce(p_scroll, 0), 100)),
         last_seen = now()
   where id = p_id;
$$;
grant execute on function public.track_heartbeat(uuid, int, int) to anon, authenticated;


-- ================= LIKES (login chhara, 7 diner moddhe ekbar) =================
create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  target text not null default 'site',
  visitor_id text,
  net_hash text,
  constraint likes_len check (char_length(target) <= 60 and char_length(coalesce(visitor_id, '')) <= 64 and char_length(coalesce(net_hash, '')) <= 40)
);
create index if not exists likes_target_idx on public.likes (target);
create index if not exists likes_visitor_idx on public.likes (visitor_id, created_at desc);
create index if not exists likes_net_idx on public.likes (net_hash, created_at desc);
-- race guard: ek-i identity, ek-i target, ek-i calendar week e duto row hote parbe na
create unique index if not exists likes_visitor_week_uidx on public.likes (visitor_id, target, (date_trunc('week', created_at at time zone 'utc'))) where visitor_id is not null;
create unique index if not exists likes_net_week_uidx on public.likes (net_hash, target, (date_trunc('week', created_at at time zone 'utc'))) where net_hash is not null;

alter table public.likes enable row level security;
drop policy if exists "admin reads likes" on public.likes;
drop policy if exists "admin deletes likes" on public.likes;
-- anon er kono policy nai: likhe shudhu /api/like (service role) — browser theke shorashori insert kora jay na
create policy "admin reads likes" on public.likes for select using (public.is_admin());
create policy "admin deletes likes" on public.likes for delete using (public.is_admin());

create or replace function public.like_counts()
returns table(target text, n bigint) language sql security definer set search_path = public as $$
  select target, count(*)::bigint from public.likes group by target;
$$;
grant execute on function public.like_counts() to anon, authenticated, service_role;


-- ================= RAW IP (opt-in: Vercel env STORE_RAW_IP=1) + INQUIRIES =================
alter table public.visits add column if not exists ip text;
alter table public.bot_hits add column if not exists ip text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'visits_ip_len') then
    alter table public.visits add constraint visits_ip_len check (char_length(coalesce(ip, '')) <= 45);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'bot_hits_ip_len') then
    alter table public.bot_hits add constraint bot_hits_ip_len check (char_length(coalesce(ip, '')) <= 45);
  end if;
end $$;

-- admin purano IP muchte pare (retention: 90 din)
drop policy if exists "admin updates visits" on public.visits;
drop policy if exists "admin updates bot hits" on public.bot_hits;
create policy "admin updates visits" on public.visits for update using (public.is_admin()) with check (public.is_admin());
create policy "admin updates bot hits" on public.bot_hits for update using (public.is_admin()) with check (public.is_admin());

-- Optional: roj raate 90 diner purano IP auto-muchte (Supabase > Database > Extensions e pg_cron on korte hobe)
-- select cron.schedule('purge-old-ip', '0 3 * * *', $$
--   update public.visits set ip = null where ip is not null and created_at < now() - interval '90 days';
--   update public.bot_hits set ip = null where ip is not null and created_at < now() - interval '90 days';
-- $$);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  services text[] not null default '{}',
  budget text,
  timeline text,
  message text not null,
  visitor_id text,
  session_id text,
  link_code text,
  ip_hash text,
  country text,
  city text,
  status text not null default 'new',
  note text,
  constraint inquiries_len check (char_length(name) <= 80 and char_length(email) <= 120 and char_length(message) <= 2000 and char_length(coalesce(note, '')) <= 1000),
  constraint inquiries_status check (status in ('new', 'contacted', 'won', 'lost'))
);
create index if not exists inquiries_created_idx on public.inquiries (created_at desc);
create index if not exists inquiries_ip_idx on public.inquiries (ip_hash, created_at desc);
alter table public.inquiries enable row level security;
drop policy if exists "admin manages inquiries" on public.inquiries;
-- anon er kono policy nai: likhe shudhu /api/inquiry (service role)
create policy "admin manages inquiries" on public.inquiries for all using (public.is_admin()) with check (public.is_admin());
