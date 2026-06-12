import { useMemo, useRef } from 'react';
import Flag from './Flag.jsx';
import FollowButton from './FollowButton.jsx';
import { useApp } from '../lib/ctx.js';
import { teamColors } from '../lib/teamColors.js';
import { crowdCheer } from '../lib/crowd.js';

function TeamCard({ t }) {
  const { openTeam } = useApp();
  const hoverTimer = useRef(null);
  const [c1, c2] = teamColors(t.code);

  return (
    <div
      className="team-card"
      style={{ backgroundImage: `linear-gradient(135deg, ${c1}14, transparent 55%, ${c2 || c1}10)` }}
      onClick={() => openTeam(t.id)}
      onMouseEnter={() => {
        hoverTimer.current = setTimeout(crowdCheer, 2000); // linger 2s → crowd roar
      }}
      onMouseLeave={() => clearTimeout(hoverTimer.current)}
    >
      <Flag src={t.flag} size={28} wave />
      <div className="tc-id">
        <div className="tc-name">{t.name}</div>
        <div className="tc-code mono">
          {t.code} · {t.group_name?.replace('Group ', 'GRP ') || '—'}
        </div>
      </div>
      <FollowButton team={t} />
    </div>
  );
}

export default function Teams() {
  const { teams } = useApp();

  const groups = useMemo(() => {
    const g = {};
    teams.forEach(t => {
      (g[t.group_name || 'Other'] ||= []).push(t);
    });
    return Object.keys(g)
      .sort()
      .map(k => [k, g[k]]);
  }, [teams]);

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">ALL 48 TEAMS</h2>
        <p className="section-sub">
          Follow the nations you care about — their fixtures fill your Favourites page and timetable automatically.
          Tap a card for fixtures, form and group standing.
        </p>
      </div>
      {groups.map(([gname, ts]) => (
        <div className={`group-block g-${gname.slice(6, 7)}`} key={gname}>
          <div className="group-head">
            <span className="grp-dot" />
            {gname}
          </div>
          <div className="teams-grid">
            {ts.map(t => (
              <TeamCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
