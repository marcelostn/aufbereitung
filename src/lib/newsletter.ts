/**
 * Newsletter-Subscriber-Liste — lokales Storage im Admin.
 * Anmeldungen kommen aktuell per E-Mail an die Firmenadresse (Web3Forms);
 * der User pflegt sie hier manuell ein. Sobald Brevo o.ä. eingebunden ist,
 * wandert die Liste dort hin — bis dahin dient diese Liste als zentrales
 * Sammelbecken + CSV-Export-Quelle.
 */

export const STORAGE_KEY = 'newsletter_subscriber_v1';

export interface Subscriber {
  email: string;     // normalisiert (lowercase, trim)
  name?: string;
  datum: string;     // ISO yyyy-mm-dd
  quelle?: string;   // z.B. „Webseite", „WhatsApp", „Telefon"
  notiz?: string;
  bestaetigt: boolean; // hat der User die DOI-Mail manuell verschickt + Antwort erhalten?
}

export function normalisiereEmail(s: string): string {
  return (s || '').trim().toLowerCase();
}

export function loadAlleSubscriber(): Subscriber[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (!s) return [];
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveAlleSubscriber(arr: Subscriber[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* ignore */
  }
}

export function findeSubscriber(emailRoh: string): Subscriber | null {
  const e = normalisiereEmail(emailRoh);
  if (!e) return null;
  return loadAlleSubscriber().find((s) => s.email === e) ?? null;
}

/** Subscriber hinzufügen oder aktualisieren. Gibt true zurück bei Neuanlage, false bei Update. */
export function upsertSubscriber(sub: Omit<Subscriber, 'email'> & { email: string }): boolean {
  const e = normalisiereEmail(sub.email);
  if (!e) return false;
  const arr = loadAlleSubscriber();
  const idx = arr.findIndex((s) => s.email === e);
  const eintrag: Subscriber = { ...sub, email: e };
  if (idx >= 0) {
    arr[idx] = { ...arr[idx], ...eintrag };
    saveAlleSubscriber(arr);
    return false;
  }
  arr.unshift(eintrag);
  saveAlleSubscriber(arr);
  return true;
}

export function loescheSubscriber(emailRoh: string): void {
  const e = normalisiereEmail(emailRoh);
  if (!e) return;
  const arr = loadAlleSubscriber().filter((s) => s.email !== e);
  saveAlleSubscriber(arr);
}

export function toggleBestaetigt(emailRoh: string): void {
  const e = normalisiereEmail(emailRoh);
  if (!e) return;
  const arr = loadAlleSubscriber();
  const idx = arr.findIndex((s) => s.email === e);
  if (idx < 0) return;
  arr[idx] = { ...arr[idx], bestaetigt: !arr[idx].bestaetigt };
  saveAlleSubscriber(arr);
}

/** CSV-Export im Brevo-kompatiblen Format (EMAIL,FIRSTNAME,SMS,ATTRIBUTE_1,...). */
export function exportiereCsv(): string {
  const arr = loadAlleSubscriber();
  const header = ['EMAIL', 'FIRSTNAME', 'QUELLE', 'DATUM', 'BESTAETIGT', 'NOTIZ'];
  const rows = arr.map((s) =>
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
