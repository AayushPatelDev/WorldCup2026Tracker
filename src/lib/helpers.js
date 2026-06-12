// ---------- date / time formatting ----------
// Every formatter accepts an optional IANA timezone (e.g. 'Asia/Kolkata').
// When omitted it falls back to the browser zone, so old call-sites keep working.
const tzOpt = tz => (tz ? { timeZone: tz } : {});

export const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
export const tzName = detectedTz; // back-compat alias

export const fmtDay = (d, tz) =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', ...tzOpt(tz) });
export const fmtDayS = (d, tz) =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', ...tzOpt(tz) });
export const fmtTime = (d, tz) =>
  new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', ...tzOpt(tz) });

// Short zone label for display next to times, e.g. "EST", "GMT+5:30".
export const tzAbbr = (tz, d = new Date()) => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { ...tzOpt(tz), timeZoneName: 'short' }).formatToParts(d);
    return parts.find(p => p.type === 'timeZoneName')?.value || '';
  } catch {
    return '';
  }
};
export const fmtTimeZ = (d, tz) => `${fmtTime(d, tz)} ${tzAbbr(tz, new Date(d))}`;

// Calendar-day key (YYYY-MM-DD) as seen from the given zone.
export const dayKey = (d, tz) =>
  new Date(d).toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', ...tzOpt(tz) });

// Label for a dayKey. The key is already zone-resolved, so format it in UTC
// to guarantee the displayed date never shifts again.
export const fmtDateKey = (k, opts = { weekday: 'long', month: 'short', day: 'numeric' }) =>
  new Date(`${k}T00:00:00Z`).toLocaleDateString(undefined, { ...opts, timeZone: 'UTC' });

// group an array of matches into [dayKey, sortedMatches][] ordered by day
export function groupByDay(list, tz) {
  const g = {};
  list.forEach(m => {
    (g[dayKey(m.kickoff, tz)] ||= []).push(m);
  });
  return Object.keys(g)
    .sort()
    .map(k => [k, g[k].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))]);
}

// ---------- ICS (calendar) export ----------
export function icsEvent(m) {
  const start = new Date(m.kickoff);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const z = s => s.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const homeName = m.home?.name || m.home_label || 'TBD';
  const awayName = m.away?.name || m.away_label || 'TBD';
  const title = `${homeName} vs ${awayName}`;
  return [
    'BEGIN:VEVENT',
    `UID:wc-${m.id}@pitchside`,
    `DTSTAMP:${z(new Date())}`,
    `DTSTART:${z(start)}`,
    `DTEND:${z(end)}`,
    `SUMMARY:⚽ ${title} (${m.stage || 'World Cup'})`,
    `LOCATION:${m.venue || 'World Cup 2026'}`,
    `DESCRIPTION:${m.stage || ''} — added via Pitchside`,
    'END:VEVENT',
  ].join('\r\n');
}

export function downloadICS(events, filename) {
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pitchside//WC2026//EN',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');
  const blob = new Blob([ics], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
