/**
 * Newsletter-Subscriber-Liste — Speicherung in Supabase (zentral).
 * Anmeldungen kommen aktuell per E-Mail an die Firmenadresse (Web3Forms);
 * der User pflegt sie hier manuell ein. Sobald Brevo o.ä. eingebunden ist,
 * wandert die Liste dort hin — bis dahin dient diese Liste als zentrales
 * Sammelbecken + CSV-Export-Quelle.
 */

export interface Subscriber {
  email: string;     // normalisiert (lowercase, trim)
  name?: string;
  datum: string;     // ISO yyyy-mm-dd (=created_at-Datum)
  quelle?: string;   // z.B. „Webseite", „WhatsApp", „Telefon"
  notiz?: string;
  bestaetigt: boolean; // hat der User die DOI-Mail manuell verschickt + Antwort erhalten?
}

export function normalisiereEmail(s: string): string {
  return (s || '').trim().toLowerCase();
}

// ── API-Calls ───────────────────────────────────────────────────────────────

async function api<T>(method: string, body?: unknown, query?: string): Promise<T> {
  const res = await fetch('/api/newsletter' + (query ?? ''), {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API /api/newsletter ${method} → HTTP ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export async function fetchAlleSubscriber(): Promise<Subscriber[]> {
  const data = await api<{ subscriber: Subscriber[] }>('GET');
  return data.subscriber;
}

export async function upsertSubscriber(
  sub: Subscriber
): Promise<{ created: boolean; subscriber: Subscriber | null }> {
  const e = normalisiereEmail(sub.email);
  if (!e) return { created: false, subscriber: null };
  return await api<{ created: boolean; subscriber: Subscriber | null }>('POST', {
    action: 'upsert',
    sub: { ...sub, email: e },
  });
}

export async function loescheSubscriber(emailRoh: string): Promise<void> {
  const e = normalisiereEmail(emailRoh);
  if (!e) return;
  await api<{ ok: boolean }>('DELETE', undefined, `?email=${encodeURIComponent(e)}`);
}

export async function loescheAlleSubscriber(): Promise<void> {
  await api<{ ok: boolean }>('DELETE', undefined, '?all=1');
}

export async function toggleBestaetigt(emailRoh: string): Promise<Subscriber | null> {
  const e = normalisiereEmail(emailRoh);
  if (!e) return null;
  const data = await api<{ subscriber: Subscriber | null }>('POST', {
    action: 'toggle',
    email: e,
  });
  return data.subscriber;
}

/** CSV-Export im Brevo-Format. Arbeitet auf bereits geladenen Subscribern (kein zusätzlicher Roundtrip). */
export function exportiereCsv(subs: Subscriber[]): string {
  const header = ['EMAIL', 'FIRSTNAME', 'QUELLE', 'DATUM', 'BESTAETIGT', 'NOTIZ'];
  const rows = subs.map((s) =>
    [
      s.email,
      s.name ?? '',
      s.quelle ?? '',
      s.datum,
      s.bestaetigt ? 'ja' : 'nein',
      (s.notiz ?? '').replace(/[\r\n,;]+/g, ' '),
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  );
  return [header.join(','), ...rows].join('\n');
}
