import { useState, useEffect } from 'react';
import {
  loadAlleSubscriber,
  saveAlleSubscriber,
  upsertSubscriber,
  loescheSubscriber,
  toggleBestaetigt,
  exportiereCsv,
  type Subscriber,
} from '../lib/newsletter';

interface Props {
  empfaenger: string; // FIRMA.email zur Anzeige im Hinweis
}

const TODAY = () => new Date().toISOString().slice(0, 10);
const FMT = (iso: string) => {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
};

const SECTION = 'bg-zinc-900 border border-zinc-800 rounded-xl p-5';
const INPUT =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none placeholder-zinc-600';
const LABEL = 'block text-xs text-zinc-400 mb-1';

export default function NewsletterAdmin({ empfaenger }: Props) {
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [suche, setSuche] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [quelle, setQuelle] = useState('Webseite');
  const [notiz, setNotiz] = useState('');

  useEffect(() => {
    setSubs(loadAlleSubscriber());
  }, []);

  const refresh = () => setSubs(loadAlleSubscriber());

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    upsertSubscriber({
      email: email.trim(),
      name: name.trim() || undefined,
      quelle: quelle.trim() || undefined,
      notiz: notiz.trim() || undefined,
      datum: TODAY(),
      bestaetigt: false,
    });
    setEmail(''); setName(''); setNotiz(''); setQuelle('Webseite');
    setFormOpen(false);
    refresh();
  }

  function downloadCsv() {
    const csv = exportiereCsv();
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscriber-${TODAY()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    if (!confirm('ALLE Newsletter-Subscriber unwiderruflich löschen? Dies kann nicht rückgängig gemacht werden.')) return;
    saveAlleSubscriber([]);
    refresh();
  }

  function deleteOne(email: string) {
    if (!confirm(`Subscriber ${email} wirklich löschen?`)) return;
    loescheSubscriber(email);
    refresh();
  }

  function toggle(email: string) {
    toggleBestaetigt(email);
    refresh();
  }

  const gefiltert = suche.trim()
    ? subs.filter((s) =>
        ((s.email || '') + ' ' + (s.name || '') + ' ' + (s.quelle || '') + ' ' + (s.notiz || ''))
          .toLowerCase()
          .includes(suche.toLowerCase())
      )
    : subs;

  const bestaetigt = subs.filter((s) => s.bestaetigt).length;
  const offen = subs.length - bestaetigt;
  const thisMonth = TODAY().slice(0, 7);
  const neuDieserMonat = subs.filter((s) => s.datum.startsWith(thisMonth)).length;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-zinc-100">Newsletter-Subscriber</h1>
        <div className="flex gap-2">
          {subs.length > 0 && (
            <button
              onClick={downloadCsv}
              className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              CSV-Export
            </button>
          )}
          <button
            onClick={() => setFormOpen((v) => !v)}
            className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {formOpen ? 'Schließen' : 'Subscriber eintragen'}
          </button>
        </div>
      </div>

      {/* Wichtiger Hinweis: aktuelles Setup ist halb-manuell */}
      <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-4 mb-5 flex items-start gap-3">
        <svg className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
        </svg>
        <div className="flex-1 text-sm">
          <p className="font-bold text-amber-200 mb-1">So funktioniert der Newsletter aktuell:</p>
          <ol className="text-amber-300/90 text-xs space-y-1 list-decimal ml-4 leading-relaxed">
            <li>Kunde meldet sich auf der Webseite an → Anmeldung kommt per E-Mail an <code className="bg-amber-500/10 px-1 rounded">{empfaenger}</code></li>
            <li>Du antwortest mit kurzer Willkommens-Mail (DSGVO: Bestätigung der Anmeldung)</li>
            <li>Wenn der Kunde antwortet oder nicht widerspricht → hier mit „Subscriber eintragen" hinzufügen</li>
            <li>Wenn du genug zusammen hast (~20 Subscriber) → CSV exportieren und auf <a href="https://www.brevo.com/de/" target="_blank" rel="noopener" className="underline">Brevo</a> hochladen — ab dann läuft alles automatisch</li>
          </ol>
        </div>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Gesamt</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 tabular-nums">{subs.length}</div>
          <div className="text-xs text-zinc-600 mt-1">Subscriber</div>
        </div>
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Bestätigt</div>
          <div className="text-2xl font-bold text-green-400 mt-1 tabular-nums">{bestaetigt}</div>
          <div className="text-xs text-zinc-600 mt-1">Double-Opt-In erfolgt</div>
        </div>
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Offen</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 tabular-nums">{offen}</div>
          <div className="text-xs text-zinc-600 mt-1">Bestätigung ausstehend</div>
        </div>
        <div className={SECTION}>
          <div className="text-xs text-zinc-500 uppercase tracking-wider">Diesen Monat</div>
          <div className="text-2xl font-bold text-zinc-100 mt-1 tabular-nums">+{neuDieserMonat}</div>
          <div className="text-xs text-zinc-600 mt-1">Neu hinzugefügt</div>
        </div>
      </div>

      {/* Eingabe-Form (toggle) */}
      {formOpen && (
        <form onSubmit={add} className={`${SECTION} mb-5`}>
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">
            Neuen Subscriber eintragen
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>E-Mail *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kunde@beispiel.de"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max Mustermann"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Quelle</label>
              <select
                value={quelle}
                onChange={(e) => setQuelle(e.target.value)}
                className={INPUT}
              >
                <option value="Webseite">Webseite</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telefon">Telefon</option>
                <option value="vor Ort">vor Ort</option>
                <option value="Empfehlung">Empfehlung</option>
                <option value="andere">andere</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Notiz (optional)</label>
              <input
                value={notiz}
                onChange={(e) => setNotiz(e.target.value)}
                placeholder="z.B. Hund, möchte Pollen-Tipps"
                className={INPUT}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              Hinzufügen
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="text-zinc-500 hover:text-zinc-300 px-3 py-2 text-sm transition-colors"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Suche */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={suche}
          onChange={(e) => setSuche(e.target.value)}
          placeholder="Suchen nach E-Mail, Name, Quelle, Notiz…"
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none placeholder-zinc-600"
        />
        {subs.length > 0 && (
          <button
            onClick={reset}
            className="text-xs text-zinc-500 hover:text-red-400 px-3 py-2 transition-colors"
            title="Alle Subscriber löschen"
          >
            Alle zurücksetzen
          </button>
        )}
      </div>

      {/* Liste */}
      {subs.length === 0 ? (
        <div className={`${SECTION} text-center py-12`}>
          <p className="text-zinc-400">Noch keine Subscriber.</p>
          <p className="text-zinc-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Sobald sich jemand auf der Webseite einträgt, bekommst du eine Mail. Bestätige die Anmeldung
            und trage den Subscriber dann hier ein.
          </p>
          <button
            onClick={() => setFormOpen(true)}
            className="mt-4 text-amber-500 hover:text-amber-400 font-semibold text-sm"
          >
            Ersten Subscriber eintragen →
          </button>
        </div>
      ) : gefiltert.length === 0 ? (
        <div className={`${SECTION} text-center py-8`}>
          <p className="text-zinc-500 text-sm">Keine Treffer für „{suche}"</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-zinc-800/60 text-zinc-400 text-xs uppercase tracking-wider">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">E-Mail</th>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Quelle</th>
                <th className="text-left px-4 py-3 font-semibold">Eingetragen</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {gefiltert.map((s) => (
                <tr key={s.email} className="border-t border-zinc-800 hover:bg-zinc-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-zinc-100">{s.email}</div>
                    {s.notiz && <div className="text-xs text-zinc-600 mt-0.5 italic">{s.notiz}</div>}
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{s.name || <span className="text-zinc-600">—</span>}</td>
                  <td className="px-4 py-3 text-zinc-400 text-xs">{s.quelle || '—'}</td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums text-xs">{FMT(s.datum)}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggle(s.email)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold transition-colors ${
                        s.bestaetigt
                          ? 'bg-green-500/15 border border-green-500/40 text-green-300'
                          : 'bg-amber-500/15 border border-amber-500/40 text-amber-300'
                      }`}
                      title="Status umschalten"
                    >
                      {s.bestaetigt ? '✓ bestätigt' : '⏳ offen'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteOne(s.email)}
                      className="text-zinc-600 hover:text-red-400 text-xs px-2 py-1 transition-colors"
                      title="Subscriber löschen"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-6 leading-relaxed">
        Daten liegen ausschließlich in diesem Browser (localStorage). Vor Browser-Cache-Löschen unbedingt
        CSV exportieren! Für echten Versand (Newsletter-Tool mit Tracking, Abmelde-Link, automatischer DOI):
        <a href="https://www.brevo.com/de/" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300 ml-1 underline">
          Brevo
        </a>
        {' '}— Free Tier bis 300 Mails/Tag, EU-Server.
      </p>
    </div>
  );
}
