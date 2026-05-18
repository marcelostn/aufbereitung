import firmaJson from './firma.json';

export const FIRMA = firmaJson;
export const CAL_LINKS: Record<string, string> = firmaJson.calLinks ?? {};
