const STROKE = {
  red: "#d21f1f",
  yellow: "#e0a800",
  green: "#1f9d4a",
} as const;

export function HandDrawnRing({
  color,
  label,
}: {
  color: keyof typeof STROKE;
  label?: string;
}) {
  const stroke = STROKE[color] ?? STROKE.red;
  return (
    <span className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg
        className="hand-ring absolute left-1/2 top-1/2 h-[188%] w-[168%] min-h-[1.45rem] min-w-[1.7rem] -translate-x-1/2 -translate-y-1/2 overflow-visible"
        viewBox="0 0 100 64"
        focusable="false"
      >
        <path
          d="M47 9 C70 4 97 13 95 33 C93 51 73 61 48 59 C23 57 7 47 9 30 C11 15 27 6 55 10"
          fill="none"
          stroke={stroke}
          strokeWidth="2.6"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {label ? (
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-full whitespace-nowrap text-[10px] font-bold leading-none"
          style={{ color: stroke }}
        >
          {label}
        </span>
      ) : null}
    </span>
  );
}
