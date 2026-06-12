import { useState } from 'react';
import Flag from './Flag.jsx';
import { Chevron } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';

// Collapsible group tables (A–L), recomputed client-side from finished results.
// `only` limits to specific group names; `defaultOpen` expands them initially.
export default function Standings({ only = null, defaultOpen = false }) {
  const { standings, followed, openTeam } = useApp();
  const names = Object.keys(standings)
    .filter(g => !only || only.includes(g))
    .sort();
  const [open, setOpen] = useState(() => new Set(defaultOpen ? names : []));

  if (!names.length) return null;

  const toggle = g =>
    setOpen(prev => {
      const next = new Set(prev);
      next.has(g) ? next.delete(g) : next.add(g);
      return next;
    });

  return (
    <div className="standings">
      {names.map(g => {
        const isOpen = open.has(g);
        const letter = g.slice(6, 7);
        return (
          <div className={`stand-group g-${letter}`} key={g}>
            <button type="button" className="stand-head" onClick={() => toggle(g)}>
              <span className="grp-dot" />
              <span className="stand-title">{g}</span>
              <span className="stand-chev">
                <Chevron open={isOpen} />
              </span>
            </button>
            {isOpen && (
              <table className="stand-table">
                <thead>
                  <tr>
                    <th className="pos">#</th>
                    <th className="tname">Team</th>
                    <th>P</th><th>W</th><th>D</th><th>L</th>
                    <th>GF</th><th>GA</th><th>GD</th>
                    <th className="pts">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings[g].map((r, i) => (
                    <tr
                      key={r.team.id}
                      className={'stand-row' + (i < 2 ? ' qual' : '') + (followed.has(r.team.id) ? ' mine' : '')}
                      style={{ animationDelay: `${i * 40}ms` }}
                      onClick={() => openTeam(r.team.id)}
                    >
                      <td className="pos mono">{i + 1}</td>
                      <td className="tname">
                        <Flag src={r.team.flag} size={14} /> {r.team.name}
                      </td>
                      <td className="mono">{r.p}</td>
                      <td className="mono">{r.w}</td>
                      <td className="mono">{r.d}</td>
                      <td className="mono">{r.l}</td>
                      <td className="mono">{r.gf}</td>
                      <td className="mono">{r.ga}</td>
                      <td className="mono">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                      <td className="pts mono">{r.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
