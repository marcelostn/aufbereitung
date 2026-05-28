/**
 * Rechnungs-Archiv (Speicherung in Supabase, geräteübergreifend).
 * Rechnungsnummer (RE-YYYY-NNN) wird serverseitig vergeben — dadurch keine
 * Duplikate, auch wenn zwei Geräte gleichzeitig eine Rechnung erstellen.
 */

export interface Pos {
  beschreibung: string;
  /** Brutto als String (User-Eingabe mit Komma), wird beim Anzeigen geparst. */
  brutto: string;
}

export interface ArchivEintrag {
  rNr: string;
  rDatum: string;       // ISO yyyy-mm-dd
  lDatum: string;
  kName: string;
  kAdresse: string;
  kEmail: string;
  kTelefon?: string;
  fahrzeug: string;
  positionen: Pos[];
  zahlung: 'bar' | 'karte' | 'ueberweisung';
  zahlungsziel: string;
  notiz: string;
  gespeichertAm: string; // ISO Timestamp
  brutto: number;
}

// ── API-Calls ───────────────────────────────────────────────────────────────

async function api<T>(method: string, body?: unknown, query?: string): Promise<T> {
  const res = await fetch('/api/rechnungen' + (query ?? ''), {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API /api/rechnungen ${method} → HTTP ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export async function fetchAlleRechnungen(): Promise<ArchivEintrag[]> {
  const data = await api<{ rechnungen: ArchivEintrag[] }>('GET');
  return data.rechnungen;
}

export async function fetchNaechsteNummer(): Promise<string> {
  const data = await api<{ nummer: string }>('GET', undefined, '?next=1');
  return data.nummer;
}

export async function upsertRechnung(eintrag: ArchivEintrag): Promise<void> {
  await api<{ ok: boolean }>('POST', eintrag);
}

export async function loescheRechnung(rNr: string): Promise<void> {
  await api<{ ok: boolean }>('DELETE', undefined, `?r_nr=${encodeURIComponent(rNr)}`);
}
