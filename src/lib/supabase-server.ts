/**
 * Supabase Server-Client mit Service-Role-Key.
 *
 * ACHTUNG: Service-Role umgeht Row-Level-Security. NUR auf dem Server verwenden
 * (Astro API Routes / SSR Pages mit prerender=false). NIEMALS im Client-Bundle.
 *
 * Auth zur API-Schicht regelt die bestehende Admin-Middleware (cms_auth-Cookie).
 *
 * Setup:
 *   .env (lokal) und Vercel Environment Variables:
 *     SUPABASE_URL=https://<projektref>.supabase.co
 *     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... (geheim, NICHT in Git!)
 *
 * Wenn SUPABASE_URL fehlt, bleibt der Client null — Endpoints melden dann 503,
 * Frontend fällt auf localStorage zurück. So bricht nichts während der Migration.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const URL = import.meta.env.SUPABASE_URL ?? process.env.SUPABASE_URL ?? '';
const KEY =
  import.meta.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

let _client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!URL || !KEY) return null;
  if (_client) return _client;
  _client = createClient(URL, KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return _client;
}

export function isConfigured(): boolean {
  return Boolean(URL && KEY);
}

export function configStatus(): { url: boolean; key: boolean } {
  return { url: Boolean(URL), key: Boolean(KEY) };
}
