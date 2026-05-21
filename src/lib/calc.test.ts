import { describe, it, expect } from 'vitest';
import { berechnePreis } from './calc';

describe('berechnePreis – PKW', () => {
  it('Komplett Basic, 0 km, keine Aufpreise → 119,99 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'pkw',
      paket: 'komplett_basic',
      fahrzeugZuschlag: 'pkw',
      tierhaare: 'keine',
      kindersitze: 0,
      nikotin: false,
      entfernungKm: 0,
    });
    expect(gesamt).toBe(119.99);
  });

  it('Komplett Premium + SUV-Zuschlag, 0 km → 169,99 × 1,15 = 195,49 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'pkw',
      paket: 'komplett_premium',
      fahrzeugZuschlag: 'suv',
      tierhaare: 'keine',
      kindersitze: 0,
      nikotin: false,
      entfernungKm: 0,
    });
    expect(gesamt).toBe(195.49);
  });

  it('Innen Detail + Tierhaare stark + 1 Kindersitz + 25 km → 298,99 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'pkw',
      paket: 'innen_detail',
      fahrzeugZuschlag: 'pkw',
      tierhaare: 'stark',
      kindersitze: 1,
      nikotin: false,
      entfernungKm: 25,
    });
    // 224,99 + 45 + 20 + 9 (Anfahrt: (25-10)×2×0,30=9)
    expect(gesamt).toBe(298.99);
  });

  it('Van Komplett Detail, 50 km → 348,99 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'pkw',
      paket: 'komplett_detail',
      fahrzeugZuschlag: 'van',
      tierhaare: 'keine',
      kindersitze: 0,
      nikotin: false,
      entfernungKm: 50,
    });
    // 249,99 + 75,00 (30 %) + 24 (Anfahrt: (50-10)×2×0,30=24)
    expect(gesamt).toBe(348.99);
  });

  it('Anfahrt innerhalb 10 km Radius → 0 € Anfahrt', () => {
    const { positionen } = berechnePreis({
      typ: 'pkw',
      paket: 'aussen',
      fahrzeugZuschlag: 'pkw',
      tierhaare: 'keine',
      kindersitze: 0,
      nikotin: false,
      entfernungKm: 8,
    });
    const anfahrt = positionen.find(p => p.bezeichnung === 'Anfahrtskosten');
    expect(anfahrt).toBeUndefined();
  });

  it('Anfahrt genau 10 km → 0 € Anfahrt', () => {
    const { positionen } = berechnePreis({
      typ: 'pkw',
      paket: 'aussen',
      fahrzeugZuschlag: 'pkw',
      tierhaare: 'keine',
      kindersitze: 0,
      nikotin: false,
      entfernungKm: 10,
    });
    const anfahrt = positionen.find(p => p.bezeichnung === 'Anfahrtskosten');
    expect(anfahrt).toBeUndefined();
  });
});

describe('berechnePreis – LKW', () => {
  it('LKW Kabine Premium (3 h), 0 km → 119,99 € Festpreis', () => {
    const { gesamt } = berechnePreis({
      typ: 'lkw',
      paket: 'lkw_premium',
      tierhaare: 'keine',
      nikotin: false,
      entfernungKm: 0,
    });
    // 3 h × 33 €/h netto (30 + 3 Material) × 1,19 = 117,81 → gerundeter Festpreis 119,99
    expect(gesamt).toBe(119.99);
  });

  it('LKW Kabine Basic (1,5 h), 0 km → 59,99 € Festpreis', () => {
    const { gesamt } = berechnePreis({
      typ: 'lkw',
      paket: 'lkw_basic',
      tierhaare: 'keine',
      nikotin: false,
      entfernungKm: 0,
    });
    // 1,5 h × 33 € × 1,19 = 58,91 → Festpreis 59,99
    expect(gesamt).toBe(59.99);
  });

  it('LKW Full Detail (5 h) + Mäusekot + Anfahrt 25 km → 199,99 + 45 + 9 = 253,99 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'lkw',
      paket: 'lkw_detail',
      tierhaare: 'keine',
      nikotin: false,
      maeusekot: true,
      entfernungKm: 25,
    });
    expect(gesamt).toBe(253.99);
  });

  it('LKW Premium + Schimmel + Lebensmittel-Reste → 119,99 + 40 + 25 = 184,99 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'lkw',
      paket: 'lkw_premium',
      tierhaare: 'keine',
      nikotin: false,
      schimmel: true,
      lebensmittel: true,
      entfernungKm: 0,
    });
    expect(gesamt).toBe(184.99);
  });
});
