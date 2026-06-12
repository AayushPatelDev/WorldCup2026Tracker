import { useEffect, useMemo } from 'react';
import { teamColors } from '../lib/teamColors.js';
import { confettiBurst } from '../lib/confetti.js';

// Full-screen ~3s goal celebration: ball flies in on a parabolic arc, the net
// ripples, "GOAL!" fades in, confetti bursts in the scoring team's colours.
// The whole overlay unmounts on completion, removing every particle div.
export default function GoalAnimation({ event, onDone }) {
  const { match, side } = event;
  const team = side === 'home' ? match.home : match.away;
  const colors = teamColors(team?.code);
  const confetti = useMemo(() => confettiBurst(colors, 40), [event.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(onDone, 3300);
    return () => clearTimeout(t);
  }, [event.key, onDone]);

  return (
    <div className="fx-overlay goal-fx" onClick={onDone}>
      <div className="goal-stage">
        <div className="goal-net" />
        <div className="goal-ring r1" />
        <div className="goal-ring r2" />
        <div className="goal-ring r3" />
        <div className="goal-ball-x">
          <div className="goal-ball-y">⚽</div>
        </div>
        <div className="goal-word">GOAL!</div>
        <div className="goal-team">
          {team?.name || 'Goal'}{' '}
          <span className="mono">
            {match.home_score ?? 0}–{match.away_score ?? 0}
          </span>
        </div>
      </div>
      {confetti.map(c => (
        <div
          key={c.id}
          className="confetti burst"
          style={{
            left: c.left,
            top: c.top,
            background: c.color,
            width: c.w,
            height: c.w * 0.45,
            '--dx': c.dx,
            '--dy': c.dy,
            '--rot': c.rot,
            '--dur': c.dur,
            '--delay': c.delay,
          }}
        />
      ))}
    </div>
  );
}
