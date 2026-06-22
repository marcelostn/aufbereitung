import { useRef, useState, useEffect, useCallback } from 'react';

export type GalerieKarte =
  | { typ: 'ergebnis'; src: string; titel: string; tag?: string }
  | { typ: 'vorhernachher'; vorher: string; nachher: string; titel: string };

interface Props {
  karten: GalerieKarte[];
}

export default function GalerieKarussell({ karten }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [aktiv, setAktiv] = useState(0);

  // Breite einer Karte inkl. Abstand ermitteln
  const schrittBreite = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length < 1) return 0;
    const erste = track.children[0] as HTMLElement;
    const zweite = track.children[1] as HTMLElement | undefined;
    if (zweite) return zweite.offsetLeft - erste.offsetLeft;
    return erste.offsetWidth;
  }, []);

  // Aktiven Index aus Scroll-Position ableiten
  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const breite = schrittBreite();
    if (!breite) return;
    const idx = Math.round(track.scrollLeft / breite);
    setAktiv(Math.max(0, Math.min(karten.length - 1, idx)));
  }, [schrittBreite, karten.length]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const zuKarte = useCallback(
    (idx: number) => {
      const track = trackRef.current;
      if (!track) return;
      const ziel = Math.max(0, Math.min(karten.length - 1, idx));
      track.scrollTo({ left: ziel * schrittBreite(), behavior: 'smooth' });
    },
    [schrittBreite, karten.length],
  );

  return (
    <div className="relative">
      {/* Pfeil links */}
      <button
        type="button"
        onClick={() => zuKarte(aktiv - 1)}
        disabled={aktiv === 0}
        aria-label="Vorheriges Foto"
        className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/80 p-2.5 text-zinc-200 shadow-xl backdrop-blur-sm transition hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Pfeil rechts */}
      <button
        type="button"
        onClick={() => zuKarte(aktiv + 1)}
        disabled={aktiv === karten.length - 1}
        aria-label="Nächstes Foto"
        className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/80 p-2.5 text-zinc-200 shadow-xl backdrop-blur-sm transition hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Karten-Spur */}
      <div
        ref={trackRef}
        className="galerie-track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 sm:gap-5"
        style={{ scrollbarWidth: 'none' }}
      >
        {karten.map((karte, i) => (
          <div
            key={i}
            className="w-[78vw] max-w-[300px] shrink-0 snap-center sm:w-[300px]"
          >
            {karte.typ === 'vorhernachher' ? (
              <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-lg" style={{ aspectRatio: '3 / 4' }}>
                {/* Vorher (oben) */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${karte.vorher})` }}>
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-zinc-950/85 px-2.5 py-1 text-[11px] font-bold text-zinc-200 backdrop-blur-sm">
                    Vorher
                  </span>
                </div>
                {/* Nachher (unten) */}
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${karte.nachher})` }}>
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-amber-400/60 bg-amber-500/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 backdrop-blur-sm">
                    Nachher
                  </span>
                </div>
                {/* Goldene Trennlinie */}
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.5)]" aria-hidden="true" />
                {/* Titel unten */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                  <p className="text-sm font-semibold text-white">{karte.titel}</p>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-lg" style={{ aspectRatio: '3 / 4' }}>
                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${karte.src})` }} />
                {karte.tag && (
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-amber-400/60 bg-amber-500/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 backdrop-blur-sm">
                    {karte.tag}
                  </span>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-3 pt-8">
                  <p className="text-sm font-semibold text-white">{karte.titel}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Punkte */}
      <div className="mt-6 flex items-center justify-center gap-2.5">
        {karten.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => zuKarte(i)}
            aria-label={`Zu Foto ${i + 1}`}
            aria-current={aktiv === i}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              aktiv === i ? 'w-6 bg-amber-400' : 'w-2.5 bg-zinc-600 hover:bg-zinc-500'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
