import { useEffect, useMemo, useState } from 'react';

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

interface BereichErgebnis {
  imported: number;
  skipped: number;
  errors: string[];
}
interface TreueErgebnis extends BereichErgebnis {
  einloesungen: number;
}
interface MigrationsErgebnis {
  treue: TreueErgebnis;
  newsletter: BereichErgebnis;
  rechnungen: BereichErgebnis;
  lager_verbrauch: BereichErgebnis;
  lager_anlagen: BereichErgebnis;
}

const SECTION = 'bg-zinc-900 border border-zinc-800 rounded-xl p-5';
const SQL_PATH = '/sql/schema.sql'; // wird per public/sql geliefert

// localStorage-Keys, die wir migrieren (müssen synchron zu lib/treue.ts, lib/newsletter.ts, RechnungsGenerator.tsx, LagerManager.tsx bleiben)
const LS_KEYS = {
  treue: 'treue_stempel_v1',
  newsletter: 'newsletter_subscriber_v1',
  rechnungen: 'rechnungen_archiv_v1',
  lager_verbrauch: 'lager_verbrauch_v3',
  lager_anlagen: 'lager_anlagen_v3',
} as const;

function readLs<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const s = window.localStorage.getItem(key);
    if (!s) return [];
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}

interface VorschauZahlen {
  treue: number;
  newsletter: number;
  rechnungen: number;
  lager_verbrauch: number;
  lager_anlagen: number;
}

