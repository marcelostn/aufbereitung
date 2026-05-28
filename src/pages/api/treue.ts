/**
 * REST-Endpoint für die Treuekarten-Logik.
 *
 *   GET  /api/treue                 → { kunden: KundenStempel[] }
 *   GET  /api/treue?telefon=0160…   → { kunde: KundenStempel | null }
 *   POST /api/treue                 → { kunde }  (Body { action, … })
 *   DELETE /api/treue?telefon=…     → { ok: true }
 *   DELETE /api/treue?all=1         → { ok: true }
 *
 * Auth: cms_auth-Cookie aus der Admin-Middleware. Service-Role-Key umgeht RLS.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';
import type { KundenStempel, Einloesung } from '../../lib/treue';

export const prerender = false;

interface DbStempel {
  id: string;
  telefon: string;
  name: string | null;
  anzahl_auftraege: number;
  erster_auftrag: string | null;
  letzter_auftrag: string | null;
  kunden_einloesungen: {
    id: string;
    datum: string;
    produkt: string;
    rechnungsnr: string | null;
  }[];
}

function mapKunde(row: DbStempel): KundenStempel {
  return {
    telefon: row.telefon,
    name: row.name ?? '',
    anzahlAuftraege: row.anzahl_auftraege ?? 0,
    ersterAuftrag: row.erster_auftrag ?? '',
    letzterAuftrag: row.letzter_auftrag ?? '',
    einloesungen: (row.kunden_einloesungen ?? []).map((e) => ({
      datum: e.datum,
      produkt: e.produkt,
      rechnungsNr: e.rechnungsnr ?? undefined,
    })),
  };
}

function unauthorized() {
  return new Response(JSON.stringify({ error: 'unauthorized' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

function serverError(msg: string, status = 500) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function authed(cookie: string | null) {
  return !!cookie && cookie.includes('cms_auth=');
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const SELECT = 'id, telefon, name, anzahl_auftraege, erster_auftrag, letzter_auftrag, kunden_einloesungen(id, datum, produkt, rechnungsnr)';

// ── GET ────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ request, url }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  const tel = url.searchParams.get('telefon');
  if (tel) {
    const { data, error } = await supabase
      .from('kunden_stempel')
      .select(SELECT)
      .eq('telefon', tel)
      .maybeSingle<DbStempel>();
    if (error) return serverError(error.message);
    return json({ kunde: data ? mapKunde(data) : null });
  }

  const { data, error } = await supabase
    .from('kunden_stempel')
    .select(SELECT)
    .order('letzter_auftrag', { ascending: false, nullsFirst: false })
    .returns<DbStempel[]>();
  if (error) return serverError(error.message);
  return json({ kunden: (data ?? []).map(mapKunde) });
};

// ── POST ───────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  let body: { action?: string; telefon?: string; name?: string; datumIso?: string; neueAnzahl?: number; eintrag?: Einloesung };
  try {
    body = await request.json();
  } catch {
    return serverError('invalid_json', 400);
  }
  const action = body.action;
  const telefon = (body.telefon ?? '').trim();
  if (!telefon) return serverError('telefon_missing', 400);

  // Lookup vorhanden?
  const { data: bestand, error: bErr } = await supabase
    .from('kunden_stempel')
    .select('id, name, anzahl_auftraege, erster_auftrag')
    .eq('telefon', telefon)
    .maybeSingle<{ id: string; name: string | null; anzahl_auftraege: number; erster_auftrag: string | null }>();
  if (bErr) return serverError(bErr.message);

  if (action === 'add') {
    const datumIso = body.datumIso ?? new Date().toISOString().slice(0, 10);
    const name = body.name ?? '';
    if (bestand) {
      const { error } = await supabase
        .from('kunden_stempel')
        .update({
          name: name || bestand.name || '',
          anzahl_auftraege: bestand.anzahl_auftraege + 1,
          letzter_auftrag: datumIso,
        })
        .eq('id', bestand.id);
      if (error) return serverError(error.message);
    } else {
      const { error } = await supabase.from('kunden_stempel').insert({
        telefon,
        name,
        anzahl_auftraege: 1,
        erster_auftrag: datumIso,
        letzter_auftrag: datumIso,
      });
      if (error) return serverError(error.message);
    }
  } else if (action === 'setAnzahl') {
    if (!bestand) return serverError('kunde_nicht_gefunden', 404);
    const neueAnzahl = Math.max(0, Math.floor(body.neueAnzahl ?? 0));
    const { error } = await supabase
      .from('kunden_stempel')
      .update({ anzahl_auftraege: neueAnzahl })
      .eq('id', bestand.id);
    if (error) return serverError(error.message);
  } else if (action === 'einloesung') {
    if (!bestand) return serverError('kunde_nicht_gefunden', 404);
    const eintrag = body.eintrag;
    if (!eintrag?.datum || !eintrag?.produkt) {
      return serverError('eintrag_unvollstaendig', 400);
    }
    // Prüfen ob offene Belohnung vorhanden (verdient vs. eingelöst)
    const verdient = Math.floor(bestand.anzahl_auftraege / 5);
    const { count: einloesungenAnzahl, error: cErr } = await supabase
      .from('kunden_einloesungen')
      .select('*', { count: 'exact', head: true })
      .eq('kunde_id', bestand.id);
    if (cErr) return serverError(cErr.message);
    if ((einloesungenAnzahl ?? 0) >= verdient) {
      // Keine offene Belohnung → no-op, aber Kunde zurückgeben
    } else {
      const { error } = await supabase.from('kunden_einloesungen').insert({
        kunde_id: bestand.id,
        datum: eintrag.datum,
        produkt: eintrag.produkt,
        rechnungsnr: eintrag.rechnungsNr ?? '',
      });
      if (error) return serverError(error.message);
    }
  } else {
    return serverError('unknown_action', 400);
  }

  // Aktualisierten Kunden zurückgeben
  const { data: nach, error: nErr } = await supabase
    .from('kunden_stempel')
    .select(SELECT)
    .eq('telefon', telefon)
    .maybeSingle<DbStempel>();
  if (nErr) return serverError(nErr.message);
  return json({ kunde: nach ? mapKunde(nach) : null });
};

// ── DELETE ─────────────────────────────────────────────────────────────────
export const DELETE: APIRoute = async ({ request, url }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  if (url.searchParams.get('all') === '1') {
    // Reset komplett (Einlösungen kaskadieren via FK on delete cascade)
    const { error } = await supabase.from('kunden_stempel').delete().not('id', 'is', null);
    if (error) return serverError(error.message);
    return json({ ok: true });
  }

  const tel = url.searchParams.get('telefon');
  if (!tel) return serverError('telefon_missing', 400);
  const { error } = await supabase.from('kunden_stempel').delete().eq('telefon', tel);
  if (error) return serverError(error.message);
  return json({ ok: true });
};
