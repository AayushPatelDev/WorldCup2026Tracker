import { useMemo } from 'react';
import HeroTicker from './HeroTicker.jsx';
import MatchCard from './MatchCard.jsx';
import MatchList from './MatchList.jsx';
import Standings from './Standings.jsx';
import { useApp } from '../lib/ctx.js';
import { dayKey } from '../lib/helpers.js';

// Match Centre: ticker → live now → today → next 7 days → results → standings.
export default function Home() {
  const { matches, tz } = useApp();

  const { live, todays, week, results } = useMemo(() => {
    const todayKey = dayKey(new Date(), tz);
    const weekKeys = new Set(
      Array.from({ length: 7 }, (_, i) => dayKey(new Date(Date.now() + (i + 1) * 864e5), tz))
    );
    return {
      live: matches.filter(m => m.status === 'live'),
      todays: matches.filter(m => dayKey(m.kickoff, tz) === todayKey),
      week: matches.filter(m => m.status === 'scheduled' && weekKeys.has(dayKey(m.kickoff, tz))),
      results: matches
        .filter(m => m.status === 'finished')
        .sort((a, b) => new Date(b.kickoff) - new Date(a.kickoff))
        .slice(0, 8),
    };
  }, [matches, tz]);

  return (
    <div>
      <HeroTicker />

      {live.length > 0 && (
        <section className="section live-now">
          <div className="live-header">
            <span className="live-pulse" />
            LIVE NOW
          </div>
          {live.map(m => (
            <MatchCard key={m.id} m={m} />
          ))}
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">TODAY'S MATCHES</h2>
          <p className="section-sub">Every fixture on today's card, in your time.</p>
        </div>
        {todays.length ? (
          todays.map(m => <MatchCard key={m.id} m={m} />)
        ) : (
          <div className="empty slim">
            <div className="big">No matches today</div>
            <div>The football returns soon — check the week ahead below.</div>
          </div>
        )}
      </section>

      {week.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">UPCOMING THIS WEEK</h2>
            <p className="section-sub">The next seven days of fixtures.</p>
          </div>
          <MatchList matches={week} emptyTitle="" emptyBody="" />
        </section>
      )}

      {results.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2 className="section-title">RESULTS</h2>
            <p className="section-sub">The most recent final scores.</p>
          </div>
          <div className="results-grid">
            {results.map(m => (
              <MatchCard key={m.id} m={m} />
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">GROUP STANDINGS</h2>
          <p className="section-sub">Computed live from finished results — top two in each group advance.</p>
        </div>
        <Standings />
      </section>
    </div>
  );
}
