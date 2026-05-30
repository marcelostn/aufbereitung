/**
 * Öffentliche Newsletter-Anmeldung (Footer-Formular).
 *
 *   POST /api/newsletter/subscribe
 *     Body: { email, name?, honeypot? }
 *     200 { ok: true, created: boolean, doi: boolean }
 *     400 { error: 'invalid_email' | 'invalid_json' }
 *     429 { error: 'rate_limited' }
 *     503 { error: 'not_configured' }
 *
 * Kein cms_auth-Cookie nötig (öffentlich).
 *
 * Ablauf:
 *   1. Honeypot/Rate-Limit/Email-Validierung.
 *   2. Token (crypto.randomUUID) generieren + Supabase-Insert mit bestaetigt=false.
 *   3. Wenn Resend (RESEND_API_KEY) konfiguriert: Mail mit Bestätigungs-Link
 *      `${PUBLIC_BASE_URL}/newsletter/bestaetigen?token=<token>` versenden.
 *   4. Bestätigung läuft über /newsletter/bestaetigen (siehe dort): setzt
 *      bestaetigt=true + löscht den Token.
 *
 * Spam-Schutz: Honeypot + In-Memory-Rate-Limit (5/IP/h).
 */

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
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

// ── Resend DOI-Mail ───────────────────────────────────────────────────────
// .trim() überall: in Vercel/IONOS gesetzte Werte enthalten leicht versehentlich
// Leerzeichen/Zeilenumbrüche am Rand. Ein Leerzeichen in BASE_URL zerschießt sonst
// den Bestätigungs-Link in der Mail (…de␣/newsletter → kaputt).
const RESEND_API_KEY = (
  import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY ?? ''
).trim();
const FROM_EMAIL = (
  import.meta.env.NEWSLETTER_FROM ??
  process.env.NEWSLETTER_FROM ??
  'info@glanzwerk-cloppenburg.de'
).trim();
const FROM_NAME = 'Glanzwerk Cloppenburg';
const BASE_URL = (
  import.meta.env.PUBLIC_BASE_URL ??
  process.env.PUBLIC_BASE_URL ??
  'https://www.glanzwerk-cloppenburg.de'
)
  .trim()
  .replace(/\/+$/, '');

async function sendDoiMail(email: string, name: string, token: string): Promise<boolean> {
  if (!RESEND_API_KEY) return false;

  const confirmUrl = `${BASE_URL}/newsletter/bestaetigen?token=${encodeURIComponent(token)}`;
  const greeting = name ? `Hallo ${name},` : 'Hallo,';

  const html = `<!doctype html>
<html lang="de">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1113;color:#f2f3f5;margin:0;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#15171a;border-radius:16px;padding:32px 28px">
      <p style="color:#c9a86a;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 12px">Glanzwerk Cloppenburg</p>
      <h1 style="font-size:24px;font-weight:900;color:#f2f3f5;margin:0 0 16px;letter-spacing:-0.02em">Nur noch ein Klick</h1>
      <p style="color:#9aa0a8;line-height:1.7;margin:0 0 24px">${greeting} danke fürs Eintragen! Klick den Button unten, um deine Newsletter-Anmeldung zu bestätigen — danach gehört der Saisonpflege-Newsletter dir.</p>
      <p style="margin:0 0 32px">
        <a href="${confirmUrl}" style="display:inline-block;background:#c9a86a;color:#0f1113;padding:14px 24px;border-radius:10px;font-weight:700;text-decoration:none">Anmeldung bestätigen</a>
      </p>
      <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0 0 24px">Falls der Button nicht funktioniert, kopier diesen Link in deinen Browser:<br><a href="${confirmUrl}" style="color:#c9a86a;word-break:break-all">${confirmUrl}</a></p>
      <hr style="border:0;border-top:1px solid #2c3036;margin:24px 0">
      <p style="color:#52525b;font-size:12px;line-height:1.6;margin:0">Du hast dich nicht angemeldet? Ignoriere diese Mail einfach — ohne Bestätigung passiert nichts.</p>
    </div>
  </body>
</html>`;

  const text = `${greeting}

Danke fürs Eintragen! Bestätige deine Newsletter-Anmeldung mit einem Klick auf diesen Link:

${confirmUrl}

Du hast dich nicht angemeldet? Ignoriere diese Mail einfach — ohne Bestätigung passiert nichts.

Glanzwerk Cloppenburg`;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject: 'Bestätige deine Anmeldung zum Glanzwerk-Newsletter',
      html,
      text,
    });
    if (result.error) {
      console.warn('[resend] error', result.error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[resend] fetch error', err);
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
  const token = crypto.randomUUID();

  const { data: bestand } = await supabase
    .from('newsletter_subscriber')
    .select('email, bestaetigt')
    .eq('email', email)
    .maybeSingle<{ email: string; bestaetigt: boolean }>();

  if (bestand) {
    // Schon bekannt. Wenn noch nicht bestätigt: neuen Token + DOI-Mail
    // anstoßen, damit der Subscriber eine neue Bestätigungs-Chance bekommt.
    // Wenn bereits bestätigt: still nichts tun, keine doppelte Mail.
    if (!bestand.bestaetigt) {
      await supabase
        .from('newsletter_subscriber')
        .update({ doi_token: token, name: name || undefined })
        .eq('email', email);
      const doi = await sendDoiMail(email, name, token);
      return json({ ok: true, created: false, doi });
    }
    return json({ ok: true, created: false, doi: false });
  }

  const { error } = await supabase.from('newsletter_subscriber').insert({
    email,
    name,
    quelle: 'Webseite',
    notiz: '',
    bestaetigt: false,
    doi_token: token,
  });
  if (error) {
    return json({ error: 'db_error' }, 500);
  }

  const doi = await sendDoiMail(email, name, token);
  return json({ ok: true, created: true, doi });
};
