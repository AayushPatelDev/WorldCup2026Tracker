import { useMemo, Fragment } from 'react';
import Flag from './Flag.jsx';

export default function Teams({ teams, followed, toggleTeam }) {
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
      <div className="section-h">Choose your teams</div>
      <div className="section-sub">
        Tap any team to follow it. Following Portugal, France and Norway at once? Tap all three — every match they
        play shows up on your Favourites page automatically.
      </div>
      <div className="team-grid">
        {groups.map(([gname, ts]) => (
          <Fragment key={gname}>
            <div className="grp-head">{gname}</div>
            {ts.map(t => (
              <div
                key={t.id}
                className={'team-card' + (followed.has(t.id) ? ' on' : '')}
                onClick={() => toggleTeam(t.id)}
              >
                <Flag src={t.flag} size={26} />
                <div>
                  <div className="nm">{t.name}</div>
                  <div className="gp">{t.code}</div>
                </div>
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
