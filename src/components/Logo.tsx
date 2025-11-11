type Props = { size?: number; className?: string }
export default function Logo({ size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="ccg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#25bf77" />
          <stop offset="1" stopColor="#138353" />
        </linearGradient>
        <clipPath id="clipCircle">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#ccg)" />
      <g clipPath="url(#clipCircle)">
        <path d="M -4 38 L 68 38 L 68 68 L -4 68 Z" fill="#16a34a" />
        <path d="M -4 44 Q 32 54 68 44 L 68 58 L -4 58 Z" fill="#22c55e" />
        <path d="M10 58 L12 44 L14 58 Z" fill="#15803d" />
        <path d="M14 58 L16 46 L18 58 Z" fill="#16a34a" />
        <path d="M18 58 L20 45 L22 58 Z" fill="#22c55e" />
        <path d="M22 58 L24 36 L26 58 Z" fill="#15803d" />
        <path d="M26 58 L28 32 L30 58 Z" fill="#16a34a" />
        <path d="M30 58 L32 30 L34 58 Z" fill="#22c55e" />
        <path d="M34 58 L36 32 L38 58 Z" fill="#15803d" />
        <path d="M38 58 L40 36 L42 58 Z" fill="#16a34a" />
        <path d="M42 58 L44 44 L46 58 Z" fill="#22c55e" />
        <path d="M46 58 L48 46 L50 58 Z" fill="#15803d" />
        <path d="M50 58 L52 45 L54 58 Z" fill="#16a34a" />
        <path d="M54 58 L56 47 L58 58 Z" fill="#22c55e" />
        {/** simple mower silhouette */}
        <g opacity="0.95">
          <line x1="46" y1="44" x2="58" y2="34" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="40" y="47" width="20" height="7" rx="2.5" fill="#ffffff" />
          <circle cx="46" cy="56" r="2.8" fill="#0f5137" />
          <circle cx="56" cy="56" r="2.8" fill="#0f5137" />
        </g>
      </g>
      <g>
        <text x="32" y="37" textAnchor="middle" fontSize="26" fontFamily="system-ui,Segoe UI,Arial" fill="#ffffff" stroke="#0f5137" strokeWidth="1.2" fontWeight={800}>CC</text>
      </g>
    </svg>
  )
}
