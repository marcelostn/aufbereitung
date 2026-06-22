/**
 * Einstellungen (key/value JSON) — Admin.
 *
 *   GET  /api/einstellungen?schluessel=verfuegbarkeit → { schluessel, wert }
 *   PUT  /api/einstellungen   Body { schluessel, wert } → { ok:true }
 *
 * Auth: cms_auth-Cookie. Service-Role umgeht RLS.
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../lib/supabase-server';

export const prerender = false;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
function authed(cookie: string | null) {
  return !!cookie && cookie.includes('cms_auth=');
}

export const GET: APIRoute = async ({ request, url }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  const schluessel = url.searchParams.get('schluessel') ?? '';
  if (!schluessel) return json({ error: 'missing_key' }, 400);

  const { data, error } = await supabase
    .from('einstellungen')
    .select('wert')
    .eq('schluessel', schluessel)
    .maybeSingle<{ wert: unknown }>();
  if (error) return json({ error: error.message }, 500);

  return json({ schluessel, wert: data?.wert ?? null });
};

export const PUT: APIRoute = async ({ request }) => {
  if (!authed(request.headers.get('cookie'))) return json({ error: 'unauthorized' }, 401);
  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  let body: { schluessel?: string; wert?: unknown };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }
  if (!body.schluessel) return json({ error: 'missing_key' }, 400);

  const { error } = await supabase
    .from('einstellungen')
    .upsert({ schluessel: body.schluessel, wert: body.wert ?? {} }, { onConflict: 'schluessel' });
  if (error) return json({ error: error.message }, 500);

  return json({ ok: true });
};
