import Flag from './Flag.jsx';
import { Globe } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';
import { fmtDayS, fmtTime, tzAbbr } from '../lib/helpers.js';

// Outlook-style timetable of followed-team fixtures, in the user's timezone.
export default function Timetable({ matches }) {
  const { tz, followed, openMatch, openSettings } = useApp();
  if (!matches.length) return null;
  const rows = [...matches].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff));

  const name = (team, label) => (
    <span className={'tt-team' + (team && followed.has(team.id) ? ' mine' : '')}>
      {team?.flag && <Flag src={team.flag} size={14} />} {team?.name || label || 'TBD'}
    </span>
  );

  return (
    <div className="tt-wrap">
      <table className="tt">
        <thead>
          <tr>
            <th>Date</th>
            <th>
              <span className="tt-tz-head">
                <Globe /> Kickoff · {tzAbbr(tz)}
                <button type="button" className="tt-tz-change" onClick={openSettings} title="Change timezone">
                  change
                </button>
              </span>
            </th>
            <th>Match</th>
            <th>Stage / Venue</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(m => (
            <tr key={m.id} onClick={() => openMatch(m.id)}>
              <td className="tt-date">{fmtDayS(m.kickoff, tz)}</td>
              <td className="tt-time mono">
                {m.status === 'live' ? (
                  <span className="tt-live">
                    <span className="pulse-dot" /> LIVE
                  </span>
                ) : m.status === 'finished' ? (
                  `FT ${m.home_score ?? 0}–${m.away_score ?? 0}`
                ) : (
                  fmtTime(m.kickoff, tz)
                )}
              </td>
              <td>
                <div className="tt-match">
                  {name(m.home, m.home_label)}
                  <span className="tt-v">v</span>
                  {name(m.away, m.away_label)}
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
