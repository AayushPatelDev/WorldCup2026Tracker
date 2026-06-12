// Tiny inline icon set — stroke icons inherit currentColor.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const Globe = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.7 2.6 4 5.6 4 9s-1.3 6.4-4 9c-2.7-2.6-4-5.6-4-9s1.3-6.4 4-9z" />
  </svg>
);

export const Stadium = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <ellipse cx="12" cy="17" rx="9" ry="4" />
    <path d="M3 17v-4c0-2.2 4-4 9-4s9 1.8 9 4v4M12 9V5M8.5 9.4V6M15.5 9.4V6" />
  </svg>
);

export const CalendarIcon = ({ size = 13 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4M12 13.5v5M9.5 16h5" />
  </svg>
);

export const Close = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const Chevron = ({ size = 14, open = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    {...base}
    style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}
    aria-hidden="true"
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const Menu = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const Whistle = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} aria-hidden="true">
    <circle cx="9" cy="15" r="5.5" />
    <path d="M13.5 11.5L21 7.5M14 15h-2M9 15h.01" />
  </svg>
);
