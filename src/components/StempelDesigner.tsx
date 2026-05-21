import { useState, useRef } from 'react';

interface Props {
  initialOben: string;   // Außenring oben
  initialUnten: string;  // Außenring unten
  initialMitte: string;  // Initialen / Wort in der Mitte
}

const SECTION = 'bg-zinc-900 border border-zinc-800 rounded-xl p-5';
const LABEL = 'block text-xs text-zinc-400 mb-1';
const INPUT =
  'w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:border-amber-500 focus:outline-none placeholder-zinc-600';

export default function StempelDesigner({ initialOben, initialUnten, initialMitte }: Props) {
  const [oben, setOben] = useState(initialOben.toUpperCase());
  const [unten, setUnten] = useState(initialUnten.toUpperCase());
  const [mitte, setMitte] = useState(initialMitte.toUpperCase());
  const [style, setStyle] = useState<'auto' | 'initialen'>('auto');
  const svgRef = useRef<SVGSVGElement>(null);

  // ── Stempel-SVG ───────────────────────────────────────────────────────────
  // Outer circle Ø 30mm = 300 viewBox units (1mm = 10 units)
  // Inner area: Auto-Silhouette oder große Initialen
  const stempel = (
    <svg
      ref={svgRef}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 300 300"
      width="300"
      height="300"
      style={{ display: 'block' }}
    >
      <defs>
        {/* Path für Text oben (von links nach rechts gebogen, Mitte des Texts oben) */}
        <path id="pfad-oben" d="M 50,150 A 100,100 0 0,1 250,150" fill="none" />
        {/* Path für Text unten (von rechts nach links, damit Text korrekt gelesen wird) */}
        <path id="pfad-unten" d="M 50,150 A 100,100 0 0,0 250,150" fill="none" />
      </defs>

      {/* Außenring */}
      <circle cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="6" />
      <circle cx="150" cy="150" r="120" fill="none" stroke="currentColor" strokeWidth="3" />

      {/* Innerer Trennkreis */}
      <circle cx="150" cy="150" r="78" fill="none" stroke="currentColor" strokeWidth="2.5" />

      {/* Text oben */}
      <text
        fill="currentColor"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="20"
        fontWeight="700"
        letterSpacing="3"
      >
        <textPath href="#pfad-oben" startOffset="50%" textAnchor="middle">
          {oben}
        </textPath>
      </text>

      {/* Text unten */}
      <text
        fill="currentColor"
        fontFamily="Inter, system-ui, sans-serif"
        fontSize="18"
        fontWeight="600"
        letterSpacing="4"
      >
        <textPath href="#pfad-unten" startOffset="50%" textAnchor="middle">
          {unten}
        </textPath>
      </text>

      {/* Zier-Sterne links und rechts auf der horizontalen Achse */}
      <g fill="currentColor">
        <circle cx="36" cy="150" r="3" />
        <circle cx="264" cy="150" r="3" />
      </g>

      {/* Mitte: Auto-Silhouette oder Initialen */}
      {style === 'auto' ? (
        <g transform="translate(150,150)" fill="currentColor">
          {/* Vereinfachte Auto-Silhouette, zentriert */}
          <path
            transform="translate(-48,-26) scale(2.6)"
            d="M5 11l1.5-4.5C6.8 5.6 7.7 5 8.6 5h6.8c.9 0 1.8.6 2.1 1.5L19 11h1c.6 0 1 .4 1 1v4c0 .6-.4 1-1 1h-1v1c0 .6-.4 1-1 1s-1-.4-1-1v-1H7v1c0 .6-.4 1-1 1s-1-.4-1-1v-1H4c-.6 0-1-.4-1-1v-4c0-.6.4-1 1-1h1zm2.1 0h9.8L15.7 7H8.3l-1.2 4zM7 13.5c0 .8-.7 1.5-1.5 1.5S4 14.3 4 13.5 4.7 12 5.5 12s1.5.7 1.5 1.5zm13 0c0 .8-.7 1.5-1.5 1.5S17 14.3 17 13.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5z"
          />
          {mitte && (
            <text
              y="40"
              textAnchor="middle"
              fontFamily="'Cormorant Garamond', Georgia, serif"
              fontSize="22"
              fontWeight="700"
              letterSpacing="2"
            >
              {mitte}
            </text>
          )}
        </g>
      ) : (
        <text
          x="150"
          y="170"
          fill="currentColor"
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontSize="64"
          fontWeight="700"
          textAnchor="middle"
          letterSpacing="2"
        >
          {mitte || '··'}
        </text>
      )}
    </svg>
  );

  // ── Download-Funktionen ───────────────────────────────────────────────────
  function downloadSvg() {
    if (!svgRef.current) return;
    // Wir klonen das SVG und ersetzen currentColor durch schwarz (Stempel-Hersteller
    // brauchen explizite Farben, nicht CSS-Vererbung).
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    // currentColor -> #000
    clone.querySelectorAll('[fill="currentColor"]').forEach((el) => el.setAttribute('fill', '#000'));
    clone.querySelectorAll('[stroke="currentColor"]').forEach((el) => el.setAttribute('stroke', '#000'));

    const xml = new XMLSerializer().serializeToString(clone);
    const header = '<?xml version="1.0" encoding="UTF-8"?>\n';
    const blob = new Blob([header + xml], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stempel-motiv.svg';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadPng() {
    if (!svgRef.current) return;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.querySelectorAll('[fill="currentColor"]').forEach((el) => el.setAttribute('fill', '#000'));
    clone.querySelectorAll('[stroke="currentColor"]').forEach((el) => el.setAttribute('stroke', '#000'));
    const xml = new XMLSerializer().serializeToString(clone);
    const dataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });

    const SIZE = 1200; // 1200×1200 px, druckfähig
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.drawImage(img, 0, 0, SIZE, SIZE);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'stempel-motiv.png';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-100 mb-2">Stempel-Motiv designen</h1>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">
          Dein eigenes Stempelmotiv für die Treuekarten — damit Kunden nicht selbst nachstempeln können.
          Anpassen, herunterladen, beim Stempelhersteller hochladen, fertig.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Vorschau ─────────────────────────────────────────────────── */}
        <div className={SECTION}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Vorschau (Ø 30 mm)</p>
            <span className="text-xs text-zinc-600">1:1 Originalgröße</span>
          </div>
          <div className="bg-zinc-100 rounded-lg p-8 flex items-center justify-center">
            <div className="text-zinc-900" style={{ width: '300px', height: '300px' }}>
              {stempel}
            </div>
          </div>
          <p className="text-xs text-zinc-500 mt-3 text-center">
            So sieht der Stempel-Abdruck aus. Schwarz wird zur Stempelfarbe.
          </p>
        </div>

        {/* ── Einstellungen + Download ─────────────────────────────────── */}
        <div className="space-y-4">

          <div className={SECTION}>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-4">Texte</p>
            <div className="space-y-3">
              <div>
                <label className={LABEL}>Außenring oben</label>
                <input
                  value={oben}
                  onChange={(e) => setOben(e.target.value.toUpperCase())}
                  maxLength={32}
                  className={INPUT}
                  placeholder="AUTOAUFBEREITUNG"
                />
                <p className="text-xs text-zinc-600 mt-1">Wird automatisch in Großbuchstaben gesetzt.</p>
              </div>
              <div>
                <label className={LABEL}>Außenring unten</label>
                <input
                  value={unten}
                  onChange={(e) => setUnten(e.target.value.toUpperCase())}
                  maxLength={32}
                  className={INPUT}
                  placeholder="CLOPPENBURG"
                />
              </div>
              <div>
                <label className={LABEL}>Mitte (klein) — z.B. Stadtkürzel, Jahr, Initialen</label>
                <input
                  value={mitte}
                  onChange={(e) => setMitte(e.target.value.toUpperCase())}
                  maxLength={8}
                  className={INPUT}
                  placeholder="CLP · 2026"
                />
              </div>
            </div>
          </div>

          <div className={SECTION}>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Mittenmotiv</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setStyle('auto')}
                className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  style === 'auto'
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                🚗 Auto-Silhouette
              </button>
              <button
                onClick={() => setStyle('initialen')}
                className={`px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                  style === 'initialen'
                    ? 'bg-amber-500/15 border-amber-500/60 text-amber-300'
                    : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
              >
                AA Initialen (groß)
              </button>
            </div>
            {style === 'initialen' && (
              <p className="text-xs text-zinc-600 mt-3">
                Bei Initialen empfehlen wir 2–3 Buchstaben im „Mitte"-Feld (z. B. „AA" oder „MO").
              </p>
            )}
          </div>

          <div className={SECTION}>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Download</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={downloadSvg}
                className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                SVG herunterladen
              </button>
              <button
                onClick={downloadPng}
                className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2"
              >
                PNG (1200×1200) herunterladen
              </button>
            </div>
            <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
              <strong className="text-zinc-300">SVG</strong> ist Vektorgrafik — beliebig skalierbar, das wollen die meisten Stempelhersteller. <strong className="text-zinc-300">PNG</strong> ist nur Backup.
            </p>
          </div>

        </div>
      </div>

      {/* ── Anleitung ──────────────────────────────────────────────────── */}
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={SECTION}>
          <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold mb-2">Schritt 1</p>
          <h3 className="text-zinc-100 font-bold mb-2">Stempel-Datei vorbereiten</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            SVG herunterladen (Button oben). Texte und Layout sind dann eingebrannt.
            Den Datei-Namen merken — den brauchst du gleich.
          </p>
        </div>

        <div className={SECTION}>
          <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold mb-2">Schritt 2</p>
          <h3 className="text-zinc-100 font-bold mb-2">Bei einem Stempelhersteller bestellen</h3>
          <p className="text-zinc-400 text-sm leading-relaxed mb-3">
            Empfohlene Anbieter (Lieferung ~3–7 Tage):
          </p>
          <ul className="text-sm space-y-1">
            <li>
              <a href="https://www.stempel-fabrik.de" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300">stempel-fabrik.de</a>
              <span className="text-zinc-500"> — Trodat Printy 4630, Ø 30 mm, ~15–25 €</span>
            </li>
            <li>
              <a href="https://www.stempel-stempel.de" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300">stempel-stempel.de</a>
              <span className="text-zinc-500"> — Premium-Holzstempel, ~25–40 €</span>
            </li>
            <li>
              <a href="https://www.amazon.de/s?k=trodat+printy+4630" target="_blank" rel="noopener" className="text-amber-400 hover:text-amber-300">Amazon</a>
              <span className="text-zinc-500"> — Trodat „nach Wunsch", ~18 € — SVG hochladen</span>
            </li>
          </ul>
        </div>

        <div className={SECTION}>
          <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold mb-2">Schritt 3</p>
          <h3 className="text-zinc-100 font-bold mb-2">Stempelfarbe wählen</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Empfehlung: <strong className="text-amber-300">Gold</strong> oder <strong className="text-zinc-300">Schwarz</strong>.
            Beides passt zur Markenlinie. Rot wirkt zu „Behörde", Blau zu generisch.
          </p>
        </div>

        <div className={SECTION}>
          <p className="text-xs text-amber-400/80 uppercase tracking-wider font-semibold mb-2">Schritt 4</p>
          <h3 className="text-zinc-100 font-bold mb-2">Geheim halten</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Den fertigen Stempel <strong className="text-zinc-200">nicht zeigen</strong> und kein
            Foto online posten. Sonst können Kunden das Motiv kopieren und selbst Stempel anfertigen.
            Stempel im Auto / in der Werkzeugbox aufbewahren.
          </p>
        </div>
      </div>
    </div>
  );
}
