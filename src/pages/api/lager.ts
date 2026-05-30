/**
 * Lager REST-Endpoint (Verbrauchsmittel + Anlagegüter).
 *
 *   GET /api/lager   → { verbrauch: Verbrauchsmittel[], anlagen: Anlagegut[] }
 *   PUT /api/lager   → { ok: true }
 *       Body: { verbrauch, anlagen } — komplette Listen.
 *       Bulk-Sync: Upsert aller übergebenen Einträge (onConflict schluessel)
 *       + Löschen der Einträge, die nicht mehr in der Liste sind.
 *
 * Auth: cms_auth-Cookie. Service-Role-Key umgeht RLS.
 *
 * Mapping Komponente ↔ DB:
 *   Verbrauchsmittel.id            ↔ schluessel
 *   .preisProEinheit               ↔ preis_brutto
 *   .bestellLink                   ↔ bestelllink
 *   .notizen                       ↔ notiz
 *   Anlagegut.kaufdatum            ↔ anschaffung_datum
 *   .kaufpreis                     ↔ anschaffung_preis
 *   .nutzungsdauerJahre            ↔ nutzungsdauer_m (× 12)
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';
import type { Verbrauchsmittel, Anlagegut } from '../../lib/lager';

export const prerender = false;

// ── DB-Zeilen-Typen ──────────────────────────────────────────────────────────
interface DbVerbrauch {
  schluessel: string;
  name: string;
  einheit: string | null;
  bestand: number | string | null;
  mindestbestand: number | string | null;
  nachbestellmenge: number | string | null;
  preis_brutto: number | string | null;
  lieferant: string | null;
  bestelllink: string | null;
  notiz: string | null;
}

interface DbAnlage {
  schluessel: string;
  name: string;
  anschaffung_datum: string | null;
  anschaffung_preis: number | string | null;
  nutzungsdauer_m: number | null;
  notiz: string | null;
}

const TODAY = () => new Date().toISOString().slice(0, 10);
const num = (v: unknown): number =>
  typeof v === 'string' ? parseFloat(v) || 0 : typeof v === 'number' ? v : 0;

// ── Helpers ──────────────────────────────────────────────────────────────────
function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function authed(cookie: string | null) {
  return !!cookie && cookie.includes('cms_auth=');
}

const V_SELECT =
  'schluessel, name, einheit, bestand, mindestbestand, nachbestellmenge, preis_brutto, lieferant, bestelllink, notiz';
const A_SELECT =
  'schluessel, name, anschaffung_datum, anschaffung_preis, nutzungsdauer_m, notiz';

// ── DB → Komponente ──────────────────────────────────────────────────────────
function mapVerbrauch(r: DbVerbrauch): Verbrauchsmittel {
  return {
    id: r.schluessel,
    name: r.name,
    einheit: r.einheit ?? 'Stück',
    bestand: num(r.bestand),
    mindestbestand: num(r.mindestbestand),
    nachbestellmenge: num(r.nachbestellmenge),
    preisProEinheit: num(r.preis_brutto),
    lieferant: r.lieferant ?? '',
    bestellLink: r.bestelllink ?? '',
    notizen: r.notiz ?? '',
  };
}
function mapAnlage(r: DbAnlage): Anlagegut {
  return {
    id: r.schluessel,
    name: r.name,
    kaufdatum: r.anschaffung_datum ?? TODAY(),
    kaufpreis: num(r.anschaffung_preis),
    nutzungsdauerJahre: Math.max(1, Math.round((r.nutzungsdauer_m ?? 60) / 12)),
    notizen: r.notiz ?? '',
  };
}

// ── Komponente → DB ──────────────────────────────────────────────────────────
function rowVerbrauch(v: Verbrauchsmittel, i: number) {
  return {
    schluessel: v.id,
    name: v.name ?? '',
    einheit: v.einheit || 'Stück',
    bestand: num(v.bestand),
    mindestbestand: num(v.mindestbestand),
    nachbestellmenge: num(v.nachbestellmenge),
    preis_brutto: num(v.preisProEinheit),
    lieferant: v.lieferant ?? '',
    bestelllink: v.bestellLink ?? '',
    notiz: v.notizen ?? '',
    sortierung: i,
  };
}
function rowAnlage(a: Anlagegut, i: number) {
  const datum = a.kaufdatum && !Number.isNaN(new Date(a.kaufdatum).getTime()) ? a.kaufdatum : null;
  return {
    schluessel: a.id,
    name: a.name ?? '',
    anschaffung_datum: datum,
    anschaffung_preis: num(a.kaufpreis),
    nutzungsdauer_m: Math.max(1, Math.round((num(a.nutzungsdauerJahre) || 5) * 12)),
    notiz: a.notizen ?? '',
    sortierung: i,
  };
}

// ── GET ──────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  const [v, a] = await Promise.all([
    supabase.from('lager_verbrauchsmittel').select(V_SELECT).order('sortierung', { ascending: true }).returns<DbVerbrauch[]>(),
    supabase.from('lager_anlagen').select(A_SELECT).order('sortierung', { ascending: true }).returns<DbAnlage[]>(),
  ]);
  if (v.error) return json({ error: v.error.message }, 500);
  if (a.error) return json({ error: a.error.message }, 500);

  return json({
    verbrauch: (v.data ?? []).map(mapVerbrauch),
    anlagen: (a.data ?? []).map(mapAnlage),
  });
};

// ── PUT (Bulk-Sync) ────────────────────────────────────────────────────────────
export const PUT: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  let body: { verbrauch?: Verbrauchsmittel[]; anlagen?: Anlagegut[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const verbrauch = (body.verbrauch ?? []).filter((v) => v && v.id);
  const anlagen = (body.anlagen ?? []).filter((a) => a && a.id);

  // 1. Upsert Verbrauchsmittel
  if (verbrauch.length > 0) {
    const { error } = await supabase
      .from('lager_verbrauchsmittel')
      .upsert(verbrauch.map(rowVerbrauch), { onConflict: 'schluessel' });
    if (error) return json({ error: error.message }, 500);
  }
  // 2. Entfernte Verbrauchsmittel löschen (alles, was nicht mehr in der Liste ist)
  {
    const keys = verbrauch.map((v) => v.id);
    let del = supabase.from('lager_verbrauchsmittel').delete();
    del = keys.length > 0
      ? del.not('schluessel', 'in', `(${keys.map((k) => `"${k}"`).join(',')})`)
      : del.not('schluessel', 'is', null); // leere Liste → alle löschen
    const { error } = await del;
    if (error) return json({ error: error.message }, 500);
  }

  // 3. Upsert Anlagen
  if (anlagen.length > 0) {
    const { error } = await supabase
      .from('lager_anlagen')
      .upsert(anlagen.map(rowAnlage), { onConflict: 'schluessel' });
    if (error) return json({ error: error.message }, 500);
  }
  // 4. Entfernte Anlagen löschen
  {
    const keys = anlagen.map((a) => a.id);
    let del = supabase.from('lager_anlagen').delete();
    del = keys.length > 0
      ? del.not('schluessel', 'in', `(${keys.map((k) => `"${k}"`).join(',')})`)
      : del.not('schluessel', 'is', null);
    const { error } = await del;
    if (error) return json({ error: error.message }, 500);
  }

  return json({ ok: true });
};
