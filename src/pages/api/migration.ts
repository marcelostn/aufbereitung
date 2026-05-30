/**
 * One-Shot-Migration: localStorage-Payload → Supabase.
 *
 * Wird einmalig pro Browser-Gerät vom Admin getriggert (DatenbankSetup-UI),
 * damit vorhandene lokale Daten sicher in die zentrale Datenbank wandern,
 * bevor die einzelnen Bereiche (Treue / Newsletter / Rechnungen / Lager)
 * auf reine Server-Speicherung umgestellt werden.
 *
 * Idempotent: Upsert auf eindeutige Felder (telefon, email, r_nr, schluessel).
 * Wiederholtes Senden überschreibt höchstens, dupliziert nicht.
 */

import type { APIRoute } from 'astro';
import { getSupabase, configStatus } from '../../lib/supabase-server';

export const prerender = false;

interface EinloesungLs {
  datum: string;
  produkt: string;
  rechnungsNr?: string;
}

interface KundenStempelLs {
  telefon: string;
  name: string;
  anzahlAuftraege: number;
  ersterAuftrag: string;
  letzterAuftrag: string;
  einloesungen: EinloesungLs[];
}

interface SubscriberLs {
  email: string;
  name?: string;
  datum: string;
  quelle?: string;
  notiz?: string;
  bestaetigt: boolean;
}

interface PosLs {
  beschreibung: string;
  brutto: string;
}

interface RechnungLs {
  rNr: string;
  rDatum: string;
  lDatum: string;
  kName: string;
  kAdresse: string;
  kEmail: string;
  kTelefon?: string;
  fahrzeug: string;
  positionen: PosLs[];
  zahlung: 'bar' | 'karte' | 'ueberweisung';
  zahlungsziel: string;
  notiz: string;
  gespeichertAm: string;
  brutto: number;
}

interface VerbrauchLs {
  id: string;
  name: string;
  einheit: string;
  bestand: number;
  mindestbestand: number;
  nachbestellmenge: number;
  preisProEinheit: number;
  lieferant: string;
  bestellLink: string;
  notizen: string;
}

interface AnlageLs {
  id: string;
  name: string;
  kaufdatum: string;
  kaufpreis: number;
  nutzungsdauerJahre: number;
  notizen: string;
}

interface Payload {
  treue?: KundenStempelLs[];
  newsletter?: SubscriberLs[];
  rechnungen?: RechnungLs[];
  lager_verbrauch?: VerbrauchLs[];
  lager_anlagen?: AnlageLs[];
}

interface BereichErgebnis {
  imported: number;
  skipped: number;
  errors: string[];
}

interface TreueErgebnis extends BereichErgebnis {
  einloesungen: number;
}

