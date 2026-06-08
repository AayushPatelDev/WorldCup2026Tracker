import MatchCard from './MatchCard.jsx';
import { fmtDay, groupByDay } from '../lib/helpers.js';

export default function MatchList({ matches, followed, toggleTeam, emptyTitle, emptyBody }) {
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
      {groupByDay(matches).map(([k, items]) => (
        <div className="day-group" key={k}>
          <div className="day-label">
            {fmtDay(k)}
            <span className="cnt">
              {items.length} match{items.length > 1 ? 'es' : ''}
            </span>
          </div>
          {items.map(m => (
            <MatchCard key={m.id} m={m} followed={followed} toggleTeam={toggleTeam} />
          ))}
        </div>
      ))}
    </div>
  );
}
