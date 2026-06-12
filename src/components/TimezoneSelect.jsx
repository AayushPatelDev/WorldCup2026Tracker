import { useMemo } from 'react';

// Curated fallback for engines without Intl.supportedValuesOf.
const FALLBACK = [
  'UTC', 'America/New_York', 'America/Toronto', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'America/Vancouver', 'America/Mexico_City', 'America/Sao_Paulo',
  'America/Buenos_Aires', 'Europe/London', 'Europe/Lisbon', 'Europe/Paris', 'Europe/Madrid',
  'Europe/Berlin', 'Europe/Rome', 'Europe/Zagreb', 'Africa/Casablanca', 'Africa/Cairo',
  'Africa/Lagos', 'Africa/Johannesburg', 'Asia/Riyadh', 'Asia/Dubai', 'Asia/Tehran',
  'Asia/Karachi', 'Asia/Kolkata', 'Asia/Dhaka', 'Asia/Bangkok', 'Asia/Shanghai',
  'Asia/Tokyo', 'Asia/Seoul', 'Australia/Sydney', 'Pacific/Auckland',
];

// Region-grouped IANA timezone dropdown (Americas, Europe, Asia, …).
export default function TimezoneSelect({ value, onChange, id }) {
  const groups = useMemo(() => {
    let zones = FALLBACK;
    try {
      if (typeof Intl.supportedValuesOf === 'function') zones = Intl.supportedValuesOf('timeZone');
    } catch { /* keep fallback */ }
    if (value && !zones.includes(value)) zones = [value, ...zones];
    const byRegion = {};
    zones.forEach(z => {
      const region = z.includes('/') ? z.split('/')[0] : 'Other';
      (byRegion[region] ||= []).push(z);
    });
    return Object.keys(byRegion).sort().map(r => [r, byRegion[r]]);
  }, [value]);

  return (
    <select id={id} className="tz-select" value={value} onChange={e => onChange(e.target.value)}>
      {groups.map(([region, zones]) => (
        <optgroup key={region} label={region}>
          {zones.map(z => (
            <option key={z} value={z}>
              {z.replace(/_/g, ' ')}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
