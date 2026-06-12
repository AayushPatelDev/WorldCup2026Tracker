import { useEffect, useRef, useState } from 'react';
import Flag from './Flag.jsx';
import FollowButton from './FollowButton.jsx';
import { Stadium, CalendarIcon } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';
import { fmtTime, tzAbbr, icsEvent, downloadICS } from '../lib/helpers.js';
import { groupLetter } from '../lib/standings.js';
import { teamColors } from '../lib/teamColors.js';

export default function MatchCard({ m }) {
  const { tz, followed, openMatch, liveMinute, goalFlash } = useApp();
  const live = m.status === 'live';
  const done = m.status === 'finished';

  // brief scale-pop on the score digits every time the score changes
  const scoreKey = `${m.home_score ?? ''}-${m.away_score ?? ''}`;
  const prevScore = useRef(scoreKey);
  const [pop, setPop] = useState(false);
  useEffect(() => {
    if (prevScore.current === scoreKey) return;
    prevScore.current = scoreKey;
    setPop(true);
    const t = setTimeout(() => setPop(false), 320);
    return () => clearTimeout(t);
  }, [scoreKey]);

  const isFav = (m.home && followed.has(m.home.id)) || (m.away && followed.has(m.away.id));
  const flash = goalFlash.get(m.id);
  const gl = groupLetter(m);

  // subtle national-colour wash, home colours left / away colours right
  const hC = m.home ? teamColors(m.home.code)[0] : null;
  const aC = m.away ? teamColors(m.away.code)[0] : null;
  const wash = {
    backgroundImage: `linear-gradient(100deg, ${hC ? hC + '12' : 'transparent'} 0%, transparent 32%, transparent 68%, ${aC ? aC + '12' : 'transparent'} 100%)`,
  };

  const hs = m.home_score ?? 0;
  const as = m.away_score ?? 0;
  const winSide = done ? (hs > as ? 'home' : as > hs ? 'away' : null) : null;

  const side = (team, label, away) => (
    <div className={'mc-side' + (away ? ' away' : '') + (winSide && winSide === (away ? 'away' : 'home') ? ' win' : '') + (winSide && winSide !== (away ? 'away' : 'home') ? ' lose' : '')}>
      {team ? (
        <>
          <FollowButton team={team} />
          <Flag src={team.flag} size={30} wave />
          <div className="mc-id">
            <div className="mc-name">{team.name}</div>
            <div className="mc-code mono">{team.code}</div>
          </div>
        </>
      ) : (
        <>
          <Flag src={null} size={30} />
          <div className="mc-id">
            <div className="mc-name tbd">{label || 'TBD'}</div>
            <div className="mc-code mono">—</div>
          </div>
        </>
      )}
    </div>
  );

  const minute = live ? liveMinute(m) : null;
  const calTitle = `${m.home?.name || m.home_label || 'TBD'} vs ${m.away?.name || m.away_label || 'TBD'}`;

  return (
    <article
      className={
        'match-card' +
        (gl ? ` g-${gl}` : '') +
        (live ? ' live' : '') +
        (isFav ? ' fav' : '') +
        (flash ? ' goal-flash' : '')
      }
      style={wash}
      onClick={() => openMatch(m.id)}
    >
      <div className="mc-main">
        {side(m.home, m.home_label, false)}

        <div className="mc-centre">
          {live && (
            <div className="mc-badge live">
              <span className="pulse-dot" />
              LIVE{minute != null ? <span className="mono"> {minute}'</span> : ''}
            </div>
          )}
          {done && <div className="mc-badge ft">FT</div>}
          {!live && !done && <div className="mc-badge up">{m.matchday ? `MD ${m.matchday}` : 'UPCOMING'}</div>}

          {live || done ? (
            <div className={'mc-score' + (pop ? ' pop' : '')}>
              <span>{hs}</span>
              <span className="mc-dash">–</span>
              <span>{as}</span>
            </div>
          ) : (
            <>
              <div className="mc-vs">VS</div>
              <div className="mc-time mono">
                {fmtTime(m.kickoff, tz)} <span className="mc-tz">{tzAbbr(tz, new Date(m.kickoff))}</span>
              </div>
            </>
          )}
        </div>

        {side(m.away, m.away_label, true)}
      </div>

      <div className="mc-meta">
        <div className="mc-meta-left">
          <span className="mc-stage-chip">
            <span className="grp-dot" />
            {m.stage || 'World Cup'}
          </span>
          {m.venue && (
            <span className="mc-venue">
              <Stadium /> {m.venue}
            </span>
          )}
          {isFav && <span className="your-chip">★ Your team</span>}
        </div>
        {!done && (m.home || m.away) && (
          <button
            type="button"
            className="mc-cal"
            onClick={e => {
              e.stopPropagation();
              downloadICS([icsEvent(m)], `${calTitle}.ics`);
            }}
          >
            <CalendarIcon /> Add to calendar
          </button>
        )}
      </div>
    </article>
  );
}
