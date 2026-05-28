import { useState } from 'react';

export default function NewsletterAnmeldung() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [dsgvo, setDsgvo] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'success_doi' | 'error'>('idle');
  const [fehler, setFehler] = useState('');

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !dsgvo) return;
    setStatus('sending');
    setFehler('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        doi?: boolean;
        error?: string;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setStatus(data.doi ? 'success_doi' : 'success');
    } catch (err) {
      setFehler(err instanceof Error ? err.message : 'Unbekannter Fehler');
      setStatus('error');
    }
  }

  if (status === 'success_doi') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 mb-3">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
        </div>
        <p className="font-bold text-amber-200 text-lg">Bestätigungs-Mail unterwegs!</p>
        <p className="text-amber-300/80 text-sm mt-2 leading-relaxed max-w-md mx-auto">
          Wir haben dir gerade eine Bestätigungs-Mail geschickt. Klick einfach den Link drin —
          danach bist du dabei. Schau auch im Spam-Ordner, falls sie nicht sofort ankommt.
        </p>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/40 mb-3">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
        <p className="font-bold text-amber-200 text-lg">Danke für die Anmeldung!</p>
        <p className="text-amber-300/80 text-sm mt-2 leading-relaxed max-w-md mx-auto">
          Wir bestätigen deine Anmeldung in Kürze per E-Mail.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} className="max-w-2xl mx-auto">
      {/* Honeypot — für Menschen unsichtbar, Bots füllen es aus. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dein Vorname (optional)"
          className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:border-amber-500/60 focus:outline-none placeholder-zinc-600"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="deine@email.de"
          className="flex-1 bg-zinc-900/80 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-100 text-sm focus:border-amber-500/60 focus:outline-none placeholder-zinc-600"
        />
        <button
          type="submit"
          disabled={!dsgvo || status === 'sending'}
          className="btn-gold px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {status === 'sending' ? 'wird gesendet…' : 'Newsletter abonnieren'}
        </button>
      </div>

      <label className="flex items-start gap-2 text-xs text-zinc-500 leading-relaxed cursor-pointer">
        <input
          type="checkbox"
          checked={dsgvo}
          onChange={(e) => setDsgvo(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50 cursor-pointer"
        />
        <span>
          Ich willige ein, dass meine E-Mail-Adresse für den Versand des Newsletters gespeichert wird.
          Die Anmeldung kann ich jederzeit per Klick im Newsletter widerrufen. Mehr in der{' '}
          <a href="/datenschutz" className="text-amber-400 hover:text-amber-300 underline">Datenschutzerklärung</a>.
        </span>
      </label>

      {status === 'error' && (
        <p className="text-sm text-red-400 mt-3">
          Anmeldung fehlgeschlagen ({fehler}). Bitte versuche es später nochmal.
        </p>
      )}
    </form>
  );
}
