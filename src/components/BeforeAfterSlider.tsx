import { useRef, useState, useCallback, useEffect } from 'react';

interface Props {
  beforeSrc?: string;
  afterSrc?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Vorher',
  afterLabel = 'Nachher',
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [position, setPosition] = useState(50);
  const [isMobile, setIsMobile] = useState(false);
  const [showAfter, setShowAfter] = useState(true); // Mobile: aktuell sichtbares Bild

  // Mobile-Detection: Touch-Device ODER < 768 px Breite
  useEffect(() => {
    const mq = window.matchMedia('(hover: none) and (pointer: coarse), (max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pct = Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
    setPosition(pct);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    isDragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    updatePosition(e.clientX);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePosition(e.clientX);
  };
  const onPointerUp = () => { isDragging.current = false; };

  const beforeBg = beforeSrc
    ? { backgroundImage: `url(${beforeSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(120deg, #1c1917 0%, #44403c 50%, #57534e 100%)' };

  const afterBg = afterSrc
    ? { backgroundImage: `url(${afterSrc})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { background: 'linear-gradient(120deg, #09090b 0%, #18181b 35%, #92400e 75%, #fbbf24 100%)' };

  // ── MOBILE: Tap-Toggle zwischen Vorher/Nachher ────────────────────────────
  if (isMobile) {
    return (
      <div>
        <div
          className="relative select-none overflow-hidden rounded-2xl cursor-pointer"
          style={{ aspectRatio: '16/9' }}
          onClick={() => setShowAfter((v) => !v)}
          role="button"
          tabIndex={0}
          aria-label="Tippen zum Wechseln zwischen Vorher und Nachher"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setShowAfter((v) => !v);
            }
          }}
        >
          {/* Beide Ebenen mit Fade-Übergang */}
          <div className="absolute inset-0 transition-opacity duration-500" style={{ ...beforeBg, opacity: showAfter ? 0 : 1 }} />
          <div className="absolute inset-0 transition-opacity duration-500" style={{ ...afterBg, opacity: showAfter ? 1 : 0 }} />

          {/* Aktuelles Label */}
          <span
            className={`absolute top-3 left-3 text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-sm border transition-colors ${
              showAfter
                ? 'bg-amber-500/95 text-amber-950 border-amber-400'
                : 'bg-zinc-950/85 text-zinc-200 border-white/15'
            }`}
          >
            {showAfter ? afterLabel : beforeLabel}
          </span>

          {/* Tap-Hinweis */}
          <span className="absolute bottom-3 right-3 bg-zinc-950/85 text-zinc-200 text-xs font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm border border-white/15 flex items-center gap-1.5 pointer-events-none">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            Antippen
          </span>
        </div>

        {/* Toggle-Buttons unter dem Bild */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setShowAfter(false)}
            className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 border ${
              !showAfter
                ? 'bg-zinc-800 border-zinc-600 text-zinc-100'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            {beforeLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowAfter(true)}
            className={`py-2.5 px-3 rounded-xl text-sm font-bold transition-all duration-200 border ${
              showAfter
                ? 'bg-amber-500 border-amber-400 text-amber-950'
                : 'bg-transparent border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-500/50'
            }`}
          >
            {afterLabel}
          </button>
        </div>
      </div>
    );
  }

  // ── DESKTOP: Slider wie bisher ────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl cursor-col-resize"
      style={{ aspectRatio: '16/9', touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      role="img"
      aria-label="Vorher/Nachher-Vergleich – Regler verschieben zum Vergleichen"
    >
      <div className="absolute inset-0" style={afterBg} />
      <div className="absolute inset-0" style={{ ...beforeBg, clipPath: `inset(0 ${100 - position}% 0 0)` }} />

      <div
        className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_20px_rgba(0,0,0,0.7)]"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        aria-hidden="true"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-zinc-950 border-2 border-amber-400 rounded-full shadow-2xl flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
          </svg>
        </div>
      </div>

      <span className="absolute top-3 left-3 bg-zinc-950/75 text-zinc-300 text-xs font-bold px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm border border-white/10">
        {beforeLabel}
      </span>
      <span className="absolute top-3 right-3 bg-zinc-950/75 text-amber-300 text-xs font-bold px-3 py-1 rounded-full pointer-events-none backdrop-blur-sm border border-amber-500/25">
        {afterLabel}
      </span>

      {!beforeSrc && !afterSrc && (
        <div className="absolute inset-0 flex items-end justify-center pb-5 pointer-events-none">
          <p className="text-white/40 text-xs bg-black/50 px-4 py-1.5 rounded-full backdrop-blur-sm">
            Eigene Fotos → <code className="font-mono">public/images/</code>
          </p>
        </div>
      )}
    </div>
  );
}
