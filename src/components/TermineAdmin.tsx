import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  fetchTermine,
  patchTermin,
  deleteTermin,
  formatDatum,
  STATUS_LABEL,
  ZEIT_KURZ,
  type Termin,
  type TerminStatus,
} from '../lib/termine';

/** 'HH:MM' + Minuten → End-Uhrzeit 'HH:MM'. */
function endeVon(start: string, dauerMin: number): string {
  if (!start) return '';
  const [h, m] = start.split(':').map(Number);
  const tot = (h || 0) * 60 + (m || 0) + (dauerMin || 0);
  return `${String(Math.floor(tot / 60)).padStart(2, '0')}:${String(tot % 60).padStart(2, '0')}`;
}

const STATUS_STYLE: Record<TerminStatus, string> = {
  offen: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  bestaetigt: 'bg-green-500/15 text-green-300 border-green-500/40',
  erledigt: 'bg-zinc-600/20 text-zinc-300 border-zinc-500/40',
  abgesagt: 'bg-red-500/15 text-red-300 border-red-500/40',
};

const eur = (n: number) => n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

const INPUT =
  'bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none [color-scheme:dark]';

// ── Einzelne Termin-Karte ─────────────────────────────────────────────────────
function TerminCard({
  t,
  onPatched,
  onDeleted,
}: {
  t: Termin;
  onPatched: (t: Termin) => void;
  onDeleted: (id: string) => void;
}) {
  const [bestDatum, setBestDatum] = useState(t.bestaetigtDatum || t.wunschDatum);
  const [bestZeit, setBestZeit] = useState(t.bestaetigtZeit || t.startZeit);
  const [adminNotiz, setAdminNotiz] = useState(t.adminNotiz);
  const [busy, setBusy] = useState(false);
  const [fehler, setFehler] = useState('');

  async function run(patch: Parameters<typeof patchTermin>[1], optimistic: Partial<Termin>) {
    setBusy(true);
    setFehler('');
    try {
      await patchTermin(t.id, patch);
      onPatched({ ...t, ...optimistic });
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fehler');
    } finally {
      setBusy(false);
    }
  }

  const bestaetigen = () =>
    run(
      { status: 'bestaetigt', bestaetigtDatum: bestDatum, bestaetigtZeit: bestZeit },
      { status: 'bestaetigt', bestaetigtDatum: bestDatum, bestaetigtZeit: bestZeit }
    );
  const setStatus = (status: TerminStatus) => run({ status }, { status });
  const notizSpeichern = () => run({ adminNotiz }, { adminNotiz });

  async function loeschen() {
    if (!confirm('Diesen Termin wirklich löschen?')) return;
    setBusy(true);
    try {
      await deleteTermin(t.id);
      onDeleted(t.id);
    } catch (e) {
      setFehler(e instanceof Error ? e.message : 'Fehler');
      setBusy(false);
    }
  }

  const rechnungUrl =
    '/admin/rechnung?' +
    new URLSearchParams({
      vorname: t.name,
      kEmail: t.email,
      kTelefon: t.telefon,
      strasse: t.strasse,
      plz: t.plz,
      ort: t.ort,
      fahrzeug: t.kennzeichen,
      paket: t.paket,
      preis: t.preis.toFixed(2),
    }).toString();

  const eingang = new Date(t.createdAt).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      {/* Kopf */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-zinc-100">{t.name || 'Ohne Namen'}</h3>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${STATUS_STYLE[t.status]}`}>
              {STATUS_LABEL[t.status]}
            </span>
          </div>
          <p className="text-xs text-zinc-500 mt-0.5">Eingegangen: {eingang}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-lg font-black text-amber-400">{eur(t.preis)}</p>
        </div>
      </div>

      {/* Wunschtermin */}
      <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 mb-3">
        <p className="text-xs text-zinc-500 mb-0.5">Wunschtermin des Kunden</p>
        <p className="text-sm font-semibold text-zinc-100">
          {t.wunschDatum ? formatDatum(t.wunschDatum) : '—'}
          {t.startZeit
            ? ` · ${t.startZeit}–${endeVon(t.startZeit, t.dauerMin)} Uhr`
            : t.wunschZeit
              ? ' · ' + (ZEIT_KURZ[t.wunschZeit] ?? t.wunschZeit)
              : ''}
          {t.dauerMin ? <span className="text-zinc-500 font-normal"> ({(t.dauerMin / 60).toLocaleString('de-DE')} h)</span> : null}
        </p>
        {t.status === 'bestaetigt' && t.bestaetigtDatum && (
          <p className="text-sm text-green-300 mt-1">
            ✓ Bestätigt: {formatDatum(t.bestaetigtDatum)}
            {t.bestaetigtZeit ? ' · ' + (ZEIT_KURZ[t.bestaetigtZeit] ?? t.bestaetigtZeit) : ''}
          </p>
        )}
      </div>

      {/* Details */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm mb-3">
        <Detail label="Leistung" value={t.paket} />
        <Detail label="Ort" value={t.reinigungsort === 'beiuns' ? 'Bei uns in Cloppenburg' : 'Vor Ort beim Kunden'} />
        {t.aufpreise && <Detail label="Aufpreise" value={t.aufpreise} />}
        {t.entfernungKm > 0 && <Detail label="Entfernung" value={`${t.entfernungKm} km`} />}
        {t.kennzeichen && <Detail label="Fahrzeug" value={t.kennzeichen} />}
        <Detail
          label="Telefon"
          value={<a href={`tel:${t.telefon}`} className="text-amber-400 hover:underline">{t.telefon}</a>}
        />
        <Detail
          label="E-Mail"
          value={<a href={`mailto:${t.email}`} className="text-amber-400 hover:underline break-all">{t.email}</a>}
        />
        <Detail label="Adresse" value={`${t.strasse}, ${t.plz} ${t.ort}`} />
      </dl>

      {t.notiz && (
        <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg p-3 mb-3">
          <p className="text-xs text-zinc-500 mb-0.5">Nachricht des Kunden</p>
          <p className="text-sm text-zinc-200 whitespace-pre-wrap">{t.notiz}</p>
        </div>
      )}

      {/* Bestätigen (nur offen) */}
      {t.status === 'offen' && (
        <div className="flex flex-wrap items-end gap-2 mb-3 border-t border-zinc-800 pt-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Termin am</label>
            <input type="date" value={bestDatum} onChange={(e) => setBestDatum(e.target.value)} className={INPUT} />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Uhrzeit</label>
            <input type="time" value={bestZeit} onChange={(e) => setBestZeit(e.target.value)} className={INPUT} />
          </div>
          <button
            onClick={bestaetigen}
            disabled={busy || !bestDatum}
            className="btn-gold px-4 py-2 rounded-lg font-bold text-sm cursor-pointer disabled:opacity-50"
          >
            ✓ Bestätigen
          </button>
        </div>
      )}

      {/* Aktionen */}
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800 pt-3">
        {t.status === 'bestaetigt' && (
          <button onClick={() => setStatus('erledigt')} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer">
            Als erledigt markieren
          </button>
        )}
        {(t.status === 'offen' || t.status === 'bestaetigt') && (
          <button onClick={() => setStatus('abgesagt')} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-red-500/20 hover:text-red-300 text-zinc-200 cursor-pointer">
            Absagen
          </button>
        )}
        {(t.status === 'abgesagt' || t.status === 'erledigt') && (
          <button onClick={() => setStatus('offen')} disabled={busy} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 cursor-pointer">
            Wieder öffnen
          </button>
        )}
        <a href={rechnungUrl} className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 no-underline">
          Rechnung erstellen
        </a>
        <button onClick={loeschen} disabled={busy} className="ml-auto px-3 py-1.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 cursor-pointer">
          Löschen
        </button>
      </div>

      {/* Interne Notiz */}
      <div className="mt-3">
        <textarea
          value={adminNotiz}
          onChange={(e) => setAdminNotiz(e.target.value)}
          rows={1}
          placeholder="Interne Notiz …"
          className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-200 text-sm focus:border-amber-500 focus:outline-none resize-y"
        />
        {adminNotiz !== t.adminNotiz && (
          <button onClick={notizSpeichern} disabled={busy} className="mt-1 text-xs text-amber-400 hover:underline cursor-pointer">
            Notiz speichern
          </button>
        )}
      </div>

      {fehler && <p className="mt-2 text-sm text-red-400">{fehler}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="text-zinc-500 shrink-0">{label}:</dt>
      <dd className="text-zinc-200">{value}</dd>
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────
type Filter = 'alle' | TerminStatus;

export default function TermineAdmin() {
  const [termine, setTermine] = useState<Termin[]>([]);
  const [loading, setLoading] = useState(true);
  const [fehler, setFehler] = useState('');
  const [filter, setFilter] = useState<Filter>('offen');

  useEffect(() => {
    let aktiv = true;
    (async () => {
      try {
        const data = await fetchTermine();
        if (aktiv) setTermine(data);
      } catch (e) {
        if (aktiv) setFehler(e instanceof Error ? e.message : 'Laden fehlgeschlagen');
      } finally {
        if (aktiv) setLoading(false);
      }
    })();
    return () => {
      aktiv = false;
    };
  }, []);

  const zaehler = useMemo(() => {
    const z: Record<string, number> = { alle: termine.length, offen: 0, bestaetigt: 0, erledigt: 0, abgesagt: 0 };
    for (const t of termine) z[t.status]++;
    return z;
  }, [termine]);

  const sichtbar = useMemo(() => {
    const list = filter === 'alle' ? termine : termine.filter((t) => t.status === filter);
    // Offene zuerst nach Wunschdatum, sonst nach Eingang
    return [...list];
  }, [termine, filter]);

  const onPatched = (u: Termin) => setTermine((prev) => prev.map((t) => (t.id === u.id ? u : t)));
  const onDeleted = (id: string) => setTermine((prev) => prev.filter((t) => t.id !== id));

  const TABS: { wert: Filter; label: string }[] = [
    { wert: 'offen', label: 'Offen' },
    { wert: 'bestaetigt', label: 'Bestätigt' },
    { wert: 'erledigt', label: 'Erledigt' },
    { wert: 'abgesagt', label: 'Abgesagt' },
    { wert: 'alle', label: 'Alle' },
  ];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-black tracking-tighter mb-1">Termine</h1>
      <p className="text-sm text-zinc-500 mb-6">Buchungsanfragen aus dem Preisrechner — bestätigen, ändern, abschließen.</p>

      {/* Filter-Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.wert}
            onClick={() => setFilter(tab.wert)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
              filter === tab.wert ? 'bg-amber-500 text-zinc-900' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-100 border border-zinc-800'
            }`}
          >
            {tab.label} <span className="opacity-70">({zaehler[tab.wert] ?? 0})</span>
          </button>
        ))}
      </div>

      {loading && <p className="text-zinc-500 text-sm">Lädt …</p>}
      {fehler && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-sm text-red-300">{fehler}</div>
      )}

      {!loading && !fehler && sichtbar.length === 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center text-zinc-500">
          Keine Termine in dieser Ansicht.
        </div>
      )}

      <div className="space-y-4">
        {sichtbar.map((t) => (
          <TerminCard key={t.id} t={t} onPatched={onPatched} onDeleted={onDeleted} />
        ))}
      </div>
    </div>
  );
}
