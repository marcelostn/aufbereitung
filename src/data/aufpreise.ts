import aufpreiseJson from './aufpreise.json';

export type TierhaarStufe = 'keine' | 'leicht' | 'mittel' | 'stark';
export type FahrzeugZuschlagTyp = 'pkw' | 'suv' | 'van' | 'lang';

export const TIERHAARE: Record<TierhaarStufe, number> = {
  keine: 0,
  leicht: aufpreiseJson.tierhaare_leicht,
  mittel: aufpreiseJson.tierhaare_mittel,
  stark: aufpreiseJson.tierhaare_stark,
};

export const KINDERSITZ_PRO_STUECK = aufpreiseJson.kindersitz;
export const NIKOTIN = aufpreiseJson.nikotin;
export const MAEUSEKOT = aufpreiseJson.maeusekot;
export const EXTREME_VERSCHMUTZUNG = aufpreiseJson.extreme_verschmutzung;
export const SCHIMMEL = aufpreiseJson.schimmel;
export const LEBENSMITTEL = aufpreiseJson.lebensmittel;

export const FAHRZEUG_ZUSCHLAG: Record<FahrzeugZuschlagTyp, number> = {
  pkw: 0,
  suv: aufpreiseJson.suv_zuschlag,
  van: aufpreiseJson.van_zuschlag,
  lang: aufpreiseJson.lang_zuschlag,
};

export const FREI_RADIUS_KM = aufpreiseJson.frei_radius_km;
export const KM_PREIS = aufpreiseJson.km_preis;
