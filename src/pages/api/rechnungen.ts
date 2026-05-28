/**
 * Rechnungs-Archiv REST-Endpoint.
 *
 *   GET    /api/rechnungen          → { rechnungen: ArchivEintrag[] }
 *   GET    /api/rechnungen?next=1   → { nummer: 'RE-2026-005' }   (Vorschlag für nächste Nr.)
 *   POST   /api/rechnungen          → { ok: true }                 (Body = ArchivEintrag, upsert auf r_nr)
 *   DELETE /api/rechnungen?r_nr=…   → { ok: true }
 *
 * Auth: cms_auth-Cookie. Service-Role-Key umgeht RLS.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';
import type { ArchivEintrag, Pos } from '../../lib/rechnungen';

export const prerender = false;

interface DbRechnung {
  r_nr: string;
  r_datum: string;
  l_datum: string;
  k_name: string | null;
  k_adresse: string | null;
  k_email: string | null;
  k_telefon: string | null;
  fahrzeug: string | null;
  positionen: unknown;
  zahlung: 'bar' | 'karte' | 'ueberweisung';
  zahlungsziel: string | null;
  notiz: string | null;
  brutto: number | string | null;
  created_at: string | null;
}

function mapRechnung(row: DbRechnung): ArchivEintrag {
  return {
    rNr: row.r_nr,
    rDatum: row.r_datum,
    lDatum: row.l_datum,
    kName: row.k_name ?? '',
    kAdresse: row.k_adresse ?? '',
    kEmail: row.k_email ?? '',
    kTelefon: row.k_telefon ?? '',
    fahrzeug: row.fahrzeug ?? '',
    positionen: Array.isArray(row.positionen) ? (row.positionen as Pos[]) : [],
    zahlung: row.zahlung,
    zahlungsziel: row.zahlungsziel ?? '14',
    notiz: row.notiz ?? '',
    brutto: typeof row.brutto === 'string' ? parseFloat(row.brutto) || 0 : (row.brutto ?? 0),
    gespeichertAm: row.created_at ?? '',
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

const SELECT = 'r_nr, r_datum, l_datum, k_name, k_adresse, k_email, k_telefon, fahrzeug, positionen, zahlung, zahlungsziel, notiz, brutto, created_at';

// ── GET ────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ request, url }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  // Nächste Rechnungsnummer berechnen
  if (url.searchParams.get('next') === '1') {
    const jahr = new Date().getFullYear();
    const praefix = `RE-${jahr}-`;
    const { data, error } = await supabase
      .from('rechnungen')
      .select('r_nr')
      .like('r_nr', `${praefix}%`)
      .order('r_nr', { ascending: false })
      .limit(1)
      .returns<{ r_nr: string }[]>();
    if (error) return serverError(error.message);
    let next = 1;
    if (data && data.length > 0) {
      const m = data[0].r_nr.match(/^RE-\d{4}-(\d+)$/);
      if (m) next = parseInt(m[1], 10) + 1;
    }
    return json({ nummer: `${praefix}${String(next).padStart(3, '0')}` });
  }

  const { data, error } = await supabase
    .from('rechnungen')
    .select(SELECT)
    .order('r_datum', { ascending: false })
    .order('r_nr', { ascending: false })
    .returns<DbRechnung[]>();
  if (error) return serverError(error.message);
  return json({ rechnungen: (data ?? []).map(mapRechnung) });
};

// ── POST ───────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  let body: ArchivEintrag;
  try {
    body = (await request.json()) as ArchivEintrag;
  } catch {
    return serverError('invalid_json', 400);
  }
  if (!body.rNr) return serverError('r_nr_missing', 400);

  const row = {
    r_nr: body.rNr,
    r_datum: body.rDatum,
    l_datum: body.lDatum || body.rDatum,
    k_name: body.kName ?? '',
    k_adresse: body.kAdresse ?? '',
    k_email: body.kEmail ?? '',
    k_telefon: body.kTelefon ?? '',
    fahrzeug: body.fahrzeug ?? '',
    positionen: Array.isArray(body.positionen) ? body.positionen : [],
    zahlung: body.zahlung,
    zahlungsziel: body.zahlungsziel ?? '14',
    notiz: body.notiz ?? '',
    brutto: Number(body.brutto) || 0,
  };

  const { error } = await supabase.from('rechnungen').upsert(row, { onConflict: 'r_nr' });
  if (error) return serverError(error.message);
  return json({ ok: true });
};

// ── DELETE ─────────────────────────────────────────────────────────────────
export const DELETE: APIRoute = async ({ request, url }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  const rNr = url.searchParams.get('r_nr');
  if (!rNr) return serverError('r_nr_missing', 400);
  const { error } = await supabase.from('rechnungen').delete().eq('r_nr', rNr);
  if (error) return serverError(error.message);
  return json({ ok: true });
};
