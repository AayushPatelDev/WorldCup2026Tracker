import { useMemo } from 'react';
import Flag from './Flag.jsx';
import MatchList from './MatchList.jsx';
import Timetable from './Timetable.jsx';
import Standings from './Standings.jsx';
import { Globe, CalendarIcon } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';
import { icsEvent, downloadICS, tzAbbr } from '../lib/helpers.js';

export default function Favourites({ setPage }) {
  const { teams, matches, followed, toggleTeam, tz, openSettings, openTeam } = useApp();

  const favTeams = useMemo(() => teams.filter(t => followed.has(t.id)), [teams, followed]);
  const favMatches = useMemo(
    () => matches.filter(m => (m.home && followed.has(m.home.id)) || (m.away && followed.has(m.away.id))),
    [matches, followed]
  );
  const favGroups = useMemo(
    () => [...new Set(favTeams.map(t => t.group_name).filter(Boolean))].sort(),
    [favTeams]
  );

  function addAllFav() {
    const upcoming = favMatches.filter(m => m.status !== 'finished');
    if (!upcoming.length) return;
    downloadICS(upcoming.map(icsEvent), 'my-worldcup-2026.ics');
  }

  if (!favTeams.length) {
    return (
      <div>
        <div className="section-head">
          <h2 className="section-title">YOUR FAVOURITES</h2>
        </div>
        <div className="empty">
          <div className="big">No favourite teams yet</div>
          <div>Follow a team from the Teams page — or tap the ★ on any match card.</div>
          <button type="button" className="btn btn-gold" style={{ marginTop: 18 }} onClick={() => setPage('teams')}>
            Browse teams
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">YOUR FAVOURITES</h2>
        <p className="section-sub">
          Everything for the teams you follow, in one place — and one click to put it all in your calendar.
        </p>
      </div>

      <div className="fav-teams">
        {favTeams.map(t => (
          <div className="fav-team" key={t.id} onClick={() => openTeam(t.id)}>
            <Flag src={t.flag} size={16} /> {t.name}
            <button
              type="button"
              className="fav-x"
              title={`Unfollow ${t.name}`}
              onClick={e => {
                e.stopPropagation();
                toggleTeam(t.id);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <section className="section">
        <div className="section-head row">
          <h2 className="section-title sm">GROUP STANDINGS</h2>
        </div>
        <Standings only={favGroups} defaultOpen />
      </section>

      <section className="section">
        <div className="section-head row">
          <h2 className="section-title sm">MATCHES</h2>
          <button type="button" className="btn btn-gold" onClick={addAllFav}>
            <CalendarIcon size={15} /> Add all to my calendar
          </button>
        </div>
        <MatchList
          matches={favMatches}
          emptyTitle="No matches scheduled yet"
          emptyBody="Fixtures will appear here as they're confirmed."
        />
      </section>

      <section className="section">
        <div className="section-head row">
          <div>
            <h2 className="section-title sm">TIMETABLE</h2>
            <p className="section-sub">
              <Globe /> Times shown in {tz.replace(/_/g, ' ')} ({tzAbbr(tz)}) ·{' '}
              <button type="button" className="link-btn" onClick={openSettings}>
                change
              </button>
            </p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={addAllFav}>
            Export .ics
          </button>
        </div>
        <Timetable matches={favMatches} />
      </section>
    </div>
  );
}
