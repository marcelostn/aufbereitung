import { useState, useEffect } from 'react';
import {
  loadAlleStempel,
  saveAlleStempel,
  setStempelAnzahl,
  loescheStempel,
  offeneBelohnungen,
  bisNaechsteBelohnung,
  BELOHNUNG_INTERVALL,
  type KundenStempel,
} from '../lib/treue';

const FMT = (iso: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const SECTION = 'bg-zinc-900 border border-zinc-800 rounded-xl p-5';

export default function TreueUebersicht() {
  const [kunden, setKunden] = useState<KundenStempel[]>([]);
  const [suche, setSuche] = useState('');

  useEffect(() => {
    setKunden(loadAlleStempel());
  }, []);

  const refresh = () => setKunden(loadAlleStempel());

  const gefiltert = suche.trim()
    ? kunden.filter((k) =>
        (k.name + ' ' + k.telefon).toLowerCase().includes(suche.toLowerCase())
      )
    : kunden;

  // Sortierung: offene Belohnungen zuerst, dann nach Auftragsanzahl, dann nach letztem Auftrag
  const sortiert = [...gefiltert].sort((a, b) => {
    const offA = offeneBelohnungen(a);
    const offB = offeneBelohnungen(b);
    if (offA !== offB) return offB - offA;
    if (a.anzahlAuftraege !== b.anzahlAuftraege) return b.anzahlAuftraege - a.anzahlAuftraege;
    return b.letzterAuftrag.localeCompare(a.letzterAuftrag);
  });

  const summe = kunden.length;
  const aktive = kunden.filter((k) => {
    const monateZurueck = (new Date().getTime() - new Date(k.letzterAuftrag).getTime()) / (1000 * 60 * 60 * 24 * 30);
    return monateZurueck < 6;
  }).length;
  const offenGesamt = kunden.reduce((s, k) => s + offeneBelohnungen(k), 0);
  const auftraegeGesamt = kunden.reduce((s, k) => s + k.anzahlAuftraege, 0);

  function manuellPlus(k: KundenStempel) {
    if (!confirm(`Manuell einen Stempel für ${k.name} hinzufügen?`)) return;
    setStempelAnzahl(k.telefon, k.anzahlAuftraege + 1);
    refresh();
  }

  function manuellMinus(k: KundenStempel) {
    if (!confirm(`Einen Stempel von ${k.name} abziehen?`)) return;
    setStempelAnzahl(k.telefon, Math.max(0, k.anzahlAuftraege - 1));
    refresh();
  }

  function kundeLoeschen(k: KundenStempel) {
    if (!confirm(`Kunde ${k.name} (${k.telefon}) komplett aus der Treueliste entfernen?\n\nDies wirkt sich NICHT auf Rechnungen aus, nur auf den Stempel-Zähler.`)) return;
    loescheStempel(k.telefon);
    refresh();
  }

  function reset() {
    if (!confirm('ALLE Treuekarten unwiderruflich zurücksetzen? Dies kann nicht rückgängig gemacht werden.')) return;
    saveAlleStempel([]);
    refresh();
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-zinc-100">Treuekunden</h1>
        <div className="flex gap-2">
          <a
            href="/admin/stempel-motiv"
            className="bg-zinc-800 hover:bg-amber-500/15 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 hover:text-amber-300 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="6" />
              <circle cx="12" cy="12" r="2" />
            </svg>
            Stempel-Motiv designen
          </a>
          <a
            href="/admin/treuekarte"
            className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0 0 21 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 0 0-1.913-.247M6.34 18H5.25A2.25 2.25 0 0 1 3 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 0 1 1.913-.247m10.5 0a48.536 48.536 0 0 0-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008H18V10.5Zm-3 0h.008v.008H15V10.5Z" />
            </svg>
            Treuekarte drucken
          </a>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Kunden</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 tabular-nums">{summe}</div>
          <div className="text-xs text-zinc-600 mt-1">davon {aktive} aktiv (≤6 Mt)</div>
        </div>
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Aufträge gesamt</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 tabular-nums">{auftraegeGesamt}</div>
          <div className="text-xs text-zinc-600 mt-1">über alle Kunden</div>
        </div>
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Offene Belohnungen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{offenGesamt}</div>
          <div className="text-xs text-zinc-600 mt-1">noch nicht eingelöst</div>
        </div>
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Intervall</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 tabular-nums">alle {BELOHNUNG_INTERVALL}.</div>
          <div className="text-xs text-zinc-600 mt-1">Aufbereitung</div>
        </div>
      </div>

      {/* Suche + Reset */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suchen nach Name oder Telefon…"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none placeholder-zinc-600"
        />
        {kunden.length > 0 && (
          <button
            onClick={reset}
            className="text-xs text-zinc-500 hover:text-red-400 px-3 py-2 transition-colors"
            title="Alle Treuekarten löschen"
          >
            Alle zurücksetzen
          </button>
        )}
      </div>

      {/* Tabelle */}
      {kunden.length === 0 ? (
        <div className={`${SECTION} text-center py-12`}>
          <p className="text-zinc-400">Noch keine Treuekunden.</p>
          <p className="text-zinc-600 text-sm mt-2">
            Sobald du eine Rechnung mit Telefonnummer erstellst, landet der Kunde automatisch hier.
          </p>
        </div>
      ) : sortiert.length === 0 ? (
        <div className={`${SECTION} text-center py-8`}>
          <p className="text-zinc-500 text-sm">Keine Treffer für „{suche}"</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Kunde</th>
                <th className="text-left px-4 py-3 font-semibold">Telefon</th>
                <th className="text-center px-4 py-3 font-semibold">Stempel</th>
                <th className="text-center px-4 py-3 font-semibold">Belohnungen</th>
                <th className="text-left px-4 py-3 font-semibold">Letzter Auftrag</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {sortiert.map((k) => {
                const offen = offeneBelohnungen(k);
                const bisNaechste = bisNaechsteBelohnung(k);
                const istStammkunde = k.anzahlAuftraege >= BELOHNUNG_INTERVALL;
                return (
                  <tr key={k.telefon} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-zinc-100">{k.name || <span className="text-zinc-600 italic">ohne Name</span>}</div>
                      <div className="text-xs text-zinc-600 mt-0.5">Seit {FMT(k.ersterAuftrag)}</div>
                    </td>
                    <td className="px-4 py-3 text-zinc-400 font-mono text-xs">{k.telefon}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="inline-flex items-center gap-1 justify-center">
                        <button
                          onClick={() => manuellMinus(k)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 text-xs leading-none transition-colors"
                          title="Stempel abziehen"
                        >−</button>
                        <span className={`text-lg font-bold tabular-nums w-8 text-center ${istStammkunde ? 'text-amber-400' : 'text-zinc-200'}`}>
                          {k.anzahlAuftraege}
                        </span>
                        <button
                          onClick={() => manuellPlus(k)}
                          className="w-6 h-6 rounded bg-zinc-800 hover:bg-amber-500/30 text-zinc-500 hover:text-amber-300 text-xs leading-none transition-colors"
                          title="Stempel hinzufügen"
                        >+</button>
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">
                        {bisNaechste === 0 ? 'jetzt!' : `noch ${bisNaechste}`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {offen > 0 ? (
                        <span className="inline-flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-300 px-2 py-1 rounded-md text-xs font-bold">
                          🎁 {offen} offen
                        </span>
                      ) : k.einloesungen.length > 0 ? (
                        <span className="text-zinc-500 text-xs">{k.einloesungen.length}× eingelöst</span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 tabular-nums">{FMT(k.letzterAuftrag)}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => kundeLoeschen(k)}
                        className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 transition-colors"
                        title="Aus Treueliste entfernen"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-6 leading-relaxed">
        Stempel werden automatisch bei jeder Rechnung mit hinterlegter Telefonnummer hochgezählt. Daten liegen
        ausschließlich in diesem Browser (localStorage) — also: nicht den Browser-Cache löschen, sonst sind die
        Treuekarten weg. Zur Sicherheit jährlich exportieren oder eine Papier-Treuekarte parallel pflegen.
      </p>
    </div>
  );
}
