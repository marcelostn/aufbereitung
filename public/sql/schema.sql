-- ============================================================================
-- Autoaufbereitung Cloppenburg — Supabase Schema
-- ============================================================================
-- Diese Datei einmal in den Supabase SQL Editor kopieren und ausführen.
-- (Supabase Dashboard → SQL Editor → New Query → Paste → Run)
--
-- Alle Tabellen haben:
--   - id           uuid PRIMARY KEY DEFAULT gen_random_uuid()
--   - created_at   timestamptz DEFAULT now()
--   - updated_at   timestamptz DEFAULT now()
--
-- Row Level Security: AKTIVIERT, aber keine Policies — bedeutet:
-- Zugriff nur mit Service-Role-Key (umgeht RLS).
-- Anon-Key kann nichts lesen/schreiben → sicher gegen Browser-Manipulation.
-- ============================================================================


-- ── 1. Rechnungen ───────────────────────────────────────────────────────────
create table if not exists rechnungen (
  id                uuid primary key default gen_random_uuid(),
  r_nr              text not null unique,
  r_datum           date not null,
  l_datum           date not null,
  k_name            text not null,
  k_adresse         text default '',
  k_email           text default '',
  k_telefon         text default '',
  fahrzeug          text default '',
  positionen        jsonb not null default '[]'::jsonb,
  zahlung           text not null check (zahlung in ('bar', 'karte', 'ueberweisung')),
  zahlungsziel      text default '14',
  notiz             text default '',
  brutto            numeric(10, 2) not null default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists rechnungen_r_datum_idx on rechnungen(r_datum desc);
create index if not exists rechnungen_k_telefon_idx on rechnungen(k_telefon);
create index if not exists rechnungen_r_nr_idx on rechnungen(r_nr);


-- ── 2. Treuekunden (Stempel) ────────────────────────────────────────────────
create table if not exists kunden_stempel (
  id                uuid primary key default gen_random_uuid(),
  telefon           text not null unique,
  name              text default '',
  anzahl_auftraege  integer not null default 0,
  erster_auftrag    date,
  letzter_auftrag   date,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists kunden_stempel_telefon_idx on kunden_stempel(telefon);
create index if not exists kunden_stempel_letzter_idx on kunden_stempel(letzter_auftrag desc);

-- Einlösungen separat, damit pro Kunde mehrere History-Einträge möglich
create table if not exists kunden_einloesungen (
  id                uuid primary key default gen_random_uuid(),
  kunde_id          uuid not null references kunden_stempel(id) on delete cascade,
  datum             date not null,
  produkt           text not null,
  rechnungsnr       text default '',
  created_at        timestamptz default now()
);

create index if not exists kunden_einloesungen_kunde_idx on kunden_einloesungen(kunde_id);


-- ── 3. Newsletter-Subscriber ────────────────────────────────────────────────
create table if not exists newsletter_subscriber (
  id                uuid primary key default gen_random_uuid(),
  email             text not null unique,
  name              text default '',
  quelle            text default '',
  notiz             text default '',
  bestaetigt        boolean not null default false,
  doi_token         text,                          -- random token für DOI-Bestätigungslink (NULL nach Bestätigung)
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists newsletter_email_idx on newsletter_subscriber(email);
create index if not exists newsletter_bestaetigt_idx on newsletter_subscriber(bestaetigt);
create index if not exists newsletter_doi_token_idx on newsletter_subscriber(doi_token);


-- ── 4. Lager: Verbrauchsmittel ──────────────────────────────────────────────
create table if not exists lager_verbrauchsmittel (
  id                uuid primary key default gen_random_uuid(),
  schluessel        text not null unique,    -- z.B. 'pol_star_250' (für Rezepte)
  name              text not null,
  einheit           text default 'Stück',
  bestand           numeric(10, 2) not null default 0,
  mindestbestand    numeric(10, 2) default 0,
  nachbestellmenge  numeric(10, 2) default 0,
  preis_brutto      numeric(10, 2) default 0,
  lieferant         text default '',
  bestelllink       text default '',
  notiz             text default '',
  sortierung        integer default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists lager_verbrauch_schluessel_idx on lager_verbrauchsmittel(schluessel);


-- ── 5. Lager: Anlagegüter ───────────────────────────────────────────────────
create table if not exists lager_anlagen (
  id                uuid primary key default gen_random_uuid(),
  schluessel        text not null unique,
  name              text not null,
  anschaffung_datum date,
  anschaffung_preis numeric(10, 2) default 0,
  nutzungsdauer_m   integer default 60,      -- Monate, für Abschreibung
  ersatz_geplant    date,
  bestelllink       text default '',
  notiz             text default '',
  sortierung        integer default 0,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists lager_anlagen_schluessel_idx on lager_anlagen(schluessel);


-- ── 6. updated_at Auto-Trigger für alle Tabellen ────────────────────────────
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in select unnest(array[
    'rechnungen', 'kunden_stempel', 'newsletter_subscriber',
    'lager_verbrauchsmittel', 'lager_anlagen'
  ]) loop
    execute format(
      'drop trigger if exists set_updated_at on %I; ' ||
      'create trigger set_updated_at before update on %I ' ||
      'for each row execute function set_updated_at();',
      t, t
    );
  end loop;
end$$;


-- ── 7. Row Level Security aktivieren ────────────────────────────────────────
-- Keine Policies → nur Service-Role-Key kann zugreifen.
alter table rechnungen                  enable row level security;
alter table kunden_stempel              enable row level security;
alter table kunden_einloesungen         enable row level security;
alter table newsletter_subscriber       enable row level security;
alter table lager_verbrauchsmittel      enable row level security;
alter table lager_anlagen               enable row level security;


-- ============================================================================
-- Fertig! Die Tabellen sind angelegt und gesichert.
-- Connection-Check: in der Web-App unter /admin/datenbank.
-- ============================================================================
