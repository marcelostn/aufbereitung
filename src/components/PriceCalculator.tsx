import React, { useReducer, useEffect, useRef, useState } from 'react';
import { PKW_PAKETE, type PaketTyp } from '../data/preise';
import { LKW_PAKETE, type LkwPaketTyp } from '../data/lkw';
import { type TierhaarStufe, type FahrzeugZuschlagTyp } from '../data/aufpreise';
import { berechnePreis, type PreisErgebnis } from '../lib/calc';

interface Props {
  calLink: string;
  calLinks?: Record<string, string>;
  telefon: string;
}

type FahrzeugGruppe = 'pkw' | 'lkw';
type Reinigungsort = 'vorort' | 'beiuns';

interface State {
  schritt: number;
  fahrzeugGruppe: FahrzeugGruppe;
  fahrzeugZuschlag: FahrzeugZuschlagTyp;
  pkwPaket: PaketTyp;
  lkwPaket: LkwPaketTyp;
  tierhaare: TierhaarStufe;
  kindersitze: number;
  nikotin: boolean;
  reinigungsort: Reinigungsort | null;
  entfernungKm: number;
  ergebnis: PreisErgebnis | null;
  calKey: number;
}

type Action =
  | { type: 'SET_FAHRZEUG'; gruppe: FahrzeugGruppe; zuschlag: FahrzeugZuschlagTyp }
  | { type: 'SET_PKW_PAKET'; value: PaketTyp }
  | { type: 'SET_LKW_PAKET'; value: LkwPaketTyp }
  | { type: 'SET_TIERHAARE'; value: TierhaarStufe }
  | { type: 'SET_KINDERSITZE'; value: number }
  | { type: 'TOGGLE_NIKOTIN' }
  | { type: 'SET_REINIGUNGSORT'; value: Reinigungsort }
  | { type: 'SET_KM'; value: number }
  | { type: 'WEITER' }
  | { type: 'ZURUECK' }
  | { type: 'BERECHNEN' }
  | { type: 'RESET' };

const init: State = {
  schritt: 1,
  fahrzeugGruppe: 'pkw',
  fahrzeugZuschlag: 'pkw',
  pkwPaket: 'komplett_basic',
  lkwPaket: 'lkw_basic',
  tierhaare: 'keine',
  kindersitze: 0,
  nikotin: false,
  reinigungsort: null,
  entfernungKm: 0,
  ergebnis: null,
  calKey: 0,
};

function kalkuliere(s: State, km: number): PreisErgebnis {
  return s.fahrzeugGruppe === 'pkw'
    ? berechnePreis({ typ: 'pkw', paket: s.pkwPaket, fahrzeugZuschlag: s.fahrzeugZuschlag, tierhaare: s.tierhaare, kindersitze: s.kindersitze, nikotin: s.nikotin, entfernungKm: km })
    : berechnePreis({ typ: 'lkw', paket: s.lkwPaket, tierhaare: s.tierhaare, nikotin: s.nikotin, entfernungKm: km });
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'SET_FAHRZEUG':
      return { ...s, fahrzeugGruppe: a.gruppe, fahrzeugZuschlag: a.zuschlag };
    case 'SET_PKW_PAKET':
      return { ...s, pkwPaket: a.value };
    case 'SET_LKW_PAKET':
      return { ...s, lkwPaket: a.value };
    case 'SET_TIERHAARE':
      return { ...s, tierhaare: a.value };
    case 'SET_KINDERSITZE':
      return { ...s, kindersitze: Math.max(0, a.value) };
    case 'TOGGLE_NIKOTIN':
      return { ...s, nikotin: !s.nikotin };
    case 'SET_REINIGUNGSORT': {
      if (a.value === 'beiuns') {
        // direkt berechnen, Entfernungsschritt überspringen
        return { ...s, reinigungsort: 'beiuns', entfernungKm: 0, schritt: 6, ergebnis: kalkuliere(s, 0), calKey: s.calKey + 1 };
      }
      return { ...s, reinigungsort: 'vorort', schritt: 5 };
    }
    case 'SET_KM':
      return { ...s, entfernungKm: Math.max(0, a.value) };
    case 'WEITER':
      return { ...s, schritt: s.schritt + 1 };
    case 'ZURUECK':
      if (s.schritt === 6) {
        // zurück zu Entfernung (vorort) oder Reinigungsort (beiuns)
        return { ...s, schritt: s.reinigungsort === 'beiuns' ? 4 : 5, ergebnis: null };
      }
      return { ...s, schritt: Math.max(1, s.schritt - 1), ergebnis: null };
    case 'BERECHNEN': {
      return { ...s, schritt: 6, ergebnis: kalkuliere(s, s.entfernungKm), calKey: s.calKey + 1 };
    }
    case 'RESET':
      return { ...init };
  }
}

