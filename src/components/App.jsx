import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { db, configured } from '../lib/supabase.js';
import { detectedTz } from '../lib/helpers.js';
import { AppCtx } from '../lib/ctx.js';
import { computeStandings } from '../lib/standings.js';
import Auth from './Auth.jsx';
import Header from './Header.jsx';
import Home from './Home.jsx';
import Schedule from './Schedule.jsx';
import Favourites from './Favourites.jsx';
import Teams from './Teams.jsx';
import MatchDetail from './MatchDetail.jsx';
import TeamDrawer from './TeamDrawer.jsx';
import GoalAnimation from './GoalAnimation.jsx';
import WinnerAnimation from './WinnerAnimation.jsx';
import SettingsModal from './SettingsModal.jsx';
import Trophy from './Trophy.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [followed, setFollowed] = useState(new Set());
  const [matches, setMatches] = useState([]); // ALL matches
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('home');
  const [onboarding, setOnboarding] = useState(false);

  // timezone preference
  const [tz, setTzState] = useState(detectedTz);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [firstRunTz, setFirstRunTz] = useState(false);

  // drawers + celebration overlays
  const [detailId, setDetailId] = useState(null);
  const [teamId, setTeamId] = useState(null);
  const [goalEvent, setGoalEvent] = useState(null);
  const [winEvent, setWinEvent] = useState(null);
  const [goalFlash, setGoalFlash] = useState(() => new Map());

  // ---------- auth (unchanged data logic) ----------
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

  // ---------- data loading (unchanged data logic) ----------
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
        '*, home:home_team_id(id,name,code,flag,group_name), away:away_team_id(id,name,code,flag,group_name)'
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

  // ---------- realtime (unchanged pattern; everything below derives from `matches`) ----------
  useEffect(() => {
    if (!user) return;
    const ch = db
      .channel('matches-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => loadMatches())
      .subscribe();
    return () => db.removeChannel(ch);
  }, [user, loadMatches]);

  // ---------- follow / unfollow (unchanged data logic) ----------
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

  // ---------- timezone preference ----------
  useEffect(() => {
    if (!user || onboarding) return;
    db.from('user_preferences')
      .select('timezone')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.timezone) setTzState(data.timezone);
        else setFirstRunTz(true); // first login: confirm detected zone
      });
  }, [user, onboarding]);

  const saveTz = useCallback(
    async z => {
      setTzState(z);
      setFirstRunTz(false);
      setSettingsOpen(false);
      if (user)
        await db
          .from('user_preferences')
          .upsert({ user_id: user.id, timezone: z, updated_at: new Date().toISOString() });
    },
    [user]
  );

  // ---------- goal & full-time detection (drives celebrations + card flashes) ----------
  const prevMatchesRef = useRef(new Map());
  useEffect(() => {
    const prev = prevMatchesRef.current;
    if (prev.size) {
      for (const m of matches) {
        const p = prev.get(m.id);
        if (!p) continue;
        const hs = m.home_score ?? 0;
        const as = m.away_score ?? 0;
        const phs = p.home_score ?? 0;
        const pas = p.away_score ?? 0;
        if (m.status !== 'scheduled' && (hs > phs || as > pas)) {
          const side = hs > phs ? 'home' : 'away';
          setGoalEvent({ match: m, side, key: `${m.id}-${hs}-${as}` });
          setGoalFlash(f => new Map(f).set(m.id, { side, ts: Date.now() }));
          setTimeout(
            () =>
              setGoalFlash(f => {
                const n = new Map(f);
                n.delete(m.id);
                return n;
              }),
            5000
          );
        }
        if (p.status !== 'finished' && m.status === 'finished') {
          const mine =
            (m.home && followed.has(m.home.id)) || (m.away && followed.has(m.away.id));
          if (mine) setWinEvent({ match: m, key: `ft-${m.id}` });
        }
      }
    }
    prevMatchesRef.current = new Map(matches.map(m => [m.id, m]));
  }, [matches, followed]);

  // ---------- live match clock: tick client-side between server updates ----------
  const minuteBase = useRef(new Map());
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const map = minuteBase.current;
    const liveIds = new Set();
    matches.forEach(m => {
      if (m.status !== 'live') return;
      liveIds.add(m.id);
      const srv = m.minute ?? 0;
      const b = map.get(m.id);
      if (!b || b.server !== srv) map.set(m.id, { server: srv, ts: Date.now() }); // reset on server update
    });
    [...map.keys()].forEach(id => liveIds.has(id) || map.delete(id));
  }, [matches]);
  useEffect(() => {
    if (!matches.some(m => m.status === 'live')) return;
    const t = setInterval(() => setClockTick(x => x + 1), 60000);
    return () => clearInterval(t);
  }, [matches]);
  const liveMinute = useCallback(m => {
    const b = minuteBase.current.get(m.id);
    if (!b) return m.minute ?? null;
    return b.server + Math.floor((Date.now() - b.ts) / 60000);
  }, []);

  // ---------- derived ----------
  const standings = useMemo(() => computeStandings(teams, matches), [teams, matches]);

  const ctx = useMemo(
    () => ({
      tz,
      teams,
      matches,
      followed,
      standings,
      goalFlash,
      toggleTeam,
      liveMinute,
      openMatch: setDetailId,
      openTeam: setTeamId,
      openSettings: () => setSettingsOpen(true),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tz, teams, matches, followed, standings, goalFlash, liveMinute]
  );

  // ---------- render ----------
  if (loading)
    return (
      <div className="loading-splash">
        <Trophy size={48} />
        <div className="wordmark">PITCHSIDE</div>
        <div className="loading-sub">Warming up…</div>
      </div>
    );

  if (!configured)
    return (
      <div className="wrap">
        <div className="auth-card setup">
          <h2 className="auth-h">SETUP NEEDED</h2>
          <p className="auth-p">
            Create a <b>.env</b> file with your <b>VITE_SUPABASE_URL</b> and <b>VITE_SUPABASE_ANON_KEY</b> (see
            <b> .env.example</b>), then restart the dev server. Run <b>db/schema.sql</b> in Supabase first.
          </p>
        </div>
      </div>
    );

  if (!user || onboarding) return <Auth onAuth={setUser} setOnboarding={setOnboarding} />;

  const detailMatch = detailId != null ? matches.find(m => m.id === detailId) : null;
  const drawerTeam = teamId != null ? teams.find(t => t.id === teamId) : null;

  return (
    <AppCtx.Provider value={ctx}>
      <Header page={page} setPage={setPage} user={user} />

      <main key={page} className="wrap page-anim">
        {page === 'home' && <Home />}
        {page === 'schedule' && <Schedule />}
        {page === 'fav' && <Favourites setPage={setPage} />}
        {page === 'teams' && <Teams />}
      </main>

      {detailMatch && <MatchDetail match={detailMatch} onClose={() => setDetailId(null)} />}
      {drawerTeam && <TeamDrawer team={drawerTeam} onClose={() => setTeamId(null)} />}

      {goalEvent && (
        <GoalAnimation key={goalEvent.key} event={goalEvent} onDone={() => setGoalEvent(null)} />
      )}
      {winEvent && !goalEvent && (
        <WinnerAnimation key={winEvent.key} event={winEvent} onDone={() => setWinEvent(null)} />
      )}

      {(settingsOpen || firstRunTz) && (
        <SettingsModal
          tz={tz}
          firstRun={firstRunTz && !settingsOpen}
          onSave={saveTz}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </AppCtx.Provider>
  );
}
