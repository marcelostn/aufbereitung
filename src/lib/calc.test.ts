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
  it('LKW Kabine Premium (3 h), 0 km → 82,11 €', () => {
    const { gesamt } = berechnePreis({
      typ: 'lkw',
      paket: 'lkw_premium',
      tierhaare: 'keine',
      nikotin: false,
      entfernungKm: 0,
    });
    // 3 h × 23 €/h netto × 1,19 MwSt = 82,11
    expect(gesamt).toBe(82.11);
  });

  it('LKW unter 2 h → Mindestpauschale 40 € netto = 47,60 € brutto', () => {
    const { gesamt } = berechnePreis({
      typ: 'lkw',
      paket: 'lkw_basic', // 1,5 h → 23 × 1,5 = 34,5 < 40 → Mindest 40
      tierhaare: 'keine',
      nikotin: false,
      entfernungKm: 0,
    });
    // 40 × 1,19 = 47,60
    expect(gesamt).toBe(47.60);
  });
});
