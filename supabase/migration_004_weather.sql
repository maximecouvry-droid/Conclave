-- Migration 004 : météo des marathons (colonnes « Météo » et « Avis météo » de la base Notion).
-- À coller dans Supabase > SQL Editor > Run (sans risque si déjà exécuté).
alter table catalog add column if not exists weather_year    int;      -- année de la mesure (2026 ou 2025)
alter table catalog add column if not exists weather_kind    text;     -- 'observed' (réel autour de la course 2026) | 'last_year' (même date, an dernier)
alter table catalog add column if not exists temp_max        numeric;  -- °C
alter table catalog add column if not exists temp_min        numeric;  -- °C
alter table catalog add column if not exists rain_mm         numeric;  -- cumul sur les 3 jours (ou la période de référence)
alter table catalog add column if not exists rain_day_mm     numeric;  -- dont le jour J
alter table catalog add column if not exists wind_kmh        numeric;  -- vent max
alter table catalog add column if not exists weather_opinion text;     -- « Avis météo » (texte libre)
