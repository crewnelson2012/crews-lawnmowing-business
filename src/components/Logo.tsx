type Props = { size?: number; className?: string }
export default function Logo({ size = 20, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 128 128"
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
          <circle cx="64" cy="64" r="60" />
        </clipPath>
      </defs>
      <circle cx="64" cy="64" r="60" fill="url(#ccg)" />
      <g clipPath="url(#clipCircle)">
        <rect x="-8" y="76" width="144" height="64" fill="#198f51" />
        <path d="M -8 108 L 84 78 L 144 78 L 144 140 L -8 140 Z" fill="#2acb73" />
        <g fill="#0f7a43">
          <path d="M84 116 L88 88 L92 116 Z" />
          <path d="M92 116 L96 86 L100 116 Z" />
          <path d="M100 116 L104 88 L108 116 Z" />
          <path d="M108 116 L112 90 L116 116 Z" />
          <path d="M116 116 L120 92 L124 116 Z" />
        </g>
        <g fill="#25a45f">
          <rect x="8" y="104" width="3" height="12" />
          <rect x="16" y="102" width="3" height="14" />
          <rect x="24" y="100" width="3" height="16" />
          <rect x="32" y="98" width="3" height="18" />
          <rect x="40" y="96" width="3" height="20" />
          <rect x="48" y="94" width="3" height="22" />
          <rect x="56" y="92" width="3" height="24" />
          <rect x="64" y="90" width="3" height="26" />
          <rect x="72" y="88" width="3" height="28" />
        </g>
        {/** simple mower silhouette */}
        <g opacity="0.22">
          <line x1="86" y1="72" x2="118" y2="52" stroke="#0f0f0f" strokeWidth="4" strokeLinecap="round" />
          <rect x="70" y="76" width="24" height="10" rx="3" fill="#0f0f0f" />
          <rect x="72" y="80" width="36" height="12" rx="4" fill="#0f0f0f" />
          <circle cx="84" cy="98" r="6" fill="#0f0f0f" />
          <circle cx="104" cy="98" r="6" fill="#0f0f0f" />
        </g>
        <text x="90" y="88" textAnchor="middle" fontSize="14" fontFamily="system-ui,Segoe UI,Arial" fill="#ffffff" stroke="#0f5137" strokeWidth="1" fontWeight={800}>CC</text>
      </g>
    </svg>
  )
}
