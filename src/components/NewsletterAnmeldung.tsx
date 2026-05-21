import { useState } from 'react';

interface Props {
  empfaenger: string;       // FIRMA.email
  web3formsKey?: string;    // FIRMA.web3formsKey
}

export default function NewsletterAnmeldung({ empfaenger, web3formsKey }: Props) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dsgvo, setDsgvo] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [fehler, setFehler] = useState('');

  async function absenden(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !dsgvo) return;
    setStatus('sending');
    setFehler('');

    const nachricht = [
      'Neue Newsletter-Anmeldung',
      '',
      `E-Mail: ${email}`,
      name ? `Name: ${name}` : '',
      '',
      '→ Bitte Bestätigungsmail mit „Willkommen — du erhältst ca. 1 Mail pro Monat" schicken.',
      '→ Diese Adresse manuell in die Newsletter-Liste eintragen (Brevo / Excel / CRM).',
    ].filter(Boolean).join('\n');

    if (web3formsKey) {
      try {
        const res = await fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: web3formsKey,
            subject: `Newsletter-Anmeldung: ${email}`,
            from_name: name || 'Newsletter-Interessent',
            email,
            replyto: email,
            message: nachricht,
          }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Unbekannter Fehler');
        setStatus('success');
      } catch (err) {
        setFehler(err instanceof Error ? err.message : 'Versand fehlgeschlagen');
        setStatus('error');
      }
    } else {
      // Kein Web3Forms-Key → mailto-Fallback
      const subject = encodeURIComponent(`Newsletter-Anmeldung: ${email}`);
      const body = encodeURIComponent(nachricht);
      window.location.href = `mailto:${empfaenger}?subject=${subject}&body=${body}`;
      setStatus('success');
    }
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
          Wir bestätigen deine Anmeldung in Kürze per E-Mail. Erst danach bist du auf der Liste — versprochen, kein Spam.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={absenden} className="max-w-2xl mx-auto">
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
          Versand fehlgeschlagen ({fehler}). Bitte versuche es später nochmal oder schreib uns direkt an{' '}
          <a href={`mailto:${empfaenger}`} className="underline">{empfaenger}</a>.
        </p>
      )}
    </form>
  );
}
