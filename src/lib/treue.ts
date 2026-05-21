/**
 * Treuekarten-Logik: jeder 5. Auftrag → Belohnung (kleines Pflegeprodukt).
 * Storage: localStorage, kein Backend nötig (Single-Browser-Use im Admin).
 * Identifikator: normalisierte Telefonnummer.
 */

export const STORAGE_KEY = 'treue_stempel_v1';
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

// ── localStorage (SSR-safe) ─────────────────────────────────────────────────

export function loadAlleStempel(): KundenStempel[] {
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

export function saveAlleStempel(arr: KundenStempel[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    /* Speicher voll oder verboten – ignorieren */
  }
}

export function findeStempel(telefonRoh: string): KundenStempel | null {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  return loadAlleStempel().find((k) => k.telefon === tel) ?? null;
}

/**
 * Auftrag verbuchen: erhöht den Stempel-Zähler um 1.
 * Wenn der Kunde neu ist, wird er angelegt.
 * Gibt den aktualisierten Eintrag zurück.
 */
export function addStempel(
  telefonRoh: string,
  name: string,
  datumIso: string
): KundenStempel | null {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const arr = loadAlleStempel();
  const idx = arr.findIndex((k) => k.telefon === tel);
  if (idx >= 0) {
    arr[idx] = {
      ...arr[idx],
      name: name || arr[idx].name,
      anzahlAuftraege: arr[idx].anzahlAuftraege + 1,
      letzterAuftrag: datumIso,
    };
    saveAlleStempel(arr);
    return arr[idx];
  }
  const neu: KundenStempel = {
    telefon: tel,
    name,
    anzahlAuftraege: 1,
    ersterAuftrag: datumIso,
    letzterAuftrag: datumIso,
    einloesungen: [],
  };
  arr.unshift(neu);
  saveAlleStempel(arr);
  return neu;
}

/** Eine Belohnung als eingelöst markieren. Gibt den aktualisierten Eintrag zurück oder null wenn keine offene Belohnung. */
export function markiereEinloesung(telefonRoh: string, eintrag: Einloesung): KundenStempel | null {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const arr = loadAlleStempel();
  const idx = arr.findIndex((k) => k.telefon === tel);
  if (idx < 0) return null;
  if (offeneBelohnungen(arr[idx]) <= 0) return arr[idx]; // nichts offen
  arr[idx] = { ...arr[idx], einloesungen: [...arr[idx].einloesungen, eintrag] };
  saveAlleStempel(arr);
  return arr[idx];
}

/** Stempel-Korrektur (z.B. Tippfehler): manuell Anzahl setzen. */
export function setStempelAnzahl(telefonRoh: string, neueAnzahl: number): KundenStempel | null {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return null;
  const arr = loadAlleStempel();
  const idx = arr.findIndex((k) => k.telefon === tel);
  if (idx < 0) return null;
  arr[idx] = { ...arr[idx], anzahlAuftraege: Math.max(0, Math.floor(neueAnzahl)) };
  saveAlleStempel(arr);
  return arr[idx];
}

/** Kunde komplett löschen (z.B. Doppel-Eintrag). */
export function loescheStempel(telefonRoh: string): void {
  const tel = normalisiereTelefon(telefonRoh);
  if (!tel) return;
  const arr = loadAlleStempel().filter((k) => k.telefon !== tel);
  saveAlleStempel(arr);
}
