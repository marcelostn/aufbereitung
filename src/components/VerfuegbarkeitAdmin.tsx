import { useEffect, useState } from 'react';
import {
  fetchVerfuegbarkeit,
  saveVerfuegbarkeit,
  WOCHENTAGE_LANG,
  type Verfuegbarkeit,
  type TagFenster,
} from '../lib/verfuegbarkeit';

const INPUT =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none [color-scheme:dark]';

// Anzeige-Reihenfolge Mo … So (getDay-Index)
const REIHENFOLGE = [1, 2, 3, 4, 5, 6, 0];

export default function VerfuegbarkeitAdmin() {
  const [v, setV] = useState<Verfuegbarkeit | null>(null);
  const [loading, setLoading] = useState(true);
  const [fehler, setFehler] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    let aktiv = true;
    fetchVerfuegbarkeit()
      .then((data) => { if (aktiv) setV(data); })
      .catch((e) => { if (aktiv) setFehler(e instanceof Error ? e.message : 'Laden fehlgeschlagen'); })
      .finally(() => { if (aktiv) setLoading(false); });
    return () => { aktiv = false; };
  }, []);

  if (loading) return <p className="text-zinc-500 text-sm">Lädt …</p>;
  if (fehler && !v) return <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">{fehler}</div>;
  if (!v) return null;

  const setTag = (idx: number, fenster: TagFenster | null) => {
    setV({ ...v, tage: { ...v.tage, [String(idx)]: fenster } });
    setStatus('idle');
  };
  const setNum = (feld: keyof Verfuegbarkeit, wert: number) => {
    setV({ ...v, [feld]: wert });
    setStatus('idle');
  };

  async function speichern() {
    if (!v) return;
    setStatus('saving');
    setFehler('');
    try {
      await saveVerfuegbarkeit(v);
      setStatus('saved');
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Speichern fehlgeschlagen');
      setStatus('idle');
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-black tracking-tighter mb-1">Verfügbarkeit</h1>
      <p className="text-sm text-zinc-500 mb-6">
        Hier legst du fest, wann buchbare Termine angeboten werden. Die Dauer jeder Leistung wird
        automatisch eingeplant — der Kunde sieht nur Startzeiten, die lückenlos in deine Arbeitszeit passen.
      </p>

      {/* Wochentage */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5">
        <p className="text-sm font-bold text-zinc-200 mb-3">Arbeitstage & Zeiten</p>
        <div className="space-y-2">
          {REIHENFOLGE.map((idx) => {
            const fenster = v.tage[String(idx)] ?? null;
            const aktiv = !!fenster;
            return (
              <div key={idx} className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 w-32 shrink-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={aktiv}
                    onChange={(e) => setTag(idx, e.target.checked ? { von: '08:00', bis: '18:00' } : null)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className={`text-sm ${aktiv ? 'text-zinc-100 font-medium' : 'text-zinc-500'}`}>{WOCHENTAGE_LANG[idx]}</span>
                </label>
                {aktiv && fenster ? (
                  <div className="flex items-center gap-2">
                    <input type="time" value={fenster.von} onChange={(e) => setTag(idx, { ...fenster, von: e.target.value })} className={INPUT} />
                    <span className="text-zinc-500 text-sm">bis</span>
                    <input type="time" value={fenster.bis} onChange={(e) => setTag(idx, { ...fenster, bis: e.target.value })} className={INPUT} />
                  </div>
                ) : (
                  <span className="text-sm text-zinc-600">geschlossen</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weitere Einstellungen */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Parallele Aufträge (Kapazität)</label>
          <input type="number" min={1} max={5} value={v.kapazitaet} onChange={(e) => setNum('kapazitaet', Math.max(1, parseInt(e.target.value) || 1))} className={`${INPUT} w-full`} />
          <p className="text-[11px] text-zinc-600 mt-1">1 = nur du. 2 = du + Partner/Angestellter.</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Puffer zwischen Aufträgen (Min)</label>
          <input type="number" min={0} max={240} step={15} value={v.pufferMin} onChange={(e) => setNum('pufferMin', Math.max(0, parseInt(e.target.value) || 0))} className={`${INPUT} w-full`} />
          <p className="text-[11px] text-zinc-600 mt-1">Für Anfahrt / Auf- & Abbau.</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Vorlauf (Tage)</label>
          <input type="number" min={0} max={30} value={v.vorlaufTage} onChange={(e) => setNum('vorlaufTage', Math.max(0, parseInt(e.target.value) || 0))} className={`${INPUT} w-full`} />
          <p className="text-[11px] text-zinc-600 mt-1">Frühestens buchbar in N Tagen (1 = ab morgen).</p>
        </div>
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Buchbar bis (Tage voraus)</label>
          <input type="number" min={1} max={120} value={v.horizontTage} onChange={(e) => setNum('horizontTage', Math.max(1, parseInt(e.target.value) || 1))} className={`${INPUT} w-full`} />
          <p className="text-[11px] text-zinc-600 mt-1">31 ≈ ein Monat.</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={speichern} disabled={status === 'saving'} className="btn-gold px-5 py-2.5 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-50">
          {status === 'saving' ? 'Speichert …' : 'Speichern'}
        </button>
        {status === 'saved' && <span className="text-sm text-green-400">Gespeichert ✓</span>}
        {fehler && <span className="text-sm text-red-400">{fehler}</span>}
      </div>
    </div>
  );
}
