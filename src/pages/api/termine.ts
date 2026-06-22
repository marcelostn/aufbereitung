/**
 * Termin-Verwaltung (Admin).
 *
 *   GET    /api/termine            → { termine: Termin[] }  (neueste zuerst)
 *   PATCH  /api/termine            → { ok: true }
 *       Body: { id, status?, bestaetigtDatum?, bestaetigtZeit?, adminNotiz? }
 *   DELETE /api/termine            → { ok: true }
 *       Body: { id }
 *
 * Auth: cms_auth-Cookie. Service-Role-Key umgeht RLS.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';
import type { Termin, TerminStatus } from '../../lib/termine';

export const prerender = false;

interface DbTermin {
  id: string;
  status: TerminStatus;
  wunsch_datum: string | null;
  wunsch_zeit: string | null;
  wunsch_alternativ: string | null;
  bestaetigt_datum: string | null;
  bestaetigt_zeit: string | null;
  name: string | null;
  telefon: string | null;
  email: string | null;
  strasse: string | null;
  plz: string | null;
  ort: string | null;
  kennzeichen: string | null;
  fahrzeug_gruppe: string | null;
  paket: string | null;
  reinigungsort: string | null;
  aufpreise: string | null;
  entfernung_km: number | string | null;
  preis: number | string | null;
  notiz: string | null;
  admin_notiz: string | null;
  start_zeit: string | null;
  dauer_min: number | string | null;
  created_at: string;
}

const num = (v: unknown): number =>
  typeof v === 'string' ? parseFloat(v) || 0 : typeof v === 'number' ? v : 0;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function authed(cookie: string | null) {
  return !!cookie && cookie.includes('cms_auth=');
}

const SELECT =
  'id, status, wunsch_datum, wunsch_zeit, wunsch_alternativ, bestaetigt_datum, bestaetigt_zeit, ' +
  'name, telefon, email, strasse, plz, ort, kennzeichen, fahrzeug_gruppe, paket, reinigungsort, ' +
  'aufpreise, entfernung_km, preis, notiz, admin_notiz, start_zeit, dauer_min, created_at';

function mapTermin(r: DbTermin): Termin {
  return {
    id: r.id,
    status: r.status,
    wunschDatum: r.wunsch_datum ?? '',
    startZeit: r.start_zeit ?? '',
    dauerMin: num(r.dauer_min),
    wunschZeit: r.wunsch_zeit ?? '',
    wunschAlternativ: r.wunsch_alternativ ?? '',
    bestaetigtDatum: r.bestaetigt_datum ?? '',
    bestaetigtZeit: r.bestaetigt_zeit ?? '',
    name: r.name ?? '',
    telefon: r.telefon ?? '',
    email: r.email ?? '',
    strasse: r.strasse ?? '',
    plz: r.plz ?? '',
    ort: r.ort ?? '',
    kennzeichen: r.kennzeichen ?? '',
    fahrzeugGruppe: r.fahrzeug_gruppe ?? '',
    paket: r.paket ?? '',
    reinigungsort: r.reinigungsort ?? '',
    aufpreise: r.aufpreise ?? '',
    entfernungKm: num(r.entfernung_km),
    preis: num(r.preis),
    notiz: r.notiz ?? '',
    adminNotiz: r.admin_notiz ?? '',
    createdAt: r.created_at,
  };
}

// ── GET ────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  const { data, error } = await supabase
    .from('termine')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .returns<DbTermin[]>();
  if (error) return json({ error: error.message }, 500);

  return json({ termine: (data ?? []).map(mapTermin) });
};

// ── PATCH ──────────────────────────────────────────────────────────────────
const STATUS_OK: TerminStatus[] = ['offen', 'bestaetigt', 'abgesagt', 'erledigt'];

export const PATCH: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  let body: {
    id?: string;
    status?: TerminStatus;
    bestaetigtDatum?: string;
    bestaetigtZeit?: string;
    adminNotiz?: string;
  };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!body.id) return json({ error: 'missing_id' }, 400);

  const patch: Record<string, unknown> = {};
  if (body.status !== undefined) {
    if (!STATUS_OK.includes(body.status)) return json({ error: 'invalid_status' }, 400);
    patch.status = body.status;
  }
  if (body.bestaetigtDatum !== undefined) patch.bestaetigt_datum = body.bestaetigtDatum || null;
  if (body.bestaetigtZeit !== undefined) patch.bestaetigt_zeit = body.bestaetigtZeit ?? '';
  if (body.adminNotiz !== undefined) patch.admin_notiz = (body.adminNotiz ?? '').slice(0, 1000);

  if (Object.keys(patch).length === 0) return json({ error: 'nothing_to_update' }, 400);

  const { error } = await supabase.from('termine').update(patch).eq('id', body.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};

// ── DELETE ─────────────────────────────────────────────────────────────────
export const DELETE: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!body.id) return json({ error: 'missing_id' }, 400);

  const { error } = await supabase.from('termine').delete().eq('id', body.id);
  if (error) return json({ error: error.message }, 500);
  return json({ ok: true });
};
