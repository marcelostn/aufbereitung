/**
 * Öffentliche Terminanfrage (aus dem Preisrechner).
 *
 *   POST /api/termin/anfrage
 *     Body: TerminEingabe (siehe src/lib/termine.ts) + honeypot
 *     200 { ok: true, id, mailKunde: boolean, mailBetrieb: boolean }
 *     400 { error: 'invalid_json' | 'invalid_input' }
 *     429 { error: 'rate_limited' }
 *     503 { error: 'not_configured' }
 *
 * Kein cms_auth-Cookie nötig (öffentlich). Ablauf:
 *   1. Honeypot + Rate-Limit + Pflichtfeld-Prüfung.
 *   2. Insert in Supabase-Tabelle `termine` (status='offen').
 *   3. Wenn Resend konfiguriert: Bestätigungs-Mail an Kunden +
 *      Benachrichtigung an den Betrieb (info@…). Mailfehler brechen die
 *      Anfrage NICHT ab — der Datensatz ist gesichert.
 *
 * Spam-Schutz: Honeypot + In-Memory-Rate-Limit (5/IP/h).
 */

import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { getSupabase } from '../../../lib/supabase-server';
import { formatDatum, type TerminEingabe } from '../../../lib/termine';
import { paketDauerMin, berechneSlots, type Belegung } from '../../../lib/slots';
import { ladeVerfuegbarkeit } from '../../../lib/verfuegbarkeit-server';
import { zeitZuMin, minZuZeit } from '../../../lib/verfuegbarkeit';

/** 'YYYY-MM-DD' + 'HH:MM' + Dauer → "Sa, 14.06.2026 · 12:00–16:00 Uhr". */
function terminText(datum: string, startZeit: string, dauerMin: number): string {
  if (!datum) return 'Zeitlich flexibel';
  const d = formatDatum(datum);
  if (!startZeit) return d;
  const ende = minZuZeit(zeitZuMin(startZeit) + dauerMin);
  return `${d} · ${startZeit}–${ende} Uhr`;
}

export const prerender = false;

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Rate-Limit (in-memory, pro Server-Instanz) ──────────────────────────────
const FENSTER_MS = 60 * 60 * 1000;
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

// ── Resend-Konfiguration (gleiche ENV wie Newsletter) ───────────────────────
const RESEND_API_KEY = (
  import.meta.env.RESEND_API_KEY ?? process.env.RESEND_API_KEY ?? ''
).trim();
const FROM_EMAIL = (
  import.meta.env.NEWSLETTER_FROM ?? process.env.NEWSLETTER_FROM ?? 'info@glanzwerk-cloppenburg.de'
).trim();
const FROM_NAME = 'Glanzwerk Cloppenburg';
const BASE_URL = (
  import.meta.env.PUBLIC_BASE_URL ?? process.env.PUBLIC_BASE_URL ?? 'https://www.glanzwerk-cloppenburg.de'
)
  .trim()
  .replace(/\/+$/, '');

const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

// ── Mail an den Kunden ───────────────────────────────────────────────────────
async function sendKundenMail(resend: Resend, t: TerminEingabe, dauerMin: number): Promise<boolean> {
  const wunsch = terminText(t.wunschDatum, t.startZeit, dauerMin);

  const html = `<!doctype html>
<html lang="de">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1113;color:#f2f3f5;margin:0;padding:24px">
    <div style="max-width:560px;margin:0 auto;background:#15171a;border-radius:16px;padding:32px 28px">
      <p style="color:#c9a86a;font-size:12px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;margin:0 0 12px">Glanzwerk Cloppenburg</p>
      <h1 style="font-size:24px;font-weight:900;color:#f2f3f5;margin:0 0 16px;letter-spacing:-0.02em">Anfrage erhalten ✓</h1>
      <p style="color:#9aa0a8;line-height:1.7;margin:0 0 20px">Hallo ${t.name || 'und danke'}, deine Terminanfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich, um deinen Wunschtermin zu bestätigen.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 24px">
        <tr><td style="color:#71717a;font-size:13px;padding:6px 0">Wunschtermin</td><td style="color:#f2f3f5;font-size:13px;padding:6px 0;text-align:right;font-weight:600">${wunsch}</td></tr>
        <tr><td style="color:#71717a;font-size:13px;padding:6px 0">Leistung</td><td style="color:#f2f3f5;font-size:13px;padding:6px 0;text-align:right;font-weight:600">${t.paket || '—'}</td></tr>
        <tr><td style="color:#71717a;font-size:13px;padding:6px 0">Ort</td><td style="color:#f2f3f5;font-size:13px;padding:6px 0;text-align:right;font-weight:600">${t.reinigungsort === 'beiuns' ? 'Bei uns in Cloppenburg' : 'Vor Ort bei dir'}</td></tr>
        ${t.aufpreise ? `<tr><td style="color:#71717a;font-size:13px;padding:6px 0">Zusätzlich</td><td style="color:#f2f3f5;font-size:13px;padding:6px 0;text-align:right;font-weight:600">${t.aufpreise}</td></tr>` : ''}
        <tr><td style="color:#71717a;font-size:13px;padding:10px 0 0;border-top:1px solid #2c3036">Preis (inkl. MwSt.)</td><td style="color:#c9a86a;font-size:18px;padding:10px 0 0;text-align:right;font-weight:900;border-top:1px solid #2c3036">${eur(t.preis)}</td></tr>
      </table>
      <p style="color:#71717a;font-size:13px;line-height:1.6;margin:0 0 8px">Der Preis ist ein Festpreis. Sollten vor Ort Sonderfälle dazukommen, sprechen wir das vorher mit dir ab.</p>
      <hr style="border:0;border-top:1px solid #2c3036;margin:24px 0">
      <p style="color:#52525b;font-size:12px;line-height:1.6;margin:0">Glanzwerk Cloppenburg · ${FROM_EMAIL}<br>Diese E-Mail ist eine automatische Eingangsbestätigung, noch keine verbindliche Terminzusage.</p>
    </div>
  </body>
</html>`;

  const text = `Hallo ${t.name || ''},

deine Terminanfrage ist bei uns eingegangen. Wir melden uns schnellstmöglich, um deinen Wunschtermin zu bestätigen.

Wunschtermin: ${wunsch}
Leistung: ${t.paket || '—'}
Ort: ${t.reinigungsort === 'beiuns' ? 'Bei uns in Cloppenburg' : 'Vor Ort bei dir'}
${t.aufpreise ? 'Zusätzlich: ' + t.aufpreise + '\n' : ''}Preis (inkl. MwSt.): ${eur(t.preis)}

Diese E-Mail ist eine automatische Eingangsbestätigung, noch keine verbindliche Terminzusage.

Glanzwerk Cloppenburg`;

  try {
    const r = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [t.email],
      replyTo: FROM_EMAIL,
      subject: 'Deine Terminanfrage bei Glanzwerk Cloppenburg',
      html,
      text,
    });
    if (r.error) { console.warn('[termin] kundenmail', r.error); return false; }
    return true;
  } catch (e) {
    console.warn('[termin] kundenmail fetch', e);
    return false;
  }
}

