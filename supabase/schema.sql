-- Supabase Dashboard > SQL Editor e eta ekbar run koro.
-- ⚠️ Niche 'YOUR_EMAIL_HERE' bodle nijer admin email dao (ja diye login korbe).

create table if not exists public.site_settings (
  id int primary key default 1,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  tech text[] default '{}',
  live_url text,
  repo_url text,
  image_url text,
  featured boolean default false,
  sort int default 0,
  created_at timestamptz default now()
);

create or replace function public.is_admin() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'YOUR_EMAIL_HERE'
$$;

alter table public.site_settings enable row level security;
alter table public.projects enable row level security;

drop policy if exists "public read settings" on public.site_settings;
drop policy if exists "admin write settings" on public.site_settings;
drop policy if exists "public read projects" on public.projects;
drop policy if exists "admin write projects" on public.projects;
create policy "public read settings" on public.site_settings for select using (true);
create policy "admin write settings" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());
create policy "public read projects" on public.projects for select using (true);
create policy "admin write projects" on public.projects for all using (public.is_admin()) with check (public.is_admin());

-- Storage bucket (favicon, character image, depth map, project covers)
insert into storage.buckets (id, name, public) values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

drop policy if exists "public read assets" on storage.objects;
drop policy if exists "admin insert assets" on storage.objects;
drop policy if exists "admin update assets" on storage.objects;
drop policy if exists "admin delete assets" on storage.objects;
create policy "public read assets" on storage.objects for select using (bucket_id = 'site-assets');
create policy "admin insert assets" on storage.objects for insert with check (bucket_id = 'site-assets' and public.is_admin());
create policy "admin update assets" on storage.objects for update using (bucket_id = 'site-assets' and public.is_admin());
create policy "admin delete assets" on storage.objects for delete using (bucket_id = 'site-assets' and public.is_admin());
