import { useState } from 'react';
import { db } from '../lib/supabase.js';

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit() {
    setErr('');
    setMsg('');
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error } = await db.auth.signUp({ email, password: pw });
        if (error) throw error;
        setMsg('Check your email to confirm, then sign in.');
      } else {
        const { data, error } = await db.auth.signInWithPassword({ email, password: pw });
        if (error) throw error;
        onAuth(data.user);
      }
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  return (
    <div className="auth">
      <h2>{mode === 'signup' ? 'Join Pitchside' : 'Welcome back'}</h2>
      <p>Follow every match of World Cup 2026 — and build a personal calendar for the teams you love.</p>
      {err && <div className="err">{err}</div>}
      {msg && (
        <div
          className="err"
          style={{ background: 'rgba(62,224,106,.12)', borderColor: 'rgba(62,224,106,.4)', color: '#7df59b' }}
        >
          {msg}
        </div>
      )}
      <div className="field">
        <label>Email</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>
      <div className="field">
        <label>Password</label>
        <input
          type="password"
          value={pw}
          onChange={e => setPw(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          placeholder="••••••••"
        />
      </div>
      <button className="btn btn-grass" disabled={busy} onClick={submit}>
        {busy ? '…' : mode === 'signup' ? 'Create account' : 'Sign in'}
      </button>
      <div className="switch">
        {mode === 'signup' ? 'Already have an account? ' : 'No account yet? '}
        <a
          onClick={() => {
            setMode(mode === 'signup' ? 'signin' : 'signup');
            setErr('');
            setMsg('');
          }}
        >
          {mode === 'signup' ? 'Sign in' : 'Sign up'}
        </a>
      </div>
    </div>
  );
}