export default function DatenbankSetup() {
  const [check, setCheck] = useState<CheckResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [vorschau, setVorschau] = useState<VorschauZahlen | null>(null);
  const [migration, setMigration] = useState<{
    state: 'idle' | 'sending' | 'done' | 'error';
    ergebnis?: MigrationsErgebnis;
    fehler?: string;
  }>({ state: 'idle' });

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
    // Vorschau-Zahlen aus localStorage (lokal pro Browser)
    setVorschau({
      treue: readLs(LS_KEYS.treue).length,
      newsletter: readLs(LS_KEYS.newsletter).length,
      rechnungen: readLs(LS_KEYS.rechnungen).length,
      lager_verbrauch: readLs(LS_KEYS.lager_verbrauch).length,
      lager_anlagen: readLs(LS_KEYS.lager_anlagen).length,
    });
  }, []);

  const gesamtVorschau = useMemo(
    () =>
      vorschau
        ? vorschau.treue + vorschau.newsletter + vorschau.rechnungen + vorschau.lager_verbrauch + vorschau.lager_anlagen
        : 0,
    [vorschau]
  );

  async function migrieren() {
    setMigration({ state: 'sending' });
    try {
      const payload = {
        treue: readLs(LS_KEYS.treue),
        newsletter: readLs(LS_KEYS.newsletter),
        rechnungen: readLs(LS_KEYS.rechnungen),
        lager_verbrauch: readLs(LS_KEYS.lager_verbrauch),
        lager_anlagen: readLs(LS_KEYS.lager_anlagen),
      };
      const res = await fetch('/api/migration', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        setMigration({ state: 'error', fehler: `HTTP ${res.status}: ${txt}` });
        return;
      }
      const data = (await res.json()) as { ok: boolean; ergebnis: MigrationsErgebnis };
      setMigration({ state: 'done', ergebnis: data.ergebnis });
      // Counts in Status-Übersicht aktualisieren
      void refresh();
    } catch (e) {
      setMigration({ state: 'error', fehler: String(e) });
    }
  }

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
                Sobald der Status grün <code className="bg-zinc-800 px-1 rounded text-xs">✓ Bereit</code> zeigt, erscheint unten die
                Migrations-Sektion, um die in diesem Browser vorhandenen lokalen Daten in die Datenbank zu übertragen.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Migration: localStorage → Supabase ───────────────────────────── */}
      {check?.status === 'ok' && vorschau && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-zinc-100 mb-2">Daten aus diesem Browser in die Datenbank übertragen</h2>
          <p className="text-sm text-zinc-400 leading-relaxed mb-4 max-w-2xl">
            Die folgenden Einträge liegen aktuell nur im <strong className="text-zinc-200">localStorage dieses Browsers</strong>.
            Übertragung schreibt sie nach Supabase, sodass sie auf jedem Gerät sichtbar sind.
            Wiederholbar — bestehende Einträge werden überschrieben, nicht dupliziert.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {[
              { label: 'Treuekunden', n: vorschau.treue },
              { label: 'Newsletter', n: vorschau.newsletter },
              { label: 'Rechnungen', n: vorschau.rechnungen },
              { label: 'Verbrauch', n: vorschau.lager_verbrauch },
              { label: 'Anlagen', n: vorschau.lager_anlagen },
            ].map((b) => (
              <div
                key={b.label}
                className={`rounded-lg border px-3 py-2 text-center ${
                  b.n > 0
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
              >
                <div className="text-2xl font-bold tabular-nums">{b.n}</div>
                <div className="text-xs uppercase tracking-wider opacity-80">{b.label}</div>
              </div>
            ))}
          </div>

          {gesamtVorschau === 0 ? (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
              In diesem Browser sind keine lokalen Daten gespeichert — entweder ist alles schon migriert oder du hast
              hier noch keine Treuekunden / Newsletter-Anmeldungen / Rechnungen / Lager-Einträge angelegt.
            </div>
          ) : (
            <div className={SECTION}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-zinc-300">
                  Insgesamt <strong className="text-amber-300">{gesamtVorschau}</strong> Einträge bereit zur Übertragung.
                </p>
                <button
                  onClick={migrieren}
                  disabled={migration.state === 'sending'}
                  className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-wait text-zinc-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  {migration.state === 'sending' ? 'überträgt…' : 'Jetzt übertragen'}
                </button>
              </div>

              {migration.state === 'error' && (
                <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
                  <strong className="text-red-200">Fehler:</strong> {migration.fehler}
                </div>
              )}

              {migration.state === 'done' && migration.ergebnis && (
                <div className="mt-4 space-y-2">
                  <div className="rounded-lg border border-green-500/40 bg-green-500/10 p-3 text-sm text-green-300">
                    <strong className="text-green-200">Fertig.</strong> Die Daten liegen jetzt in Supabase. Die einzelnen Bereiche
                    (Treue, Newsletter, Rechnungen, Lager) lesen aktuell noch aus localStorage und werden in den nächsten Schritten
                    auf die Datenbank umgestellt.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {(
                      [
                        ['Treuekunden', migration.ergebnis.treue, ` + ${migration.ergebnis.treue.einloesungen} Einlösungen`],
                        ['Newsletter', migration.ergebnis.newsletter, ''],
                        ['Rechnungen', migration.ergebnis.rechnungen, ''],
                        ['Verbrauchsmittel', migration.ergebnis.lager_verbrauch, ''],
                        ['Anlagegüter', migration.ergebnis.lager_anlagen, ''],
                      ] as [string, BereichErgebnis, string][]
                    ).map(([label, b, suffix]) => {
                      const hatFehler = b.errors.length > 0;
                      return (
                        <div
                          key={label}
                          className={`rounded-lg border px-3 py-2 ${
                            hatFehler
                              ? 'bg-red-500/5 border-red-500/30 text-red-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className="font-bold text-zinc-200">{label}</div>
                          <div className="opacity-80">
                            {b.imported} übertragen{suffix}
                            {b.skipped > 0 && ` · ${b.skipped} übersprungen`}
                            {hatFehler && ` · ${b.errors.length} Fehler`}
                          </div>
                          {hatFehler && (
                            <ul className="mt-1 text-[10px] list-disc ml-4 opacity-90">
                              {b.errors.slice(0, 3).map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                              {b.errors.length > 3 && <li>… und {b.errors.length - 3} weitere</li>}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-zinc-600 mt-8 leading-relaxed text-center">
        Bei Problemen: Status oben kopieren und sagen — ich helfe direkt.<br />
        Solange Supabase nicht eingerichtet ist, läuft alles wie bisher über localStorage (kein Datenverlust).
      </p>
    </div>
  );
}
