import { useEffect, useMemo } from 'react';
import Flag from './Flag.jsx';
import FollowButton from './FollowButton.jsx';
import Standings from './Standings.jsx';
import { Close } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';
import { fmtDayS, fmtTime, tzAbbr } from '../lib/helpers.js';
import { teamStanding, ordinal } from '../lib/standings.js';

// Slide-in team detail: group standing, every fixture, squad placeholder.
export default function TeamDrawer({ team, onClose }) {
  const { matches, tz, openMatch, standings } = useApp();

  useEffect(() => {
    const onKey = e => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const teamMatches = useMemo(
    () =>
      matches
        .filter(m => m.home?.id === team.id || m.away?.id === team.id)
        .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)),
    [matches, team.id]
  );

  const standing = teamStanding(standings, team.id);

  const row = m => {
    const home = m.home?.id === team.id;
    const opp = home ? m.away : m.home;
    const oppLabel = home ? m.away_label : m.home_label;
    const done = m.status === 'finished';
    const live = m.status === 'live';
    const us = home ? m.home_score : m.away_score;
    const them = home ? m.away_score : m.home_score;
    const res = done ? (us > them ? 'W' : us < them ? 'L' : 'D') : null;
    return (
      <button type="button" className="td-match" key={m.id} onClick={() => openMatch(m.id)}>
        <span className="td-date mono">{fmtDayS(m.kickoff, tz)}</span>
        <span className="td-opp">
          {home ? 'vs' : '@'} {opp ? <><Flag src={opp.flag} size={13} /> {opp.name}</> : oppLabel || 'TBD'}
        </span>
        {live && (
          <span className="td-score mono live">
            <span className="pulse-dot" /> {m.home_score ?? 0}–{m.away_score ?? 0}
          </span>
        )}
        {done && (
          <span className={`td-score mono r-${res}`}>
            {res} {m.home_score ?? 0}–{m.away_score ?? 0}
          </span>
        )}
        {!done && !live && <span className="td-score mono">{fmtTime(m.kickoff, tz)} {tzAbbr(tz, new Date(m.kickoff))}</span>}
      </button>
    );
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="drawer team-drawer" onClick={e => e.stopPropagation()}>
        <header className="drawer-head">
          <div className="td-head">
            <Flag src={team.flag} size={40} wave />
            <div>
              <div className="td-name">{team.name}</div>
              <div className="td-sub mono">
                {team.code} · {team.group_name || '—'}
                {standing && standing.row.p > 0 && <> · {ordinal(standing.pos)}, {standing.row.pts} pts</>}
              </div>
            </div>
            <FollowButton team={team} label />
          </div>
          <button type="button" className="drawer-close" onClick={onClose} title="Close">
            <Close />
          </button>
        </header>

        <div className="drawer-body">
          {team.group_name && (
            <section className="md-section">
              <h3 className="md-h">GROUP STANDING</h3>
              <Standings only={[team.group_name]} defaultOpen />
            </section>
          )}

          <section className="md-section">
            <h3 className="md-h">FIXTURES & RESULTS</h3>
            {teamMatches.length ? (
              <div className="td-matches">{teamMatches.map(row)}</div>
            ) : (
              <div className="md-note">No fixtures yet — run the sync to load the schedule.</div>
            )}
          </section>

          <section className="md-section">
            <h3 className="md-h">SQUAD</h3>
            <div className="md-note">Squad information will appear here when the data source provides it.</div>
          </section>
        </div>
      </aside>
    </div>
  );
}
