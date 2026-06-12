import Flag from './Flag.jsx';
import { useApp } from '../lib/ctx.js';

const ROUNDS = [
  ['Round of 32', 'ROUND OF 32'],
  ['Round of 16', 'ROUND OF 16'],
  ['Quarterfinal', 'QUARTER-FINALS'],
  ['Semifinal', 'SEMI-FINALS'],
  ['Final', 'FINAL'],
];

// Compact knockout bracket. TBD slots show their qualification labels; cells
// involving followed teams glow gold so users can trace their team's path.
export default function Bracket() {
  const { matches, followed, openMatch } = useApp();

  const byRound = ROUNDS.map(([stage, label]) => [
    label,
    matches
      .filter(m => m.stage === stage)
      .sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff)),
  ]).filter(([, list]) => list.length);

  const third = matches.find(m => (m.stage || '').toLowerCase().includes('third'));
  if (!byRound.length) return null;

  const cellTeam = (team, label, score, win) => (
    <div className={'br-team' + (win ? ' win' : '') + (!team ? ' br-tbd' : '')}>
      {team ? (
        <>
          <Flag src={team.flag} size={12} />
          <span className="br-name">{team.code}</span>
        </>
      ) : (
        <span className="br-name">{label || 'TBD'}</span>
      )}
      <span className="br-score mono">{score ?? ''}</span>
    </div>
  );

  const cell = m => {
    const done = m.status === 'finished';
    const hs = m.home_score ?? null;
    const as = m.away_score ?? null;
    const mine = (m.home && followed.has(m.home.id)) || (m.away && followed.has(m.away.id));
    return (
      <button
        type="button"
        key={m.id}
        className={'br-cell' + (mine ? ' fav' : '') + (m.status === 'live' ? ' live' : '')}
        onClick={() => openMatch(m.id)}
      >
        {cellTeam(m.home, m.home_label, hs, done && hs > as)}
        {cellTeam(m.away, m.away_label, as, done && as > hs)}
      </button>
    );
  };

  return (
    <div className="bracket-wrap">
      <div className="bracket">
        {byRound.map(([label, list]) => (
          <div className="br-round" key={label}>
            <div className="br-round-title">{label}</div>
            {list.map(cell)}
          </div>
        ))}
        {third && (
          <div className="br-round">
            <div className="br-round-title">THIRD PLACE</div>
            {cell(third)}
          </div>
        )}
      </div>
    </div>
  );
}
