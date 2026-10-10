-- Migration 003 : « heartbeat » quotidien dans la base (pg_cron) contre la mise en pause du plan gratuit.
-- Méthode : https://inforeole.substack.com/p/votre-projet-supabase-se-met-en-pause
-- À coller dans Supabase > SQL Editor > Run. Sans risque si déjà exécuté.
-- (En complément du ping GitHub Actions : .github/workflows/keep-supabase-alive.yml)

create extension if not exists pg_cron;

create table if not exists public.keep_alive (
  last_ping timestamptz default now()
);
-- la table n'a pas à être lisible/écrivable depuis l'API : RLS active, aucune policy
-- (le job pg_cron s'exécute avec les droits de la base et n'est pas concerné)
alter table public.keep_alive enable row level security;

-- évite les doublons si on relance le script
do $$
begin
  perform cron.unschedule('prevent_project_pause');
exception when others then
  null;
end $$;

-- une écriture par jour, à minuit UTC
select cron.schedule(
  'prevent_project_pause',
  '0 0 * * *',
  $$delete from public.keep_alive; insert into public.keep_alive default values;$$
);

-- première écriture tout de suite
delete from public.keep_alive;
insert into public.keep_alive default values;

-- ---------- Vérification (à lancer dans une nouvelle requête) ----------
-- select jobname, schedule, active from cron.job where jobname = 'prevent_project_pause';
-- select status, start_time from cron.job_run_details order by start_time desc limit 3;
-- select last_ping from public.keep_alive;

-- ---------- Désinstallation (si un jour tu passes au plan Pro) ----------
-- select cron.unschedule('prevent_project_pause');
-- drop table if exists public.keep_alive;
