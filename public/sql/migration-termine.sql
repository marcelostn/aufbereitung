-- ============================================================================
-- Migration: Tabelle `termine` (eigenes Buchungssystem, ersetzt Cal.eu)
-- ============================================================================
-- Einmal im Supabase SQL Editor ausführen.
-- (Dashboard → SQL Editor → New Query → Paste → Run)
-- ============================================================================

create table if not exists termine (
  id                uuid primary key default gen_random_uuid(),
  status            text not null default 'offen'
                      check (status in ('offen','bestaetigt','abgesagt','erledigt')),

  -- Wunschtermin (vom Kunden)
  wunsch_datum      date,
  wunsch_zeit       text default '',         -- 'vormittags' | 'nachmittags' | 'ganztags' | 'flexibel'
  wunsch_alternativ text default '',         -- optionaler Ausweichtermin / Freitext

  -- Bestätigter Termin (vom Admin, kann vom Wunsch abweichen)
  bestaetigt_datum  date,
  bestaetigt_zeit   text default '',

  -- Kunde
  name              text not null default '',
  telefon           text default '',
  email             text default '',
  strasse           text default '',
  plz               text default '',
  ort               text default '',
  kennzeichen       text default '',

  -- Leistung
  fahrzeug_gruppe   text default '',         -- 'pkw' | 'lkw'
  paket             text default '',
  reinigungsort     text default '',         -- 'vorort' | 'beiuns'
  aufpreise         text default '',
  entfernung_km     numeric(10,2) default 0,
  preis             numeric(10,2) default 0,

  notiz             text default '',         -- Nachricht des Kunden
  admin_notiz       text default '',         -- interne Notiz

  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists termine_status_idx on termine(status);
create index if not exists termine_wunsch_datum_idx on termine(wunsch_datum);
create index if not exists termine_created_idx on termine(created_at desc);

-- updated_at-Auto-Trigger (set_updated_at() existiert bereits aus schema.sql)
drop trigger if exists set_updated_at on termine;
create trigger set_updated_at before update on termine
  for each row execute function set_updated_at();

-- Row Level Security: nur Service-Role-Key kann zugreifen
alter table termine enable row level security;
