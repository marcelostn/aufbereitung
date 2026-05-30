/**
 * Lager (Verbrauchsmittel + Anlagegüter) — Typen, Default-Katalog und API-Wrapper.
 *
 * Speicherung läuft über Supabase (geräteübergreifend) via `/api/lager`:
 *   - fetchLager()            lädt beide Listen
 *   - syncLager(data)         schreibt beide Listen komplett zurück (Bulk-Upsert
 *                             + Löschen entfernter Einträge)
 *
 * Der LagerManager hält die Listen im State und ruft syncLager() debounced bei
 * jeder Änderung auf. Frische Datenbank wird beim ersten Laden mit dem
 * Default-Katalog (aus der Excel) befüllt.
 */

export interface Verbrauchsmittel {
  id: string;
  name: string;
  einheit: string;
  bestand: number;
  mindestbestand: number;
  nachbestellmenge: number;
  preisProEinheit: number;
  lieferant: string;
  bestellLink: string;
  notizen: string;
}

export interface Anlagegut {
  id: string;
  name: string;
  kaufdatum: string;
  kaufpreis: number;
  nutzungsdauerJahre: number;
  notizen: string;
}

export interface LagerData {
  verbrauch: Verbrauchsmittel[];
  anlagen: Anlagegut[];
}

export const EINHEITEN = ['ml', 'l', 'g', 'kg', 'Stück', 'Rolle', 'Flasche', 'Eimer'];

const TODAY = new Date().toISOString().slice(0, 10);

