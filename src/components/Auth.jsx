import { useEffect, useState } from 'react';
import { db } from '../lib/supabase.js';
import Trophy from './Trophy.jsx';
import Flag from './Flag.jsx';
import TimezoneSelect from './TimezoneSelect.jsx';
import { Globe } from './Icons.jsx';
import { detectedTz, tzAbbr, fmtTime } from '../lib/helpers.js';
import { teamColors } from '../lib/teamColors.js';

// Animated pitch-line backdrop for the branding panel.
const PitchLines = () => (
  <svg className="pitch-svg" viewBox="0 0 600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <g fill="none" stroke="#00FF87" strokeWidth="2">
      <rect x="40" y="40" width="520" height="820" rx="4" />
      <line x1="40" y1="450" x2="560" y2="450" />
      <circle cx="300" cy="450" r="90" />
      <circle cx="300" cy="450" r="4" fill="#00FF87" />
      <rect x="140" y="40" width="320" height="140" />
      <rect x="220" y="40" width="160" height="55" />
      <rect x="140" y="720" width="320" height="140" />
      <rect x="220" y="805" width="160" height="55" />
      <path d="M225 180 A90 90 0 0 0 375 180" />
      <path d="M225 720 A90 90 0 0 1 375 720" />
    </g>
  </svg>
);

