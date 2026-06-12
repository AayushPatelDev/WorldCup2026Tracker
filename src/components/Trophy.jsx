// Inline World Cup trophy — golden cup silhouette, crisp at any size.
export default function Trophy({ size = 32, className = '' }) {
  return (
    <svg
      className={className}
      width={Math.round(size * 0.75)}
      height={size}
      viewBox="0 0 24 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="psGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#EFD685" />
          <stop offset="0.5" stopColor="#C9A84C" />
          <stop offset="1" stopColor="#8C6F2A" />
        </linearGradient>
      </defs>
      {/* globe */}
      <circle cx="12" cy="6.4" r="4.7" fill="url(#psGold)" />
      <path d="M7.7 4.6 C9.9 6.6 14.1 6.6 16.3 4.6" stroke="#7A5F22" strokeWidth="0.7" strokeLinecap="round" opacity="0.45" />
      <path d="M7.7 8.2 C9.9 6.4 14.1 6.4 16.3 8.2" stroke="#7A5F22" strokeWidth="0.7" strokeLinecap="round" opacity="0.45" />
      <ellipse cx="12" cy="6.4" rx="2.1" ry="4.6" stroke="#7A5F22" strokeWidth="0.7" opacity="0.35" />
      {/* rising arms holding the globe */}
      <path
        d="M5.4 9.0 C7.9 13.2 10.3 14.6 10.3 17.7 L10.3 20.9 C10.3 22.4 9.4 23.4 8.2 24.0 L15.8 24.0 C14.6 23.4 13.7 22.4 13.7 20.9 L13.7 17.7 C13.7 14.6 16.1 13.2 18.6 9.0 C16.3 11.6 14.1 12.6 12 12.6 C9.9 12.6 7.7 11.6 5.4 9.0 Z"
        fill="url(#psGold)"
      />
      {/* base */}
      <rect x="6.8" y="24.7" width="10.4" height="2.5" rx="1.25" fill="url(#psGold)" />
      <rect x="5" y="28" width="14" height="3.4" rx="1.4" fill="#241D0E" stroke="#C9A84C" strokeOpacity="0.55" strokeWidth="0.6" />
    </svg>
  );
}
