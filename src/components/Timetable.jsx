import Flag from './Flag.jsx';
import { fmtDayS, fmtTime, tzName } from '../lib/helpers.js';

export default function Timetable({ matches }) {
  if (!matches.length) return null;
  const rows = [...matches].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));
  return (
    <div className="tt-wrap">
      <table className="tt">
        <thead>
          <tr>
            <th>Date</th>
            <th>Kickoff ({tzName})</th>
            <th>Match</th>
            <th>Stage / Venue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => (
            <tr key={m.id}>
              <td className="tt-date">{fmtDayS(m.kickoff)}</td>
              <td className="tt-time">
                {m.status === 'live' ? (
                  <span className="tt-live">LIVE</span>
                ) : m.status === 'finished' ? (
                  'FT'
                ) : (
                  fmtTime(m.kickoff)
                )}
              </td>
              <td>
                <div className="tt-match">
                  <span>
                    {m.home?.flag && <Flag src={m.home.flag} size={16} />} {m.home?.name || m.home_label || 'TBD'}
                  </span>
                  <span style={{ color: 'var(--mut)' }}>v</span>
                  <span>
                    {m.away?.name || m.away_label || 'TBD'} {m.away?.flag && <Flag src={m.away.flag} size={16} />}
                  </span>
                </div>
              </td>
              <td className="tt-stage">
                {m.stage || '—'}
                {m.venue ? ` · ${m.venue}` : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
