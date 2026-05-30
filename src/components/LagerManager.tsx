import { useState, useEffect, useRef } from 'react';
import {
  type Verbrauchsmittel,
  type Anlagegut,
  EINHEITEN,
  DEFAULT_VERBRAUCH,
  DEFAULT_ANLAGEN,
  fetchLager,
  syncLager,
} from '../lib/lager';

const uid = () => Math.random().toString(36).slice(2, 10);
const EUR = (n: number) =>
  new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n) + ' €';
const TODAY = new Date().toISOString().slice(0, 10);

// ── Verbrauch pro Auftrag (Kalkulation aus Excel) ────────────────────────────
// Keyword muss im Produktnamen enthalten sein (case-insensitive)
const REZEPTE: Record<string, { name: string; menge: number }[]> = {
  'Außen Basic': [
    { name: 'Vorreiniger',          menge: 30 },
    { name: 'Snow Foam',            menge: 30 },
    { name: 'Green Star',           menge: 30 },
    { name: 'Felgenreiniger',       menge: 50 },
    { name: 'Insektenreiniger',     menge: 30 },
    { name: 'Mikrofasertücher',     menge: 2  },
    { name: 'Saugstarkes Trockentuch', menge: 1 },
  ],
  'Innen Basic': [
    { name: 'Mehrzweckreiniger',    menge: 60 },
    { name: 'Pol Star',             menge: 40 },
    { name: 'Glass Cleaner',        menge: 15 },
    { name: 'Mikrofasertücher',     menge: 2  },
    { name: 'Carbon Tuch',          menge: 1  },
  ],
  'Innen Premium': [
    { name: 'Mehrzweckreiniger',    menge: 90  },
    { name: 'Pol Star',             menge: 60  },
    { name: 'Leather Star',         menge: 50  },
    { name: 'Glass Cleaner',        menge: 20  },
    { name: 'Fresh Up',             menge: 15  },
    { name: 'Mikrofasertücher',     menge: 3   },
    { name: 'Carbon Tuch',          menge: 1   },
  ],
  'Innen Detail': [
    { name: 'Mehrzweckreiniger',    menge: 150 },
    { name: 'Pol Star',             menge: 100 },
    { name: 'Leather Star',         menge: 80  },
    { name: 'Glass Cleaner',        menge: 30  },
    { name: 'Fresh Up',             menge: 20  },
    { name: 'Mikrofasertücher',     menge: 4   },
    { name: 'Carbon Tuch',         menge: 2   },
  ],
  'Komplett Basic': [
    { name: 'Vorreiniger',          menge: 30 },
    { name: 'Snow Foam',            menge: 30 },
    { name: 'Green Star',           menge: 30 },
    { name: 'Felgenreiniger',       menge: 50 },
    { name: 'Insektenreiniger',     menge: 30 },
    { name: 'Mehrzweckreiniger',    menge: 60 },
    { name: 'Pol Star',             menge: 40 },
    { name: 'Glass Cleaner',        menge: 20 },
    { name: 'Mikrofasertücher',     menge: 3  },
    { name: 'Carbon Tuch',          menge: 1  },
    { name: 'Saugstarkes Trockentuch', menge: 1 },
  ],
  'Komplett Premium': [
    { name: 'Vorreiniger',          menge: 30  },
    { name: 'Snow Foam',            menge: 30  },
    { name: 'Green Star',           menge: 30  },
    { name: 'Felgenreiniger',       menge: 50  },
    { name: 'Insektenreiniger',     menge: 30  },
    { name: 'Mehrzweckreiniger',    menge: 90  },
    { name: 'Pol Star',             menge: 60  },
    { name: 'Leather Star',         menge: 50  },
    { name: 'Glass Cleaner',        menge: 25  },
    { name: 'Fresh Up',             menge: 15  },
    { name: 'Mikrofasertücher',     menge: 4   },
    { name: 'Carbon Tuch',          menge: 1   },
    { name: 'Saugstarkes Trockentuch', menge: 1 },
  ],
  'Komplett Detail': [
    { name: 'Vorreiniger',          menge: 30  },
    { name: 'Snow Foam',            menge: 30  },
    { name: 'Green Star',           menge: 30  },
    { name: 'Felgenreiniger',       menge: 50  },
    { name: 'Insektenreiniger',     menge: 30  },
    { name: 'Mehrzweckreiniger',    menge: 150 },
    { name: 'Pol Star',             menge: 100 },
    { name: 'Leather Star',         menge: 80  },
    { name: 'Glass Cleaner',        menge: 35  },
    { name: 'Fresh Up',             menge: 20  },
    { name: 'Mikrofasertücher',     menge: 5   },
    { name: 'Carbon Tuch',          menge: 2   },
    { name: 'Saugstarkes Trockentuch', menge: 1 },
  ],
};

