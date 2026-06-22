/**
 * Öffentliche Slot-Abfrage für den Preisrechner.
 *
 *   GET /api/termin/slots?gruppe=pkw|lkw&paket=<key>
 *     200 { ok:true, dauerMin, tage:[{ datum, wochentag, slots:["08:00", …] }, …] }
 *     400 { error:'invalid_paket' }
 *     503 { error:'not_configured' }
 *
 * Liefert für jeden buchbaren Tag (im Vorlauf-/Horizont-Fenster) die freien
 * Startzeiten. Belegung = bestehende Termine (status offen + bestätigt).
 * Kein Login nötig.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../../lib/supabase-server';
import { paketDauerMin, berechneSlots, type Belegung } from '../../../lib/slots';
import { ladeVerfuegbarkeit } from '../../../lib/verfuegbarkeit-server';
import { zeitZuMin, WOCHENTAGE_KURZ } from '../../../lib/verfuegbarkeit';

export const prerender = false;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Heutiges Datum in Europe/Berlin als 'YYYY-MM-DD'. */
function heuteBerlin(): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(new Date()); // en-CA → YYYY-MM-DD
}

/** Datum (YYYY-MM-DD) + n Tage → YYYY-MM-DD (DST-sicher über 12:00 UTC). */
function plusTage(iso: string, n: number): string {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export const GET: APIRoute = async ({ url }) => {
  const gruppe = url.searchParams.get('gruppe') ?? 'pkw';
  const paket = url.searchParams.get('paket') ?? '';
  const dauerMin = paketDauerMin(gruppe, paket);
  if (dauerMin <= 0) return json({ error: 'invalid_paket' }, 400);

  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  const v = await ladeVerfuegbarkeit(supabase);
  const heute = heuteBerlin();
  const von = plusTage(heute, Math.max(0, v.vorlaufTage));
  const bis = plusTage(heute, Math.max(v.vorlaufTage, v.horizontTage));

  // Bestehende Belegungen im Fenster laden
  const { data: bookings } = await supabase
    .from('termine')
    .select('wunsch_datum, start_zeit, dauer_min, status')
    .in('status', ['offen', 'bestaetigt'])
    .gte('wunsch_datum', von)
    .lte('wunsch_datum', bis)
    .neq('start_zeit', '')
    .returns<{ wunsch_datum: string; start_zeit: string; dauer_min: number; status: string }[]>();

  const belegtProTag = new Map<string, Belegung[]>();
  for (const b of bookings ?? []) {
    if (!b.wunsch_datum || !b.start_zeit || !b.dauer_min) continue;
    const start = zeitZuMin(b.start_zeit);
    const liste = belegtProTag.get(b.wunsch_datum) ?? [];
    liste.push({ start, end: start + b.dauer_min });
    belegtProTag.set(b.wunsch_datum, liste);
  }

  const tage: { datum: string; wochentag: string; slots: string[] }[] = [];
  for (let off = v.vorlaufTage; off <= v.horizontTage; off++) {
    const datum = plusTage(heute, off);
    const slots = berechneSlots(datum, dauerMin, v, belegtProTag.get(datum) ?? []);
    if (slots.length > 0) {
      const wd = new Date(datum + 'T00:00:00').getDay();
      tage.push({ datum, wochentag: WOCHENTAGE_KURZ[wd], slots });
    }
  }

  return json({ ok: true, dauerMin, tage });
};
