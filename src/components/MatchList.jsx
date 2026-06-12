import MatchCard from './MatchCard.jsx';
import { useApp } from '../lib/ctx.js';
import { groupByDay, fmtDateKey } from '../lib/helpers.js';

export default function MatchList({ matches, emptyTitle, emptyBody }) {
  const { tz } = useApp();
  if (!matches.length) {
    return (
      <div className="empty">
        <div className="big">{emptyTitle}</div>
        <div>{emptyBody}</div>
      </div>
    );
  }
  return (
    <div>
      {groupByDay(matches, tz).map(([k, items]) => (
        <div className="day-group" key={k}>
          <div className="day-label">
            {fmtDateKey(k)}
            <span className="day-count mono">
              {items.length} match{items.length > 1 ? 'es' : ''}
            </span>
          </div>
          {items.map(m => (
            <MatchCard key={m.id} m={m} />
          ))}
        </div>
      ))}
    </div>
  );
}
