/**
 * Treuekarten-Logik: jeder 5. Auftrag → Belohnung (kleines Pflegeprodukt).
 *
 * Speicherung: Supabase (geräteübergreifend). Alle Schreib-/Lesezugriffe laufen
 * über /api/treue und sind dadurch async. Pure Hilfsfunktionen (normalisieren,
 * Belohnungs-Logik) bleiben synchron.
 *
 * Identifikator: normalisierte Telefonnummer (eindeutig in der DB).
 */

export const BELOHNUNG_INTERVALL = 5;

export interface Einloesung {
  datum: string;          // ISO yyyy-mm-dd
  produkt: string;        // z.B. "Koch Chemie Pol Star 250 ml"
  rechnungsNr?: string;
}

export interface KundenStempel {
  telefon: string;        // normalisiert (nur Ziffern, +49 → 0)
  name: string;
  anzahlAuftraege: number;
  ersterAuftrag: string;  // ISO
  letzterAuftrag: string; // ISO
  einloesungen: Einloesung[];
}

// ── Pure Helpers ────────────────────────────────────────────────────────────

/** Telefon normalisieren: nur Ziffern, +49 / 0049 / 49xxx → 0xxx. Leerstring wenn unbrauchbar. */
export function normalisiereTelefon(s: string): string {
  if (!s) return '';
  let nur = s.replace(/\D/g, '');
  if (nur.startsWith('0049')) nur = '0' + nur.slice(4);
  else if (nur.startsWith('49') && nur.length >= 11) nur = '0' + nur.slice(2);
  return nur;
}

/** Anzahl bereits verdienter Belohnungen (alle 5 Aufträge). */
export function verdienteBelohnungen(s: KundenStempel | null): number {
  if (!s) return 0;
  return Math.floor(s.anzahlAuftraege / BELOHNUNG_INTERVALL);
}

/** Offene (noch nicht eingelöste) Belohnungen. */
export function offeneBelohnungen(s: KundenStempel | null): number {
  if (!s) return 0;
  return Math.max(0, verdienteBelohnungen(s) - s.einloesungen.length);
}

/** Aufträge bis zur nächsten Belohnung (1..5). 0 = jetzt Belohnung verdient. */
export function bisNaechsteBelohnung(s: KundenStempel | null): number {
  if (!s) return BELOHNUNG_INTERVALL;
  const rest = s.anzahlAuftraege % BELOHNUNG_INTERVALL;
  return rest === 0 && s.anzahlAuftraege > 0 ? 0 : BELOHNUNG_INTERVALL - rest;
}

// ── API-Calls (async) ───────────────────────────────────────────────────────

async function api<T>(method: string, body?: unknown, query?: string): Promise<T> {
  const res = await fetch('/api/treue' + (query ?? ''), {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API /api/treue ${method} → HTTP ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export async function fetchAlleStempel(): Promise<KundenStempel[]> {
  const data = await api<{ kunden: KundenStempel[] }>('GET');
  return data.kunden;
}

export async function findeStempel(telefonRoh: string): Promise<KundenStempel | null> {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const data = await api<{ kunde: KundenStempel | null }>('GET', undefined, `?telefon=${encodeURIComponent(tel)}`);
  return data.kunde;
}

export async function addStempel(
  telefonRoh: string,
  name: string,
  datumIso: string
): Promise<KundenStempel | null> {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const data = await api<{ kunde: KundenStempel | null }>('POST', {
    action: 'add',
    telefon: tel,
    name,
    datumIso,
  });
  return data.kunde;
}

export async function markiereEinloesung(
  telefonRoh: string,
  eintrag: Einloesung
): Promise<KundenStempel | null> {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const data = await api<{ kunde: KundenStempel | null }>('POST', {
    action: 'einloesung',
    telefon: tel,
    eintrag,
  });
  return data.kunde;
}

export async function setStempelAnzahl(
  telefonRoh: string,
  neueAnzahl: number
): Promise<KundenStempel | null> {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const data = await api<{ kunde: KundenStempel | null }>('POST', {
    action: 'setAnzahl',
    telefon: tel,
    neueAnzahl: Math.max(0, Math.floor(neueAnzahl)),
  });
  return data.kunde;
}

export async function loescheStempel(telefonRoh: string): Promise<void> {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return;
  await api<{ ok: boolean }>('DELETE', undefined, `?telefon=${encodeURIComponent(tel)}`);
}

export async function loescheAlleStempel(): Promise<void> {
  await api<{ ok: boolean }>('DELETE', undefined, '?all=1');
}
