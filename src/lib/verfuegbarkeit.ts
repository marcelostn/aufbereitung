/**
 * Verfügbarkeit / Arbeitszeiten — Konfiguration für das Slot-Buchungssystem.
 *
 * Gespeichert in Supabase-Tabelle `einstellungen` unter schluessel='verfuegbarkeit'.
 * Wird vom Slot-Endpoint (server) gelesen und im Admin (/admin/verfuegbarkeit) bearbeitet.
 */

export interface TagFenster {
  von: string; // 'HH:MM'
  bis: string; // 'HH:MM'
}

export interface Verfuegbarkeit {
  /** Index "0"–"6" → JS getDay() (0=Sonntag … 6=Samstag). null = geschlossen. */
  tage: Record<string, TagFenster | null>;
  kapazitaet: number;   // wie viele Aufträge parallel (1 = nur du)
  pufferMin: number;    // Puffer zwischen Aufträgen (Anfahrt/Aufbau)
  vorlaufTage: number;  // frühestens buchbar in N Tagen (1 = ab morgen)
  horizontTage: number; // wie weit im Voraus buchbar
}

export const WOCHENTAGE_KURZ = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
export const WOCHENTAGE_LANG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

/** Start-Konfiguration (vom User vorgegeben 2026-06-01). */
export const DEFAULT_VERFUEGBARKEIT: Verfuegbarkeit = {
  tage: {
    '0': null,                              // Sonntag
    '1': null,                              // Montag
    '2': { von: '14:00', bis: '20:00' },    // Dienstag
    '3': null,                              // Mittwoch
    '4': null,                              // Donnerstag
    '5': { von: '12:00', bis: '18:00' },    // Freitag
    '6': { von: '08:00', bis: '18:00' },    // Samstag
  },
  kapazitaet: 1,
  pufferMin: 30,
  vorlaufTage: 1,
  horizontTage: 31,
};

export function zeitZuMin(t: string): number {
  const [h, m] = t.split(':').map((x) => parseInt(x, 10));
  return (h || 0) * 60 + (m || 0);
}

export function minZuZeit(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Fehlende Felder mit Defaults auffüllen (robust gegen Teil-Configs aus der DB). */
export function normalisiere(v: Partial<Verfuegbarkeit> | null | undefined): Verfuegbarkeit {
  if (!v) return DEFAULT_VERFUEGBARKEIT;
  return {
    tage: v.tage ?? DEFAULT_VERFUEGBARKEIT.tage,
    kapazitaet: v.kapazitaet ?? DEFAULT_VERFUEGBARKEIT.kapazitaet,
    pufferMin: v.pufferMin ?? DEFAULT_VERFUEGBARKEIT.pufferMin,
    vorlaufTage: v.vorlaufTage ?? DEFAULT_VERFUEGBARKEIT.vorlaufTage,
    horizontTage: v.horizontTage ?? DEFAULT_VERFUEGBARKEIT.horizontTage,
  };
}

// ── Admin-API-Wrapper ───────────────────────────────────────────────────────
export async function fetchVerfuegbarkeit(): Promise<Verfuegbarkeit> {
  const res = await fetch('/api/einstellungen?schluessel=verfuegbarkeit', { credentials: 'include' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return normalisiere(data.wert);
}

export async function saveVerfuegbarkeit(v: Verfuegbarkeit): Promise<void> {
  const res = await fetch('/api/einstellungen', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schluessel: 'verfuegbarkeit', wert: v }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`);
}
