// Client-side group standings computed from finished group-stage matches.

// 'Group A' -> 'A'; falls back to either team's group for knockout cards.
export const groupLetter = m => {
  const s = m.stage || '';
  if (s.startsWith('Group ')) return s.slice(6, 7);
  return m.home?.group_name?.slice(6, 7) || m.away?.group_name?.slice(6, 7) || '';
};

// Returns { 'Group A': [{ team, p, w, d, l, gf, ga, gd, pts }, ...], ... }
// rows sorted by Pts → GD → GF → name.
export function computeStandings(teams, matches) {
  const rows = new Map();
  teams.forEach(t => {
    if (t.group_name) rows.set(t.id, { team: t, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
  });

  matches.forEach(m => {
    if (m.status !== 'finished') return;
    if (!(m.stage || '').startsWith('Group')) return;
    const h = m.home && rows.get(m.home.id);
    const a = m.away && rows.get(m.away.id);
    if (!h || !a) return;
    const hs = m.home_score ?? 0;
    const as = m.away_score ?? 0;
    h.p++; a.p++;
    h.gf += hs; h.ga += as;
    a.gf += as; a.ga += hs;
    if (hs > as) { h.w++; a.l++; h.pts += 3; }
    else if (hs < as) { a.w++; h.l++; a.pts += 3; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  });

  const groups = {};
  rows.forEach(r => {
    r.gd = r.gf - r.ga;
    (groups[r.team.group_name] ||= []).push(r);
  });
  Object.values(groups).forEach(list =>
    list.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.name.localeCompare(y.team.name))
  );
  return groups;
}

// Position of a team inside its group: { group, pos, row } or null.
export function teamStanding(groups, teamId) {
  for (const [group, list] of Object.entries(groups)) {
    const i = list.findIndex(r => r.team.id === teamId);
    if (i !== -1) return { group, pos: i + 1, row: list[i] };
  }
  return null;
}

export const ordinal = n => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) ? 0 : Math.min(n % 10, 4) % 4] || 'th'}`;
