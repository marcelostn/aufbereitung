/**
 * Auswahl an Belohnungsprodukten, die wir Treuekunden bei der 5./10./15./...
 * Aufbereitung schenken. Wert in € (UVP/Endkundenpreis) dient als grobe Orientierung
 * für die Margenrechnung — wir verschenken das EK-günstige Produkt, das zum Kunden passt.
 */

export interface Belohnung {
  id: string;
  name: string;
  hinweis: string;
  /** UVP brutto, grobe Orientierung */
  wert: number;
}

export const BELOHNUNGEN: Belohnung[] = [
  {
    id: 'pol_star_250',
    name: 'Koch Chemie Pol Star 250 ml',
    hinweis: 'Polsterreiniger — bewährter Allrounder, passt zu jedem Kunden mit Stoffsitzen.',
    wert: 12,
  },
  {
    id: 'top_star_500',
    name: 'Koch Chemie Top Star 500 ml',
    hinweis: 'Innenraumreiniger — passt zu Kunden, die regelmäßig selbst Cockpit pflegen wollen.',
    wert: 14,
  },
  {
    id: 'plast_star_500',
    name: 'Koch Chemie Plast Star 500 ml',
    hinweis: 'Kunststoffpflege außen — für Stoßfänger, Spiegel, Türholme.',
    wert: 15,
  },
  {
    id: 'leather_star_250',
    name: 'Koch Chemie Leather Star 250 ml',
    hinweis: 'Lederpflege — nur für Kunden mit Lederausstattung sinnvoll.',
    wert: 16,
  },
  {
    id: 'glass_cleaner_500',
    name: 'Koch Chemie Glass Cleaner 500 ml',
    hinweis: 'Streifenfreier Glasreiniger — sicherer Allrounder, jeder kann ihn brauchen.',
    wert: 11,
  },
  {
    id: 'duftbaum',
    name: 'Premium Duftbaum / Lufterfrischer',
    hinweis: 'Günstige Mini-Variante als zusätzliches Goodie oder wenn keine Chemie passt.',
    wert: 4,
  },
];