// Findet Produkt anhand Teil-Name (case-insensitive)
function matchProduct(products: Verbrauchsmittel[], keyword: string): Verbrauchsmittel | undefined {
  const kw = keyword.toLowerCase();
  return (
    products.find(v => v.name.toLowerCase() === kw) ??
    products.find(v => v.name.toLowerCase().includes(kw)) ??
    products.find(v => kw.includes(v.name.toLowerCase()))
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcRestwert(ag: Anlagegut): number {
  const jahreDiff = (Date.now() - new Date(ag.kaufdatum).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return Math.max(0, ag.kaufpreis - (ag.kaufpreis / ag.nutzungsdauerJahre) * jahreDiff);
}
function calcErsatzDatum(ag: Anlagegut): Date {
  const d = new Date(ag.kaufdatum);
  d.setFullYear(d.getFullYear() + ag.nutzungsdauerJahre);
  return d;
}
function ersatzStatus(ag: Anlagegut): 'gut' | 'bald' | 'faellig' {
  const monate = (calcErsatzDatum(ag).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44);
  return monate < 0 ? 'faellig' : monate < 6 ? 'bald' : 'gut';
}
function bestandStatus(v: Verbrauchsmittel): 'ok' | 'niedrig' | 'kritisch' {
  const r = v.mindestbestand > 0 ? v.bestand / v.mindestbestand : 2;
  return r <= 0.5 ? 'kritisch' : r <= 1 ? 'niedrig' : 'ok';
}

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconEdit() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Z" /></svg>;
}
function IconDelete() {
  return <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    ok:       { label: 'OK',          cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
    niedrig:  { label: 'Niedrig',     cls: 'bg-amber-900/40 text-amber-400 border-amber-800/50' },
    kritisch: { label: 'Kritisch!',   cls: 'bg-red-900/40 text-red-400 border-red-800/50' },
    gut:      { label: 'Gut',         cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-800/50' },
    bald:     { label: 'Bald fällig', cls: 'bg-amber-900/40 text-amber-400 border-amber-800/50' },
    faellig:  { label: 'Ersetzen!',   cls: 'bg-red-900/40 text-red-400 border-red-800/50' },
  };
  const c = map[status] ?? map.ok;
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium border ${c.cls}`}>{c.label}</span>;
}

// ── Produktbalken ─────────────────────────────────────────────────────────────
function ProduktBalken({ v, onBestandChange, onEdit, onDelete }: {
  v: Verbrauchsmittel;
  onBestandChange: (id: string, neu: number) => void;
  onEdit: (v: Verbrauchsmittel) => void;
  onDelete: (id: string) => void;
}) {
  const [localVal, setLocalVal] = useState(String(v.bestand));
  useEffect(() => setLocalVal(String(v.bestand)), [v.bestand]);

  const st = bestandStatus(v);
  const barMax = Math.max(v.bestand, v.nachbestellmenge || v.mindestbestand * 3 || 100);
  const barPct  = Math.min(100, Math.max(1, (v.bestand / barMax) * 100));
  const barColor = st === 'ok' ? '#10b981' : st === 'niedrig' ? '#f59e0b' : '#ef4444';
  const borderColor = st === 'kritisch' ? 'border-red-800/50' : st === 'niedrig' ? 'border-amber-800/30' : 'border-zinc-800';

  const commit = () => {
    const n = parseFloat(localVal);
    if (!isNaN(n) && n >= 0) onBestandChange(v.id, n);
    else setLocalVal(String(v.bestand));
  };

  return (
    <div className={`bg-zinc-900 border ${borderColor} rounded-xl overflow-hidden`}>
      {/* ── Kopfzeile ── */}
      <div className="flex items-center gap-3 px-4 pt-3 pb-2">
        <span className="font-semibold text-sm flex-1 min-w-0 truncate">{v.name}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge status={st} />
          {v.bestellLink && (
            <a href={v.bestellLink} target="_blank" rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors whitespace-nowrap">
              Bestellen →
            </a>
          )}
          <button onClick={() => onEdit(v)} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded" title="Bearbeiten"><IconEdit /></button>
          <button onClick={() => onDelete(v.id)} className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors rounded" title="Löschen"><IconDelete /></button>
        </div>
      </div>

      {/* ── Balken ── */}
      <div className="px-4 pb-2">
        <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${barPct}%`, background: barColor, boxShadow: `0 0 8px ${barColor}55` }}
          />
        </div>
      </div>

      {/* ── Fußzeile: Info + Bestand-Input ── */}
      <div className="flex items-center justify-between px-4 pb-3 gap-4">
        <div className="text-xs text-zinc-500 min-w-0">
          Min: <span className="text-zinc-400">{v.mindestbestand} {v.einheit}</span>
          {v.lieferant && <> · <span>{v.lieferant}</span></>}
          {v.notizen && <> · <span className="italic">{v.notizen}</span></>}
        </div>
        {/* Inline-Bestandseingabe */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-zinc-600">Bestand</span>
          <input
            type="number"
            value={localVal}
            onChange={e => setLocalVal(e.target.value)}
            onBlur={commit}
            onKeyDown={e => e.key === 'Enter' && commit()}
            className="w-20 text-sm text-right bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-0.5 text-zinc-200 focus:border-amber-500/60 outline-none font-medium"
          />
          <span className="text-xs text-zinc-500">{v.einheit}</span>
        </div>
      </div>
    </div>
  );
}

// ── Auftrag-Modal ─────────────────────────────────────────────────────────────
function AuftragModal({ verbrauch, onConfirm, onClose }: {
  verbrauch: Verbrauchsmittel[];
  onConfirm: (deductions: Record<string, number>) => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState(Object.keys(REZEPTE)[2]); // Innen Premium default

  const positionen = (REZEPTE[selected] ?? []).map(r => {
    const produkt = matchProduct(verbrauch, r.name);
    return { ...r, produkt, reicht: produkt ? produkt.bestand >= r.menge : false };
  });

  const confirm = () => {
    const deductions: Record<string, number> = {};
    positionen.forEach(p => { if (p.produkt) deductions[p.produkt.id] = p.menge; });
    onConfirm(deductions);
  };

  const inputCls = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 outline-none focus:border-amber-500/60';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-0.5">Auftrag abrechnen</h3>
        <p className="text-xs text-zinc-500 mb-5">Materialverbrauch automatisch vom Lager abziehen</p>

        <div className="mb-5">
          <label className="block text-xs text-zinc-400 mb-1.5">Leistung</label>
          <select value={selected} onChange={e => setSelected(e.target.value)} className={inputCls}>
            {Object.keys(REZEPTE).map(k => <option key={k}>{k}</option>)}
          </select>
        </div>

        <div className="mb-2">
          <div className="text-xs font-medium text-zinc-400 mb-2">Wird abgezogen (Schätzung):</div>
          <div className="space-y-1.5">
            {positionen.map((p, i) => (
              <div key={i} className={`flex items-center justify-between text-xs rounded-lg px-3 py-2 ${
                !p.produkt
                  ? 'bg-zinc-800/40 opacity-50'
                  : p.reicht
                  ? 'bg-zinc-800'
                  : 'bg-red-950/40 border border-red-800/30'
              }`}>
                <span className="text-zinc-300">{p.produkt?.name ?? p.name}</span>
                <span className={p.reicht || !p.produkt ? 'text-zinc-400' : 'text-red-400 font-medium'}>
                  − {p.menge} {p.produkt?.einheit ?? ''}
                  {!p.produkt && <span className="text-zinc-600 ml-1">(nicht im Lager)</span>}
                  {p.produkt && !p.reicht && (
                    <span className="text-red-500 ml-1">(nur {p.produkt.bestand}!)</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-700 mb-5">Grobe Kalkulation aus deiner Excel. Danach manuell korrigierbar.</p>

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">
            Abbrechen
          </button>
          <button onClick={confirm} className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-semibold hover:bg-amber-500/30 transition-colors">
            Abziehen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Verbrauch-Edit-Modal ───────────────────────────────────────────────────────
function VerbrauchModal({ item, onSave, onClose }: {
  item: Partial<Verbrauchsmittel> | null;
  onSave: (v: Verbrauchsmittel) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Verbrauchsmittel>({
    id: item?.id ?? uid(), name: item?.name ?? '', einheit: item?.einheit ?? 'ml',
    bestand: item?.bestand ?? 0, mindestbestand: item?.mindestbestand ?? 0,
    nachbestellmenge: item?.nachbestellmenge ?? 0, preisProEinheit: item?.preisProEinheit ?? 0,
    lieferant: item?.lieferant ?? '', bestellLink: item?.bestellLink ?? '', notizen: item?.notizen ?? '',
  });
  const set = (k: keyof Verbrauchsmittel) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      setForm(prev => ({ ...prev, [k]: val }));
    };
  const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/60 outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-5">{item?.id ? 'Artikel bearbeiten' : 'Artikel hinzufügen'}</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Name *</label>
            <input value={form.name} onChange={set('name')} className={inp} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Einheit</label>
              <select value={form.einheit} onChange={set('einheit')} className={inp}>
                {EINHEITEN.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Preis / Einheit (€)</label>
              <input type="number" step="0.001" value={form.preisProEinheit} onChange={set('preisProEinheit')} className={inp} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Bestand</label>
              <input type="number" value={form.bestand} onChange={set('bestand')} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Mindestbestand</label>
              <input type="number" value={form.mindestbestand} onChange={set('mindestbestand')} className={inp} />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Bestellmenge</label>
              <input type="number" value={form.nachbestellmenge} onChange={set('nachbestellmenge')} className={inp} />
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Lieferant</label>
            <input value={form.lieferant} onChange={set('lieferant')} className={inp} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Bestell-Link</label>
            <input value={form.bestellLink} onChange={set('bestellLink')} placeholder="https://…" className={inp} />
          </div>
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Notizen</label>
            <textarea value={form.notizen} onChange={set('notizen')} rows={2} className={`${inp} resize-none`} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">Abbrechen</button>
          <button onClick={() => form.name && onSave(form)} disabled={!form.name} className="flex-1 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-40 transition-colors">Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ── Anlagen-Modal ──────────────────────────────────────────────────────────────
function AnlagenModal({ item, onSave, onClose }: {
  item: Partial<Anlagegut> | null;
  onSave: (a: Anlagegut) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Anlagegut>({
    id: item?.id ?? uid(), name: item?.name ?? '', kaufdatum: item?.kaufdatum ?? TODAY,
    kaufpreis: item?.kaufpreis ?? 0, nutzungsdauerJahre: item?.nutzungsdauerJahre ?? 5, notizen: item?.notizen ?? '',
  });
  const set = (k: keyof Anlagegut) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
      setForm(prev => ({ ...prev, [k]: val }));
    };
  const inp = 'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:border-amber-500/60 outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-5">{item?.id ? 'Gerät bearbeiten' : 'Gerät hinzufügen'}</h3>
        <div className="space-y-4">
          <div><label className="block text-xs text-zinc-400 mb-1">Name *</label><input value={form.name} onChange={set('name')} className={inp} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-xs text-zinc-400 mb-1">Kaufdatum</label><input type="date" value={form.kaufdatum} onChange={set('kaufdatum')} className={inp} /></div>
            <div><label className="block text-xs text-zinc-400 mb-1">Kaufpreis (€)</label><input type="number" step="0.01" value={form.kaufpreis} onChange={set('kaufpreis')} className={inp} /></div>
          </div>
          <div><label className="block text-xs text-zinc-400 mb-1">Nutzungsdauer (Jahre)</label><input type="number" min="1" max="20" value={form.nutzungsdauerJahre} onChange={set('nutzungsdauerJahre')} className={inp} /></div>
          <div><label className="block text-xs text-zinc-400 mb-1">Notizen</label><textarea value={form.notizen} onChange={set('notizen')} rows={2} className={`${inp} resize-none`} /></div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-zinc-700 text-zinc-400 text-sm hover:bg-zinc-800 transition-colors">Abbrechen</button>
          <button onClick={() => form.name && onSave(form)} disabled={!form.name} className="flex-1 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-40 transition-colors">Speichern</button>
        </div>
      </div>
    </div>
  );
}

// ── Hauptkomponente ────────────────────────────────────────────────────────────
export default function LagerManager() {
  const [tab, setTab] = useState<'verbrauch' | 'anlagen' | 'kosten'>('verbrauch');
  const [verbrauch, setVerbrauch] = useState<Verbrauchsmittel[]>([]);
  const [anlagen, setAnlagen]     = useState<Anlagegut[]>([]);
  const [vModal,  setVModal]      = useState<Partial<Verbrauchsmittel> | null | false>(false);
  const [aModal,  setAModal]      = useState<Partial<Anlagegut> | null | false>(false);
  const [auftragModal, setAuftragModal] = useState(false);
  const [toast, setToast]         = useState('');
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');

  const skipSync   = useRef(true);   // erste Daten-Setzung (Laden) nicht zurückspeichern
  const syncTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial laden — frische Datenbank wird mit dem Default-Katalog befüllt
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const data = await fetchLager();
        if (cancel) return;
        if (data.verbrauch.length === 0 && data.anlagen.length === 0) {
          skipSync.current = false;            // Defaults müssen gespeichert werden
          setVerbrauch(DEFAULT_VERBRAUCH);
          setAnlagen(DEFAULT_ANLAGEN);
        } else {
          skipSync.current = true;             // geladene Daten nicht sofort zurückschreiben
          setVerbrauch(data.verbrauch);
          setAnlagen(data.anlagen);
        }
      } catch {
        if (!cancel) setError('Lager konnte nicht geladen werden. Läuft die Datenbank?');
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => { cancel = true; };
  }, []);

  // Debounced Auto-Save bei jeder Änderung (Bulk-Sync zur Datenbank)
  useEffect(() => {
    if (loading) return;
    if (skipSync.current) { skipSync.current = false; return; }
    if (syncTimer.current) clearTimeout(syncTimer.current);
    setSaveState('saving');
    syncTimer.current = setTimeout(async () => {
      try {
        await syncLager({ verbrauch, anlagen });
        setError('');
        setSaveState('saved');
        if (savedTimer.current) clearTimeout(savedTimer.current);
        savedTimer.current = setTimeout(() => setSaveState('idle'), 1500);
      } catch {
        setError('Speichern fehlgeschlagen — Änderung evtl. nicht gesichert.');
        setSaveState('idle');
      }
    }, 700);
    return () => { if (syncTimer.current) clearTimeout(syncTimer.current); };
  }, [verbrauch, anlagen, loading]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const updateBestand = (id: string, neu: number) =>
    setVerbrauch(prev => prev.map(v => v.id === id ? { ...v, bestand: neu } : v));

  const saveVerbrauch = (v: Verbrauchsmittel) => {
    setVerbrauch(prev => {
      const idx = prev.findIndex(x => x.id === v.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = v; return n; }
      return [...prev, v];
    });
    setVModal(false);
  };
  const deleteVerbrauch = (id: string) => {
    if (window.confirm('Artikel wirklich löschen?')) setVerbrauch(prev => prev.filter(x => x.id !== id));
  };

  const saveAnlage = (a: Anlagegut) => {
    setAnlagen(prev => {
      const idx = prev.findIndex(x => x.id === a.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = a; return n; }
      return [...prev, a];
    });
    setAModal(false);
  };
  const deleteAnlage = (id: string) => {
    if (window.confirm('Gerät wirklich löschen?')) setAnlagen(prev => prev.filter(x => x.id !== id));
  };

  const handleAuftrag = (deductions: Record<string, number>) => {
    setVerbrauch(prev =>
      prev.map(v => deductions[v.id] != null
        ? { ...v, bestand: Math.max(0, v.bestand - deductions[v.id]) }
        : v
      )
    );
    setAuftragModal(false);
    showToast('Materialverbrauch wurde abgezogen ✓');
  };

  const kritisch = verbrauch.filter(v => bestandStatus(v) !== 'ok');
  const gesamtKaufwert  = anlagen.reduce((s, a) => s + a.kaufpreis, 0);
  const gesamtRestwert  = anlagen.reduce((s, a) => s + calcRestwert(a), 0);
  const monatlichV      = verbrauch.reduce((s, v) => s + (v.nachbestellmenge * v.preisProEinheit) / 3, 0);
  const restwertPct     = gesamtKaufwert > 0 ? (gesamtRestwert / gesamtKaufwert) * 100 : 100;

  const sortedByStatus = <T,>(arr: T[], fn: (x: T) => string, order: Record<string, number>) =>
    [...arr].sort((a, b) => (order[fn(a)] ?? 9) - (order[fn(b)] ?? 9));

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center text-zinc-500 text-sm">
        Lager wird geladen …
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto relative">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-emerald-900 border border-emerald-700 text-emerald-300 text-sm px-4 py-2 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* Speicher-Status */}
      {saveState !== 'idle' && (
        <div className={`fixed top-4 right-4 z-40 text-xs px-3 py-1.5 rounded-lg border ${
          saveState === 'saving'
            ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
            : 'bg-emerald-900/60 border-emerald-700/60 text-emerald-300'
        }`}>
          {saveState === 'saving' ? 'Speichert …' : 'Gespeichert ✓'}
        </div>
      )}

      {/* Fehler-Banner */}
      {error && (
        <div className="mb-4 bg-red-950/40 border border-red-800/40 text-red-300 text-sm px-4 py-2.5 rounded-xl">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-1">
        {(['verbrauch', 'anlagen', 'kosten'] as const).map(t => {
          const labels = { verbrauch: 'Verbrauchsmittel', anlagen: 'Anlagegüter', kosten: 'Kosten' };
          return (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                tab === t ? 'bg-zinc-800 text-zinc-100 shadow' : 'text-zinc-500 hover:text-zinc-300'
              }`}>
              {labels[t]}
              {t === 'verbrauch' && kritisch.length > 0 && (
                <span className="ml-1.5 bg-red-500/80 text-white text-xs rounded-full px-1.5 py-0.5">{kritisch.length}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══ VERBRAUCHSMITTEL ═══ */}
      {tab === 'verbrauch' && (
        <div>
          <div className="flex items-center justify-between mb-4 gap-3">
            <div>
              <h2 className="font-bold text-lg">Verbrauchsmittel</h2>
              <p className="text-xs text-zinc-500 mt-0.5">
                {verbrauch.length} Artikel · {kritisch.length > 0 ? `${kritisch.length} unter Mindestbestand` : 'Alles ausreichend'}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Auftrag abrechnen */}
              <button onClick={() => setAuftragModal(true)}
                className="px-4 py-2 bg-amber-500/25 border border-amber-500/50 text-amber-200 text-sm font-semibold rounded-xl hover:bg-amber-500/35 transition-colors">
                Auftrag abrechnen
              </button>
              <button onClick={() => setVModal(null)}
                className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium rounded-xl hover:bg-zinc-750 hover:border-zinc-600 transition-colors">
                + Artikel
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {sortedByStatus(verbrauch, bestandStatus, { kritisch: 0, niedrig: 1, ok: 2 }).map(v => (
              <ProduktBalken
                key={v.id}
                v={v}
                onBestandChange={updateBestand}
                onEdit={v => setVModal(v)}
                onDelete={deleteVerbrauch}
              />
            ))}
          </div>
          <p className="text-xs text-zinc-700 mt-4 text-center">
            Bestand direkt im Feld rechts anpassen → Enter oder Klick außerhalb speichert
          </p>
        </div>
      )}

      {/* ═══ ANLAGEGÜTER ═══ */}
      {tab === 'anlagen' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-lg">Anlagegüter & Geräte</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Lineare Abschreibung</p>
            </div>
            <button onClick={() => setAModal(null)}
              className="px-4 py-2 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm font-medium rounded-xl hover:bg-zinc-750 hover:border-zinc-600 transition-colors">
              + Gerät
            </button>
          </div>

          <div className="space-y-2">
            {sortedByStatus(anlagen, ersatzStatus, { faellig: 0, bald: 1, gut: 2 }).map(a => {
              const rw  = calcRestwert(a);
              const pct = a.kaufpreis > 0 ? (rw / a.kaufpreis) * 100 : 0;
              const st  = ersatzStatus(a);
              const barColor = pct > 50 ? '#10b981' : pct > 20 ? '#f59e0b' : '#ef4444';
              const borderColor = st === 'faellig' ? 'border-red-800/50' : st === 'bald' ? 'border-amber-800/30' : 'border-zinc-800';
              return (
                <div key={a.id} className={`bg-zinc-900 border ${borderColor} rounded-xl overflow-hidden`}>
                  <div className="flex items-center gap-3 px-4 pt-3 pb-2">
                    <span className="font-semibold text-sm flex-1">{a.name}</span>
                    <Badge status={st} />
                    <button onClick={() => setAModal(a)} className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors rounded"><IconEdit /></button>
                    <button onClick={() => deleteAnlage(a.id)} className="p-1.5 text-zinc-700 hover:text-red-400 transition-colors rounded"><IconDelete /></button>
                  </div>
                  {/* Abschreibungs-Balken */}
                  <div className="px-4 pb-2">
                    <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(1, pct)}%`, background: barColor, boxShadow: `0 0 8px ${barColor}55` }} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 px-4 pb-3 text-xs text-zinc-500">
                    <span>Kaufpreis: <span className="text-zinc-300">{EUR(a.kaufpreis)}</span></span>
                    <span>Restwert: <span className="text-zinc-300">{EUR(rw)}</span> ({pct.toFixed(0)} %)</span>
                    <span>Ersetzen: <span className="text-zinc-300">{calcErsatzDatum(a).toLocaleDateString('de-DE')}</span></span>
                    {a.notizen && <span className="italic">{a.notizen}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ KOSTEN ═══ */}
      {tab === 'kosten' && (
        <div>
          <h2 className="font-bold text-lg mb-4">Kosten-Übersicht</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Investiert Geräte', value: EUR(gesamtKaufwert), sub: `${anlagen.length} Geräte`, color: '' },
              { label: 'Restwert Geräte',   value: EUR(gesamtRestwert), sub: `${restwertPct.toFixed(0)} % verbleibend`, color: '' },
              { label: 'Verbrauch / Monat', value: EUR(monatlichV), sub: 'grobe Schätzung', color: '' },
              { label: 'Nachbestellen',      value: String(kritisch.length), sub: `von ${verbrauch.length} Artikeln`, color: kritisch.length > 0 ? 'text-red-400' : 'text-emerald-400' },
            ].map(c => (
              <div key={c.label} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
                <div className="text-xs text-zinc-500 mb-1">{c.label}</div>
                <div className={`text-xl font-bold ${c.color || 'text-zinc-100'}`}>{c.value}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{c.sub}</div>
              </div>
            ))}
          </div>

          {kritisch.length > 0 && (
            <div className="mb-5">
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Sofort nachbestellen</h3>
              <div className="space-y-1">
                {kritisch.map(v => (
                  <div key={v.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="text-sm font-medium">{v.name}</span>
                      <span className="text-xs text-zinc-500 ml-3">noch {v.bestand} {v.einheit} · Min. {v.mindestbestand} {v.einheit}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge status={bestandStatus(v)} />
                      {v.bestellLink && (
                        <a href={v.bestellLink} target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs rounded-lg hover:bg-amber-500/30 transition-colors">
                          Bestellen →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {anlagen.filter(a => ersatzStatus(a) !== 'gut').length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-zinc-400 mb-2">Geräte — Ersetzen prüfen</h3>
              <div className="space-y-1">
                {anlagen.filter(a => ersatzStatus(a) !== 'gut').map(a => (
                  <div key={a.id} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium">{a.name}</span>
                      <span className="text-xs text-zinc-500 ml-3">Ersatz: {calcErsatzDatum(a).toLocaleDateString('de-DE')}</span>
                    </div>
                    <Badge status={ersatzStatus(a)} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {kritisch.length === 0 && anlagen.filter(a => ersatzStatus(a) !== 'gut').length === 0 && (
            <div className="text-center text-zinc-600 py-10">Alles im grünen Bereich</div>
          )}
        </div>
      )}

      {/* Modals */}
      {auftragModal && <AuftragModal verbrauch={verbrauch} onConfirm={handleAuftrag} onClose={() => setAuftragModal(false)} />}
      {vModal !== false && <VerbrauchModal item={vModal} onSave={saveVerbrauch} onClose={() => setVModal(false)} />}
      {aModal !== false && <AnlagenModal item={aModal} onSave={saveAnlage} onClose={() => setAModal(false)} />}
    </div>
  );
}
