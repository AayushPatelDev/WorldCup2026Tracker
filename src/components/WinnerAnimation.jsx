import { useEffect, useMemo } from 'react';
import Flag from './Flag.jsx';
import Trophy from './Trophy.jsx';
import { teamColors } from '../lib/teamColors.js';
import { confettiRain } from '../lib/confetti.js';

// Full-time celebration when a followed team's match ends: winner's flag zooms
// out, a trophy drops in with a double bounce, confetti rains in flag colours.
// Draws get a quiet "An Even Battle" card instead.
export default function WinnerAnimation({ event, onDone }) {
  const { match } = event;
  const hs = match.home_score ?? 0;
  const as = match.away_score ?? 0;
  const draw = hs === as;
  const winner = hs > as ? match.home : as > hs ? match.away : null;
  const colors = winner ? teamColors(winner.code) : [];
  const confetti = useMemo(() => (draw || !winner ? [] : confettiRain(colors, 56)), [event.key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const t = setTimeout(onDone, draw ? 2800 : 4600);
    return () => clearTimeout(t);
  }, [event.key, draw, onDone]);

  const homeName = match.home?.name || match.home_label || 'TBD';
  const awayName = match.away?.name || match.away_label || 'TBD';

  if (draw) {
    return (
      <div className="fx-overlay ft-fx" onClick={onDone}>
        <div className="ft-draw">
          <div className="ft-draw-title">AN EVEN BATTLE</div>
          <div className="ft-draw-sub">
            {homeName} {hs}–{as} {awayName}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fx-overlay ft-fx" onClick={onDone}>
      <div className="ft-flag-zoom">
        <Flag src={winner?.flag} size={64} />
      </div>
      <div className="ft-stage">
        <div className="ft-trophy">
          <Trophy size={96} />
        </div>
        <div className="ft-title">{winner?.name?.toUpperCase()} WIN</div>
        <div className="ft-sub mono">
          FT · {homeName} {hs}–{as} {awayName}
        </div>
      </div>
      {confetti.map(c => (
        <div
          key={c.id}
          className="confetti rain"
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
