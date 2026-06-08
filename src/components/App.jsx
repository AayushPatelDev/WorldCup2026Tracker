import { useState, useEffect, useCallback, useMemo } from 'react';
import { db, configured } from '../lib/supabase.js';
import { icsEvent, downloadICS, tzName } from '../lib/helpers.js';
import Auth from './Auth.jsx';
import Flag from './Flag.jsx';
import MatchList from './MatchList.jsx';
import Timetable from './Timetable.jsx';
import Teams from './Teams.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [followed, setFollowed] = useState(new Set());
  const [matches, setMatches] = useState([]); // ALL matches
  const [tab, setTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [groupFilter, setGroupFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    db.auth.getSession().then(({ data }) => {
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data: sub } = db.auth.onAuthStateChange((_e, s) => setUser(s?.user || null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const loadBase = useCallback(async () => {
    const { data: t } = await db.from('teams').select('*').order('group_name').order('name');
    setTeams(t || []);
    const { data: ut } = await db.from('user_teams').select('team_id');
    setFollowed(new Set((ut || []).map(r => r.team_id)));
  }, []);

  const loadMatches = useCallback(async () => {
    const { data } = await db
      .from('matches')
      .select(
        '*, home:home_team_id(id,name,code,flag), away:away_team_id(id,name,code,flag)'
      )
      .order('kickoff');
    // keep matches that have at least one resolved team OR a TBD label (knockouts)
    setMatches((data || []).filter(m => m.home || m.away || m.home_label || m.away_label));
  }, []);

  useEffect(() => {
    if (user) {
      loadBase();
      loadMatches();
    }
  }, [user, loadBase, loadMatches]);

  useEffect(() => {
    if (!user) return;
    const ch = db
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadMatches())
      .subscribe();
    return () => db.removeChannel(ch);
  }, [user, loadMatches]);

  async function toggleTeam(id) {
    const next = new Set(followed);
    if (next.has(id)) {
      next.delete(id);
      await db.from('user_teams').delete().eq('user_id', user.id).eq('team_id', id);
    } else {
      next.add(id);
      await db.from('user_teams').insert({ user_id: user.id, team_id: id });
    }
    setFollowed(next);
  }

  const favMatches = useMemo(
    () => matches.filter(m => (m.home && followed.has(m.home.id)) || (m.away && followed.has(m.away.id))),
    [matches, followed]
  );
  const favTeams = useMemo(() => teams.filter(t => followed.has(t.id)), [teams, followed]);
  const liveCount = matches.filter(m => m.status === 'live').length;

  const allGroups = useMemo(
    () => [...new Set(teams.map(t => t.group_name).filter(Boolean))].sort(),
    [teams]
  );
  const filteredAll = useMemo(
    () =>
      matches.filter(m => {
        if (statusFilter !== 'all' && m.status !== statusFilter) return false;
        if (groupFilter !== 'all' && !(m.stage || '').includes(groupFilter)) return false;
        return true;
      }),
    [matches, statusFilter, groupFilter]
  );

  function addAllFav() {
    if (!favMatches.length) return;
    const upcoming = favMatches.filter(m => m.status !== 'finished');
    downloadICS(upcoming.map(icsEvent), 'my-worldcup-2026.ics');
  }

  if (loading) return <div className="loading">Loading…</div>;

  if (!configured)
    return (
      <div className="wrap">
        <div className="auth">
          <h2>Setup needed</h2>
          <p>
            Create a <b>.env</b> file with your <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> (see
            <b> .env.example</b>), then restart the dev server. Run <b>db/schema.sql</b> in Supabase first.
          </p>
        </div>
      </div>
    );

  if (!user)
    return (
      <div className="wrap">
        <Auth onAuth={setUser} />
      </div>
    );

  return (
    <div className="wrap">
      <header className="top">
        <div className="logo">
          <div className="ball"></div>
          <div>
            <h1>
              PITCH<span>SIDE</span>
            </h1>
            <small>WORLD CUP 2026 TRACKER</small>
          </div>
        </div>
        <button className="btn btn-ghost" onClick={() => db.auth.signOut()}>
          Sign out
        </button>
      </header>

      <div className="tabs">
        <div className={'tab' + (tab === 'all' ? ' active' : '')} onClick={() => setTab('all')}>
          All Matches {liveCount > 0 && <span className="dot"></span>}
        </div>
        <div className={'tab' + (tab === 'fav' ? ' active' : '')} onClick={() => setTab('fav')}>
          Favourites {favTeams.length > 0 && <span className="pill">{favTeams.length}</span>}
        </div>
        <div className={'tab' + (tab === 'teams' ? ' active' : '')} onClick={() => setTab('teams')}>
          Teams
        </div>
      </div>

      {tab === 'all' && (
        <div>
          <div className="toolbar">
            <div>
              <div className="section-h">All matches</div>
              <div className="section-sub">
                Every fixture in the tournament. Tap the ★ next to any team to add it to your favourites.
              </div>
            </div>
            <div className="filters">
              <select className="grp" value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
                <option value="all">All groups</option>
                {allGroups.map(g => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              {['all', 'live', 'scheduled', 'finished'].map(s => (
                <span
                  key={s}
                  className={'chip' + (statusFilter === s ? ' on' : '')}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s[0].toUpperCase() + s.slice(1)}
                </span>
              ))}
            </div>
          </div>
          <MatchList
            matches={filteredAll}
            followed={followed}
            toggleTeam={toggleTeam}
            emptyTitle="No matches to show"
            emptyBody="Run the sync to load the World Cup 2026 fixtures, or adjust your filters."
          />
        </div>
      )}

      {tab === 'fav' && (
        <div>
          <div className="section-h">Your favourites</div>
          <div className="section-sub">
            Everything for the teams you follow — all in one place. Add the whole schedule to your own calendar
            with one click.
          </div>

          {favTeams.length === 0 ? (
            <div className="empty">
              <div className="big">No favourite teams yet</div>
              <div>Head to the Teams tab (or tap a ★ on any match) to start following.</div>
            </div>
          ) : (
            <>
              <div className="fav-teams">
                {favTeams.map(t => (
                  <div className="fav-team" key={t.id}>
                    <Flag src={t.flag} size={18} /> {t.name}
                    <span className="x" title="Remove" onClick={() => toggleTeam(t.id)}>
                      ×
                    </span>
                  </div>
                ))}
              </div>

              <div className="toolbar">
                <div className="section-h" style={{ fontSize: '20px' }}>
                  Upcoming & live
                </div>
                <button className="btn btn-grass" onClick={addAllFav}>
                  ＋ Add all to my calendar
                </button>
              </div>
              <MatchList
                matches={favMatches}
                followed={followed}
                toggleTeam={toggleTeam}
                emptyTitle="No matches scheduled yet"
                emptyBody="Fixtures will appear here as they're confirmed."
              />

              <div className="tt-head">
                <div>
                  <div className="section-h" style={{ fontSize: '20px' }}>
                    Timetable
                  </div>
                  <div className="tz-note">Times shown in your local zone · {tzName}</div>
                </div>
                <button className="btn btn-ghost" onClick={addAllFav}>
                  Export .ics
                </button>
              </div>
              <Timetable matches={favMatches} />
            </>
          )}
        </div>
      )}

      {tab === 'teams' && <Teams teams={teams} followed={followed} toggleTeam={toggleTeam} />}
    </div>
  );
}
