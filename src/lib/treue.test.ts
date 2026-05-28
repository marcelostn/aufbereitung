import { describe, it, expect } from 'vitest';
import {
  BELOHNUNG_INTERVALL,
  normalisiereTelefon,
  verdienteBelohnungen,
  offeneBelohnungen,
  bisNaechsteBelohnung,
} from './treue';

// Storage-Funktionen (fetchAlleStempel, addStempel, ...) sind seit der Supabase-Migration
// reine HTTP-Wrapper. Sie werden durch Integration mit der echten /api/treue-Route in
// Production verifiziert, nicht hier — Vitest-Mocks gegen fetch wären reine Tautologie.

describe('normalisiereTelefon', () => {
  it('+49 → 0', () => {
    expect(normalisiereTelefon('+49 160 1234567')).toBe('01601234567');
  });
  it('0049 → 0', () => {
    expect(normalisiereTelefon('0049 160 1234567')).toBe('01601234567');
  });
  it('Whitespace und Sonderzeichen raus', () => {
    expect(normalisiereTelefon('0160 / 123 45-67')).toBe('01601234567');
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
