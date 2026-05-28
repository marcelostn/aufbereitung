/**
 * Newsletter-Subscriber REST-Endpoint (Admin).
 *
 *   GET    /api/newsletter        → { subscriber: Subscriber[] }
 *   POST   /api/newsletter        → { created, subscriber }  (Body { action: 'upsert', sub })
 *                                  → { subscriber }            (Body { action: 'toggle', email })
 *   DELETE /api/newsletter?email= → { ok: true }
 *   DELETE /api/newsletter?all=1  → { ok: true }
 *
 * Auth: cms_auth-Cookie. Service-Role-Key umgeht RLS.
 * Public-Anmeldung läuft separat über Web3Forms (E-Mail an Firma); kommt erst
 * mit Brevo-Integration in den automatisierten DOI-Flow.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';
import type { Subscriber } from '../../lib/newsletter';

export const prerender = false;

interface DbSubscriber {
  email: string;
  name: string | null;
  quelle: string | null;
  notiz: string | null;
  bestaetigt: boolean;
  created_at: string;
}

function mapSub(row: DbSubscriber): Subscriber {
  return {
    email: row.email,
    name: row.name ?? undefined,
    quelle: row.quelle ?? undefined,
    notiz: row.notiz ?? undefined,
    bestaetigt: Boolean(row.bestaetigt),
    datum: row.created_at ? row.created_at.slice(0, 10) : '',
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

const SELECT = 'email, name, quelle, notiz, bestaetigt, created_at';

// ── GET ────────────────────────────────────────────────────────────────────
export const GET: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  const { data, error } = await supabase
    .from('newsletter_subscriber')
    .select(SELECT)
    .order('created_at', { ascending: false })
    .returns<DbSubscriber[]>();
  if (error) return serverError(error.message);
  return json({ subscriber: (data ?? []).map(mapSub) });
};

// ── POST ───────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  let body: { action?: string; sub?: Subscriber; email?: string };
  try {
    body = await request.json();
  } catch {
    return serverError('invalid_json', 400);
  }

  if (body.action === 'upsert' && body.sub) {
    const e = body.sub.email.trim().toLowerCase();
    if (!e) return serverError('email_missing', 400);

    // Existiert schon?
    const { data: bestand } = await supabase
      .from('newsletter_subscriber')
      .select('email')
      .eq('email', e)
      .maybeSingle<{ email: string }>();

    const row = {
      email: e,
      name: body.sub.name ?? '',
      quelle: body.sub.quelle ?? '',
      notiz: body.sub.notiz ?? '',
      bestaetigt: Boolean(body.sub.bestaetigt),
    };

    const { data, error } = await supabase
      .from('newsletter_subscriber')
      .upsert(row, { onConflict: 'email' })
      .select(SELECT)
      .single<DbSubscriber>();
    if (error) return serverError(error.message);
    return json({ created: !bestand, subscriber: data ? mapSub(data) : null });
  }

  if (body.action === 'toggle' && body.email) {
    const e = body.email.trim().toLowerCase();
    const { data: bestand, error: bErr } = await supabase
      .from('newsletter_subscriber')
      .select('email, bestaetigt')
      .eq('email', e)
      .maybeSingle<{ email: string; bestaetigt: boolean }>();
    if (bErr) return serverError(bErr.message);
    if (!bestand) return serverError('not_found', 404);

    const { data, error } = await supabase
      .from('newsletter_subscriber')
      .update({ bestaetigt: !bestand.bestaetigt })
      .eq('email', e)
      .select(SELECT)
      .single<DbSubscriber>();
    if (error) return serverError(error.message);
    return json({ subscriber: data ? mapSub(data) : null });
  }

  return serverError('unknown_action', 400);
};

// ── DELETE ─────────────────────────────────────────────────────────────────
export const DELETE: APIRoute = async ({ request, url }) => {
  if (!authed(request.headers.get('cookie'))) return unauthorized();
  const supabase = getSupabase();
  if (!supabase) return serverError('not_configured', 503);

  if (url.searchParams.get('all') === '1') {
    const { error } = await supabase.from('newsletter_subscriber').delete().not('email', 'is', null);
    if (error) return serverError(error.message);
    return json({ ok: true });
  }

  const email = url.searchParams.get('email');
  if (!email) return serverError('email_missing', 400);
  const { error } = await supabase.from('newsletter_subscriber').delete().eq('email', email.toLowerCase());
  if (error) return serverError(error.message);
  return json({ ok: true });
};
