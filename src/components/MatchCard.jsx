import Flag from './Flag.jsx';
import { fmtTime, icsEvent, downloadICS } from '../lib/helpers.js';

export default function MatchCard({ m, followed, toggleTeam }) {
  const live = m.status === 'live';
  const done = m.status === 'finished';
  const s = m.stats || {};

  const star = team =>
    team && (
      <span
        className={'star' + (followed.has(team.id) ? ' on' : '')}
        title={followed.has(team.id) ? 'Unfollow' : 'Follow'}
        onClick={() => toggleTeam(team.id)}
      >
        ★
      </span>
    );

  // Render one side: a real team (flag + name + follow star), or a TBD label.
  const sideContent = (team, label, away) => {
    if (team) {
      return (
        <>
          {star(team)}
          <Flag src={team.flag} size={30} />
          <div>
            <div className="nm">{team.name}</div>
            <div className="cd">{team.code}</div>
          </div>
        </>
      );
    }
    return (
      <>
        <Flag src={null} size={30} />
        <div>
          <div className="nm tbd">{label || 'TBD'}</div>
          <div className="cd">—</div>
        </div>
      </>
    );
  };

  const canCalendar = !done && (m.home || m.away);
  const calTitle = `${m.home?.name || m.home_label || 'TBD'} vs ${m.away?.name || m.away_label || 'TBD'}`;

  return (
    <div className={'match' + (live ? ' live' : '')}>
      <div className="side home">{sideContent(m.home, m.home_label, false)}</div>

      <div className="mid">
        {live && (
          <div className="badge live">
            <span className="d"></span>LIVE {m.minute ? `${m.minute}'` : ''}
          </div>
        )}
        {done && <div className="badge done">FT</div>}
        {!live && !done && <div className="badge up">Upcoming</div>}
        {live || done ? (
          <div className="score">
            {m.home_score ?? 0}
            <span style={{ color: 'var(--mut)', margin: '0 4px' }}>–</span>
            {m.away_score ?? 0}
          </div>
        ) : (
          <>
            <div className="vs">VS</div>
            <div className="time">{fmtTime(m.kickoff)}</div>
          </>
        )}
      </div>

      <div className="side away">{sideContent(m.away, m.away_label, true)}</div>

      {(live || done) && (s.possession_home || s.shots_home != null) && (
        <div className="stats-row">
          {s.possession_home != null && (
            <div className="stat">
              Possession <b>{s.possession_home}% – {s.possession_away}%</b>
            </div>
          )}
          {s.shots_home != null && (
            <div className="stat">
              Shots <b>{s.shots_home} – {s.shots_away}</b>
            </div>
          )}
          {s.corners_home != null && (
            <div className="stat">
              Corners <b>{s.corners_home} – {s.corners_away}</b>
            </div>
          )}
        </div>
      )}

      <div className="meta">
        <div className="info">
          {m.stage || 'World Cup'}
          {m.venue ? ` · ${m.venue}` : ''}
        </div>
        {canCalendar && (
          <button className="ics" onClick={() => downloadICS([icsEvent(m)], `${calTitle}.ics`)}>
            ＋ Add to calendar
          </button>
        )}
      </div>
    </div>
  );
}
