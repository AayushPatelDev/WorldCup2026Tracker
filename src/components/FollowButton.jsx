import { useRef, useState } from 'react';
import { useApp } from '../lib/ctx.js';

// Star follow toggle with a burst animation when a team is newly followed.
export default function FollowButton({ team, label = false }) {
  const { followed, toggleTeam } = useApp();
  const [burst, setBurst] = useState(false);
  const timer = useRef(null);
  if (!team) return null;
  const on = followed.has(team.id);

  const click = e => {
    e.stopPropagation();
    if (!on) {
      setBurst(true);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setBurst(false), 700);
    }
    toggleTeam(team.id);
  };

  return (
    <button
      type="button"
      className={'star' + (on ? ' on' : '') + (burst ? ' burst' : '') + (label ? ' lbl' : '')}
      title={on ? `Unfollow ${team.name}` : `Follow ${team.name}`}
      onClick={click}
    >
      <span className="star-glyph">★</span>
      {label && <span className="star-text">{on ? 'Following' : 'Follow'}</span>}
    </button>
  );
}
