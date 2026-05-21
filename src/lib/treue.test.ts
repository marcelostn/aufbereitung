import { describe, it, expect, beforeEach } from 'vitest';
import {
  STORAGE_KEY,
  BELOHNUNG_INTERVALL,
  normalisiereTelefon,
  verdienteBelohnungen,
  offeneBelohnungen,
  bisNaechsteBelohnung,
  addStempel,
  findeStempel,
  markiereEinloesung,
  loadAlleStempel,
} from './treue';

// localStorage-Stub für Vitest (jsdom hat localStorage, aber bei Bedarf hier resetten)
beforeEach(() => {
  if (typeof window !== 'undefined') window.localStorage.clear();
});

describe('normalisiereTelefon', () => {
  it('+49 → 0', () => {
    expect(normalisiereTelefon('+49 160 1234567')).toBe('01601234567');
  });
  it('0049 → 0', () => {
    expect(normalisiereTelefon('0049 160 1234567')).toBe('01601234567');
  });
  it('Whitespace und Sonderzeichen raus', () => {
    expect(normalisiereTelefon('0160 / 123 45-67')).toBe('01601234567');
    // identisches Ergebnis bei verschiedenen Schreibweisen
    expect(normalisiereTelefon('0160 / 123 4567')).toBe(normalisiereTelefon('01601234567'));
  });
  it('Leerstring bei leerer Eingabe', () => {
    expect(normalisiereTelefon('')).toBe('');
  });
});

describe('Belohnungs-Logik', () => {
  it('0 Aufträge → 0 verdient, 5 bis zur nächsten', () => {
    expect(verdienteBelohnungen(null)).toBe(0);
    expect(bisNaechsteBelohnung(null)).toBe(BELOHNUNG_INTERVALL);
  });

  it('4 Aufträge → 0 verdient, 1 bis zur nächsten', () => {
    const k = {
      telefon: '0160', name: 'Test', anzahlAuftraege: 4,
      ersterAuftrag: '2026-01-01', letzterAuftrag: '2026-01-20', einloesungen: [],
    };
    expect(verdienteBelohnungen(k)).toBe(0);
    expect(offeneBelohnungen(k)).toBe(0);
    expect(bisNaechsteBelohnung(k)).toBe(1);
  });

  it('5 Aufträge → 1 verdient, 1 offen, 0 bis zur nächsten = jetzt!', () => {
    const k = {
      telefon: '0160', name: 'Test', anzahlAuftraege: 5,
      ersterAuftrag: '2026-01-01', letzterAuftrag: '2026-05-01', einloesungen: [],
    };
    expect(verdienteBelohnungen(k)).toBe(1);
    expect(offeneBelohnungen(k)).toBe(1);
    expect(bisNaechsteBelohnung(k)).toBe(0);
  });

  it('5 Aufträge + 1 Einlösung → 1 verdient, 0 offen', () => {
    const k = {
      telefon: '0160', name: 'Test', anzahlAuftraege: 5,
      ersterAuftrag: '2026-01-01', letzterAuftrag: '2026-05-01',
      einloesungen: [{ datum: '2026-05-01', produkt: 'Pol Star' }],
    };
    expect(verdienteBelohnungen(k)).toBe(1);
    expect(offeneBelohnungen(k)).toBe(0);
  });

  it('11 Aufträge + 2 Einlösungen → 2 verdient, 0 offen, 4 bis zur nächsten (15)', () => {
    const k = {
      telefon: '0160', name: 'Test', anzahlAuftraege: 11,
      ersterAuftrag: '2025-01-01', letzterAuftrag: '2026-05-01',
      einloesungen: [
        { datum: '2025-05-01', produkt: 'Pol Star' },
        { datum: '2025-12-01', produkt: 'Top Star' },
      ],
    };
    expect(verdienteBelohnungen(k)).toBe(2);
    expect(offeneBelohnungen(k)).toBe(0);
    expect(bisNaechsteBelohnung(k)).toBe(4);
  });

  it('15 Aufträge + 2 Einlösungen → 3 verdient, 1 offen', () => {
    const k = {
      telefon: '0160', name: 'Test', anzahlAuftraege: 15,
      ersterAuftrag: '2025-01-01', letzterAuftrag: '2026-05-01',
      einloesungen: [
        { datum: '2025-05-01', produkt: 'Pol Star' },
        { datum: '2025-12-01', produkt: 'Top Star' },
      ],
    };
    expect(verdienteBelohnungen(k)).toBe(3);
    expect(offeneBelohnungen(k)).toBe(1);
  });
});

describe('addStempel + findeStempel', () => {
  it('Neuer Kunde wird angelegt', () => {
    const k = addStempel('+49 160 1234567', 'Max Mustermann', '2026-05-21');
    expect(k).not.toBeNull();
    expect(k!.anzahlAuftraege).toBe(1);
    expect(k!.telefon).toBe('01601234567');
    expect(k!.name).toBe('Max Mustermann');
  });

  it('Bestehender Kunde wird hochgezählt', () => {
    addStempel('0160 1234567', 'Max', '2026-05-01');
    const k = addStempel('0160-1234567', 'Max', '2026-05-21');
    expect(k!.anzahlAuftraege).toBe(2);
    // findeStempel toleriert verschiedene Schreibweisen
    expect(findeStempel('+49 160 1234567')!.anzahlAuftraege).toBe(2);
  });

  it('Leeres Telefon → kein Eintrag, keine Crashes', () => {
    expect(addStempel('', 'Max', '2026-05-21')).toBeNull();
    expect(loadAlleStempel()).toHaveLength(0);
  });
});

describe('markiereEinloesung', () => {
  it('Belohnung einlösen senkt offene Anzahl', () => {
    for (let i = 0; i < 5; i++) addStempel('01601234567', 'Max', '2026-05-21');
    const vorher = findeStempel('01601234567');
    expect(offeneBelohnungen(vorher)).toBe(1);

    const nachher = markiereEinloesung('01601234567', {
      datum: '2026-05-21', produkt: 'Pol Star', rechnungsNr: 'RE-2026-005',
    });
    expect(offeneBelohnungen(nachher)).toBe(0);
    expect(nachher!.einloesungen).toHaveLength(1);
  });

  it('Einlösung ohne offene Belohnung ändert nichts', () => {
    addStempel('01601234567', 'Max', '2026-05-21'); // nur 1 Auftrag
    const k = markiereEinloesung('01601234567', { datum: '2026-05-21', produkt: 'Pol Star' });
    expect(k!.einloesungen).toHaveLength(0);
  });
});
