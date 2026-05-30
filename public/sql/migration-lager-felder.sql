-- Migration: Lager-Verbrauchsmittel um Lieferant + Nachbestellmenge erweitern
-- Im Supabase SQL Editor laufen lassen (Dashboard → SQL Editor → Run).
-- Idempotent (kann mehrfach ausgeführt werden).
--
-- Vorher wurden Lieferant + Nachbestellmenge verlustbehaftet ans Notiz-Feld
-- angehängt. Mit diesen Spalten werden sie sauber gespeichert.

alter table lager_verbrauchsmittel
  add column if not exists lieferant        text default '',
  add column if not exists nachbestellmenge numeric(10, 2) default 0;
