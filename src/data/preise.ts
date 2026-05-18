import preiseJson from './preise.json';

export type PaketTyp =
  | 'aussen'
  | 'innen_basic'
  | 'innen_premium'
  | 'innen_detail'
  | 'komplett_basic'
  | 'komplett_premium'
  | 'komplett_detail';

export interface Paket {
  name: string;
  bruttoPreis: number;
  dauer: string;
  beschreibung: string;
}

export const PKW_PAKETE = preiseJson as Record<PaketTyp, Paket>;
