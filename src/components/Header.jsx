import { useState } from 'react';
import Trophy from './Trophy.jsx';
import { Globe, Menu, Close } from './Icons.jsx';
import { useApp } from '../lib/ctx.js';
import { tzAbbr } from '../lib/helpers.js';
import { db } from '../lib/supabase.js';

const NAV = [
  ['home', 'Match Centre'],
  ['schedule', 'Schedule'],
  ['fav', 'Favourites'],
  ['teams', 'Teams'],
];

// Broadcast lower-third style top bar: brand left, nav centre, user right.
export default function Header({ page, setPage, user }) {
  const { tz, openSettings, matches, followed } = useApp();
  const [menu, setMenu] = useState(false);
  const liveCount = matches.filter(m => m.status === 'live').length;
  const initials = (user?.email || '?').slice(0, 2).toUpperCase();

  const go = p => {
    setPage(p);
    setMenu(false);
  };

  const links = NAV.map(([key, label]) => (
    <button
      type="button"
      key={key}
      className={'nav-link' + (page === key ? ' active' : '')}
      onClick={() => go(key)}
    >
      {label}
      {key === 'home' && liveCount > 0 && <span className="nav-live-dot" />}
      {key === 'fav' && followed.size > 0 && <span className="nav-pill mono">{followed.size}</span>}
    </button>
  ));

  return (
    <header className="hdr">
      <div className="hdr-inner wrap">
        <button type="button" className="brand" onClick={() => go('home')}>
          <Trophy size={32} />
          <span className="brand-text">
            <span className="wordmark">PITCHSIDE</span>
            <span className="tagline">The World's Tournament. Your Schedule.</span>
          </span>
        </button>

        <nav className="nav desktop">{links}</nav>

        <div className="hdr-right">
          <button type="button" className="tz-btn" onClick={openSettings} title={`Timezone: ${tz} — click to change`}>
            <Globe /> <span className="tz-btn-txt">{tzAbbr(tz)}</span>
          </button>
          <div className="avatar" title={user?.email || ''}>
            {initials}
          </div>
          <button type="button" className="btn btn-ghost signout desktop" onClick={() => db.auth.signOut()}>
            Sign out
          </button>
          <button type="button" className="burger" onClick={() => setMenu(true)} title="Menu">
            <Menu />
          </button>
        </div>
      </div>

      {menu && (
        <div className="mob-backdrop" onClick={() => setMenu(false)}>
          <div className="mob-drawer" onClick={e => e.stopPropagation()}>
            <div className="mob-head">
              <span className="wordmark sm">PITCHSIDE</span>
              <button type="button" className="drawer-close" onClick={() => setMenu(false)}>
                <Close />
              </button>
            </div>
            <nav className="nav vertical">{links}</nav>
            <button
              type="button"
              className="nav-link"
              onClick={() => {
                setMenu(false);
                openSettings();
              }}
            >
              <Globe /> Timezone · {tzAbbr(tz)}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => db.auth.signOut()}>
              Sign out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
