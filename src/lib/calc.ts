import { PKW_PAKETE, type PaketTyp } from '../data/preise';
import {
  TIERHAARE,
  KINDERSITZ_PRO_STUECK,
  NIKOTIN,
  FAHRZEUG_ZUSCHLAG,
  FREI_RADIUS_KM,
  KM_PREIS,
  type TierhaarStufe,
  type FahrzeugZuschlagTyp,
} from '../data/aufpreise';
import { LKW_PAKETE, type LkwPaketTyp } from '../data/lkw';

export interface PkwInput {
  typ: 'pkw';
  paket: PaketTyp;
  fahrzeugZuschlag: FahrzeugZuschlagTyp;
  tierhaare: TierhaarStufe;
  kindersitze: number;
  nikotin: boolean;
  entfernungKm: number;
}

export interface LkwInput {
  typ: 'lkw';
  paket: LkwPaketTyp;
  tierhaare: TierhaarStufe;
  nikotin: boolean;
  entfernungKm: number;
}

export type PreisInput = PkwInput | LkwInput;

export interface PreisPosition {
  bezeichnung: string;
  betrag: number;
}

export interface PreisErgebnis {
  positionen: PreisPosition[];
  gesamt: number;
}

function fahrtkosten(km: number): number {
  const mehrKm = Math.max(0, km - FREI_RADIUS_KM);
  return mehrKm * 2 * KM_PREIS;
}

function runden(n: number): number {
  return Math.round(n * 100) / 100;
}

export function berechnePreis(input: PreisInput): PreisErgebnis {
  const positionen: PreisPosition[] = [];

  if (input.typ === 'pkw') {
    const paket = PKW_PAKETE[input.paket];
    positionen.push({ bezeichnung: paket.name, betrag: paket.bruttoPreis });

    const zuschlagProzent = FAHRZEUG_ZUSCHLAG[input.fahrzeugZuschlag];
    if (zuschlagProzent > 0) {
      const zuschlagBetrag = runden(paket.bruttoPreis * zuschlagProzent);
      const label = input.fahrzeugZuschlag === 'suv'
        ? 'SUV-Zuschlag (+15 %)'
        : input.fahrzeugZuschlag === 'van'
          ? 'Van/Bus-Zuschlag (+30 %)'
          : 'Lang-/7-Sitzer-Zuschlag (+20 %)';
      positionen.push({ bezeichnung: label, betrag: zuschlagBetrag });
    }

    const tierhaarBetrag = TIERHAARE[input.tierhaare];
    if (tierhaarBetrag > 0) {
      const labels: Record<TierhaarStufe, string> = {
        keine: '',
        leicht: 'Aufpreis Tierhaare (leicht)',
        mittel: 'Aufpreis Tierhaare (mittel)',
        stark: 'Aufpreis Tierhaare (stark)',
      };
      positionen.push({ bezeichnung: labels[input.tierhaare], betrag: tierhaarBetrag });
    }

    if (input.kindersitze > 0) {
      const betrag = input.kindersitze * KINDERSITZ_PRO_STUECK;
      positionen.push({
        bezeichnung: `Kindersitz reinigen (${input.kindersitze}×)`,
        betrag,
      });
    }

    if (input.nikotin) {
      positionen.push({ bezeichnung: 'Aufpreis starker Nikotingeruch', betrag: NIKOTIN });
    }

    const anfahrt = fahrtkosten(input.entfernungKm);
    if (anfahrt > 0) {
      positionen.push({ bezeichnung: 'Anfahrtskosten', betrag: anfahrt });
    }
  } else {
    const paket = LKW_PAKETE[input.paket];
    positionen.push({ bezeichnung: paket.name, betrag: paket.bruttoPreis });

    const tierhaarBetrag = TIERHAARE[input.tierhaare];
    if (tierhaarBetrag > 0) {
      const labels: Record<TierhaarStufe, string> = {
        keine: '',
        leicht: 'Aufpreis Tierhaare (leicht)',
        mittel: 'Aufpreis Tierhaare (mittel)',
        stark: 'Aufpreis Tierhaare (stark)',
      };
      positionen.push({ bezeichnung: labels[input.tierhaare], betrag: tierhaarBetrag });
    }

    if (input.nikotin) {
      positionen.push({ bezeichnung: 'Aufpreis starker Nikotingeruch', betrag: NIKOTIN });
    }

    const anfahrt = fahrtkosten(input.entfernungKm);
    if (anfahrt > 0) {
      positionen.push({ bezeichnung: 'Anfahrtskosten', betrag: anfahrt });
    }
  }

  const gesamt = runden(positionen.reduce((sum, p) => sum + p.betrag, 0));
  return { positionen, gesamt };
}
