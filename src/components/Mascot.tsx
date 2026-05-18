import { useState, useEffect, useRef } from 'react';

const PEEK_DELAY_MS = 17000;
const PEEK_OFFSET_PX = 108;

export default function Mascot() {
  const [charVisible, setCharVisible] = useState(false);
  const [bubbleOpen, setBubbleOpen] = useState(false);
  const [peeked, setPeeked] = useState(false);
  const peekTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedulePeek = () => {
    if (peekTimer.current) clearTimeout(peekTimer.current);
    peekTimer.current = setTimeout(() => {
      setPeeked(true);
      setBubbleOpen(false);
    }, PEEK_DELAY_MS);
  };

  useEffect(() => {
    const t1 = setTimeout(() => setCharVisible(true), 1500);
    const t2 = setTimeout(() => {
      setBubbleOpen(true);
      schedulePeek();
    }, 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (peekTimer.current) clearTimeout(peekTimer.current);
    };
  }, []);

  const handleClick = () => {
    const wasPeeked = peeked;
    setPeeked(false);
    setBubbleOpen(wasPeeked ? true : (v) => !v);
    schedulePeek();
  };

  const handleCloseBubble = () => {
    setBubbleOpen(false);
    schedulePeek();
  };

  const transform = !charVisible
    ? 'translateX(240px) rotate(22deg)'
    : peeked
    ? `translateX(0px) translateY(${PEEK_OFFSET_PX}px) rotate(-10deg)`
    : 'translateX(0px) rotate(-10deg)';

  return (
    <div className="fixed bottom-0 right-24 z-40 flex flex-col items-end select-none">
      {/* ── Speech bubble ── */}
      <div
        className={`relative mb-2 mr-2 w-60 rounded-2xl bg-zinc-800 border border-amber-500/50 shadow-2xl shadow-amber-900/20 p-4 transition-all duration-500 ${
          bubbleOpen
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-3 scale-95 pointer-events-none'
        }`}
      >
        <button
          onClick={handleCloseBubble}
          aria-label="Schließen"
          className="absolute top-2.5 right-2.5 w-5 h-5 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-colors duration-150 rounded-full hover:bg-zinc-700 text-sm leading-none"
        >
          ✕
        </button>
        <p className="text-sm font-bold text-zinc-100 mb-1 pr-5">
          Hallo! Profi-Aufbereitung gefällig?
        </p>
        <p className="text-xs text-zinc-400 mb-3 leading-relaxed">
          Berechne deinen Preis in 60 Sekunden – kostenlos & unverbindlich!
        </p>
        <a
          href="/preisrechner"
          className="block text-center text-xs font-bold bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-zinc-950 rounded-xl px-3 py-2 transition-colors duration-200"
        >
          Jetzt Preis berechnen →
        </a>
        <div className="absolute -bottom-[11px] right-12 w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[11px] border-t-zinc-800" />
        <div
          className="absolute -bottom-[13px] right-[44px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-amber-500/50"
          style={{ zIndex: -1 }}
        />
      </div>

      {/* ── Character ── */}
      <button
        onClick={handleClick}
        title={peeked ? 'Zurückkommen' : 'Aufbereitung anfragen'}
        aria-label="Preisrechner öffnen"
        className="cursor-pointer focus:outline-none select-none"
        style={{
          transform,
          transformOrigin: 'bottom right',
          opacity: charVisible ? 1 : 0,
          transition: 'transform 0.9s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.6s ease-out',
        }}
      >
        <svg
          viewBox="0 0 170 232"
          width="152"
          height="208"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.55))' }}
        >
          {/* ════ SCHATTEN ════ */}
          <ellipse cx="74" cy="229" rx="46" ry="6" fill="rgba(0,0,0,0.3)" />

          {/* ════ SCHUHE ════ */}
          <ellipse cx="42" cy="226" rx="24" ry="7" fill="#0c1221" />
          <ellipse cx="104" cy="225" rx="22" ry="6" fill="#0c1221" />
          <rect x="20" y="219" width="44" height="8" fill="#0c1221" rx="3" />
          <rect x="84" y="218" width="40" height="8" fill="#0c1221" rx="3" />
          <rect x="22" y="206" width="40" height="17" fill="#111827" rx="5" />
          <rect x="86" y="206" width="36" height="16" fill="#111827" rx="5" />
          <ellipse cx="52" cy="210" rx="8" ry="3.5" fill="#1e293b" opacity="0.7" />
          <ellipse cx="112" cy="210" rx="7" ry="3" fill="#1e293b" opacity="0.65" />

          {/* ════ BEINE ════ */}
          <rect x="22" y="178" width="40" height="48" fill="#3B72CC" rx="7" />
          <rect x="82" y="180" width="36" height="46" fill="#3B72CC" rx="7" />
          <rect x="62" y="178" width="10" height="34" fill="#2A55A8" />
          <line x1="30" y1="185" x2="30" y2="220" stroke="#2A55A8" strokeWidth="1.2" opacity="0.5" />
          <rect x="22" y="216" width="40" height="9" fill="#4D88E0" rx="3" />
          <rect x="82" y="215" width="36" height="9" fill="#4D88E0" rx="3" />

          {/* ════ WEISSES HEMD – ÄRMEL ════ */}
          <ellipse cx="18" cy="104" rx="18" ry="13" fill="#F0F0F0" />
          <ellipse cx="130" cy="100" rx="16" ry="12" fill="#F0F0F0" />

          {/* ════ LINKER ARM ════ */}
          <rect x="2" y="104" width="26" height="76" fill="#3B72CC" rx="11" />

          {/* ════ RECHTER ARM – DAUMEN HOCH ════ */}
          <path d="M 130 100 Q 152 84 156 58" stroke="#3B72CC" strokeWidth="26" fill="none" strokeLinecap="round" />
          <path d="M 130 100 Q 152 84 156 58" stroke="#2A55A8" strokeWidth="4"  fill="none" strokeLinecap="round" opacity="0.35" />

          {/* ════ KÖRPER ════ */}
          <rect x="14" y="100" width="120" height="90" fill="#3B72CC" rx="11" />
          <rect x="14" y="100" width="8"   height="90" fill="#2A55A8" rx="4"  opacity="0.4" />
          <rect x="14" y="100" width="120" height="16" fill="#2A55A8" rx="7" />

          {/* ════ GÜRTEL ════ */}
          <rect x="14" y="177" width="120" height="11" fill="#7C4010" rx="3" />
          <rect x="60" y="173" width="34"  height="19" fill="#D4AF37" rx="4" />
          <rect x="66" y="178" width="22"  height="9"  fill="#A87F1A" rx="2.5" />
          <line x1="77" y1="173" x2="77" y2="192" stroke="#A87F1A" strokeWidth="2" />
          <rect x="98" y="177" width="34"  height="28" fill="#8B5F3A" rx="5" />
          <rect x="98" y="177" width="34"  height="7"  fill="#6B4822" rx="4" />
          <line x1="102" y1="184" x2="128" y2="184" stroke="#5C3A1A" strokeWidth="1" />
          <line x1="102" y1="188" x2="128" y2="188" stroke="#5C3A1A" strokeWidth="1" />
          <rect x="106" y="172" width="4" height="10" fill="#60A5FA" rx="2" />
          <rect x="114" y="173" width="4" height="9"  fill="#FCD34D" rx="2" />
          <rect x="122" y="172" width="4" height="10" fill="#60A5FA" rx="2" />

          {/* ════ LATZHOSE (BIB) ════ */}
          <rect x="42" y="80" width="64" height="66" fill="#4D88E0" rx="9" />
          <rect x="42" y="80" width="7"  height="66" fill="#2A55A8" rx="4"  opacity="0.35" />
          <rect x="52" y="96" width="44" height="32" fill="#3B72CC" rx="4" />
          <line x1="52" y1="108" x2="96" y2="108" stroke="#2A55A8" strokeWidth="1.5" />
          <circle cx="57" cy="122" r="2" fill="#60A5FA" />
          <circle cx="66" cy="122" r="2" fill="#60A5FA" />
          <circle cx="74" cy="122" r="2" fill="#60A5FA" />
          <circle cx="82" cy="122" r="2" fill="#60A5FA" />
          <circle cx="46"  cy="84"  r="5" fill="#D4AF37" /><circle cx="46"  cy="84"  r="2.5" fill="#A87F1A" />
          <circle cx="102" cy="84"  r="5" fill="#D4AF37" /><circle cx="102" cy="84"  r="2.5" fill="#A87F1A" />
          <circle cx="46"  cy="142" r="5" fill="#D4AF37" /><circle cx="46"  cy="142" r="2.5" fill="#A87F1A" />
          <circle cx="102" cy="142" r="5" fill="#D4AF37" /><circle cx="102" cy="142" r="2.5" fill="#A87F1A" />
          <line x1="46" y1="143" x2="102" y2="143" stroke="#3B72CC" strokeWidth="1.2" strokeDasharray="3 2" />

          {/* ════ TRÄGER + SCHNALLEN ════ */}
          <rect x="44" y="48" width="14" height="50" fill="#4D88E0" rx="7" />
          <rect x="90" y="48" width="14" height="50" fill="#4D88E0" rx="7" />
          <rect x="42" y="68" width="18" height="13" fill="#D4AF37" rx="4" />
          <rect x="47" y="71" width="8"  height="7"  fill="#A87F1A" rx="2.5" />
          <line x1="51" y1="68" x2="51" y2="81" stroke="#A87F1A" strokeWidth="1.5" />
          <rect x="88" y="68" width="18" height="13" fill="#D4AF37" rx="4" />
          <rect x="93" y="71" width="8"  height="7"  fill="#A87F1A" rx="2.5" />
          <line x1="97" y1="68" x2="97" y2="81" stroke="#A87F1A" strokeWidth="1.5" />

          {/* ════ HEMD-KRAGEN ════ */}
          <path d="M 56 88 Q 70 76 84 88 L 80 94 Q 70 82 60 94 Z" fill="#F0F0F0" />
          <line x1="70" y1="76" x2="70" y2="94" stroke="#DCDCDC" strokeWidth="1.2" />

          {/* ════ HALS ════ */}
          <rect x="63" y="60" width="16" height="36" fill="#F5A87C" rx="6" />
          <rect x="63" y="62" width="4"  height="32" fill="#D4875A" opacity="0.25" rx="2" />
          <rect x="75" y="62" width="4"  height="32" fill="#D4875A" opacity="0.2"  rx="2" />

          {/* ════ LINKES OHR ════ */}
          <ellipse cx="44" cy="44" rx="5" ry="8" fill="#D4875A" />

          {/* ════ KOPF ════ */}
          <circle cx="71" cy="42" r="28" fill="#F5A87C" />
          <ellipse cx="58" cy="52" rx="14" ry="10" fill="#F5A87C" />
          <ellipse cx="84" cy="52" rx="12" ry="9"  fill="#F5A87C" />
          <ellipse cx="71" cy="68" rx="17" ry="6"  fill="#D4875A" opacity="0.22" />
          <ellipse cx="60" cy="30" rx="16" ry="10" fill="white"   opacity="0.06" />

          {/* ════ RECHTES OHR ════ */}
          <ellipse cx="99" cy="44" rx="8" ry="11" fill="#D4875A" />
          <ellipse cx="99" cy="44" rx="5" ry="7"  fill="#C07040" />

          {/* ════ CAPPY ════ */}
          <ellipse cx="71" cy="26" rx="27" ry="6" fill="rgba(0,0,0,0.1)" />
          <path d="M 44 28 Q 42 6 71 6 Q 104 6 106 28 Z" fill="#3B72CC" />
          <path d="M 56 28 Q 55 6 71 6 Q  87 6  88 28 Z" fill="#4D88E0" />
          <line x1="56" y1="8" x2="56" y2="28" stroke="#2A55A8" strokeWidth="0.9" opacity="0.7" />
          <line x1="88" y1="8" x2="88" y2="28" stroke="#2A55A8" strokeWidth="0.9" opacity="0.7" />
          <circle cx="72" cy="17" r="7"   fill="#2A55A8" />
          <circle cx="72" cy="17" r="5"   fill="#fbbf24" />
          <circle cx="72" cy="17" r="2.5" fill="#d97706" />
          <path d="M 40 26 Q 72 30 108 29 L 106 40 Q 72 41 38 38 Z" fill="#2A55A8" />
          <path d="M 40 26 Q 72 30 108 29 L 106 32 Q 72 34 40 30 Z" fill="#4D88E0" opacity="0.5" />
          <path d="M 38 38 Q 72 41 106 40 L 104 43 Q 72 44 40 41 Z" fill="#1E3A8A" opacity="0.4" />
          <circle cx="71" cy="7" r="5"   fill="#2A55A8" />
          <circle cx="71" cy="7" r="2.5" fill="#1E3A8A" />

          {/* ════ AUGEN ════ */}
          <circle cx="58" cy="42" r="8"   fill="white" />
          <circle cx="59" cy="43" r="6.2" fill="#5C4030" />
          <circle cx="60" cy="44" r="3.8" fill="#0f172a" />
          <circle cx="61" cy="42" r="2"   fill="white" />
          <circle cx="57" cy="46" r="1.1" fill="white" opacity="0.55" />
          <circle cx="84" cy="41" r="9.5" fill="white" />
          <circle cx="85" cy="42" r="7.5" fill="#5C4030" />
          <circle cx="86" cy="43" r="4.8" fill="#0f172a" />
          <circle cx="87" cy="41" r="2.5" fill="white" />
          <circle cx="83" cy="45" r="1.3" fill="white" opacity="0.55" />
          <path d="M 50 38 Q 58 33 66 38" stroke="#C4906A" strokeWidth="1.1" fill="none" opacity="0.5" />
          <path d="M 75 37 Q 84 32 93 37" stroke="#C4906A" strokeWidth="1.1" fill="none" opacity="0.5" />

          {/* ════ AUGENBRAUEN ════ */}
          <path d="M 49 35 Q 58 29 67 34" stroke="#4a3020" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M 75 33 Q 84 27 93 33" stroke="#4a3020" strokeWidth="3.5" fill="none" strokeLinecap="round" />

          {/* ════ NASE ════ */}
          <path d="M 71 44 Q 74 50 73 56" stroke="#D4875A" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
          <circle cx="74" cy="57" r="7" fill="#E89868" />
          <circle cx="74" cy="57" r="7" fill="none" stroke="#D4875A" strokeWidth="0.8" opacity="0.5" />
          <ellipse cx="67" cy="59" rx="5"   ry="3.5" fill="#D4875A" opacity="0.4" />
          <ellipse cx="80" cy="59" rx="4.5" ry="3"   fill="#D4875A" opacity="0.35" />
          <ellipse cx="74" cy="63" rx="6"   ry="2.5" fill="#D4875A" opacity="0.3" />

          {/* ════ MUND ════ */}
          <circle cx="52" cy="62" r="3.5" fill="#B06040" />
          <circle cx="90" cy="62" r="3"   fill="#B06040" />
          <path d="M 52 62 Q 71 84 90 62" stroke="#B06040" strokeWidth="3.5" fill="none" strokeLinecap="round" />

          {/* ════ WANGENRÖTE ════ */}
          <ellipse cx="46" cy="59" rx="11" ry="8" fill="#f87171" opacity="0.22" />
          <ellipse cx="94" cy="58" rx="10" ry="7" fill="#f87171" opacity="0.2" />

          {/* ════ LINKE HAND + EIMER ════ */}
          <circle cx="15" cy="182" r="14" fill="#F5A87C" />
          <ellipse cx="3" cy="175" rx="7.5" ry="5" fill="#F5A87C" transform="rotate(-25,3,175)" />
          <line x1="9" y1="188" x2="20" y2="190" stroke="#D4875A" strokeWidth="1" opacity="0.4" />
          <path d="M 4 196 Q 18 186 32 196" stroke="#B91C1C" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M 4 196 L 10 222 L 28 222 L 34 196 Z" fill="#EF4444" />
          <ellipse cx="19" cy="196" rx="15" ry="5" fill="#DC2626" />
          <line x1="6"  y1="202" x2="10" y2="220" stroke="#DC2626" strokeWidth="1" opacity="0.5" />
          <line x1="32" y1="202" x2="28" y2="220" stroke="#DC2626" strokeWidth="1" opacity="0.5" />
          <ellipse cx="19" cy="196" rx="13" ry="4" fill="#93C5FD" opacity="0.55" />
          <circle cx="14" cy="194" r="3.5" fill="white" opacity="0.88" />
          <circle cx="15" cy="192" r="1.2" fill="white" opacity="0.95" />
          <circle cx="21" cy="193" r="3"   fill="white" opacity="0.82" />
          <circle cx="22" cy="191" r="1.1" fill="white" opacity="0.95" />
          <circle cx="28" cy="194" r="2.5" fill="white" opacity="0.78" />
          <circle cx="10" cy="193" r="2"   fill="white" opacity="0.72" />
          <circle cx="18" cy="191" r="1.8" fill="white" opacity="0.65" />

          {/* ════ RECHTE HAND – DAUMEN HOCH ════ */}
          <ellipse cx="156" cy="58" rx="14" ry="12" fill="#F5A87C" />
          <line x1="145" y1="55" x2="166" y2="55" stroke="#D4875A" strokeWidth="1.2" opacity="0.4" />
          <line x1="145" y1="60" x2="166" y2="60" stroke="#D4875A" strokeWidth="1"   opacity="0.3" />
          <rect x="159" y="32" width="14" height="30" fill="#F5A87C" rx="7" />
          <rect x="161" y="32" width="10" height="8"  fill="#D4875A" rx="3.5" opacity="0.65" />
          <line x1="160" y1="48" x2="172" y2="48" stroke="#D4875A" strokeWidth="1.2" opacity="0.4" />
          <line x1="145" y1="63" x2="165" y2="65" stroke="#D4875A" strokeWidth="1"   opacity="0.3" />
        </svg>
      </button>
    </div>
  );
}
