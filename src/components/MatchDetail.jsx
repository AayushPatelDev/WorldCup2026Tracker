import { useEffect, useMemo } from 'react';
import Flag from './Flag.jsx';
import FollowButton from './FollowButton.jsx';
import Trophy from './Trophy.jsx';
import { Close, Stadium, CalendarIcon } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';
import { fmtDay, fmtTime, tzAbbr, icsEvent, downloadICS } from '../lib/helpers.js';
import { teamColors } from '../lib/teamColors.js';

// Stat label → candidate key prefixes inside the matches.stats jsonb.
const STAT_DEFS = [
  ['Possession', ['possession', 'possession_pct'], true],
  ['Shots', ['shots', 'total_shots']],
  ['Shots on target', ['shots_on_target', 'on_target', 'shots_on_goal']],
  ['Corners', ['corners', 'corner_kicks']],
  ['Fouls', ['fouls']],
  ['Yellow cards', ['yellow_cards', 'yellows', 'yellow']],
  ['Red cards', ['red_cards', 'reds', 'red']],
];

const statVal = (s, keys, side) => {
  for (const k of keys) {
    const v = s?.[`${k}_${side}`];
    if (v !== null && v !== undefined && v !== '') return Number(v);
  }
  return null;
};

function StatBar({ label, home, away, pct, index }) {
  const total = pct ? 100 : home + away;
  const hShare = total > 0 ? (pct ? home : home / total) * (pct ? 0.01 : 1) : 0.5;
  return (
    <div className="stat-bar-row" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="sb-nums">
        <span className="mono">{home}{pct ? '%' : ''}</span>
        <span className="sb-label">{label}</span>
        <span className="mono">{away}{pct ? '%' : ''}</span>
      </div>
      <div className="sb-track">
        <div
          className="sb-home"
          style={{ width: `${hShare * 100}%`, animationDelay: `${index * 80 + 120}ms` }}
        />
        <div
          className="sb-away"
          style={{ width: `${(1 - hShare) * 100}%`, animationDelay: `${index * 80 + 120}ms` }}
        />
      </div>
    </div>
  );
}

