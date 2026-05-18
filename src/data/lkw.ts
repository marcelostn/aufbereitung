import lkwJson from './lkw.json';

export type LkwPaketTyp =
  | 'lkw_basic'
  | 'lkw_premium'
  | 'lkw_detail'
  | 'traktor_basic'
  | 'traktor_premium'
  | 'transporter_basic'
  | 'transporter_premium';

export interface LkwPaket {
  name: string;
  stunden: number;
  bruttoPreis: number;
  dauer: string;
}

export const LKW_PAKETE = Object.fromEntries(
  lkwJson.pakete.map((p) => [
    p.key,
    { name: p.name, stunden: p.stunden, bruttoPreis: p.bruttoPreis, dauer: p.dauer },
  ])
) as Record<LkwPaketTyp, LkwPaket>;
