import { useRef, useState, useCallback } from 'react';

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

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl cursor-col-resize"
      style={{ aspectRatio: '16/9' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      role="img"
      aria-label="Vorher/Nachher-Vergleich – Regler verschieben zum Vergleichen"
    >
      {/* Nachher-Ebene (Basis, volle Breite) */}
      <div className="absolute inset-0" style={afterBg} />

      {/* Vorher-Ebene (links abgeschnitten) */}
      <div
        className="absolute inset-0"
        style={{ ...beforeBg, clipPath: `inset(0 ${100 - position}% 0 0)` }}
      />

      {/* Trennlinie */}
      <div
        className="absolute top-0 bottom-0 w-px bg-white/80 shadow-[0_0_20px_rgba(0,0,0,0.7)]"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
        aria-hidden="true"
      >
        {/* Drag-Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 bg-zinc-950 border-2 border-amber-400 rounded-full shadow-2xl flex items-center justify-center">
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3" />
          </svg>
        </div>
      </div>

      {/* Beschriftungen */}
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