// ── Mail an den Betrieb ──────────────────────────────────────────────────────
async function sendBetriebMail(resend: Resend, t: TerminEingabe, dauerMin: number): Promise<boolean> {
  const wunsch = terminText(t.wunschDatum, t.startZeit, dauerMin);

  const rechnungUrl = `${BASE_URL}/admin/rechnung?${new URLSearchParams({
    vorname: t.name,
    kEmail: t.email,
    kTelefon: t.telefon,
    strasse: t.strasse,
    plz: t.plz,
    ort: t.ort,
    fahrzeug: t.kennzeichen ?? '',
    paket: t.paket,
    preis: t.preis.toFixed(2),
  }).toString()}`;
  const adminUrl = `${BASE_URL}/admin/termine`;

  const zeilen = [
    ['Wunschtermin', wunsch],
    ['Name', t.name],
    ['Telefon', t.telefon],
    ['E-Mail', t.email],
    ['Adresse', `${t.strasse}, ${t.plz} ${t.ort}`],
    ['Fahrzeug', t.kennzeichen || '—'],
    ['Leistung', t.paket],
    ['Ort', t.reinigungsort === 'beiuns' ? 'Bei uns in Cloppenburg' : 'Vor Ort beim Kunden'],
    ['Aufpreise', t.aufpreise || '—'],
    ['Entfernung', t.entfernungKm ? `${t.entfernungKm} km` : '—'],
    ['Preis', eur(t.preis)],
    ['Ausweichtermin', t.wunschAlternativ || '—'],
    ['Nachricht', t.notiz || '—'],
  ];

  const html = `<!doctype html>
<html lang="de">
  <body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1113;color:#f2f3f5;margin:0;padding:24px">
    <div style="max-width:600px;margin:0 auto;background:#15171a;border-radius:16px;padding:28px 24px">
      <h1 style="font-size:20px;font-weight:900;color:#f2f3f5;margin:0 0 4px">Neue Terminanfrage</h1>
      <p style="color:#c9a86a;font-size:13px;font-weight:700;margin:0 0 20px">${wunsch}</p>
      <table style="width:100%;border-collapse:collapse">
        ${zeilen.map(([k, v]) => `<tr><td style="color:#71717a;font-size:13px;padding:5px 0;vertical-align:top;width:130px">${k}</td><td style="color:#f2f3f5;font-size:13px;padding:5px 0;font-weight:600">${v}</td></tr>`).join('')}
      </table>
      <div style="margin:24px 0 0">
        <a href="${adminUrl}" style="display:inline-block;background:#c9a86a;color:#0f1113;padding:11px 18px;border-radius:9px;font-weight:700;text-decoration:none;font-size:14px;margin-right:8px">Im Admin öffnen</a>
        <a href="${rechnungUrl}" style="display:inline-block;background:#2c3036;color:#f2f3f5;padding:11px 18px;border-radius:9px;font-weight:700;text-decoration:none;font-size:14px">Rechnung erstellen</a>
      </div>
    </div>
  </body>
</html>`;

  try {
    const r = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [FROM_EMAIL],
      replyTo: t.email || FROM_EMAIL,
      subject: `Terminanfrage: ${t.name} – ${t.paket} (${eur(t.preis)})`,
      html,
    });
    if (r.error) { console.warn('[termin] betriebmail', r.error); return false; }
    return true;
  } catch (e) {
    console.warn('[termin] betriebmail fetch', e);
    return false;
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────
export const POST: APIRoute = async ({ request }) => {
  let body: TerminEingabe;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  // Honeypot: gefülltes verstecktes Feld → still "ok" zurück, nichts speichern
  if (body.honeypot && body.honeypot.trim() !== '') {
    return json({ ok: true, id: null, mailKunde: false, mailBetrieb: false });
  }

  const name = (body.name ?? '').trim().slice(0, 120);
  const email = (body.email ?? '').trim().toLowerCase().slice(0, 254);
  const telefon = (body.telefon ?? '').trim().slice(0, 50);
  const gruppe = (body.fahrzeugGruppe ?? '').trim().slice(0, 10);
  const paketKey = (body.paketKey ?? '').trim().slice(0, 40);
  const wunschDatum = (body.wunschDatum ?? '').trim().slice(0, 10);
  const startZeit = (body.startZeit ?? '').trim().slice(0, 5);

  if (!name || !telefon || !email || !EMAIL_RE.test(email)) {
    return json({ error: 'invalid_input' }, 400);
  }
  if (!wunschDatum || !startZeit || !paketKey) {
    return json({ error: 'invalid_input' }, 400);
  }

  if (rateLimited(clientIp(request))) {
    return json({ error: 'rate_limited' }, 429);
  }

  const supabase = getSupabase();
  if (!supabase) return json({ error: 'not_configured' }, 503);

  const dauerMin = paketDauerMin(gruppe, paketKey);
  if (dauerMin <= 0) return json({ error: 'invalid_paket' }, 400);

  // Slot erneut prüfen (gegen veraltete Auswahl / Doppelbuchung)
  const v = await ladeVerfuegbarkeit(supabase);
  const { data: bookings } = await supabase
    .from('termine')
    .select('start_zeit, dauer_min')
    .eq('wunsch_datum', wunschDatum)
    .in('status', ['offen', 'bestaetigt'])
    .neq('start_zeit', '')
    .returns<{ start_zeit: string; dauer_min: number }[]>();
  const belegt: Belegung[] = (bookings ?? [])
    .filter((b) => b.start_zeit && b.dauer_min)
    .map((b) => ({ start: zeitZuMin(b.start_zeit), end: zeitZuMin(b.start_zeit) + b.dauer_min }));
  if (!berechneSlots(wunschDatum, dauerMin, v, belegt).includes(startZeit)) {
    return json({ error: 'slot_weg' }, 409);
  }

  const sauber: TerminEingabe = {
    name,
    email,
    telefon,
    strasse: (body.strasse ?? '').trim().slice(0, 160),
    plz: (body.plz ?? '').trim().slice(0, 10),
    ort: (body.ort ?? '').trim().slice(0, 120),
    kennzeichen: (body.kennzeichen ?? '').trim().slice(0, 60),
    wunschDatum,
    startZeit,
    paketKey,
    wunschZeit: '',
    wunschAlternativ: '',
    fahrzeugGruppe: gruppe,
    paket: (body.paket ?? '').trim().slice(0, 120),
    reinigungsort: (body.reinigungsort ?? '').trim().slice(0, 20),
    aufpreise: (body.aufpreise ?? '').trim().slice(0, 400),
    entfernungKm: Number.isFinite(body.entfernungKm) ? Number(body.entfernungKm) : 0,
    preis: Number.isFinite(body.preis) ? Number(body.preis) : 0,
    notiz: (body.notiz ?? '').trim().slice(0, 1000),
  };

  const { data, error } = await supabase
    .from('termine')
    .insert({
      status: 'offen',
      wunsch_datum: wunschDatum,
      start_zeit: startZeit,
      dauer_min: dauerMin,
      wunsch_zeit: '',
      name: sauber.name,
      telefon: sauber.telefon,
      email: sauber.email,
      strasse: sauber.strasse,
      plz: sauber.plz,
      ort: sauber.ort,
      kennzeichen: sauber.kennzeichen,
      fahrzeug_gruppe: sauber.fahrzeugGruppe,
      paket: sauber.paket,
      reinigungsort: sauber.reinigungsort,
      aufpreise: sauber.aufpreise,
      entfernung_km: sauber.entfernungKm,
      preis: sauber.preis,
      notiz: sauber.notiz,
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !data) {
    console.warn('[termin] insert', error);
    return json({ error: 'db_error' }, 500);
  }

  let mailKunde = false;
  let mailBetrieb = false;
  if (RESEND_API_KEY) {
    const resend = new Resend(RESEND_API_KEY);
    [mailKunde, mailBetrieb] = await Promise.all([
      sendKundenMail(resend, sauber, dauerMin),
      sendBetriebMail(resend, sauber, dauerMin),
    ]);
  }

  return json({ ok: true, id: data.id, mailKunde, mailBetrieb });
};