// Sign in / sign up with a post-signup onboarding flow: pick teams, confirm
// timezone — so a brand-new account lands on a populated Favourites page.
export default function Auth({ onAuth, setOnboarding }) {
  const [mode, setMode] = useState('signin');
  const [stage, setStage] = useState('form'); // form | check-email | teams | tz
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [obUser, setObUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [tz, setTz] = useState(detectedTz);

  useEffect(() => {
    if (stage !== 'teams' || teams.length) return;
    db.from('teams')
      .select('*')
      .order('group_name')
      .order('name')
      .then(({ data }) => setTeams(data || []));
  }, [stage, teams.length]);

  async function submit() {
    setErr('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        // Flag onboarding before the auth listener in App fires, so the app
        // shell waits until this flow completes.
        setOnboarding(true);
        const { data, error } = await db.auth.signUp({ email, password: pw });
        if (error) throw error;
        if (data.session) {
          setObUser(data.user);
          setStage('teams');
        } else {
          setOnboarding(false);
          setStage('check-email');
        }
      } else {
        const { data, error } = await db.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        onAuth(data.user);
      }
    } catch (e) {
      setErr(e.message);
      setOnboarding(false);
    }
    setBusy(false);
  }

  const togglePick = id =>
    setPicked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  async function saveTeams() {
    setBusy(true);
    if (picked.size && obUser) {
      await db.from('user_teams').insert([...picked].map(team_id => ({ user_id: obUser.id, team_id })));
    }
    setBusy(false);
    setStage('tz');
  }

  async function finish() {
    setBusy(true);
    if (obUser) {
      await db
        .from('user_preferences')
        .upsert({ user_id: obUser.id, timezone: tz, updated_at: new Date().toISOString() });
    }
    setBusy(false);
    setOnboarding(false);
    onAuth(obUser);
  }

  const groups = teams.reduce((g, t) => {
    (g[t.group_name || 'Other'] ||= []).push(t);
    return g;
  }, {});

  return (
    <div className="auth-page">
      <div className="auth-left">
        <PitchLines />
        <div className="auth-brand">
          <div className="auth-logo">
            <Trophy size={44} />
            <div>
              <div className="wordmark lg">PITCHSIDE</div>
              <div className="tagline">The World's Tournament. Your Schedule.</div>
            </div>
          </div>
          <blockquote className="auth-quote">
            “Football is the beautiful game.”
          </blockquote>
          <div className="auth-meta">
            <span className="mono">48 TEAMS · 104 MATCHES · 3 NATIONS</span>
            <span>One screen for fans in Toronto, Mumbai, São Paulo and everywhere between.</span>
          </div>
        </div>
      </div>

      <div className="auth-right">
        {stage === 'form' && (
          <div className="auth-card">
            <h2 className="auth-h">{mode === 'signup' ? 'JOIN PITCHSIDE' : 'WELCOME BACK'}</h2>
            <p className="auth-p">
              Follow every match of World Cup 2026 — live scores, your teams, your timezone, your calendar.
            </p>
            {err && <div className="auth-err">{err}</div>}
            <div className="field">
              <label htmlFor="auth-email">Email</label>
              <input
                id="auth-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
              />
            </div>
            <div className="field">
              <label htmlFor="auth-pw">Password</label>
              <input
                id="auth-pw"
                type="password"
                value={pw}
                onChange={e => setPw(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()}
                placeholder="••••••••"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </div>
            <button type="button" className="btn btn-gold full" disabled={busy} onClick={submit}>
              {busy ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
            <div className="auth-switch">
              {mode === 'signup' ? 'Already have an account? ' : 'No account yet? '}
              <button
                type="button"
                className="link-btn"
                onClick={() => {
                  setMode(mode === 'signup' ? 'signin' : 'signup');
                  setErr('');
                }}
              >
                {mode === 'signup' ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </div>
        )}

        {stage === 'check-email' && (
          <div className="auth-card">
            <h2 className="auth-h">CHECK YOUR EMAIL</h2>
            <p className="auth-p">
              We've sent a confirmation link to <b>{email}</b>. Confirm it, then sign in to pick your teams.
            </p>
            <button type="button" className="btn btn-gold full" onClick={() => setStage('form')}>
              Back to sign in
            </button>
          </div>
        )}

        {stage === 'teams' && (
          <div className="auth-card wide">
            <h2 className="auth-h">WHICH TEAMS ARE YOU FOLLOWING?</h2>
            <p className="auth-p">
              Pick as many as you like — their matches fill your Favourites page from the moment you land.
            </p>
            <div className="ob-grid">
              {Object.keys(groups)
                .sort()
                .map(g => (
                  <div key={g} className={`ob-group g-${g.slice(6, 7)}`}>
                    <div className="ob-group-head">
                      <span className="grp-dot" />
                      {g}
                    </div>
                    {groups[g].map(t => {
                      const [c1] = teamColors(t.code);
                      return (
                        <button
                          type="button"
                          key={t.id}
                          className={'ob-team' + (picked.has(t.id) ? ' on' : '')}
                          style={{ backgroundImage: `linear-gradient(120deg, ${c1}10, transparent 60%)` }}
                          onClick={() => togglePick(t.id)}
                        >
                          <Flag src={t.flag} size={16} />
                          <span>{t.name}</span>
                          <span className="ob-star">★</span>
                        </button>
                      );
                    })}
                  </div>
                ))}
            </div>
            <div className="ob-actions">
              <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setStage('tz')}>
                Skip for now
              </button>
              <button type="button" className="btn btn-gold" disabled={busy} onClick={saveTeams}>
                {busy ? '…' : `Follow ${picked.size || 'no'} team${picked.size === 1 ? '' : 's'} →`}
              </button>
            </div>
          </div>
        )}

        {stage === 'tz' && (
          <div className="auth-card">
            <h2 className="auth-h">
              <Globe size={18} /> YOUR TIMEZONE
            </h2>
            <p className="auth-p">
              We detected <b>{detectedTz.replace(/_/g, ' ')}</b>. Looks right? Every kickoff across Pitchside will
              show in this zone.
            </p>
            <TimezoneSelect value={tz} onChange={setTz} />
            <div className="modal-preview mono">
              Right now: {fmtTime(new Date(), tz)} {tzAbbr(tz)}
            </div>
            <button type="button" className="btn btn-gold full" disabled={busy} onClick={finish}>
              {busy ? '…' : 'Looks right — take me to the football'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
