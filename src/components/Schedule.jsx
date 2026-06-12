import { useMemo, useState } from 'react';
import MatchList from './MatchList.jsx';
import Bracket from './Bracket.jsx';
import { useApp } from '../lib/ctx.js';

const STAGE_FILTERS = [
  ['all', 'All'],
  ['group', 'Groups'],
  ['Round of 32', 'R32'],
  ['Round of 16', 'R16'],
  ['Quarterfinal', 'QF'],
  ['Semifinal', 'SF'],
  ['final', 'Final'],
];
const STATUS_FILTERS = [
  ['all', 'All'],
  ['scheduled', 'Upcoming'],
  ['live', 'Live'],
  ['finished', 'Finished'],
];

// Full schedule: all 104 matches grouped by date, with stage / group / status
// filters, a followed-teams toggle and the knockout bracket.
export default function Schedule() {
  const { matches, teams, followed } = useApp();
  const [stage, setStage] = useState('all');
  const [group, setGroup] = useState('all');
  const [status, setStatus] = useState('all');
  const [mineOnly, setMineOnly] = useState(false);

  const allGroups = useMemo(
    () => [...new Set(teams.map(t => t.group_name).filter(Boolean))].sort(),
    [teams]
  );

  const filtered = useMemo(
    () =>
      matches.filter(m => {
        const s = m.stage || '';
        if (stage === 'group' && !s.startsWith('Group')) return false;
        if (stage === 'final' && !(s === 'Final' || s.toLowerCase().includes('third'))) return false;
        if (stage !== 'all' && stage !== 'group' && stage !== 'final' && s !== stage) return false;
        if (group !== 'all' && s !== group) return false;
        if (status !== 'all' && m.status !== status) return false;
        if (mineOnly && !((m.home && followed.has(m.home.id)) || (m.away && followed.has(m.away.id))))
          return false;
        return true;
      }),
    [matches, stage, group, status, mineOnly, followed]
  );

  return (
    <div>
      <div className="section-head">
        <h2 className="section-title">FULL SCHEDULE</h2>
        <p className="section-sub">
          All {matches.length || 104} matches of the tournament, grouped by date in your timezone.
        </p>
      </div>

      <div className="filter-bar">
        <div className="filter-row">
          {STAGE_FILTERS.map(([v, label]) => (
            <button
              type="button"
              key={v}
              className={'chip' + (stage === v ? ' on' : '')}
              onClick={() => setStage(v)}
            >
              {label}
            </button>
          ))}
          <select
            className="filter-select"
            value={group}
            onChange={e => {
              setGroup(e.target.value);
              if (e.target.value !== 'all') setStage('group');
            }}
          >
            <option value="all">All groups</option>
            {allGroups.map(g => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="filter-row">
          {STATUS_FILTERS.map(([v, label]) => (
            <button
              type="button"
              key={v}
              className={'chip' + (status === v ? ' on' : '')}
              onClick={() => setStatus(v)}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            className={'switch' + (mineOnly ? ' on' : '')}
            onClick={() => setMineOnly(v => !v)}
            title="Show only matches involving teams you follow"
          >
            <span className="switch-knob" />
            Your teams only
          </button>
          <span className="filter-count mono">{filtered.length} matches</span>
        </div>
      </div>

      <MatchList
        matches={filtered}
        emptyTitle="No matches found"
        emptyBody="Adjust your filters — or run the sync to load the fixtures."
      />

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">KNOCKOUT BRACKET</h2>
          <p className="section-sub">
            The road to the final. Matches involving your teams glow gold.
          </p>
        </div>
        <Bracket />
      </section>
    </div>
  );
}
