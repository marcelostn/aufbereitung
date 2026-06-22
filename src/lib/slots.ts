/**
 * Slot-Engine: berechnet buchbare Startzeiten für einen Tag.
 *
 * Regeln:
 *  - Slot muss komplett in die Arbeitszeit des Wochentags passen (Ende ≤ Feierabend).
 *  - Zwischen zwei Aufträgen liegt mindestens `pufferMin` (Anfahrt/Aufbau).
 *  - Lückenlos: Startzeiten werden ab Arbeitsbeginn und direkt hinter bestehenden
 *    Aufträgen (gestaffelt um Dauer+Puffer) erzeugt — keine angebrochenen Lücken.
 *  - `kapazitaet` erlaubt parallele Aufträge (1 = nur einer gleichzeitig).
 *
 * Reine Funktionen, kein I/O — testbar und sowohl server- als auch clientseitig nutzbar.
 */

import { PKW_PAKETE, type PaketTyp } from '../data/preise';
import { LKW_PAKETE, type LkwPaketTyp } from '../data/lkw';
import { type Verfuegbarkeit, zeitZuMin, minZuZeit } from './verfuegbarkeit';

/** Dauer "1,5 h" / "4 h" → Minuten. */
function parseDauer(s: string): number {
  const m = s.replace(',', '.').match(/[\d.]+/);
  return m ? Math.round(parseFloat(m[0]) * 60) : 0;
}

/** Dauer eines Pakets in Minuten (PKW aus dem dauer-Text, LKW aus stunden). */
export function paketDauerMin(gruppe: string, key: string): number {
  if (gruppe === 'lkw') {
    const p = LKW_PAKETE[key as LkwPaketTyp];
    return p ? Math.round(p.stunden * 60) : 0;
  }
  const p = PKW_PAKETE[key as PaketTyp];
  return p ? parseDauer(p.dauer) : 0;
}

export interface Belegung {
  start: number; // Minuten ab 0:00
  end: number;
}

/** Konflikt, wenn zwischen den Intervallen weniger als `puffer` liegt. */
function konflikt(start: number, end: number, b: Belegung, puffer: number): boolean {
  return end + puffer > b.start && b.end + puffer > start;
}

/**
 * Buchbare Startzeiten ("HH:MM") für ein Datum.
 * `belegt` sind bereits vergebene Aufträge dieses Tages (offen + bestätigt).
 */
export function berechneSlots(
  datumIso: string,
  dauerMin: number,
  v: Verfuegbarkeit,
  belegt: Belegung[]
): string[] {
  if (dauerMin <= 0) return [];
  const d = new Date(datumIso + 'T00:00:00');
  if (Number.isNaN(d.getTime())) return [];

  const fenster = v.tage[String(d.getDay())];
  if (!fenster) return [];
  const open = zeitZuMin(fenster.von);
  const close = zeitZuMin(fenster.bis);
  if (close <= open) return [];

  const puffer = Math.max(0, v.pufferMin || 0);
  const kap = Math.max(1, v.kapazitaet || 1);
  const step = dauerMin + puffer;

  // Ankerpunkte: Arbeitsbeginn + direkt hinter jedem bestehenden Auftrag (mit Puffer)
  const anker = new Set<number>([open]);
  for (const b of belegt) anker.add(b.end + puffer);

  const ok = new Set<number>();
  for (const a of anker) {
    for (let start = a; start + dauerMin <= close; start += step) {
      if (start < open) continue;
      const end = start + dauerMin;
      let parallel = 0;
      for (const b of belegt) if (konflikt(start, end, b, puffer)) parallel++;
      if (parallel < kap) ok.add(start);
    }
  }

  return [...ok].sort((x, y) => x - y).map(minZuZeit);
}
