/**
 * Termine (eigenes Buchungssystem) — Typen, Labels und API-Wrapper.
 *
 * Öffentliche Anfrage (Preisrechner) läuft über POST /api/termin/anfrage
 * (kein Login). Verwaltung im Admin läuft über /api/termine (cms_auth):
 *   - fetchTermine()              alle Termine laden (neueste zuerst)
 *   - patchTermin(id, patch)      Status/Datum/Notiz ändern
 *   - deleteTermin(id)            löschen
 */

export type TerminStatus = 'offen' | 'bestaetigt' | 'abgesagt' | 'erledigt';

/** Vollständiger Termin (wie vom Admin-Endpoint geliefert, camelCase). */
export interface Termin {
  id: string;
  status: TerminStatus;
  wunschDatum: string;        // 'YYYY-MM-DD' (gewählter Tag)
  startZeit: string;          // 'HH:MM' (gewählter Slot)
  dauerMin: number;           // Dauer des Auftrags in Minuten
  wunschZeit: string;         // legacy (Tageszeit-Text), neu meist leer
  wunschAlternativ: string;
  bestaetigtDatum: string;    // '' wenn noch nicht bestätigt
  bestaetigtZeit: string;
  name: string;
  telefon: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
  kennzeichen: string;
  fahrzeugGruppe: string;     // 'pkw' | 'lkw' | ''
  paket: string;
  reinigungsort: string;      // 'vorort' | 'beiuns' | ''
  aufpreise: string;
  entfernungKm: number;
  preis: number;
  notiz: string;
  adminNotiz: string;
  createdAt: string;
}

/** Payload, den der Preisrechner an /api/termin/anfrage schickt. */
export interface TerminEingabe {
  name: string;
  telefon: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
  kennzeichen?: string;
  wunschDatum: string;       // gewählter Tag 'YYYY-MM-DD'
  startZeit: string;         // gewählter Slot 'HH:MM'
  paketKey: string;          // Schlüssel für Dauer-Berechnung (z.B. 'komplett_premium')
  wunschZeit?: string;       // legacy
  wunschAlternativ?: string;
  fahrzeugGruppe: string;
  paket: string;
  reinigungsort: string;
  aufpreise?: string;
  entfernungKm?: number;
  preis: number;
  notiz?: string;
  honeypot?: string;          // muss leer bleiben (Spam-Schutz)
}

/** Felder, die der Admin ändern darf. */
export interface TerminPatch {
  status?: TerminStatus;
  bestaetigtDatum?: string;
  bestaetigtZeit?: string;
  adminNotiz?: string;
}

export const STATUS_LABEL: Record<TerminStatus, string> = {
  offen: 'Offen',
  bestaetigt: 'Bestätigt',
  abgesagt: 'Abgesagt',
  erledigt: 'Erledigt',
};

export const ZEIT_LABEL: Record<string, string> = {
  vormittags: 'Vormittags (8–12 Uhr)',
  nachmittags: 'Nachmittags (12–17 Uhr)',
  ganztags: 'Ganztägig / flexibel',
  flexibel: 'Zeitlich flexibel',
  '': 'Keine Angabe',
};

export const ZEIT_KURZ: Record<string, string> = {
  vormittags: 'Vormittags',
  nachmittags: 'Nachmittags',
  ganztags: 'Ganztägig',
  flexibel: 'Flexibel',
  '': '—',
};

/** Datum 'YYYY-MM-DD' → 'Sa, 14.06.2026' (de-DE). Leerstring → ''. */
export function formatDatum(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('de-DE', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// ── Admin-API-Wrapper ───────────────────────────────────────────────────────
async function api<T>(method: string, body?: unknown): Promise<T> {
  const res = await fetch('/api/termine', {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`/api/termine ${method} → HTTP ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export async function fetchTermine(): Promise<Termin[]> {
  const { termine } = await api<{ termine: Termin[] }>('GET');
  return termine;
}

export async function patchTermin(id: string, patch: TerminPatch): Promise<void> {
  await api<{ ok: boolean }>('PATCH', { id, ...patch });
}

export async function deleteTermin(id: string): Promise<void> {
  await api<{ ok: boolean }>('DELETE', { id });
}
