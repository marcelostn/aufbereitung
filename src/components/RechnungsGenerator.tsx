import { useState, useEffect } from 'react';
import {
  addStempel,
  findeStempel,
  markiereEinloesung,
  normalisiereTelefon,
  offeneBelohnungen,
  bisNaechsteBelohnung,
  BELOHNUNG_INTERVALL,
  type KundenStempel,
} from '../lib/treue';
import { BELOHNUNGEN } from '../data/treue-belohnungen';

const EUR = (n: number) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €';

const TODAY = () => new Date().toISOString().slice(0, 10);

const FMT = (iso: string) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const STORAGE_KEY = 'rechnung_zaehler';
const ARCHIV_KEY = 'rechnungen_archiv_v1';

function nextNummer(): string {
  const jahr = new Date().getFullYear();
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const o = JSON.parse(s);
      if (o.jahr === jahr) return `RE-${jahr}-${String(o.nr + 1).padStart(3, '0')}`;
    }
  } catch {}
  return `RE-${jahr}-001`;
}

function saveNummer(nr: string) {
  const m = nr.match(/RE-(\d{4})-(\d+)/);
  if (m) localStorage.setItem(STORAGE_KEY, JSON.stringify({ jahr: parseInt(m[1]), nr: parseInt(m[2]) }));
}

interface Pos {
  beschreibung: string;
  brutto: string;
}

interface ArchivEintrag {
  rNr: string;
  rDatum: string;
  lDatum: string;
  kName: string;
  kAdresse: string;
  kEmail: string;
  kTelefon?: string;
  fahrzeug: string;
  positionen: Pos[];
  zahlung: 'bar' | 'karte' | 'ueberweisung';
  zahlungsziel: string;
  notiz: string;
  gespeichertAm: string;
  brutto: number;
}

function loadArchiv(): ArchivEintrag[] {
  try {
    const s = localStorage.getItem(ARCHIV_KEY);
    if (s) return JSON.parse(s) as ArchivEintrag[];
  } catch {}
  return [];
}

function saveArchiv(arr: ArchivEintrag[]) {
  try { localStorage.setItem(ARCHIV_KEY, JSON.stringify(arr)); } catch {}
}

function upsertArchiv(eintrag: ArchivEintrag) {
  const arr = loadArchiv();
  const idx = arr.findIndex((e) => e.rNr === eintrag.rNr);
  if (idx >= 0) arr[idx] = eintrag;
  else arr.unshift(eintrag);
  saveArchiv(arr);
}

export interface Preset {
  label: string;
  preis: number;
  /** Detaillierte Leistungsbeschreibung, die in die Rechnung übernommen wird (§14 UStG). */
  beschreibung?: string;
  /** Wenn gesetzt: Prozentwert (z.B. 0.15 = +15 %, -0.10 = -10 %). */
  prozent?: number;
  /** true → Prozent gilt auf die Summe aller anderen Positionen (für Rabatte auf alles).
   *  false/undefined → Prozent gilt auf das Paket (erste Position mit positivem Preis). */
  vonGesamt?: boolean;
}

export interface FirmaInfo {
  name: string;
  inhaber: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  email: string;
  ustIdNr: string;
  steuernummer: string;
  iban: string;
  bank: string;
}

interface Props {
  firma: FirmaInfo;
  presets: Preset[];
}

const INPUT =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none placeholder-zinc-600';
const LABEL = 'block text-xs text-zinc-400 mb-1';
const SECTION = 'bg-zinc-900 border border-zinc-800 rounded-xl p-5';
const SECTION_TITLE = 'text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4';

