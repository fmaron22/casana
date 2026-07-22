// Logo Casana (recreado del manual de marca). `wordmark` controla el color del texto.
export function Logo({ wordmark = '#20252C' }: { wordmark?: string }) {
  return (
    <svg viewBox="0 0 250 60" role="img" aria-label="Casana">
      <defs>
        <linearGradient id="casaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BF3B69" />
          <stop offset="1" stopColor="#D02660" />
        </linearGradient>
      </defs>
      <path
        d="M31 6 L57 28 V49 a4 4 0 0 1 -4 4 H13 a4 4 0 0 1 -4 -4 V28 Z"
        fill="url(#casaGrad)"
      />
      <path d="M20 35 Q33 48 46 35" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" />
      <text
        x="76"
        y="43"
        fontFamily="var(--font-brand), Montserrat, system-ui, sans-serif"
        fontSize="40"
        fontWeight="700"
        fill={wordmark}
        letterSpacing="-1"
      >
        casana
      </text>
    </svg>
  );
}

/** Isotipo solo (casa + sonrisa), para el hero. */
export function Isotipo() {
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label="Casana">
      <defs>
        <linearGradient id="casaGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#BF3B69" />
          <stop offset="1" stopColor="#D02660" />
        </linearGradient>
      </defs>
      <path
        d="M60 8 L112 52 V102 a8 8 0 0 1 -8 8 H16 a8 8 0 0 1 -8 -8 V52 Z"
        fill="url(#casaGrad2)"
      />
      <path d="M38 66 Q60 92 82 66" fill="none" stroke="#fff" strokeWidth="8.5" strokeLinecap="round" />
    </svg>
  );
}