function Lineups({ match }) {
  const s = match.stats || {};
  const pick = side => {
    const l = s.lineups?.[side] || s[`lineup_${side}`] || s[`${side}_lineup`];
    return Array.isArray(l) && l.length ? l : null;
  };
  const home = pick('home');
  const away = pick('away');
  const col = (list, team, label) => (
    <div className="lu-col">
      <div className="lu-team">
        {team && <Flag src={team.flag} size={14} />} {team?.code || label || 'TBD'}
      </div>
      {(list || Array.from({ length: 11 })).map((p, i) => (
        <div className={'lu-row' + (list ? '' : ' ghost')} key={i}>
          <span className="lu-num mono">{list ? p?.number ?? i + 1 : i + 1}</span>
          <span className="lu-name">{list ? (typeof p === 'string' ? p : p?.name || '—') : '—'}</span>
        </div>
      ))}
    </div>
  );
  return (
    <section className="md-section">
      <h3 className="md-h">STARTING LINEUPS</h3>
      {!home && !away && <div className="md-note">Lineups TBD — they'll appear here once announced.</div>}
      <div className="md-lineups">
        {col(home, match.home, match.home_label)}
        {col(away, match.away, match.away_label)}
      </div>
    </section>
  );
}

function GoalTimeline({ match }) {
  const goals = useMemo(() => {
    const s = match.stats || {};
    let list =
      s.goals ||
      s.goal_events ||
      (Array.isArray(s.events) ? s.events.filter(e => (e.type || '').toLowerCase().includes('goal')) : null);
    if (!Array.isArray(list)) return [];
    return list
      .map(g => ({
        minute: Number(g.minute ?? g.time ?? g.min ?? 0),
        scorer: g.scorer || g.player || g.player_name || '',
        side:
          g.side ||
          (g.team === 'home' || g.team === 'away' ? g.team : null) ||
          (g.team_id != null
            ? String(g.team_id) === String(match.home_team_id)
              ? 'home'
              : 'away'
            : 'home'),
      }))
      .filter(g => g.minute > 0)
      .sort((a, b) => a.minute - b.minute);
  }, [match]);

  const span = Math.max(95, ...goals.map(g => g.minute + 4));
  const hasScore = (match.home_score ?? 0) + (match.away_score ?? 0) > 0;

  return (
    <section className="md-section">
      <h3 className="md-h">GOAL TIMELINE</h3>
      <div className="md-timeline">
        <div className="tl-line" />
        {[0, 45, 90].map(t => (
          <div className="tl-tick mono" key={t} style={{ left: `${(t / span) * 100}%` }}>
            {t}'
          </div>
        ))}
        {goals.map((g, i) => (
          <div
            key={i}
            className={'tl-goal' + (g.side === 'away' ? ' away' : '')}
            style={{ left: `${(g.minute / span) * 100}%` }}
            title={`${g.minute}' ${g.scorer}`}
          >
            <span className="tl-ball">⚽</span>
            <span className="tl-label">
              {g.minute}'{g.scorer ? ` ${g.scorer}` : ''}
            </span>
          </div>
        ))}
      </div>
      {!goals.length && (
        <div className="md-note">
          {hasScore ? 'Goal-by-goal detail not available for this match.' : 'No goals yet.'}
        </div>
      )}
    </section>
  );
}

export default function MatchDetail({ match, onClose }) {
  const { tz, liveMinute } = useApp();
  const m = match;
  const live = m.status === 'live';
  const done = m.status === 'finished';

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const s = m.stats || {};
  const stats = STAT_DEFS.map(([label, keys, pct]) => ({
    label,
    pct: !!pct,
    home: statVal(s, keys, 'home'),
    away: statVal(s, keys, 'away'),
  })).filter(st => st.home !== null && st.away !== null);

  const hs = m.home_score ?? 0;
  const as = m.away_score ?? 0;
  const winSide = done ? (hs > as ? 'home' : as > hs ? 'away' : null) : null;
  const motm = s.motm || s.man_of_the_match || s.best_player || null;
  const minute = live ? liveMinute(m) : null;
  const calTitle = `${m.home?.name || m.home_label || 'TBD'} vs ${m.away?.name || m.away_label || 'TBD'}`;
  const hCol = m.home ? teamColors(m.home.code)[0] : '#C9A84C';
  const aCol = m.away ? teamColors(m.away.code)[0] : '#00FF87';

  const board = (team, label, away) => (
    <div className={'md-side' + (away ? ' away' : '') + (winSide === (away ? 'away' : 'home') ? ' win' : '')}>
      <div className="md-flag">
        <Flag src={team?.flag} size={52} wave />
      </div>
      <div className="md-name">{team?.name || label || 'TBD'}</div>
      <div className="md-code mono">{team?.code || '—'}</div>
      {team && <FollowButton team={team} label />}
      {winSide === (away ? 'away' : 'home') && (
        <div className="md-winner-tag">
          <Trophy size={16} /> WINNER
        </div>
      )}
    </div>
  );

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer md-drawer" onClick={e => e.stopPropagation()}>
        <header className="drawer-head">
          <div className="drawer-head-info">
            <span className="mc-stage-chip">
              <span className="grp-dot" />
              {m.stage || 'World Cup'}
            </span>
            {m.venue && (
              <span className="mc-venue">
                <Stadium /> {m.venue}
              </span>
            )}
          </div>
          <button type="button" className="drawer-close" onClick={onClose} title="Close">
            <Close />
          </button>
        </header>

        <div className="drawer-body">
          <div className="md-board">
            {board(m.home, m.home_label, false)}
            <div className="md-centre">
              {live && (
                <div className="mc-badge live big">
                  <span className="pulse-dot" />
                  LIVE{minute != null ? <span className="mono"> {minute}'</span> : ''}
                </div>
              )}
              {done && <div className="mc-badge ft big">FULL TIME</div>}
              {!live && !done && <div className="mc-badge up big">KICK-OFF</div>}
              {live || done ? (
                <div className="md-score">
                  {hs}
                  <span className="mc-dash">–</span>
                  {as}
                </div>
              ) : (
                <div className="md-ko">
                  <div className="md-ko-time mono">{fmtTime(m.kickoff, tz)}</div>
                  <div className="md-ko-tz mono">{tzAbbr(tz, new Date(m.kickoff))}</div>
                </div>
              )}
              <div className="md-date">{fmtDay(m.kickoff, tz)}</div>
              {done && !winSide && <div className="md-draw-note">An even battle</div>}
            </div>
            {board(m.away, m.away_label, true)}
          </div>

          {motm && (
            <div className="md-motm">
              <Trophy size={18} /> Man of the Match: <b>{typeof motm === 'string' ? motm : motm.name || ''}</b>
            </div>
          )}

          <section className="md-section">
            <h3 className="md-h">MATCH STATS</h3>
            {stats.length ? (
              <div className="md-stats" style={{ '--h-col': hCol, '--a-col': aCol }}>
                {stats.map((st, i) => (
                  <StatBar key={st.label} index={i} label={st.label} home={st.home} away={st.away} pct={st.pct} />
                ))}
              </div>
            ) : (
              <div className="md-note">
                {live || done ? 'Match stats not yet available.' : 'Stats will appear once the match kicks off.'}
              </div>
            )}
          </section>

          <GoalTimeline match={m} />
          <Lineups match={m} />

          <div className="md-actions">
            {!done && (m.home || m.away) && (
              <button
                type="button"
                className="btn btn-gold"
                onClick={() => downloadICS([icsEvent(m)], `${calTitle}.ics`)}
              >
                <CalendarIcon size={15} /> Add this match to my calendar
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