export default function RechnungsGenerator({ firma, presets }: Props) {
  const [view, setView] = useState<'list' | 'form' | 'invoice'>('form');
  const [rNr, setRNr] = useState('');
  const [rDatum, setRDatum] = useState(TODAY());
  const [lDatum, setLDatum] = useState(TODAY());
  const [kName, setKName] = useState('');
  const [kAdresse, setKAdresse] = useState('');
  const [kEmail, setKEmail] = useState('');
  const [kTelefon, setKTelefon] = useState('');
  const [fahrzeug, setFahrzeug] = useState('');
  const [treueKunde, setTreueKunde] = useState<KundenStempel | null>(null);
  const [belohnungEingesetzt, setBelohnungEingesetzt] = useState<string | null>(null); // produkt-name
  const [waehleBelohnung, setWaehleBelohnung] = useState(false);
  const [positionen, setPositionen] = useState<Pos[]>([{ beschreibung: '', brutto: '' }]);
  const [zahlung, setZahlung] = useState<'bar' | 'karte' | 'ueberweisung'>('bar');
  const [zahlungsziel, setZahlungsziel] = useState('14');
  const [notiz, setNotiz] = useState('');
  const [archiv, setArchiv] = useState<ArchivEintrag[]>([]);
  const [archivSuche, setArchivSuche] = useState('');

  const [prefillBanner, setPrefillBanner] = useState(false);

  useEffect(() => {
    setRNr(nextNummer());
    const a = loadArchiv();
    setArchiv(a);

    // URL-Parameter aus Terminanfrage auslesen und Felder vorbefüllen
    const params = new URLSearchParams(window.location.search);
    if (params.has('vorname') || params.has('nachname') || params.has('paket')) {
      const vorname = params.get('vorname') ?? '';
      const nachname = params.get('nachname') ?? '';
      const strasse = params.get('strasse') ?? '';
      const plz = params.get('plz') ?? '';
      const ort = params.get('ort') ?? '';
      const paket = params.get('paket') ?? '';
      const preis = params.get('preis') ?? '';

      setKName(`${vorname} ${nachname}`.trim());
      setKAdresse([strasse, `${plz} ${ort}`.trim()].filter(Boolean).join('\n'));
      setKEmail(params.get('kEmail') ?? '');
      setKTelefon(params.get('kTelefon') ?? '');
      setFahrzeug(params.get('fahrzeug') ?? '');
      if (paket) {
        const brutto = preis ? parseFloat(preis).toFixed(2).replace('.', ',') : '';
        setPositionen([{ beschreibung: paket, brutto }]);
      }
      setView('form');
      setPrefillBanner(true);
      // URL aufräumen, damit beim Reload nicht erneut prefilled wird
      window.history.replaceState({}, '', window.location.pathname);
      return;
    }

    if (a.length > 0) setView('list');
  }, []);

  function resetForm() {
    setRNr(nextNummer());
    setRDatum(TODAY());
    setLDatum(TODAY());
    setKName('');
    setKAdresse('');
    setKEmail('');
    setKTelefon('');
    setFahrzeug('');
    setTreueKunde(null);
    setBelohnungEingesetzt(null);
    setWaehleBelohnung(false);
    setPositionen([{ beschreibung: '', brutto: '' }]);
    setZahlung('bar');
    setZahlungsziel('14');
    setNotiz('');
  }

  function ladeRechnung(e: ArchivEintrag) {
    setRNr(e.rNr);
    setRDatum(e.rDatum);
    setLDatum(e.lDatum);
    setKName(e.kName);
    setKAdresse(e.kAdresse);
    setKEmail(e.kEmail);
    setKTelefon(e.kTelefon ?? '');
    setFahrzeug(e.fahrzeug);
    setPositionen(e.positionen);
    setZahlung(e.zahlung);
    setZahlungsziel(e.zahlungsziel);
    setNotiz(e.notiz);
    setView('invoice');
    window.scrollTo(0, 0);
  }

  // Treuekunde-Status nachladen, sobald Telefonnummer eingegeben wird
  useEffect(() => {
    if (kTelefon && normalisiereTelefon(kTelefon).length >= 4) {
      setTreueKunde(findeStempel(kTelefon));
    } else {
      setTreueKunde(null);
    }
  }, [kTelefon]);

  function loescheRechnung(rNrZuLoeschen: string) {
    if (!confirm(`Rechnung ${rNrZuLoeschen} wirklich aus dem Archiv löschen?`)) return;
    const neu = archiv.filter((e) => e.rNr !== rNrZuLoeschen);
    saveArchiv(neu);
    setArchiv(neu);
  }

  const parseB = (s: string) => parseFloat(s.replace(',', '.')) || 0;

  const bruttoGes = positionen.reduce((s, p) => s + parseB(p.brutto), 0);
  const nettoGes = bruttoGes / 1.19;
  const ustGes = bruttoGes - nettoGes;

  const faelligDatum = () => {
    if (!rDatum || zahlung !== 'ueberweisung') return '';
    const d = new Date(rDatum);
    d.setDate(d.getDate() + parseInt(zahlungsziel || '14'));
    return FMT(d.toISOString().slice(0, 10));
  };

  function updatePos(i: number, field: keyof Pos, val: string) {
    setPositionen(p => {
      const n = [...p];
      n[i] = { ...n[i], [field]: val };
      return n;
    });
  }

  function onPreset(i: number, val: string) {
    const p = presets.find(p => p.label === val);
    if (!p) return;
    updatePos(i, 'beschreibung', p.beschreibung ?? p.label);

    if (p.prozent) {
      let basisBetrag = 0;
      if (p.vonGesamt) {
        // Rabatt auf alles: Summe ALLER anderen positiven Positionen
        basisBetrag = positionen.reduce(
          (s, pos, idx) => (idx !== i ? s + Math.max(0, parseB(pos.brutto)) : s),
          0
        );
      } else {
        // Aufpreis auf Paket: erste andere Position mit positivem Preis
        basisBetrag = positionen
          .map((pos, idx) => (idx !== i ? parseB(pos.brutto) : 0))
          .find((b) => b > 0) ?? 0;
      }
      const betrag = basisBetrag * p.prozent;
      updatePos(i, 'brutto', betrag !== 0 ? betrag.toFixed(2).replace('.', ',') : '');
    } else {
      updatePos(i, 'brutto', p.preis > 0 ? p.preis.toFixed(2).replace('.', ',') : '');
    }
  }

  function addPos() {
    if (positionen.length < 8) setPositionen(p => [...p, { beschreibung: '', brutto: '' }]);
  }

  function removePos(i: number) {
    if (positionen.length > 1) setPositionen(p => p.filter((_, idx) => idx !== i));
  }

  function erstellen(e: React.FormEvent) {
    e.preventDefault();
    saveNummer(rNr);
    const eintrag: ArchivEintrag = {
      rNr, rDatum, lDatum, kName, kAdresse, kEmail, kTelefon, fahrzeug,
      positionen, zahlung, zahlungsziel, notiz,
      gespeichertAm: new Date().toISOString(),
      brutto: bruttoGes,
    };
    upsertArchiv(eintrag);
    // Treue-Stempel: +1 wenn Telefon gepflegt ist
    if (kTelefon) {
      addStempel(kTelefon, kName, rDatum);
      if (belohnungEingesetzt) {
        markiereEinloesung(kTelefon, { datum: rDatum, produkt: belohnungEingesetzt, rechnungsNr: rNr });
      }
    }
    setArchiv(loadArchiv());
    setView('invoice');
    window.scrollTo(0, 0);
  }

  function belohnungEinsetzen(belohnung: { id: string; name: string }) {
    // Erst leere Position belegen, sonst neue hinzufügen
    const leereIdx = positionen.findIndex((p) => !p.beschreibung.trim() && !p.brutto.trim());
    const beschreibung = `Treue-Belohnung (5. Aufbereitung): ${belohnung.name} – kostenfrei`;
    if (leereIdx >= 0) {
      updatePos(leereIdx, 'beschreibung', beschreibung);
      updatePos(leereIdx, 'brutto', '0,00');
    } else if (positionen.length < 8) {
      setPositionen((p) => [...p, { beschreibung, brutto: '0,00' }]);
    }
    setBelohnungEingesetzt(belohnung.name);
    setWaehleBelohnung(false);
  }

  const hatIban = firma.iban && firma.iban.length > 5;
  const hatSteuer = firma.steuernummer || (firma.ustIdNr && !firma.ustIdNr.includes('XX'));

  // ── Pflichtangaben §14 UStG: prüfen welche Firmendaten fehlen ──────────────
  const isPlaceholder = (s: string, marker = 'X') => !s || s.toUpperCase().includes(marker);
  const fehlendeFirmenDaten: string[] = [];
  if (!firma.inhaber || firma.inhaber.toLowerCase() === 'inhaber') fehlendeFirmenDaten.push('Vor- und Nachname des Inhabers');
  if (!firma.strasse) fehlendeFirmenDaten.push('Straße + Hausnummer');
  if (isPlaceholder(firma.telefon)) fehlendeFirmenDaten.push('Telefonnummer');
  if (!firma.email || firma.email.includes('autoaufbereitung-cloppenburg')) fehlendeFirmenDaten.push('Echte E-Mail-Adresse');
  if (!firma.steuernummer && isPlaceholder(firma.ustIdNr)) fehlendeFirmenDaten.push('Steuernummer ODER USt-IdNr.');

  // Kleinbetragsrechnung (§33 UStDV) bis 250 € brutto: Kundenadresse nicht zwingend
  const istKleinbetrag = bruttoGes > 0 && bruttoGes <= 250;
  const kundenAdresseFehltKritisch = !istKleinbetrag && bruttoGes > 0 && !kAdresse.trim();

  // Archiv-Statistik
  const jetzt = new Date();
  const dieserMonat = `${jetzt.getFullYear()}-${String(jetzt.getMonth() + 1).padStart(2, '0')}`;
  const umsatzDieserMonat = archiv
    .filter((e) => e.rDatum.startsWith(dieserMonat))
    .reduce((s, e) => s + e.brutto, 0);
  const umsatzGesamt = archiv.reduce((s, e) => s + e.brutto, 0);

  const archivGefiltert = archivSuche
    ? archiv.filter((e) =>
        (e.rNr + e.kName + e.fahrzeug + e.kAdresse).toLowerCase().includes(archivSuche.toLowerCase())
      )
    : archiv;

  // ── LIST VIEW (Archiv) ────────────────────────────────────────────────────
  if (view === 'list') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">Rechnungs-Archiv</h1>
          <button
            onClick={() => { resetForm(); setView('form'); }}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Neue Rechnung
          </button>
        </div>

        {/* Statistik */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className={SECTION}>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Diesen Monat</div>
            <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{EUR(umsatzDieserMonat)}</div>
            <div className="text-xs text-zinc-600 mt-1">
              {archiv.filter((e) => e.rDatum.startsWith(dieserMonat)).length} Rechnungen
            </div>
          </div>
          <div className={SECTION}>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Gesamt</div>
            <div className="text-2xl font-bold text-zinc-100 mt-1 tabular-nums">{EUR(umsatzGesamt)}</div>
            <div className="text-xs text-zinc-600 mt-1">{archiv.length} Rechnungen</div>
          </div>
          <div className={SECTION}>
            <div className="text-xs text-zinc-500 uppercase tracking-wider">Letzte Rechnung</div>
            <div className="text-lg font-bold text-zinc-100 mt-1">{archiv[0]?.rNr || '—'}</div>
            <div className="text-xs text-zinc-600 mt-1">
              {archiv[0] ? FMT(archiv[0].rDatum) : 'noch keine'}
            </div>
          </div>
        </div>

        {/* Suche */}
        {archiv.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              value={archivSuche}
              onChange={(e) => setArchivSuche(e.target.value)}
              placeholder="Suchen nach Nr., Name, Kennzeichen…"
              className={INPUT}
            />
          </div>
        )}

        {/* Liste */}
        {archiv.length === 0 ? (
          <div className={`${SECTION} text-center py-12`}>
            <p className="text-zinc-400">Noch keine Rechnungen archiviert.</p>
            <button
              onClick={() => { resetForm(); setView('form'); }}
              className="mt-4 text-amber-500 hover:text-amber-400 font-semibold text-sm"
            >
              Erste Rechnung erstellen →
            </button>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Nr.</th>
                  <th className="text-left px-4 py-3 font-semibold">Datum</th>
                  <th className="text-left px-4 py-3 font-semibold">Kunde</th>
                  <th className="text-right px-4 py-3 font-semibold">Betrag</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {archivGefiltert.map((e) => (
                  <tr key={e.rNr} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-zinc-300 text-xs">{e.rNr}</td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">{FMT(e.rDatum)}</td>
                    <td className="px-4 py-3 text-zinc-200">
                      <div className="font-semibold">{e.kName}</div>
                      {e.fahrzeug && <div className="text-xs text-zinc-500">{e.fahrzeug}</div>}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-400 tabular-nums">{EUR(e.brutto)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => ladeRechnung(e)}
                        className="text-zinc-400 hover:text-amber-400 text-xs px-2 py-1 transition-colors"
                        title="Anzeigen / Drucken"
                      >
                        Öffnen
                      </button>
                      <button
                        onClick={() => loescheRechnung(e.rNr)}
                        className="text-zinc-500 hover:text-red-400 text-xs px-2 py-1 transition-colors ml-1"
                        title="Löschen"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
                {archivGefiltert.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-zinc-500 py-6 text-sm">
                      Keine Treffer für „{archivSuche}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── FORM VIEW ─────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-zinc-100">Neue Rechnung erstellen</h1>
          <button
            onClick={() => setView('list')}
            className="text-sm text-zinc-400 hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h10" /></svg>
            Archiv ({archiv.length})
          </button>
        </div>

        {/* ── Prefill-Banner: Daten kamen aus einer Terminanfrage ─────────── */}
        {prefillBanner && (
          <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 mb-5 flex items-start gap-3">
            <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <div className="flex-1">
              <p className="text-green-200 font-bold text-sm">Daten aus Terminanfrage übernommen</p>
              <p className="text-green-300/80 text-xs mt-1">
                Kundendaten, Leistung und Preis wurden automatisch aus der Anfrage-E-Mail eingefügt. Bitte vor dem Erstellen kurz kontrollieren.
              </p>
            </div>
            <button
              onClick={() => setPrefillBanner(false)}
              className="text-green-400/60 hover:text-green-300 text-lg leading-none"
              aria-label="Schließen"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── Validierungs-Panel: Fehlende Firmendaten (§14 UStG) ─────────── */}
        {fehlendeFirmenDaten.length > 0 && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-5">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-200 font-bold text-sm">Fehlende Pflichtangaben (§14 UStG)</p>
                <p className="text-red-300/80 text-xs mt-1 mb-2">Folgende Firmendaten müssen vor Rechnungsversand in den Stammdaten ergänzt werden:</p>
                <ul className="text-red-300/90 text-xs space-y-0.5 list-disc ml-4">
                  {fehlendeFirmenDaten.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <a href="/keystatic" className="inline-block mt-3 text-xs font-bold text-red-300 hover:text-red-200 underline underline-offset-2">
                  Jetzt in Inhalte & Preise → Firmendaten ergänzen →
                </a>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={erstellen} className="space-y-5">
          {/* Rechnungsdaten */}
          <div className={SECTION}>
            <div className={SECTION_TITLE}>Rechnungsdaten</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className={LABEL}>Rechnungsnummer</label>
                <input
                  value={rNr}
                  onChange={e => setRNr(e.target.value)}
                  required
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Rechnungsdatum</label>
                <input
                  type="date"
                  value={rDatum}
                  onChange={e => setRDatum(e.target.value)}
                  required
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Leistungsdatum</label>
                <input
                  type="date"
                  value={lDatum}
                  onChange={e => setLDatum(e.target.value)}
                  required
                  className={INPUT}
                />
              </div>
            </div>
          </div>

          {/* Kundendaten */}
          <div className={SECTION}>
            <div className={SECTION_TITLE}>Kundendaten</div>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Name *</label>
                <input
                  value={kName}
                  onChange={e => setKName(e.target.value)}
                  required
                  placeholder="Max Mustermann"
                  className={INPUT}
                />
              </div>
              <div>
                <label className={LABEL}>Anschrift (Straße, PLZ, Ort)</label>
                <textarea
                  value={kAdresse}
                  onChange={e => setKAdresse(e.target.value)}
                  rows={2}
                  placeholder={'Musterstraße 1\n49661 Cloppenburg'}
                  className={`${INPUT} resize-none`}
                />
                <p className="text-xs text-zinc-600 mt-1">
                  Bei Rechnungsbeträgen ab 250&nbsp;€ <strong className="text-zinc-400">Pflicht</strong> (§14 UStG). Bei Privatkunden unter 250&nbsp;€ optional.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={LABEL}>Telefon <span className="text-amber-500/80">(für Treue)</span></label>
                  <input
                    type="tel"
                    value={kTelefon}
                    onChange={e => setKTelefon(e.target.value)}
                    placeholder="0160 1234567"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>E-Mail (optional)</label>
                  <input
                    type="email"
                    value={kEmail}
                    onChange={e => setKEmail(e.target.value)}
                    placeholder="kunde@mail.de"
                    className={INPUT}
                  />
                </div>
                <div>
                  <label className={LABEL}>Fahrzeug (optional)</label>
                  <input
                    value={fahrzeug}
                    onChange={e => setFahrzeug(e.target.value)}
                    placeholder="VW Golf, CLP-XX 123"
                    className={INPUT}
                  />
                </div>
              </div>

              {/* Treue-Status-Banner */}
              {kTelefon && normalisiereTelefon(kTelefon).length >= 4 && (() => {
                const istNeukunde = !treueKunde;
                const offen = offeneBelohnungen(treueKunde);
                const zaehler = treueKunde?.anzahlAuftraege ?? 0;
                const bisNaechste = bisNaechsteBelohnung(treueKunde);

                if (offen > 0) {
                  return (
                    <div className="mt-3 bg-amber-500/15 border border-amber-500/50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">🎁</span>
                        <div className="flex-1">
                          <p className="font-bold text-amber-200 text-sm">
                            Treuekunde! Belohnung verdient — bereits {zaehler} {zaehler === 1 ? 'Auftrag' : 'Aufträge'}
                          </p>
                          <p className="text-amber-300/80 text-xs mt-0.5">
                            Wähle ein kleines Pflegeprodukt als Goodie für den Kunden:
                          </p>
                          {belohnungEingesetzt ? (
                            <div className="mt-2 inline-flex items-center gap-2 text-xs text-green-300 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-1.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                              </svg>
                              Belohnung eingesetzt: {belohnungEingesetzt}
                              <button
                                type="button"
                                onClick={() => { setBelohnungEingesetzt(null); }}
                                className="ml-2 text-green-400/60 hover:text-green-300 text-base leading-none"
                                title="Belohnung doch nicht einlösen"
                              >
                                ✕
                              </button>
                            </div>
                          ) : !waehleBelohnung ? (
                            <button
                              type="button"
                              onClick={() => setWaehleBelohnung(true)}
                              className="mt-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Belohnung jetzt einlösen
                            </button>
                          ) : (
                            <div className="mt-3 space-y-1.5">
                              {BELOHNUNGEN.map((b) => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => belohnungEinsetzen(b)}
                                  className="w-full text-left bg-zinc-800/80 hover:bg-amber-500/15 border border-zinc-700 hover:border-amber-500/50 rounded-lg px-3 py-2 transition-colors"
                                >
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="font-semibold text-zinc-200 text-sm">{b.name}</p>
                                      <p className="text-xs text-zinc-500 truncate">{b.hinweis}</p>
                                    </div>
                                    <span className="text-xs text-zinc-600 shrink-0">~{b.wert} €</span>
                                  </div>
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => setWaehleBelohnung(false)}
                                className="text-xs text-zinc-500 hover:text-zinc-300 mt-1"
                              >
                                Abbrechen
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (istNeukunde) {
                  return (
                    <div className="mt-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs text-zinc-400 flex items-center gap-2">
                      <span className="text-base">✨</span>
                      <span>Neukunde — wird mit dieser Rechnung in der Treuekarte angelegt. Belohnung nach {BELOHNUNG_INTERVALL} Aufträgen.</span>
                    </div>
                  );
                }

                return (
                  <div className="mt-3 bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-2.5 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <span className="text-base">🪙</span>
                      <span>Stammkunde: <strong className="text-zinc-100">{zaehler}</strong> {zaehler === 1 ? 'Auftrag' : 'Aufträge'} bisher</span>
                    </div>
                    <span className="text-amber-400/80 font-semibold">
                      Noch {bisNaechste} bis zur Belohnung
                    </span>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Leistungen */}
          <div className={SECTION}>
            <div className={SECTION_TITLE}>Leistungen</div>
            <div className="space-y-3">
              {positionen.map((pos, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <select
                      defaultValue=""
                      onChange={e => { onPreset(i, e.target.value); e.target.value = ''; }}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-400 text-xs focus:border-amber-500 focus:outline-none"
                    >
                      <option value="">↓ Aus Preisliste wählen…</option>
                      {presets.map(p => (
                        <option key={p.label} value={p.label}>
                          {p.label}{p.preis > 0 ? ` – ${EUR(p.preis)}` : ''}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={pos.beschreibung}
                      onChange={e => updatePos(i, 'beschreibung', e.target.value)}
                      required
                      rows={2}
                      placeholder="Detaillierte Leistungsbeschreibung – Pflicht nach §14 UStG"
                      className={`${INPUT} resize-y`}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <div className="text-xs text-zinc-500 mb-1 text-right">Brutto €</div>
                    <input
                      value={pos.brutto}
                      onChange={e => updatePos(i, 'brutto', e.target.value)}
                      required
                      placeholder="0,00"
                      className="w-24 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm text-right focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                  {positionen.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePos(i)}
                      className="mt-7 p-1.5 text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {positionen.length < 8 && (
              <button
                type="button"
                onClick={addPos}
                className="mt-3 text-sm text-amber-500 hover:text-amber-400 flex items-center gap-1 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Position hinzufügen
              </button>
            )}

            {bruttoGes > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-700 text-right space-y-1">
                <div className="text-xs text-zinc-500">Netto: {EUR(nettoGes)}</div>
                <div className="text-xs text-zinc-500">USt 19&nbsp;%: {EUR(ustGes)}</div>
                <div className="text-base font-bold text-zinc-100">Gesamt: {EUR(bruttoGes)}</div>
              </div>
            )}
          </div>

          {/* Zahlung */}
          <div className={SECTION}>
            <div className={SECTION_TITLE}>Zahlung</div>
            <div className="flex gap-3 flex-wrap">
              {(['bar', 'karte', 'ueberweisung'] as const).map(z => (
                <label
                  key={z}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors text-sm ${
                    zahlung === z
                      ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                      : 'border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="zahlung"
                    value={z}
                    checked={zahlung === z}
                    onChange={() => setZahlung(z)}
                    className="sr-only"
                  />
                  {z === 'bar' ? 'Barzahlung' : z === 'karte' ? 'EC-Karte / SumUp' : 'Überweisung'}
                </label>
              ))}
            </div>
            {zahlung === 'ueberweisung' && (
              <div className="mt-3 flex items-center gap-3">
                <label className="text-xs text-zinc-400">Zahlungsziel</label>
                <select
                  value={zahlungsziel}
                  onChange={e => setZahlungsziel(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none"
                >
                  <option value="7">7 Tage</option>
                  <option value="14">14 Tage</option>
                  <option value="30">30 Tage</option>
                </select>
                {!hatIban && (
                  <span className="text-xs text-amber-500/80">
                    ⚠ IBAN noch nicht in firma.json eingetragen
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Notiz */}
          <div className={SECTION}>
            <div className={SECTION_TITLE}>Notiz (optional)</div>
            <textarea
              value={notiz}
              onChange={e => setNotiz(e.target.value)}
              rows={2}
              placeholder="Besondere Vereinbarungen, Hinweise…"
              className={`${INPUT} resize-none`}
            />
          </div>

          {/* Adresse-Warnung bei Beträgen ab 250 € */}
          {kundenAdresseFehltKritisch && (
            <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div className="flex-1">
                <p className="text-amber-200 font-bold text-sm">Kunden-Anschrift fehlt</p>
                <p className="text-amber-300/80 text-xs mt-1">
                  Bei Rechnungsbeträgen ab 250&nbsp;€ ist die <strong>vollständige Anschrift</strong> (Straße + Hausnummer, PLZ + Ort) Pflicht (§14 UStG). Bitte oben im Feld „Anschrift" ergänzen.
                </p>
              </div>
            </div>
          )}

          {/* Kleinbetragsrechnung-Hinweis (≤ 250 €) */}
          {istKleinbetrag && !kAdresse.trim() && (
            <div className="bg-zinc-800/60 border border-zinc-700 rounded-xl p-3 text-xs text-zinc-400 flex items-start gap-2">
              <svg className="w-4 h-4 shrink-0 mt-0.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <span>
                <strong className="text-zinc-300">Kleinbetragsrechnung</strong> (§33 UStDV) – bis 250&nbsp;€ ist die Kundenadresse nicht zwingend, wenn deine Firmendaten vollständig sind.
              </span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-3 rounded-xl transition-colors text-base"
          >
            Rechnung erstellen →
          </button>
        </form>
      </div>
    );
  }

  // ── INVOICE VIEW ───────────────────────────────────────────────────────────
  return (
    <div>
      {/* Action bar – hidden when printing */}
      <div className="no-print flex gap-3 mb-6 flex-wrap">
        <button
          onClick={() => setView('list')}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          ← Zum Archiv
        </button>
        <button
          onClick={() => setView('form')}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg text-sm hover:bg-zinc-700 transition-colors"
        >
          Bearbeiten
        </button>
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-amber-500 text-zinc-950 font-bold rounded-lg text-sm hover:bg-amber-400 transition-colors"
        >
          Drucken / Als PDF speichern
        </button>
        <div className="text-xs text-zinc-500 self-center ml-auto flex items-center gap-1.5">
          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
          Im Archiv gespeichert
        </div>
      </div>

      {/* Invoice document */}
      <div
        id="rechnung-dokument"
        style={{
          background: '#fff',
          color: '#18181b',
          padding: '3rem 3.5rem',
          maxWidth: '740px',
          margin: '0 auto',
          borderRadius: '0.75rem',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#09090b' }}>{firma.name}</div>
            <div style={{ color: '#52525b', marginTop: '0.375rem', lineHeight: '1.7' }}>
              {firma.inhaber && <div>{firma.inhaber}</div>}
              {firma.strasse && <div>{firma.strasse}</div>}
              <div>{firma.plz} {firma.ort}</div>
              {firma.telefon && !firma.telefon.includes('XXX') && <div>Tel: {firma.telefon}</div>}
              {firma.email && !firma.email.includes('autoaufbereitung-cloppenburg') && (
                <div>{firma.email}</div>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.04em', color: '#09090b' }}>
              RECHNUNG
            </div>
            <div style={{ color: '#71717a', marginTop: '0.5rem', lineHeight: '1.8' }}>
              <div>
                <span style={{ color: '#52525b' }}>Nr.:</span>{' '}
                <strong style={{ color: '#09090b' }}>{rNr}</strong>
              </div>
              <div>Datum: {FMT(rDatum)}</div>
              <div>Leistungsdatum: {FMT(lDatum)}</div>
            </div>
          </div>
        </div>

        {/* Tax line */}
        {hatSteuer && (
          <div style={{ color: '#71717a', fontSize: '0.8rem', marginBottom: '2rem' }}>
            {firma.steuernummer && <span>Steuernr.: {firma.steuernummer}</span>}
            {firma.steuernummer && firma.ustIdNr && !firma.ustIdNr.includes('XX') && (
              <span style={{ marginLeft: '1.5rem' }}>USt-IdNr.: {firma.ustIdNr}</span>
            )}
            {!firma.steuernummer && firma.ustIdNr && !firma.ustIdNr.includes('XX') && (
              <span>USt-IdNr.: {firma.ustIdNr}</span>
            )}
          </div>
        )}

        {/* Recipient */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>
            Rechnungsempfänger
          </div>
          <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{kName}</div>
          {kAdresse && (
            <div style={{ color: '#52525b', whiteSpace: 'pre-line' }}>{kAdresse}</div>
          )}
          {kEmail && <div style={{ color: '#71717a', fontSize: '0.8rem' }}>{kEmail}</div>}
          {fahrzeug && (
            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#71717a' }}>Fahrzeug: </span>
              <span style={{ fontWeight: 500 }}>{fahrzeug}</span>
            </div>
          )}
        </div>

        {/* Line items */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #e4e4e7' }}>
              <th style={{ textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.5rem', width: '2rem' }}>
                Pos.
              </th>
              <th style={{ textAlign: 'left', fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.5rem' }}>
                Beschreibung
              </th>
              <th style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.5rem', width: '6rem' }}>
                Netto
              </th>
              <th style={{ textAlign: 'right', fontSize: '0.7rem', fontWeight: 700, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.06em', paddingBottom: '0.5rem', width: '6rem' }}>
                Brutto
              </th>
            </tr>
          </thead>
          <tbody>
            {positionen.map((pos, i) => {
              const b = parseB(pos.brutto);
              const n = b / 1.19;
              const isRabatt = b < 0;
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f4f4f5' }}>
                  <td style={{ padding: '0.6rem 0', color: '#a1a1aa', fontSize: '0.8rem', verticalAlign: 'top' }}>{i + 1}</td>
                  <td style={{ padding: '0.6rem 0.5rem', whiteSpace: 'pre-line', verticalAlign: 'top' }}>{pos.beschreibung}</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', color: isRabatt ? '#16a34a' : '#71717a', verticalAlign: 'top' }}>{EUR(n)}</td>
                  <td style={{ padding: '0.6rem 0', textAlign: 'right', fontWeight: 500, color: isRabatt ? '#16a34a' : '#18181b', verticalAlign: 'top' }}>{EUR(b)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals – mit Zwischensumme + Rabatt-Block bei vorhandenen Rabatten */}
        {(() => {
          const positiveBrutto = positionen.reduce((s, p) => s + Math.max(0, parseB(p.brutto)), 0);
          const rabattBrutto   = positionen.reduce((s, p) => s + Math.min(0, parseB(p.brutto)), 0);
          const hatRabatt = rabattBrutto < 0;
          return (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
              <div style={{ width: '18rem' }}>
                {hatRabatt && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#52525b' }}>
                      <span>Zwischensumme (brutto)</span>
                      <span>{EUR(positiveBrutto)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#16a34a', fontWeight: 500 }}>
                      <span>Rabatt</span>
                      <span>{EUR(rabattBrutto)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #e4e4e7', margin: '0.4rem 0' }} />
                  </>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#52525b' }}>
                  <span>Nettobetrag</span>
                  <span>{EUR(nettoGes)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', color: '#52525b' }}>
                  <span>zzgl. 19&nbsp;% USt</span>
                  <span>{EUR(ustGes)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderTop: '2px solid #3f3f46', marginTop: '0.25rem', fontWeight: 700, fontSize: '1rem' }}>
                  <span>Gesamtbetrag (brutto)</span>
                  <span>{EUR(bruttoGes)}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Payment */}
        <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '1.5rem', color: '#52525b', fontSize: '0.85rem' }}>
          <div style={{ fontWeight: 600, color: '#18181b', marginBottom: '0.4rem' }}>Zahlungsinformationen</div>
          {zahlung === 'bar' && (
            <div>Zahlungsart: Barzahlung — Betrag wurde direkt beglichen.</div>
          )}
          {zahlung === 'karte' && (
            <div>Zahlungsart: EC-Karte / SumUp — Betrag wurde gebucht.</div>
          )}
          {zahlung === 'ueberweisung' && (
            <div style={{ lineHeight: '1.8' }}>
              <div>Zahlungsart: Überweisung</div>
              <div>
                Bitte überweisen Sie den Betrag bis{' '}
                <strong style={{ color: '#18181b' }}>{faelligDatum()}</strong>.
              </div>
              {hatIban && (
                <>
                  <div>
                    IBAN: <strong style={{ color: '#18181b' }}>{firma.iban}</strong>
                  </div>
                  {firma.bank && <div>Bank: {firma.bank}</div>}
                  <div>Verwendungszweck: {rNr} / {kName}</div>
                </>
              )}
            </div>
          )}
          {notiz && (
            <div style={{ marginTop: '0.75rem', color: '#71717a', fontStyle: 'italic' }}>{notiz}</div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: '2.5rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #f4f4f5',
            textAlign: 'center',
            color: '#a1a1aa',
            fontSize: '0.8rem',
          }}
        >
          {istKleinbetrag && !kAdresse.trim() && (
            <div style={{ color: '#71717a', fontSize: '0.7rem', marginBottom: '0.6rem' }}>
              Kleinbetragsrechnung gem. §33 UStDV (Bruttobetrag unter 250&nbsp;€).
            </div>
          )}
          Vielen Dank für Ihren Auftrag!&nbsp;&mdash;&nbsp;{firma.name} &middot; {firma.ort}
        </div>
      </div>
    </div>
  );
}