// ── Default-Katalog (aus Excel autoaufbereiten.xlsx, Sheet "Basis") ───────────
// Wird nur einmalig in eine leere Datenbank geschrieben.
export const DEFAULT_VERBRAUCH: Verbrauchsmittel[] = [
  // ── Chemie (Koch Chemie) ────────────────────────────────────────────────────
  // Mindestbestand = Bedarf für ~3 Aufträge (damit nie mitten in einem Job leer)
  { id: 'v01', name: 'Koch Chemie Leather Star',            einheit: 'ml',    bestand: 0, mindestbestand: 150, nachbestellmenge: 1000, preisProEinheit: 0.018,  lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Leather-Star-Leder-Tiefenpflege-1l',                                                                        notizen: 'Lederpflege · 17,90 €/L' },
  { id: 'v02', name: 'Koch Chemie Glass Cleaner',            einheit: 'ml',    bestand: 0, mindestbestand: 60,  nachbestellmenge: 1000, preisProEinheit: 0.0099, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Koch-Chemie-Glass-Cleaner-Glasreiniger-1L',                                                                  notizen: 'Glasflächen · 9,90 €/L' },
  { id: 'v03', name: 'Koch Chemie Green Star',               einheit: 'ml',    bestand: 0, mindestbestand: 90,  nachbestellmenge: 1000, preisProEinheit: 0.0079, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Green-Star',                                                                                                   notizen: 'Universalreiniger Außen · 7,90 €/L' },
  { id: 'v04', name: 'Geruchsneutralisator (Fresh Up)',      einheit: 'ml',    bestand: 0, mindestbestand: 45,  nachbestellmenge: 500,  preisProEinheit: 0.028,  lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Colourlock-Fresh-Up-Geruchsneutralisator-Geruchskiller',                                                      notizen: 'Geruch neutralisieren · 13,90 €' },
  { id: 'v05', name: 'Koch Chemie Mehrzweckreiniger',        einheit: 'ml',    bestand: 0, mindestbestand: 270, nachbestellmenge: 1000, preisProEinheit: 0.0149, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Koch-Chemie-Allzweckreinger-Set-Mehrzweckreiniger-Zylinderflasche-Spruehkopfstar',                             notizen: 'Kunststoff Innenraum · 14,90 €/L' },
  { id: 'v06', name: 'Koch Chemie Pol Star',                 einheit: 'ml',    bestand: 0, mindestbestand: 180, nachbestellmenge: 1000, preisProEinheit: 0.0109, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Pol-Star',                                                                                                     notizen: 'Textilreiniger Sitze/Matten · 10,90 €/L' },
  { id: 'v07', name: 'Koch Chemie Felgenreiniger',           einheit: 'ml',    bestand: 0, mindestbestand: 150, nachbestellmenge: 1000, preisProEinheit: 0.0209, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Reactive-Wheel-Cleaner',                                                                                       notizen: 'Felgen säubern · 20,90 €/L' },
  { id: 'v08', name: 'Koch Chemie Snow Foam',                einheit: 'ml',    bestand: 0, mindestbestand: 90,  nachbestellmenge: 1000, preisProEinheit: 0.014,  lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Gentle-Snow-Foam',                                                                                             notizen: 'Reinigungsschaum Außen · 13,99 €/L' },
  { id: 'v09', name: 'Insektenreiniger',                     einheit: 'ml',    bestand: 0, mindestbestand: 90,  nachbestellmenge: 1000, preisProEinheit: 0.0129, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Aussenreinigung-Set-Koch-Chemie-THE-FINISHER-InsectOff-Insektenentferner-Mikrofasertuch',                      notizen: 'Insektenentferner · 12,90 €/L' },
  { id: 'v10', name: 'Koch Chemie Vorreiniger',              einheit: 'ml',    bestand: 0, mindestbestand: 90,  nachbestellmenge: 1000, preisProEinheit: 0.0079, lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Koch-Chemie-Vorreiniger-B-1L',                                                                                 notizen: 'Vorwäsche · 7,90 €/L' },
  { id: 'v11', name: 'Koch Chemie Lackversiegelung SO 02',   einheit: 'ml',    bestand: 0, mindestbestand: 50,  nachbestellmenge: 500,  preisProEinheit: 0.062,  lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Spray-Sealant',                                                                                                notizen: 'Lackversiegelung Extra · 30,90 €/500 ml' },
  { id: 'v12', name: 'Koch Chemie Textilversiegelung STO 1', einheit: 'ml',    bestand: 0, mindestbestand: 50,  nachbestellmenge: 500,  preisProEinheit: 0.072,  lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Koch-Chemie-Allround-Textile-Sealant-Textilversiegelung',                                                    notizen: 'Textilversiegelung Extra · 35,90 €/500 ml' },
  { id: 'v13', name: 'Scheibenversiegelung',                 einheit: 'ml',    bestand: 0, mindestbestand: 30,  nachbestellmenge: 200,  preisProEinheit: 0.075,  lieferant: 'Amazon',       bestellLink: '',                                                                                                                                      notizen: 'Wasserabweisung Extra · 14,99 €/200 ml' },
  { id: 'v14', name: 'Reifenschaum',                         einheit: 'ml',    bestand: 0, mindestbestand: 100, nachbestellmenge: 500,  preisProEinheit: 0,      lieferant: 'Koch Chemie', bestellLink: 'https://kc-onlineshop.de/Kcu-Reifenschaum',                                                                                             notizen: 'Reifenpflege' },
  // ── Material / Tücher ────────────────────────────────────────────────────────
  { id: 'v15', name: 'Mikrofasertücher',                     einheit: 'Stück', bestand: 0, mindestbestand: 10,  nachbestellmenge: 20,   preisProEinheit: 1.00,   lieferant: 'Amazon',       bestellLink: 'https://www.amazon.de/limpando-Allzwecktuch-Mikrofasertücher-Allzwecktücher-Reinigungstücher/dp/B0DK9M9DFW',                          notizen: '20er Pack · 19,99 €' },
  { id: 'v16', name: 'Carbon Tuch (für Glas)',               einheit: 'Stück', bestand: 0, mindestbestand: 2,   nachbestellmenge: 5,    preisProEinheit: 4.40,   lieferant: 'Amazon',       bestellLink: 'https://www.amazon.de/CARBOTEC-Premium-Carbon-Microfaser-Glastücher/dp/B08CPDFJQN',                                                   notizen: 'Glasscheiben wischen · 21,99 €/5 Stück' },
  { id: 'v17', name: 'Saugstarkes Trockentuch',              einheit: 'Stück', bestand: 0, mindestbestand: 2,   nachbestellmenge: 5,    preisProEinheit: 3.00,   lieferant: 'Amazon',       bestellLink: 'https://www.amazon.de/ZENAKIO-Auto-Trockentuch-50x80-Mikrofasertücher/dp/B0G5WXTYPR',                                                  notizen: '50×80 cm · 14,99 €/Pack' },
];

export const DEFAULT_ANLAGEN: Anlagegut[] = [
  // ── Bereits vorhanden (True in Excel) ──
  { id: 'a01', name: 'Kärcher Nasssauger Spot',             kaufdatum: '2026-05-01', kaufpreis: 112.99, nutzungsdauerJahre: 5, notizen: 'Sitze, Fußmatten saugen' },
  { id: 'a02', name: 'Tornado Druckluftpistole',            kaufdatum: '2026-05-01', kaufpreis: 24.90,  nutzungsdauerJahre: 5, notizen: 'Schmutz aufwirbeln' },
  { id: 'a03', name: 'Bürstenaufsatz (Akkuschrauber)',       kaufdatum: '2026-05-01', kaufpreis: 18.90,  nutzungsdauerJahre: 2, notizen: 'Tiefenschmutz aus Fußmatten' },
  { id: 'a04', name: 'Scrubber Pad',                        kaufdatum: '2026-05-01', kaufpreis: 22.90,  nutzungsdauerJahre: 1, notizen: 'Tiefenreinigung Kunststoff/Leder' },
  { id: 'a05', name: 'Lederbürste',                         kaufdatum: '2026-05-01', kaufpreis: 9.99,   nutzungsdauerJahre: 3, notizen: 'Sitze/Matten reinigen' },
  // ── Noch nicht gekauft (False in Excel) — Kaufdatum aktualisieren wenn gekauft ──
  { id: 'a06', name: 'Kärcher Hochdruckreiniger',           kaufdatum: TODAY,        kaufpreis: 230.99, nutzungsdauerJahre: 7, notizen: 'Außenreinigung · geplant' },
  { id: 'a07', name: 'Kärcher Nass-Trockensauger',          kaufdatum: TODAY,        kaufpreis: 56.99,  nutzungsdauerJahre: 5, notizen: 'Staubsauger · geplant' },
  { id: 'a08', name: 'Dampfreiniger',                       kaufdatum: TODAY,        kaufpreis: 119.99, nutzungsdauerJahre: 5, notizen: 'Randverschmutzung · geplant' },
  { id: 'a09', name: 'Felgenbürste',                        kaufdatum: TODAY,        kaufpreis: 17.99,  nutzungsdauerJahre: 3, notizen: 'Felgen reinigen · geplant' },
  { id: 'a10', name: 'Schaumaufsatz (Kärcher)',             kaufdatum: TODAY,        kaufpreis: 14.95,  nutzungsdauerJahre: 3, notizen: 'Schäumen · geplant' },
  { id: 'a11', name: 'Sprühflaschen (10 Stück)',            kaufdatum: TODAY,        kaufpreis: 22.90,  nutzungsdauerJahre: 3, notizen: 'Mischflaschen · geplant' },
  { id: 'a12', name: 'Wascheimer',                          kaufdatum: TODAY,        kaufpreis: 19.90,  nutzungsdauerJahre: 5, notizen: 'Schmutz trennen · geplant' },
  { id: 'a13', name: 'Waschhandschuh',                      kaufdatum: TODAY,        kaufpreis: 13.05,  nutzungsdauerJahre: 1, notizen: 'Außenwäsche · geplant' },
  { id: 'a14', name: 'Lenkradabdeckung',                    kaufdatum: TODAY,        kaufpreis: 14.30,  nutzungsdauerJahre: 2, notizen: 'Extra Feature · geplant' },
  { id: 'a15', name: 'Schutzmatte',                         kaufdatum: TODAY,        kaufpreis: 179.99, nutzungsdauerJahre: 5, notizen: 'Wasser auffangen · geplant' },
  { id: 'a16', name: 'Pavillon (3×6 m)',                    kaufdatum: TODAY,        kaufpreis: 109.95, nutzungsdauerJahre: 4, notizen: 'Sonnenschutz · geplant' },
];

// ── API-Calls ─────────────────────────────────────────────────────────────────
async function api<T>(method: string, body?: unknown): Promise<T> {
  const res = await fetch('/api/lager', {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API /api/lager ${method} → HTTP ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export async function fetchLager(): Promise<LagerData> {
  return api<LagerData>('GET');
}

export async function syncLager(data: LagerData): Promise<void> {
  await api<{ ok: boolean }>('PUT', data);
}
