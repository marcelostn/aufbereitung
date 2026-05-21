/**
 * Health-Check für die Supabase-Anbindung.
 * Wird von /admin/datenbank aufgerufen.
 *
 * Schutz: Endpoint prüft `cms_auth`-Cookie (gleiches Schema wie Admin-Middleware).
 */

import type { APIRoute } from 'astro';
import { getSupabase, configStatus } from '../../lib/supabase-server';

export const prerender = false;

const TABELLEN = [
  'rechnungen',
  'kunden_stempel',
  'kunden_einloesungen',
  'newsletter_subscriber',
  'lager_verbrauchsmittel',
  'lager_anlagen',
];

export const GET: APIRoute = async ({ request }) => {
  // Auth-Prüfung: cms_auth-Cookie muss vorhanden sein (Middleware setzt das)
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
      JSON.stringify({
        status: 'not_configured',
        config: cfg,
        hinweis: 'SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env (lokal) + Vercel Environment Variables setzen.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return new Response(
      JSON.stringify({ status: 'client_failed', config: cfg }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Pro Tabelle: count abfragen → 0 ist ok, Tabelle existiert
  const ergebnisse: Record<string, { exists: boolean; count: number | null; error?: string }> = {};
  for (const t of TABELLEN) {
    try {
      const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
      if (error) {
        ergebnisse[t] = { exists: false, count: null, error: error.message };
      } else {
        ergebnisse[t] = { exists: true, count: count ?? 0 };
      }
    } catch (e) {
      ergebnisse[t] = { exists: false, count: null, error: String(e) };
    }
  }

  const alleDa = Object.values(ergebnisse).every((r) => r.exists);
  return new Response(
    JSON.stringify({
      status: alleDa ? 'ok' : 'incomplete',
      config: cfg,
      tabellen: ergebnisse,
      hinweis: alleDa
        ? 'Alle Tabellen vorhanden. Migration kann starten.'
        : 'Mindestens eine Tabelle fehlt. SQL-Schema im Supabase SQL Editor ausführen.',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};
