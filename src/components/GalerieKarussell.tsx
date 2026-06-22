import { useRef, useState, useEffect, useCallback } from 'react';

export type GalerieKarte =
  | { typ: 'ergebnis'; src: string; titel: string; tag?: string }
  | { typ: 'vorhernachher'; vorher: string; nachher: string; titel: string };

interface Props {
  karten: GalerieKarte[];
}

export default function GalerieKarussell({ karten }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  // Erreichbare Scroll-Positionen (eine pro Punkt) – NICHT eine pro Karte,
  // sonst klemmt es bei mehreren sichtbaren Karten in der Mitte.
  const [positionen, setPositionen] = useState<number[]>([0]);
  const [aktiv, setAktiv] = useState(0);

  // Breite einer Karte inkl. Abstand
  const schrittBreite = useCallback(() => {
    const track = trackRef.current;
    if (!track || track.children.length < 1) return 0;
    const erste = track.children[0] as HTMLElement;
    const zweite = track.children[1] as HTMLElement | undefined;
    return zweite ? zweite.offsetLeft - erste.offsetLeft : erste.offsetWidth;
  }, []);

  // Erreichbare Punkt-Positionen aus tatsächlich scrollbarer Breite ableiten
  const messen = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const schritt = schrittBreite();
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (schritt <= 0 || maxScroll <= 1) {
      setPositionen([0]);
      return;
    }
    const pos: number[] = [];
    for (let p = 0; p < maxScroll; p += schritt) pos.push(p);
    // Endposition sicherstellen (letzte nahe Position ggf. ersetzen)
    const letzte = pos[pos.length - 1];
    if (maxScroll - letzte > schritt * 0.5) pos.push(maxScroll);
    else pos[pos.length - 1] = maxScroll;
    setPositionen(pos);
  }, [schrittBreite]);

  const naechsterIndex = useCallback(
    (sl: number, pos: number[]) =>
      pos.reduce((best, p, i) => (Math.abs(p - sl) < Math.abs(pos[best] - sl) ? i : best), 0),
    [],
  );

  const onScroll = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setAktiv(naechsterIndex(track.scrollLeft, positionen));
  }, [naechsterIndex, positionen]);

  useEffect(() => {
    messen();
    const track = trackRef.current;
    if (!track) return;
    const ro = new ResizeObserver(() => messen());
    ro.observe(track);
    window.addEventListener('resize', messen);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', messen);
    };
  }, [messen]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const zuPunkt = useCallback(
    (i: number) => {
      const track = trackRef.current;
      if (!track) return;
      const ziel = Math.max(0, Math.min(positionen.length - 1, i));
      track.scrollTo({ left: positionen[ziel], behavior: 'smooth' });
    },
    [positionen],
  );

  const mehrAls1 = positionen.length > 1;

  return (
    <div className="relative">
      {/* Pfeil links */}
      {mehrAls1 && (
        <button
          type="button"
          onClick={() => zuPunkt(aktiv - 1)}
          disabled={aktiv === 0}
          aria-label="Zurück"
          className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/80 p-2.5 text-zinc-200 shadow-xl backdrop-blur-sm transition hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Pfeil rechts */}
      {mehrAls1 && (
        <button
          type="button"
          onClick={() => zuPunkt(aktiv + 1)}
          disabled={aktiv === positionen.length - 1}
          aria-label="Weiter"
          className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 items-center justify-center rounded-full border border-zinc-700 bg-zinc-950/80 p-2.5 text-zinc-200 shadow-xl backdrop-blur-sm transition hover:border-amber-500/60 hover:text-amber-300 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Karten-Spur */}
      <div
        ref={trackRef}
        className="galerie-track flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-1 sm:gap-5"
        style={{ scrollbarWidth: 'none' }}
      >
        {karten.map((karte, i) => (
          <div key={i} className="w-[78vw] max-w-[300px] shrink-0 snap-start sm:w-[300px]">
            {karte.typ === 'vorhernachher' ? (
              <div className="relative overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900 shadow-lg" style={{ aspectRatio: '3 / 4' }}>
                <div className="absolute inset-x-0 top-0 h-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${karte.vorher})` }}>
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-white/15 bg-zinc-950/85 px-2.5 py-1 text-[11px] font-bold text-zinc-200 backdrop-blur-sm">
                    Vorher
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-cover bg-center" style={{ backgroundImage: `url(${karte.nachher})` }}>
                  <span className="absolute left-2.5 top-2.5 rounded-full border border-amber-400/60 bg-amber-500/95 px-2.5 py-1 text-[11px] font-bold text-amber-950 backdrop-blur-sm">
                    Nachher
                  </span>
                </div>
                <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-amber-400/80 shadow-[0_0_12px_rgba(251,191,36,0.5)]" aria-hidden="true" />
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
      {mehrAls1 && (
        <div className="mt-6 flex items-center justify-center gap-2.5">
          {positionen.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => zuPunkt(i)}
              aria-label={`Position ${i + 1}`}
              aria-current={aktiv === i}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                aktiv === i ? 'w-6 bg-amber-400' : 'w-2.5 bg-zinc-600 hover:bg-zinc-500'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
