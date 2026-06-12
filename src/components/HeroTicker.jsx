import { useMemo, useState } from 'react';
import Flag from './Flag.jsx';
import { useApp } from '../lib/ctx.js';
import { dayKey, fmtTime } from '../lib/helpers.js';

// Auto-scrolling strip of today's matches (falls back to the next fixtures so
// it never runs empty between matchdays). Click to pause; click a match to open it.
export default function HeroTicker() {
  const { matches, tz, openMatch, liveMinute } = useApp();
  const [paused, setPaused] = useState(false);

  const [items, isToday] = useMemo(() => {
    const today = dayKey(new Date(), tz);
    const todays = matches.filter(m => dayKey(m.kickoff, tz) === today);
    if (todays.length) return [todays, true];
    const next = matches.filter(m => m.status === 'scheduled').slice(0, 10);
    return [next, false];
  }, [matches, tz]);

  if (!items.length) return null;
  const loop = [...items, ...items];

  return (
    <div className="ticker" onClick={() => setPaused(p => !p)} title={paused ? 'Click to resume' : 'Click to pause'}>
      <div className="ticker-label">
        {items.some(m => m.status === 'live') && <span className="pulse-dot" />}
        {isToday ? 'TODAY' : 'NEXT UP'}
      </div>
      <div className="ticker-clip">
        <div
          className={'ticker-track' + (paused ? ' paused' : '')}
          style={{ animationDuration: `${Math.max(items.length * 7, 18)}s` }}
        >
          {loop.map((m, i) => (
            <button
              type="button"
              key={`${m.id}-${i}`}
              className={'tick-item' + (m.status === 'live' ? ' live' : '')}
              onClick={e => {
                e.stopPropagation();
                setPaused(true);
                openMatch(m.id);
              }}
            >
              {m.status === 'live' && <span className="pulse-dot" />}
              <Flag src={m.home?.flag} size={13} />
              <span className="tick-code mono">{m.home?.code || 'TBD'}</span>
              <span className="tick-score mono">
                {m.status === 'scheduled'
                  ? fmtTime(m.kickoff, tz)
                  : `${m.home_score ?? 0}–${m.away_score ?? 0}`}
              </span>
              <span className="tick-code mono">{m.away?.code || 'TBD'}</span>
              <Flag src={m.away?.flag} size={13} />
              {m.status === 'live' && liveMinute(m) != null && (
                <span className="tick-min mono">{liveMinute(m)}'</span>
              )}
              {m.status === 'finished' && <span className="tick-ft mono">FT</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
