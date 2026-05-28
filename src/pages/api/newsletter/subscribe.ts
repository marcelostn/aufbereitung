/**
 * Öffentliche Newsletter-Anmeldung vom Footer-Formular.
 *
 *   POST /api/newsletter/subscribe
 *     Body: { email, name?, honeypot? }
 *     200 { ok: true, created: boolean, doi: boolean }
 *           created → neuer Subscriber in Supabase angelegt (false = schon bekannt)
 *           doi     → Brevo hat die DOI-Bestätigungsmail rausgeschickt
 *     400 { error: 'invalid_email' | 'invalid_json' }
 *     429 { error: 'rate_limited' }
 *     503 { error: 'not_configured' }
 *
 * Kein cms_auth-Cookie nötig (öffentlich).
 *
 * Ablauf:
 *   1. Honeypot/Rate-Limit/Email-Validierung.
 *   2. Wenn Brevo (BREVO_API_KEY + BREVO_DOI_TEMPLATE_ID) konfiguriert ist:
 *      Brevo `contacts/doubleOptinConfirmation` aufrufen → Brevo schickt
 *      automatisch die Bestätigungs-Mail mit DOI-Link. Sobald der Subscriber
 *      bestätigt, landet er in der Brevo-Liste (BREVO_LIST_ID).
 *   3. Parallel Supabase-Insert (bestaetigt=false, quelle='Webseite'), damit
 *      der User die Anmeldung im Admin sieht, auch bevor Brevo bestätigt ist.
 *
 * Spam-Schutz: Honeypot + In-Memory-Rate-Limit (5/IP/h).
 */

import type { APIRoute } from 'astro';
import { getSupabase } from '../../../lib/supabase-server';

export const prerender = false;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Rate-Limit (in-memory) ────────────────────────────────────────────────
const FENSTER_MS = 60 * 60 * 1000; // 1 Stunde
const MAX_PRO_IP = 5;
const versucheProIp = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const jetzt = Date.now();
  const liste = (versucheProIp.get(ip) ?? []).filter((t) => jetzt - t < FENSTER_MS);
  if (liste.length >= MAX_PRO_IP) {
    versucheProIp.set(ip, liste);
    return true;
  }
  liste.push(jetzt);
  versucheProIp.set(ip, liste);
  if (versucheProIp.size > 5000) {
    for (const [k, v] of versucheProIp) {
      const sauber = v.filter((t) => jetzt - t < FENSTER_MS);
      if (sauber.length === 0) versucheProIp.delete(k);
      else versucheProIp.set(k, sauber);
    }
  }
  return false;
}

function clientIp(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unbekannt';
}

// ── Brevo Double-Opt-In ───────────────────────────────────────────────────
async function brevoDoi(email: string, name: string): Promise<boolean> {
  const apiKey = import.meta.env.BREVO_API_KEY ?? process.env.BREVO_API_KEY ?? '';
  const listIdRaw = import.meta.env.BREVO_LIST_ID ?? process.env.BREVO_LIST_ID ?? '';
  const templateIdRaw = import.meta.env.BREVO_DOI_TEMPLATE_ID ?? process.env.BREVO_DOI_TEMPLATE_ID ?? '';
  const redirectUrl = import.meta.env.BREVO_REDIRECT_URL ?? process.env.BREVO_REDIRECT_URL ?? '';

  const listId = parseInt(listIdRaw, 10);
  const templateId = parseInt(templateIdRaw, 10);

  if (!apiKey || !listId || !templateId || !redirectUrl) {
    return false; // Brevo nicht konfiguriert → still überspringen
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/contacts/doubleOptinConfirmation', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
        'accept': 'application/json',
      },
      body: JSON.stringify({
        email,
        attributes: name ? { FIRSTNAME: name } : {},
        includeListIds: [listId],
        templateId,
        redirectionUrl: redirectUrl,
      }),
    });
    // 201 oder 204 = Erfolg; alles andere wird im Server-Log auftauchen, aber
    // wir blockieren die Anmeldung nicht — Supabase-Eintrag rettet den Datensatz.
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      console.warn('[brevo-doi] HTTP', res.status, txt.slice(0, 200));
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[brevo-doi] fetch error', err);
    return false;
  }
}

// ── POST ──────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  let body: { email?: string; name?: string; honeypot?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Honeypot — Bot? Freundlich mit 200 ok antworten.
  if (body.honeypot && body.honeypot.trim() !== '') {
    return json({ ok: true, created: false, doi: false });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email) || email.length > 254) {
    return json({ error: 'invalid_email' }, 400);
  }

  if (rateLimited(clientIp(request))) {
    return json({ error: 'rate_limited' }, 429);
  }

  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  const name = (body.name ?? '').trim().slice(0, 100);

  const { data: bestand } = await supabase
    .from('newsletter_subscriber')
    .select('email')
    .eq('email', email)
    .maybeSingle<{ email: string }>();

  // Brevo-DOI auch für bekannte Adressen erneut anstoßen — schadet nicht,
  // Brevo dedupliziert serverseitig und schickt keine zweite Mail an
  // bereits bestätigte Kontakte.
  const doi = await brevoDoi(email, name);

  if (bestand) {
    return json({ ok: true, created: false, doi });
  }

  const { error } = await supabase.from('newsletter_subscriber').insert({
    email,
    name,
    quelle: doi ? 'Webseite (Brevo DOI)' : 'Webseite',
    notiz: '',
    bestaetigt: false,
  });
  if (error) {
    return json({ error: 'db_error' }, 500);
  }

  return json({ ok: true, created: true, doi });
};
