import { useEffect, useState } from 'react';

interface TabelleStatus {
  exists: boolean;
  count: number | null;
  error?: string;
}

interface CheckResult {
  status: 'ok' | 'incomplete' | 'not_configured' | 'client_failed';
  config: { url: boolean; key: boolean };
  tabellen?: Record<string, TabelleStatus>;
  hinweis?: string;
}

const SECTION = 'bg-zinc-900 border border-zinc-800 rounded-xl p-5';
const SQL_PATH = '/sql/schema.sql'; // wird per public/sql geliefert

export default function DatenbankSetup() {
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch('/api/datenbank-check', { credentials: 'include' });
      const data = (await res.json()) as CheckResult;
      setCheck(data);
    } catch (e) {
      setCheck({ status: 'client_failed', config: { url: false, key: false }, hinweis: String(e) });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const statusFarbe = (s?: string) =>
    s === 'ok'
      ? 'bg-green-500/15 border-green-500/40 text-green-300'
      : s === 'incomplete'
      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
      : 'bg-red-500/15 border-red-500/40 text-red-300';

  const statusLabel = (s?: string) =>
    s === 'ok'
      ? '✓ Bereit'
      : s === 'incomplete'
      ? '⚠ Tabellen fehlen'
      : s === 'not_configured'
      ? '✗ Nicht konfiguriert'
      : s === 'client_failed'
      ? '✗ Verbindungsfehler'
      : '…';

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-2">Datenbank-Setup</h1>
      <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl mb-6">
        Damit deine Rechnungen, Treuekunden, Newsletter-Liste und Lager auf <strong>allen Geräten</strong> synchron
        sind (Handy unterwegs, PC zu Hause), brauchen wir eine zentrale Datenbank. Wir nutzen
        <strong className="text-zinc-200"> Supabase</strong> — kostenlos, DSGVO-konform (EU), echtes PostgreSQL.
      </p>

      {/* ── Status ───────────────────────────────────────────────────────── */}
      <div className={`${SECTION} mb-6`}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Verbindungs-Status</p>
          <button
            onClick={refresh}
            disabled={loading}
            className="text-xs text-amber-400 hover:text-amber-300 disabled:opacity-50"
          >
            {loading ? 'prüft…' : '↻ erneut prüfen'}
          </button>
        </div>

        <div className={`rounded-xl border p-4 ${statusFarbe(check?.status)}`}>
          <div className="font-bold mb-1">{statusLabel(check?.status)}</div>
          <div className="text-sm opacity-80">{check?.hinweis ?? (loading ? 'lade…' : 'unbekannt')}</div>
        </div>

        {check?.tabellen && (
          <div className="mt-4">
            <p className="text-xs text-zinc-500 mb-2">Tabellen-Übersicht:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(check.tabellen).map(([name, info]) => (
                <div
                  key={name}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg border ${
                    info.exists ? 'bg-green-500/5 border-green-500/30 text-green-300' : 'bg-red-500/5 border-red-500/30 text-red-300'
                  }`}
                >
                  <span className="font-mono">{name}</span>
                  <span className="font-bold tabular-nums">
                    {info.exists ? `${info.count ?? 0}` : '✗'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Setup-Schritte ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-zinc-100 mb-2">So richtest du Supabase ein (~15 Minuten)</h2>

        <div className={SECTION}>
          <div className="flex items-start gap-4">
            <span className="bg-amber-500 text-zinc-950 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">1</span>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-1">Account anlegen</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Auf <a href="https://supabase.com" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300 underline">supabase.com</a> mit
                deiner E-Mail oder GitHub registrieren. Komplett kostenlos.
              </p>
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <div className="flex items-start gap-4">
            <span className="bg-amber-500 text-zinc-950 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">2</span>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-1">Neues Projekt erstellen</h3>
              <ul className="text-sm text-zinc-400 leading-relaxed space-y-1 list-disc ml-4">
                <li><strong className="text-zinc-200">Name:</strong> z. B. „autoaufbereitung-cloppenburg"</li>
                <li><strong className="text-zinc-200">Database Password:</strong> ein langes, sicheres Passwort — wird gleich automatisch generiert, einfach speichern</li>
                <li><strong className="text-zinc-200">Region:</strong> <code className="bg-zinc-800 px-1 rounded">Europe (Frankfurt) eu-central-1</code> (DSGVO!)</li>
                <li>Projekt wird in 2–3 Minuten erstellt</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <div className="flex items-start gap-4">
            <span className="bg-amber-500 text-zinc-950 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">3</span>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-2">SQL-Schema einspielen</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Im Supabase-Dashboard links auf <strong className="text-zinc-200">„SQL Editor"</strong> → <strong className="text-zinc-200">„New query"</strong>.
                Die untenstehende Datei kopieren und in den Editor einfügen, dann <strong className="text-zinc-200">„Run"</strong> klicken.
              </p>
              <a
                href={SQL_PATH}
                target="_blank"
                rel="noopener"
                download="schema.sql"
                className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-amber-500/15 border border-zinc-700 hover:border-amber-500/50 text-zinc-200 hover:text-amber-300 font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                schema.sql herunterladen
              </a>
              <p className="text-xs text-zinc-500 mt-2">
                Erfolg = „Success. No rows returned." Bei Fehler: nochmal kopieren, nichts auslassen.
              </p>
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <div className="flex items-start gap-4">
            <span className="bg-amber-500 text-zinc-950 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">4</span>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-2">URL + Service-Key kopieren</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Im Supabase-Dashboard links auf <strong className="text-zinc-200">„Project Settings"</strong> (Zahnrad) →
                <strong className="text-zinc-200"> „API"</strong>. Dort findest du:
              </p>
              <ul className="text-sm text-zinc-400 space-y-2 mb-3">
                <li>
                  <strong className="text-zinc-200">Project URL</strong> — sieht aus wie
                  <code className="bg-zinc-800 px-1 rounded text-xs ml-1">https://abcd1234.supabase.co</code>
                </li>
                <li>
                  <strong className="text-zinc-200">Project API keys → service_role</strong> — der <em className="text-amber-400">secret</em> Key, NICHT der „anon" Key!
                  Beginnt mit <code className="bg-zinc-800 px-1 rounded text-xs">eyJhbGciOi...</code>
                </li>
              </ul>
              <div className="bg-red-500/10 border border-red-500/40 rounded-lg p-3 text-xs text-red-300">
                <strong className="text-red-200">⚠ Wichtig:</strong> Den service_role Key NIE in eine E-Mail, Chat oder Git committen!
                Er gibt vollen Zugriff auf alle Daten. Nur in den Environment-Variables einsetzen.
              </div>
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <div className="flex items-start gap-4">
            <span className="bg-amber-500 text-zinc-950 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">5</span>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-2">In Vercel eintragen</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                Vercel Dashboard → dein Projekt → <strong className="text-zinc-200">Settings</strong> →
                <strong className="text-zinc-200"> Environment Variables</strong>. Zwei neue Einträge:
              </p>
              <pre className="bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs text-zinc-300 overflow-x-auto">{`SUPABASE_URL              = https://abcd1234.supabase.co
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...`}</pre>
              <p className="text-sm text-zinc-400 mt-3 leading-relaxed">
                Environment auf <strong className="text-zinc-200">Production, Preview UND Development</strong> setzen
                (alle 3 Häkchen). Danach in Vercel auf „Deployments" → letzten Deploy „Redeploy" klicken.
              </p>
            </div>
          </div>
        </div>

        <div className={SECTION}>
          <div className="flex items-start gap-4">
            <span className="bg-amber-500 text-zinc-950 font-bold w-8 h-8 rounded-lg flex items-center justify-center shrink-0">6</span>
            <div className="flex-1">
              <h3 className="font-bold text-zinc-100 mb-2">Status prüfen</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Nach dem Redeploy: oben auf <strong className="text-zinc-200">„erneut prüfen"</strong> klicken.
                Sobald der Status grün <code className="bg-zinc-800 px-1 rounded text-xs">✓ Bereit</code> zeigt, kann die Migration der bestehenden lokalen Daten starten —
                dafür baue ich dir einen <strong className="text-zinc-200">„localStorage → Datenbank"</strong>-Migrations-Knopf, sobald die Verbindung steht.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-zinc-600 mt-8 leading-relaxed text-center">
        Bei Problemen: Status oben kopieren und sagen — ich helfe direkt.<br />
        Solange Supabase nicht eingerichtet ist, läuft alles wie bisher über localStorage (kein Datenverlust).
      </p>
    </div>
  );
}
