/**
 * Einmaliges Prüf- + Seed-Skript für das Lager (Supabase).
 *   node scripts/seed-lager.mjs          → prüfen + seeden (nur wenn leer)
 *   node scripts/seed-lager.mjs --force  → bestehende Einträge überschreiben (upsert)
 *
 * Liest SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY aus .env.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── .env parsen ───────────────────────────────────────────────────────────────
const env = {};
for (const line of readFileSync(join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
}
const URL = env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) {
  console.error('❌ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen in .env');
  process.exit(1);
}
const force = process.argv.includes('--force');
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

const TODAY = new Date().toISOString().slice(0, 10);

// ── Default-Katalog (gespiegelt aus src/lib/lager.ts) ─────────────────────────
const VERBRAUCH = [
  ['v01','Koch Chemie Leather Star','ml',0,150,1000,0.018,'Koch Chemie','https://kc-onlineshop.de/Leather-Star-Leder-Tiefenpflege-1l','Lederpflege · 17,90 €/L'],
  ['v02','Koch Chemie Glass Cleaner','ml',0,60,1000,0.0099,'Koch Chemie','https://kc-onlineshop.de/Koch-Chemie-Glass-Cleaner-Glasreiniger-1L','Glasflächen · 9,90 €/L'],
  ['v03','Koch Chemie Green Star','ml',0,90,1000,0.0079,'Koch Chemie','https://kc-onlineshop.de/Green-Star','Universalreiniger Außen · 7,90 €/L'],
  ['v04','Geruchsneutralisator (Fresh Up)','ml',0,45,500,0.028,'Koch Chemie','https://kc-onlineshop.de/Colourlock-Fresh-Up-Geruchsneutralisator-Geruchskiller','Geruch neutralisieren · 13,90 €'],
  ['v05','Koch Chemie Mehrzweckreiniger','ml',0,270,1000,0.0149,'Koch Chemie','https://kc-onlineshop.de/Koch-Chemie-Allzweckreinger-Set-Mehrzweckreiniger-Zylinderflasche-Spruehkopfstar','Kunststoff Innenraum · 14,90 €/L'],
  ['v06','Koch Chemie Pol Star','ml',0,180,1000,0.0109,'Koch Chemie','https://kc-onlineshop.de/Pol-Star','Textilreiniger Sitze/Matten · 10,90 €/L'],
  ['v07','Koch Chemie Felgenreiniger','ml',0,150,1000,0.0209,'Koch Chemie','https://kc-onlineshop.de/Reactive-Wheel-Cleaner','Felgen säubern · 20,90 €/L'],
  ['v08','Koch Chemie Snow Foam','ml',0,90,1000,0.014,'Koch Chemie','https://kc-onlineshop.de/Gentle-Snow-Foam','Reinigungsschaum Außen · 13,99 €/L'],
  ['v09','Insektenreiniger','ml',0,90,1000,0.0129,'Koch Chemie','https://kc-onlineshop.de/Aussenreinigung-Set-Koch-Chemie-THE-FINISHER-InsectOff-Insektenentferner-Mikrofasertuch','Insektenentferner · 12,90 €/L'],
  ['v10','Koch Chemie Vorreiniger','ml',0,90,1000,0.0079,'Koch Chemie','https://kc-onlineshop.de/Koch-Chemie-Vorreiniger-B-1L','Vorwäsche · 7,90 €/L'],
  ['v11','Koch Chemie Lackversiegelung SO 02','ml',0,50,500,0.062,'Koch Chemie','https://kc-onlineshop.de/Spray-Sealant','Lackversiegelung Extra · 30,90 €/500 ml'],
  ['v12','Koch Chemie Textilversiegelung STO 1','ml',0,50,500,0.072,'Koch Chemie','https://kc-onlineshop.de/Koch-Chemie-Allround-Textile-Sealant-Textilversiegelung','Textilversiegelung Extra · 35,90 €/500 ml'],
  ['v13','Scheibenversiegelung','ml',0,30,200,0.075,'Amazon','','Wasserabweisung Extra · 14,99 €/200 ml'],
  ['v14','Reifenschaum','ml',0,100,500,0,'Koch Chemie','https://kc-onlineshop.de/Kcu-Reifenschaum','Reifenpflege'],
  ['v15','Mikrofasertücher','Stück',0,10,20,1.00,'Amazon','https://www.amazon.de/limpando-Allzwecktuch-Mikrofasertücher-Allzwecktücher-Reinigungstücher/dp/B0DK9M9DFW','20er Pack · 19,99 €'],
  ['v16','Carbon Tuch (für Glas)','Stück',0,2,5,4.40,'Amazon','https://www.amazon.de/CARBOTEC-Premium-Carbon-Microfaser-Glastücher/dp/B08CPDFJQN','Glasscheiben wischen · 21,99 €/5 Stück'],
  ['v17','Saugstarkes Trockentuch','Stück',0,2,5,3.00,'Amazon','https://www.amazon.de/ZENAKIO-Auto-Trockentuch-50x80-Mikrofasertücher/dp/B0G5WXTYPR','50×80 cm · 14,99 €/Pack'],
];

const ANLAGEN = [
  ['a01','Kärcher Nasssauger Spot','2026-05-01',112.99,5,'Sitze, Fußmatten saugen'],
  ['a02','Tornado Druckluftpistole','2026-05-01',24.90,5,'Schmutz aufwirbeln'],
  ['a03','Bürstenaufsatz (Akkuschrauber)','2026-05-01',18.90,2,'Tiefenschmutz aus Fußmatten'],
  ['a04','Scrubber Pad','2026-05-01',22.90,1,'Tiefenreinigung Kunststoff/Leder'],
  ['a05','Lederbürste','2026-05-01',9.99,3,'Sitze/Matten reinigen'],
  ['a06','Kärcher Hochdruckreiniger',TODAY,230.99,7,'Außenreinigung · geplant'],
  ['a07','Kärcher Nass-Trockensauger',TODAY,56.99,5,'Staubsauger · geplant'],
  ['a08','Dampfreiniger',TODAY,119.99,5,'Randverschmutzung · geplant'],
  ['a09','Felgenbürste',TODAY,17.99,3,'Felgen reinigen · geplant'],
  ['a10','Schaumaufsatz (Kärcher)',TODAY,14.95,3,'Schäumen · geplant'],
  ['a11','Sprühflaschen (10 Stück)',TODAY,22.90,3,'Mischflaschen · geplant'],
  ['a12','Wascheimer',TODAY,19.90,5,'Schmutz trennen · geplant'],
  ['a13','Waschhandschuh',TODAY,13.05,1,'Außenwäsche · geplant'],
  ['a14','Lenkradabdeckung',TODAY,14.30,2,'Extra Feature · geplant'],
  ['a15','Schutzmatte',TODAY,179.99,5,'Wasser auffangen · geplant'],
  ['a16','Pavillon (3×6 m)',TODAY,109.95,4,'Sonnenschutz · geplant'],
];

const verbrauchRows = VERBRAUCH.map((r, i) => ({
  schluessel: r[0], name: r[1], einheit: r[2], bestand: r[3], mindestbestand: r[4],
  nachbestellmenge: r[5], preis_brutto: r[6], lieferant: r[7], bestelllink: r[8],
  notiz: r[9], sortierung: i,
}));
const anlagenRows = ANLAGEN.map((r, i) => ({
  schluessel: r[0], name: r[1], anschaffung_datum: r[2], anschaffung_preis: r[3],
  nutzungsdauer_m: r[4] * 12, notiz: r[5], sortierung: i,
}));

// ── 1. Migration prüfen: neue Spalten lesbar? ─────────────────────────────────
console.log('① Prüfe Migration (Spalten lieferant + nachbestellmenge) …');
{
  const { error } = await supabase
    .from('lager_verbrauchsmittel')
    .select('schluessel, lieferant, nachbestellmenge')
    .limit(1);
  if (error) {
    console.error('❌ Spalten fehlen oder Fehler:', error.message);
    console.error('   → SQL-Migration (migration-lager-felder.sql) noch nicht gelaufen?');
    process.exit(1);
  }
  console.log('   ✓ Spalten vorhanden — Migration ist aktiv.');
}

// ── 2. Aktuellen Bestand prüfen ───────────────────────────────────────────────
const { count: vCount } = await supabase
  .from('lager_verbrauchsmittel').select('*', { count: 'exact', head: true });
const { count: aCount } = await supabase
  .from('lager_anlagen').select('*', { count: 'exact', head: true });
console.log(`② Aktuell in DB: ${vCount ?? 0} Verbrauchsmittel, ${aCount ?? 0} Anlagegüter.`);

if ((vCount || aCount) && !force) {
  console.log('   ⚠ Tabellen sind nicht leer — Seeding übersprungen (--force zum Überschreiben).');
  process.exit(0);
}

// ── 3. Seeden ─────────────────────────────────────────────────────────────────
console.log('③ Seede Default-Katalog …');
{
  const { error: e1 } = await supabase
    .from('lager_verbrauchsmittel').upsert(verbrauchRows, { onConflict: 'schluessel' });
  if (e1) { console.error('❌ Verbrauch-Upsert:', e1.message); process.exit(1); }
  const { error: e2 } = await supabase
    .from('lager_anlagen').upsert(anlagenRows, { onConflict: 'schluessel' });
  if (e2) { console.error('❌ Anlagen-Upsert:', e2.message); process.exit(1); }
}

// ── 4. Gegenprüfung ───────────────────────────────────────────────────────────
const { data: vCheck } = await supabase
  .from('lager_verbrauchsmittel').select('schluessel, name, lieferant, nachbestellmenge')
  .order('sortierung').limit(3);
const { count: vFinal } = await supabase
  .from('lager_verbrauchsmittel').select('*', { count: 'exact', head: true });
const { count: aFinal } = await supabase
  .from('lager_anlagen').select('*', { count: 'exact', head: true });

console.log(`④ Gegenprüfung: ${vFinal} Verbrauchsmittel, ${aFinal} Anlagegüter in der DB.`);
console.log('   Beispiel-Einträge (mit neuen Spalten):');
for (const r of vCheck ?? []) {
  console.log(`     • ${r.name} — Lieferant: "${r.lieferant}", Nachbestellmenge: ${r.nachbestellmenge}`);
}
console.log('\n✅ Fertig. Lager läuft jetzt auf Supabase.');
