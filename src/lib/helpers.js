// ---------- date / time formatting ----------
export const fmtDay = d =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
export const fmtDayS = d =>
  new Date(d).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
export const fmtTime = d =>
  new Date(d).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
export const dayKey = d => new Date(d).toISOString().slice(0, 10);
export const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone;

// group an array of matches into [dayKey, sortedMatches][] ordered by day
export function groupByDay(list) {
  const g = {};
  list.forEach(m => {
    (g[dayKey(m.kickoff)] ||= []).push(m);
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
