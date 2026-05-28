-- Migration: Newsletter Double-Opt-In Token-Spalte
-- Im Supabase SQL Editor laufen lassen (Dashboard → SQL Editor → Run).
-- Idempotent (kann mehrfach ausgeführt werden).

alter table newsletter_subscriber
  add column if not exists doi_token text;

create index if not exists newsletter_doi_token_idx
  on newsletter_subscriber(doi_token);