function isoOrNull(s: unknown): string | null {
  if (typeof s !== 'string' || !s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function isoTsOrNull(s: unknown): string | null {
  if (typeof s !== 'string' || !s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export const POST: APIRoute = async ({ request }) => {
  // Auth: cms_auth-Cookie muss vorhanden sein
  const cookie = request.headers.get('cookie') || '';
  if (!cookie.includes('cms_auth=')) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const cfg = configStatus();
  if (!cfg.url || !cfg.key) {
    return new Response(
      JSON.stringify({ error: 'not_configured', config: cfg }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(JSON.stringify({ error: 'client_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ergebnis = {
    treue: { imported: 0, skipped: 0, einloesungen: 0, errors: [] as string[] } as TreueErgebnis,
    newsletter: { imported: 0, skipped: 0, errors: [] as string[] } as BereichErgebnis,
    rechnungen: { imported: 0, skipped: 0, errors: [] as string[] } as BereichErgebnis,
    lager_verbrauch: { imported: 0, skipped: 0, errors: [] as string[] } as BereichErgebnis,
    lager_anlagen: { imported: 0, skipped: 0, errors: [] as string[] } as BereichErgebnis,
  };

  // ── 1. Treuekunden ────────────────────────────────────────────────────────
  for (const k of payload.treue ?? []) {
    if (!k.telefon) {
      ergebnis.treue.skipped++;
      continue;
    }
    try {
      const { data, error } = await supabase
        .from('kunden_stempel')
        .upsert(
          {
            telefon: k.telefon,
            name: k.name ?? '',
            anzahl_auftraege: k.anzahlAuftraege ?? 0,
            erster_auftrag: isoOrNull(k.ersterAuftrag),
            letzter_auftrag: isoOrNull(k.letzterAuftrag),
          },
          { onConflict: 'telefon' }
        )
        .select('id')
        .single();
      if (error || !data) {
        ergebnis.treue.errors.push(`${k.telefon}: ${error?.message ?? 'kein id'}`);
        continue;
      }
      ergebnis.treue.imported++;

      // Einlösungen: erst alle alten für diesen Kunden löschen, dann neu einfügen
      // (sonst Duplikate bei wiederholter Migration; FK on delete cascade greift hier nicht weil wir den Kunden behalten)
      if (Array.isArray(k.einloesungen) && k.einloesungen.length > 0) {
        await supabase.from('kunden_einloesungen').delete().eq('kunde_id', data.id);
        const rows = k.einloesungen
          .filter((e) => e && e.datum && e.produkt)
          .map((e) => ({
            kunde_id: data.id,
            datum: isoOrNull(e.datum),
            produkt: e.produkt,
            rechnungsnr: e.rechnungsNr ?? '',
          }));
        if (rows.length > 0) {
          const { error: eErr } = await supabase.from('kunden_einloesungen').insert(rows);
          if (eErr) ergebnis.treue.errors.push(`Einlösungen ${k.telefon}: ${eErr.message}`);
          else ergebnis.treue.einloesungen += rows.length;
        }
      }
    } catch (e) {
      ergebnis.treue.errors.push(`${k.telefon}: ${String(e)}`);
    }
  }

  // ── 2. Newsletter ─────────────────────────────────────────────────────────
  for (const s of payload.newsletter ?? []) {
    if (!s.email) {
      ergebnis.newsletter.skipped++;
      continue;
    }
    try {
      const created = isoTsOrNull(s.datum);
      const row: Record<string, unknown> = {
        email: s.email.toLowerCase().trim(),
        name: s.name ?? '',
        quelle: s.quelle ?? '',
        notiz: s.notiz ?? '',
        bestaetigt: Boolean(s.bestaetigt),
      };
      if (created) row.created_at = created;

      const { error } = await supabase
        .from('newsletter_subscriber')
        .upsert(row, { onConflict: 'email' });
      if (error) ergebnis.newsletter.errors.push(`${s.email}: ${error.message}`);
      else ergebnis.newsletter.imported++;
    } catch (e) {
      ergebnis.newsletter.errors.push(`${s.email}: ${String(e)}`);
    }
  }

  // ── 3. Rechnungen ─────────────────────────────────────────────────────────
  for (const r of payload.rechnungen ?? []) {
    if (!r.rNr) {
      ergebnis.rechnungen.skipped++;
      continue;
    }
    try {
      const created = isoTsOrNull(r.gespeichertAm);
      const row: Record<string, unknown> = {
        r_nr: r.rNr,
        r_datum: isoOrNull(r.rDatum) ?? new Date().toISOString().slice(0, 10),
        l_datum: isoOrNull(r.lDatum) ?? isoOrNull(r.rDatum) ?? new Date().toISOString().slice(0, 10),
        k_name: r.kName ?? '',
        k_adresse: r.kAdresse ?? '',
        k_email: r.kEmail ?? '',
        k_telefon: r.kTelefon ?? '',
        fahrzeug: r.fahrzeug ?? '',
        positionen: Array.isArray(r.positionen) ? r.positionen : [],
        zahlung: r.zahlung === 'karte' || r.zahlung === 'ueberweisung' ? r.zahlung : 'bar',
        zahlungsziel: r.zahlungsziel ?? '14',
        notiz: r.notiz ?? '',
        brutto: Number(r.brutto) || 0,
      };
      if (created) row.created_at = created;

      const { error } = await supabase
        .from('rechnungen')
        .upsert(row, { onConflict: 'r_nr' });
      if (error) ergebnis.rechnungen.errors.push(`${r.rNr}: ${error.message}`);
      else ergebnis.rechnungen.imported++;
    } catch (e) {
      ergebnis.rechnungen.errors.push(`${r.rNr}: ${String(e)}`);
    }
  }

  // ── 4. Lager Verbrauchsmittel ─────────────────────────────────────────────
  const verbrauch = payload.lager_verbrauch ?? [];
  for (let i = 0; i < verbrauch.length; i++) {
    const v = verbrauch[i];
    if (!v.id) {
      ergebnis.lager_verbrauch.skipped++;
      continue;
    }
    try {
      const { error } = await supabase
        .from('lager_verbrauchsmittel')
        .upsert(
          {
            schluessel: v.id,
            name: v.name ?? '',
            einheit: v.einheit ?? 'Stück',
            bestand: Number(v.bestand) || 0,
            mindestbestand: Number(v.mindestbestand) || 0,
            nachbestellmenge: Number(v.nachbestellmenge) || 0,
            preis_brutto: Number(v.preisProEinheit) || 0,
            lieferant: v.lieferant ?? '',
            bestelllink: v.bestellLink ?? '',
            notiz: v.notizen ?? '',
            sortierung: i,
          },
          { onConflict: 'schluessel' }
        );
      if (error) ergebnis.lager_verbrauch.errors.push(`${v.id}: ${error.message}`);
      else ergebnis.lager_verbrauch.imported++;
    } catch (e) {
      ergebnis.lager_verbrauch.errors.push(`${v.id}: ${String(e)}`);
    }
  }

  // ── 5. Lager Anlagen ──────────────────────────────────────────────────────
  const anlagen = payload.lager_anlagen ?? [];
  for (let i = 0; i < anlagen.length; i++) {
    const a = anlagen[i];
    if (!a.id) {
      ergebnis.lager_anlagen.skipped++;
      continue;
    }
    try {
      const { error } = await supabase
        .from('lager_anlagen')
        .upsert(
          {
            schluessel: a.id,
            name: a.name ?? '',
            anschaffung_datum: isoOrNull(a.kaufdatum),
            anschaffung_preis: Number(a.kaufpreis) || 0,
            nutzungsdauer_m: Math.round((Number(a.nutzungsdauerJahre) || 5) * 12),
            notiz: a.notizen ?? '',
            sortierung: i,
          },
          { onConflict: 'schluessel' }
        );
      if (error) ergebnis.lager_anlagen.errors.push(`${a.id}: ${error.message}`);
      else ergebnis.lager_anlagen.imported++;
    } catch (e) {
      ergebnis.lager_anlagen.errors.push(`${a.id}: ${String(e)}`);
    }
  }

  return new Response(JSON.stringify({ ok: true, ergebnis }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
