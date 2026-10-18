
-- ---------- catalogue des marathons (migration 002) ----------
-- Voir supabase/migration_002_catalog.sql (même contenu) : à exécuter aussi sur une base existante.
create table if not exists catalog (
  slug text primary key, position int not null default 0, name text not null,
  lat double precision, lng double precision, date date, loops text, elevation text, half text,
  participants int, city_image text, course_image text, official_url text, course_url text,
  from_paris text, other_races text, participants_source text
);
alter table catalog enable row level security;
drop policy if exists "public read catalog" on catalog;
create policy "public read catalog" on catalog for select to anon, authenticated using (true);
alter table marathons add column if not exists slug text;

-- ---------- météo (migration 004) ----------
alter table catalog add column if not exists weather_year int;
alter table catalog add column if not exists weather_kind text;
alter table catalog add column if not exists temp_max numeric;
alter table catalog add column if not exists temp_min numeric;
alter table catalog add column if not exists rain_mm numeric;
alter table catalog add column if not exists rain_day_mm numeric;
alter table catalog add column if not exists wind_kmh numeric;
alter table catalog add column if not exists weather_opinion text;