function eur(n: number) {
  return n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });
}

// ─── Daten für Karten ─────────────────────────────────────────────────────────

const FAHRZEUG_KARTEN = [
  { gruppe: 'pkw' as const, zuschlag: 'pkw' as const,  label: 'Standard PKW',    sub: 'Limousine, Kombi, Kleinwagen',  badge: null,       icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { gruppe: 'pkw' as const, zuschlag: 'suv' as const,  label: 'SUV / Geländewagen', sub: 'Q5, X3, Tiguan, GLC …',     badge: '+15 %',    icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { gruppe: 'pkw' as const, zuschlag: 'van' as const,  label: 'Van / Bus',         sub: 'T5/T6, Vito, Sharan, Galaxy …', badge: '+30 %', icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { gruppe: 'pkw' as const, zuschlag: 'lang' as const, label: 'Lang / 7-Sitzer',   sub: 'Langversionen, 7-Sitzer …',   badge: '+20 %',    icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
  { gruppe: 'lkw' as const, zuschlag: 'pkw' as const,  label: 'LKW / Traktor',    sub: 'Kabine & Innenraum',           badge: null,       icon: 'M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12' },
];

const PKW_GRUPPEN = [
  {
    titel: 'Nur Außen',
    tab: 'Außen',
    sub: 'Handwäsche & Pflege',
    badge: undefined as string | undefined,
    pakete: [
      { key: 'aussen' as PaketTyp, features: ['Handwäsche', 'Felgen reinigen', 'Scheiben außen', 'Türen & Dichtungen', 'Reifenpflege'] },
    ],
  },
  {
    titel: 'Nur Innenraum',
    tab: 'Innenraum',
    sub: 'Sitze, Polster, Matten',
    badge: undefined as string | undefined,
    pakete: [
      { key: 'innen_basic' as PaketTyp,   features: ['Aussaugen', 'Armaturenbrett', 'Scheiben innen', 'Fußmatten'] },
      { key: 'innen_premium' as PaketTyp, features: ['Alles Basic', 'Sitze & Polster', 'Türverkleidungen', 'Kofferraum', 'Lederpflege'] },
      { key: 'innen_detail' as PaketTyp,  features: ['Alles Premium', 'Dampfreinigung', 'Fugen & Spalten', 'Teppiche intensiv', 'Geruchsneutralisierung'] },
    ],
  },
  {
    titel: 'Komplett — Innen + Außen',
    tab: 'Komplett',
    sub: 'Innen + Außen',
    badge: '30 % Rabatt',
    pakete: [
      { key: 'komplett_basic' as PaketTyp,   features: ['Außenreinigung komplett', 'Innen Basic', 'Rabatt bereits eingerechnet'] },
      { key: 'komplett_premium' as PaketTyp, features: ['Außenreinigung komplett', 'Innen Premium', 'Rabatt bereits eingerechnet'] },
      { key: 'komplett_detail' as PaketTyp,  features: ['Außenreinigung komplett', 'Innen Full Detail', 'Rabatt bereits eingerechnet'] },
    ],
  },
];

const TIERHAARE_KARTEN: { wert: TierhaarStufe; label: string; aufpreis: string | null }[] = [
  { wert: 'keine', label: 'Keine',       aufpreis: null },
  { wert: 'leicht', label: 'Leicht',    aufpreis: '+15 €' },
  { wert: 'mittel', label: 'Mittel',    aufpreis: '+25 €' },
  { wert: 'stark',  label: 'Stark',     aufpreis: '+45 €' },
];

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

function Check() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 text-sm mb-6 cursor-pointer transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Zurück
    </button>
  );
}

// schritt 4+5 = Anfahrt (Progress-Schritt 4), schritt 6 = Preis & Termin (Progress-Schritt 5)
function schrittZuProgress(schritt: number) {
  if (schritt <= 3) return schritt;
  if (schritt <= 5) return 4;
  return 5;
}

function Progress({ schritt }: { schritt: number }) {
  const step = schrittZuProgress(schritt);
  const labels = ['Fahrzeug', 'Leistung', 'Aufpreise', 'Anfahrt', 'Preis & Termin'];
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = step > n;
        const active = step === n;
        return (
          <div key={n} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors duration-300 ${done ? 'bg-amber-500 text-zinc-900' : active ? 'bg-amber-500 text-zinc-900 ring-4 ring-amber-500/25' : 'bg-zinc-800 text-zinc-500'}`}>
                {done
                  ? <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  : n}
              </div>
              <span className={`mt-1.5 text-xs font-medium hidden sm:block ${active ? 'text-amber-400' : done ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`h-0.5 w-8 sm:w-14 mx-1 mb-5 transition-colors duration-300 ${done ? 'bg-amber-500' : 'bg-zinc-700'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Leistungs-Auswahl PKW (Kategorie + Pakete) ───────────────────────────────

function LeistungPkw({ pkwPaket, dispatch }: { pkwPaket: PaketTyp; dispatch: React.Dispatch<Action> }) {
  const initial = pkwPaket === 'aussen' ? 0 : pkwPaket.startsWith('innen') ? 1 : 2;
  const [kat, setKat] = useState(initial);
  const gruppe = PKW_GRUPPEN[kat];

  return (
    <>
      {/* Kategorie-Tabs */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {PKW_GRUPPEN.map((g, i) => (
          <button
            key={i}
            onClick={() => setKat(i)}
            className={`rounded-2xl p-4 border text-center transition-all duration-200 cursor-pointer backdrop-blur-sm ${kat === i ? 'bg-amber-500/15 border-amber-500/60 ring-2 ring-amber-500/20' : 'bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800/80'}`}
          >
            <p className={`font-bold text-sm ${kat === i ? 'text-amber-400' : 'text-zinc-100'}`}>{g.tab}</p>
            <p className="text-xs text-zinc-500 mt-0.5 hidden sm:block">{g.sub}</p>
            {g.badge && (
              <span className="inline-block mt-1.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">{g.badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* Pakete der gewählten Kategorie */}
      <div className={`grid gap-4 ${gruppe.pakete.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {gruppe.pakete.map(({ key, features }, i) => {
          const paket = PKW_PAKETE[key];
          const selected = pkwPaket === key;
          const isMiddle = gruppe.pakete.length === 3 && i === 1;
          return (
            <button
              key={key}
              onClick={() => { dispatch({ type: 'SET_PKW_PAKET', value: key }); dispatch({ type: 'WEITER' }); }}
              className={`text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer backdrop-blur-sm ${selected ? 'bg-amber-500/15 border-amber-500/60' : isMiddle ? 'bg-amber-500/8 border-amber-500/30 hover:border-amber-400' : 'bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800/80'}`}
            >
              {isMiddle && !selected && (
                <span className="inline-block text-xs font-bold bg-amber-500 text-zinc-900 px-2 py-0.5 rounded-full mb-2">Beliebt</span>
              )}
              <p className="font-bold text-zinc-100 mb-0.5">{paket.name}</p>
              <p className="text-xl font-black text-amber-400 mb-0.5">{eur(paket.bruttoPreis)}</p>
              <p className="text-xs text-zinc-500 mb-3">{paket.dauer}</p>
              <ul className="space-y-1">
                {features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-zinc-300"><Check />{f}</li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

const ORIGIN = 'Narzissenstraße 1, 49661 Cloppenburg';

async function geocode(adresse: string): Promise<{ lat: string; lon: string }> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(adresse)}&format=json&limit=1&countrycodes=de`;
  const res = await fetch(url, { headers: { 'User-Agent': 'AutoaufbereitungCloppenburg/1.0' } });
  const data = await res.json();
  if (!data.length) throw new Error('Adresse nicht gefunden. Bitte genauer eingeben (z. B. Straße, Hausnummer, Ort).');
  return { lat: data[0].lat, lon: data[0].lon };
}

async function fahrstreckeKm(from: { lat: string; lon: string }, to: { lat: string; lon: string }): Promise<number> {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.code !== 'Ok') throw new Error('Route konnte nicht berechnet werden.');
  return Math.round(data.routes[0].distance / 1000);
}

function EntfernungSchritt({ entfernungKm, dispatch }: { entfernungKm: number; dispatch: React.Dispatch<Action> }) {
  const [adresse, setAdresse] = useState('');
  const [loading, setLoading] = useState(false);
  const [fehler, setFehler] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Laufende Nummer der Autocomplete-Anfrage – verhindert, dass eine veraltete
  // (noch laufende) fetch-Antwort die Vorschlagsliste wieder aufpoppt,
  // nachdem der Nutzer schon eine Adresse gewählt oder weitergetippt hat.
  const reqIdRef = useRef(0);

  const handleAdresseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAdresse(val);
    dispatch({ type: 'SET_KM', value: 0 });
    setSuggestions([]);
    setShowSuggestions(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length >= 4) {
      const myReq = ++reqIdRef.current;
      debounceRef.current = setTimeout(async () => {
        try {
          const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&countrycodes=de`;
          const res = await fetch(url, { headers: { 'User-Agent': 'AutoaufbereitungCloppenburg/1.0' } });
          const data: any[] = await res.json();
          if (myReq !== reqIdRef.current) return; // veraltete Antwort verwerfen
          if (data.length > 0) {
            setSuggestions(data.map((d) => d.display_name));
            setShowSuggestions(true);
          }
        } catch {
          // autocomplete errors silently ignored
        }
      }, 350);
    }
  };

  const selectSuggestion = (sug: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    reqIdRef.current++; // jede noch laufende Anfrage ungültig machen
    setAdresse(sug);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const berechnen = async () => {
    if (!adresse.trim()) return;
    setLoading(true);
    setFehler('');
    setShowSuggestions(false);
    try {
      const [origin, dest] = await Promise.all([geocode(ORIGIN), geocode(adresse)]);
      const km = await fahrstreckeKm(origin, dest);
      dispatch({ type: 'SET_KM', value: km });
    } catch (e: any) {
      setFehler(e.message ?? 'Fehler bei der Berechnung.');
    } finally {
      setLoading(false);
    }
  };

  const anfahrt = entfernungKm > 10 ? Math.max(0, entfernungKm - 10) * 2 * 0.30 : 0;
  const berechnet = entfernungKm > 0;

  return (
    <div>
      <Progress schritt={5} />
      <BackBtn onClick={() => dispatch({ type: 'ZURUECK' })} />
      <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Wo befinden Sie sich?</h2>
      <p className="text-zinc-400 text-center mb-8 text-sm">Bis 10 km um Cloppenburg ist die Anfahrt kostenlos</p>

      <div className="max-w-lg mx-auto space-y-4">
        <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl p-6">
          <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-widest">
            Ihre Adresse
          </label>
          <div className="relative">
            <div className="flex gap-2">
              <input
                type="text"
                value={adresse}
                onChange={handleAdresseChange}
                onKeyDown={(e) => { if (e.key === 'Enter') { setShowSuggestions(false); berechnen(); } if (e.key === 'Escape') setShowSuggestions(false); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="z. B. Musterstraße 5, Oldenburg"
                className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 placeholder:text-zinc-600"
              />
              <button
                onClick={() => { setShowSuggestions(false); berechnen(); }}
                disabled={loading || !adresse.trim()}
                className="btn-gold px-5 py-3 rounded-xl font-bold text-sm whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? '…' : 'Berechnen'}
              </button>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute top-full left-0 right-16 mt-1 bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden z-50 shadow-xl">
                {suggestions.map((sug, i) => (
                  <li key={i}>
                    <button
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectSuggestion(sug)}
                      className="w-full text-left px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700 hover:text-zinc-100 transition-colors cursor-pointer border-b border-zinc-700/50 last:border-0 truncate block"
                    >
                      {sug}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {fehler && <p className="mt-3 text-red-400 text-sm">{fehler}</p>}

          {berechnet && !loading && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              {entfernungKm <= 10 ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                  <span className="text-green-400 font-semibold">{entfernungKm} km — Im Freiradius, keine Anfahrtskosten</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg>
                  <span className="text-amber-400 font-semibold">{entfernungKm} km — Anfahrt: {eur(anfahrt)}</span>
                </>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => dispatch({ type: 'BERECHNEN' })}
          disabled={!berechnet}
          className="btn-gold w-full font-bold py-3.5 rounded-xl cursor-pointer text-lg disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Preis berechnen →
        </button>
      </div>
    </div>
  );
}

export default function PriceCalculator({ calLink, calLinks = {}, telefon }: Props) {
  const [s, dispatch] = useReducer(reducer, init);

  // Vorauswahl aus URL-Parameter (z.B. von Service-Detailseite: /preisrechner?paket=komplett_basic)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paket = params.get('paket') as PaketTyp | null;
    if (paket && paket in PKW_PAKETE) {
      dispatch({ type: 'SET_PKW_PAKET', value: paket });
      dispatch({ type: 'WEITER' }); // 1 -> 2
      dispatch({ type: 'WEITER' }); // 2 -> 3 (Aufpreise)
    }
  }, []);

  const paketKey = s.fahrzeugGruppe === 'pkw' ? s.pkwPaket : s.lkwPaket;
  const activeCalLink = calLinks[paketKey] || calLink;


  // ─── Schritt 1: Fahrzeugtyp ────────────────────────────────────────────────
  if (s.schritt === 1) return (
    <div>
      <Progress schritt={s.schritt} />
      <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Welches Fahrzeug?</h2>
      <p className="text-zinc-400 text-center mb-8 text-sm">Wählen Sie Ihren Fahrzeugtyp</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FAHRZEUG_KARTEN.map((k, idx) => {
          const isLast = idx === FAHRZEUG_KARTEN.length - 1;
          const selected = s.fahrzeugGruppe === k.gruppe && s.fahrzeugZuschlag === k.zuschlag;
          return (
            <button
              key={k.label}
              onClick={() => { dispatch({ type: 'SET_FAHRZEUG', gruppe: k.gruppe, zuschlag: k.zuschlag }); dispatch({ type: 'WEITER' }); }}
              className={`group relative text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer backdrop-blur-sm
                ${isLast ? 'sm:col-span-2 sm:justify-self-center sm:max-w-sm sm:w-full' : ''}
                ${selected ? 'bg-amber-500/15 border-amber-500/60' : 'bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800/80'}`}
            >
              {k.badge && (
                <span className="absolute top-3 right-3 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">{k.badge}</span>
              )}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors duration-200 ${selected ? 'bg-amber-500/25 border border-amber-500/40' : 'bg-amber-500/10 border border-amber-500/20 group-hover:bg-amber-500/20'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d={k.icon} />
                </svg>
              </div>
              <p className="font-bold text-zinc-100">{k.label}</p>
              <p className="text-sm text-zinc-400 mt-0.5">{k.sub}</p>
            </button>
          );
        })}
      </div>
    </div>
  );

  // ─── Schritt 2: Leistung ───────────────────────────────────────────────────
  if (s.schritt === 2) {
    if (s.fahrzeugGruppe === 'pkw') return (
      <div>
        <Progress schritt={s.schritt} />
        <BackBtn onClick={() => dispatch({ type: 'ZURUECK' })} />
        <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Welche Leistung?</h2>
        <p className="text-zinc-400 text-center mb-8 text-sm">Kategorie wählen, dann Ihr Paket</p>
        <LeistungPkw pkwPaket={s.pkwPaket} dispatch={dispatch} />
      </div>
    );

    // LKW
    return (
      <div>
        <Progress schritt={s.schritt} />
        <BackBtn onClick={() => dispatch({ type: 'ZURUECK' })} />
        <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Welches Paket?</h2>
        <p className="text-zinc-400 text-center mb-8 text-sm">LKW / Traktor / Transporter</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(Object.keys(LKW_PAKETE) as LkwPaketTyp[]).map((key) => {
            const p = LKW_PAKETE[key];
            const selected = s.lkwPaket === key;
            return (
              <button
                key={key}
                onClick={() => { dispatch({ type: 'SET_LKW_PAKET', value: key }); dispatch({ type: 'WEITER' }); }}
                className={`text-left rounded-2xl p-5 border transition-all duration-200 cursor-pointer ${selected ? 'bg-amber-500/15 border-amber-500/60' : 'bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800/80'} backdrop-blur-sm`}
              >
                <p className="font-bold text-zinc-100 mb-0.5">{p.name}</p>
                <p className="text-xl font-black text-amber-400 mb-0.5">{eur(p.bruttoPreis)}</p>
                <p className="text-xs text-zinc-500">{p.dauer}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ─── Schritt 3: Aufpreise ──────────────────────────────────────────────────
  if (s.schritt === 3) return (
    <div>
      <Progress schritt={s.schritt} />
      <BackBtn onClick={() => dispatch({ type: 'ZURUECK' })} />
      <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Aufpreise</h2>
      <p className="text-zinc-400 text-center mb-8 text-sm">Wählen Sie alles was zutrifft — oder überspringen Sie diesen Schritt</p>

      <div className="space-y-6">
        {/* Tierhaare */}
        <div>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Tierhaare im Fahrzeug</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {TIERHAARE_KARTEN.map(({ wert, label, aufpreis }) => (
              <button
                key={wert}
                onClick={() => dispatch({ type: 'SET_TIERHAARE', value: wert })}
                className={`rounded-xl p-4 border text-center transition-all duration-200 cursor-pointer ${s.tierhaare === wert ? 'bg-amber-500/15 border-amber-500/60' : 'bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800/80'}`}
              >
                <p className="font-bold text-zinc-100 text-sm">{label}</p>
                {aufpreis && <p className="text-amber-400 text-xs mt-0.5 font-semibold">{aufpreis}</p>}
                {!aufpreis && <p className="text-zinc-600 text-xs mt-0.5">kein Aufpreis</p>}
              </button>
            ))}
          </div>
        </div>

        {/* Kindersitze (nur PKW) */}
        {s.fahrzeugGruppe === 'pkw' && (
          <div>
            <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Kindersitze reinigen <span className="normal-case font-normal text-zinc-500">(+20 € / Stück)</span></p>
            <div className="inline-flex items-center gap-4 bg-zinc-900/60 border border-zinc-700/50 rounded-xl px-5 py-3">
              <button onClick={() => dispatch({ type: 'SET_KINDERSITZE', value: s.kindersitze - 1 })} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold cursor-pointer transition-colors text-lg flex items-center justify-center">−</button>
              <span className="text-2xl font-black text-zinc-100 w-8 text-center">{s.kindersitze}</span>
              <button onClick={() => dispatch({ type: 'SET_KINDERSITZE', value: s.kindersitze + 1 })} className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-100 font-bold cursor-pointer transition-colors text-lg flex items-center justify-center">+</button>
              {s.kindersitze > 0 && <span className="text-amber-400 font-bold text-sm">+{eur(s.kindersitze * 20)}</span>}
            </div>
          </div>
        )}

        {/* Nikotin */}
        <div>
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Nikotingeruch</p>
          <button
            onClick={() => dispatch({ type: 'TOGGLE_NIKOTIN' })}
            className={`w-full sm:w-auto text-left rounded-xl p-5 border transition-all duration-200 cursor-pointer ${s.nikotin ? 'bg-amber-500/15 border-amber-500/60' : 'bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/40 hover:bg-zinc-800/80'}`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${s.nikotin ? 'bg-amber-500 border-amber-500' : 'border-zinc-600'}`}>
                {s.nikotin && <svg className="w-3 h-3 text-zinc-900" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>}
              </div>
              <div>
                <p className="font-bold text-zinc-100">Starker Nikotingeruch <span className="text-amber-400 ml-1">+40 €</span></p>
                <p className="text-xs text-amber-600/80 mt-0.5">Ohne Ozongerät kein 100 %-Erfolg garantierbar</p>
              </div>
            </div>
          </button>
        </div>
      </div>

      <button
        onClick={() => dispatch({ type: 'WEITER' })}
        className="btn-gold mt-8 w-full font-bold py-3.5 rounded-xl cursor-pointer"
      >
        Weiter →
      </button>
    </div>
  );

  // ─── Schritt 4: Reinigungsort ──────────────────────────────────────────────
  if (s.schritt === 4) return (
    <div>
      <Progress schritt={s.schritt} />
      <BackBtn onClick={() => dispatch({ type: 'ZURUECK' })} />
      <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Wo soll gereinigt werden?</h2>
      <p className="text-zinc-400 text-center mb-8 text-sm">Wir kommen zu Ihnen oder Sie bringen das Fahrzeug zu uns</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">

        <button
          onClick={() => dispatch({ type: 'SET_REINIGUNGSORT', value: 'vorort' })}
          className="group text-left rounded-2xl p-6 border bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/50 hover:bg-zinc-800/80 backdrop-blur-sm transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
          </div>
          <p className="text-lg font-bold text-zinc-100 mb-1">Vor Ort bei Ihnen</p>
          <p className="text-sm text-zinc-400 leading-relaxed">Wir kommen direkt zu Ihnen nach Hause oder zur Arbeit. Anfahrtskosten je nach Entfernung.</p>
          <p className="mt-3 text-xs text-zinc-500">10 km Freiradius um Cloppenburg · danach 0,30 €/km</p>
        </button>

        <button
          onClick={() => dispatch({ type: 'SET_REINIGUNGSORT', value: 'beiuns' })}
          className="group text-left rounded-2xl p-6 border bg-zinc-900/60 border-zinc-700/50 hover:border-amber-500/50 hover:bg-zinc-800/80 backdrop-blur-sm transition-all duration-200 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/20 transition-colors duration-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <p className="text-lg font-bold text-zinc-100 mb-1">Bei uns in Cloppenburg</p>
          <p className="text-sm text-zinc-400 leading-relaxed">Sie bringen Ihr Fahrzeug zu unserem Standort in Cloppenburg — keine Anfahrtskosten.</p>
          <p className="mt-3 text-xs text-green-400 font-semibold">Keine Anfahrtskosten</p>
        </button>
      </div>
    </div>
  );

  // ─── Schritt 5: Entfernung (nur bei "vor Ort") ─────────────────────────────
  if (s.schritt === 5) return (
    <EntfernungSchritt entfernungKm={s.entfernungKm} dispatch={dispatch} />
  );

  // ─── Schritt 6: Ergebnis + Kalender ───────────────────────────────────────
  if (s.schritt === 6 && s.ergebnis) return (
    <div>
      <Progress schritt={s.schritt} />

      <div className="max-w-lg mx-auto mb-10">
        <h2 className="text-2xl font-black tracking-tighter text-center mb-6">Ihr Preis</h2>
        <div className="bg-zinc-900/60 border border-zinc-700/50 rounded-2xl p-6 space-y-3 mb-3">
          {s.ergebnis.positionen.map((pos, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-zinc-400">{pos.bezeichnung}</span>
              <span className="font-semibold text-zinc-200">{eur(pos.betrag)}</span>
            </div>
          ))}
          <div className="border-t border-zinc-700 pt-4 flex justify-between items-baseline">
            <span className="font-bold text-zinc-100">Gesamt inkl. MwSt.</span>
            <span className="text-3xl font-black text-amber-400">{eur(s.ergebnis.gesamt)}</span>
          </div>
        </div>
        <p className="text-xs text-zinc-600 text-center">Festpreis · 19 % MwSt. · Aufpreise ggf. vor Ort nach Prüfung</p>
      </div>

      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tighter text-center mb-2">Jetzt Termin buchen</h2>
        <p className="text-zinc-400 text-center mb-6 text-sm">Wählen Sie einen freien Tag — Ihre Leistung wird automatisch übertragen</p>
        {activeCalLink && s.ergebnis ? (() => {
          const paketName = s.fahrzeugGruppe === 'pkw' ? PKW_PAKETE[s.pkwPaket].name : LKW_PAKETE[s.lkwPaket].name;
          const aufpreisTexte: string[] = [];
          if (s.tierhaare !== 'keine') aufpreisTexte.push(`Tierhaare ${s.tierhaare}`);
          if (s.kindersitze > 0) aufpreisTexte.push(`${s.kindersitze} Kindersitz${s.kindersitze > 1 ? 'e' : ''}`);
          if (s.nikotin) aufpreisTexte.push('Nikotingeruch');
          const notiz = [
            `Leistung: ${paketName}`,
            s.reinigungsort === 'beiuns' ? 'Bei uns in Cloppenburg' : 'Vor Ort beim Kunden',
            aufpreisTexte.length ? aufpreisTexte.join(', ') : null,
            s.reinigungsort === 'vorort' && s.entfernungKm > 0 ? `${s.entfernungKm} km` : null,
            `Preis: ${eur(s.ergebnis.gesamt)}`,
          ].filter(Boolean).join(' | ');
          const src = `https://cal.eu/${activeCalLink}?notes=${encodeURIComponent(notiz)}`;
          return (
            <div className="rounded-2xl border border-zinc-700/50 overflow-hidden" style={{ height: '700px' }}>
              <iframe
                key={s.calKey}
                src={src}
                style={{ width: '100%', height: '100%', border: 'none' }}
                title="Termin buchen"
                loading="lazy"
              />
            </div>
          );
        })() : (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-10 text-center">
            <p className="text-zinc-300 mb-4">Online-Kalender noch nicht eingerichtet. Bitte direkt kontaktieren:</p>
            <a href={`tel:${telefon}`} className="btn-gold inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl cursor-pointer">{telefon}</a>
          </div>
        )}
        <p className="text-center text-sm text-zinc-500 mt-4">
          Lieber direkt?{' '}
          <a href={`tel:${telefon}`} className="text-amber-400 hover:underline">{telefon}</a>
        </p>
      </div>

      <button
        onClick={() => dispatch({ type: 'RESET' })}
        className="mx-auto flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 cursor-pointer transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
        Neu berechnen
      </button>
    </div>
  );

  return null;
}
