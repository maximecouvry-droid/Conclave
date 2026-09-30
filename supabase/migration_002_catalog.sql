-- Migration 002 : catalogue des marathons (liste fixée en amont) + lien depuis les marathons d'une salle.
-- À coller dans Supabase > SQL Editor > Run (sans risque si déjà exécuté).

create table if not exists catalog (
  slug                text primary key,
  position            int  not null default 0,
  name                text not null,
  lat                 double precision,
  lng                 double precision,
  date                date,
  loops               text,
  elevation           text,
  half                text,
  participants        int,
  city_image          text,
  course_image        text,
  official_url        text,
  course_url          text,
  from_paris          text,
  other_races         text,
  participants_source text
);

alter table catalog enable row level security;
drop policy if exists "public read catalog" on catalog;
create policy "public read catalog" on catalog for select to anon, authenticated using (true);

alter table marathons add column if not exists slug text;
