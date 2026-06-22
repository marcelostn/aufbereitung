-- ============================================================================
-- Migration: Slot-Buchung (konkrete Startzeit + Dauer) + Verfügbarkeits-Einstellungen
-- ============================================================================
-- Einmal im Supabase SQL Editor ausführen.
-- ============================================================================

-- Termine: konkrete Startzeit + Dauer (für lückenlose Slot-Belegung)
alter table termine
  add column if not exists start_zeit text default '',
  add column if not exists dauer_min integer default 0;

-- Generische Einstellungen (key/value als JSON) — u.a. Verfügbarkeit/Arbeitszeiten
create table if not exists einstellungen (
  schluessel text primary key,
  wert       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

drop trigger if exists set_updated_at on einstellungen;
create trigger set_updated_at before update on einstellungen
  for each row execute function set_updated_at();

alter table einstellungen enable row level security;
