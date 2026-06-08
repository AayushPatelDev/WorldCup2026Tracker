/**
 * sync/sync.js — load FIFA World Cup 2026 data into Supabase (ESM).
 *
 *   npm install
 *   npm run sync           # or: node sync/sync.js
 *
 * Reads config from environment variables (see .env.example), loaded from a
 * local .env file by the tiny reader below.
 *
 * DATA SOURCE: the free, open-source worldcup2026 API (worldcup26.ir).
 *   https://github.com/rezarahiminia/worldcup2026
 *   - No payment, no key for the data itself, but read endpoints require a JWT,
 *     so we register/login once with WC_EMAIL/WC_PASS to get a token (84-day life).
 *   - Provides 48 teams, 16 stadiums, 104 matches, live scores during the event.
 *
 * FALLBACK: openfootball/worldcup.json (public-domain, schedule only) — used
 * automatically if worldcup26.ir is unreachable, so the calendar never goes dark.
 *
 * The browser app never calls these — it only reads from Supabase. Run this on
 * a schedule (cron / Supabase Edge Function) so scores stay fresh.
 * Use the Supabase SERVICE ROLE key here (server-side only).
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ---- minimal .env loader (no dependency) ----
try {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), '..', '.env');
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = /^\s*([\w.]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !m[1].startsWith('#') && process.env[m[1]] === undefined)
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* no .env — rely on real env vars */ }

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY (set them in .env).');
  process.exit(1);
}
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// =====================================================================
//  shared upsert helpers
// =====================================================================
async function upsertTeam({ code, name, flag, group }) {
  if (!code || !name) return null;
  const { data, error } = await sb.from('teams')
    .upsert({ code, name, flag, group_name: group || null }, { onConflict: 'code' })
    .select('id').single();
  if (error) { console.error('team', code, error.message); return null; }
  return data.id;
}
async function upsertMatch(row) {
  const { error } = await sb.from('matches').upsert(row, { onConflict: 'ext_id' });
  if (error) console.error('match', row.ext_id, error.message);
  return !error;
}

// =====================================================================
//  SOURCE 1 — worldcup26.ir  (PRIMARY, free)
// =====================================================================
const WC_BASE = process.env.WC_BASE || 'https://worldcup26.ir';
let WC_TOKEN = process.env.WC_TOKEN || '';

async function wc(path) {
  const res = await fetch(`${WC_BASE}${path}`, {
    headers: WC_TOKEN ? { Authorization: `Bearer ${WC_TOKEN}` } : {},
  });
  if (!res.ok) throw new Error(`WC ${path} -> ${res.status}`);
  const json = await res.json();
  // list endpoints may return a bare array or { teams:[...] } / { games:[...] } etc.
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object')
    for (const k of ['teams', 'stadiums', 'games', 'groups', 'matches', 'data', 'result', 'results'])
      if (Array.isArray(json[k])) return json[k];
  return json;
}

async function wcLogin() {
  if (WC_TOKEN) return;
  const email = process.env.WC_EMAIL, pass = process.env.WC_PASS;
  if (!email || !pass) throw new Error('WC_EMAIL/WC_PASS not set (needed for the JWT)');
  let r = await fetch(`${WC_BASE}/auth/authenticate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: pass }),
  });
  if (!r.ok) {
    r = await fetch(`${WC_BASE}/auth/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'sync', email, password: pass }),
    });
  }
  const j = await r.json();
  if (!j.token) throw new Error('WC login failed: ' + JSON.stringify(j).slice(0, 120));
  WC_TOKEN = j.token;
}

// "06/11/2026 13:00" (MM/DD/YYYY local) -> ISO. The API gives LOCAL venue time
// without an offset, so we store it as-is interpreted in UTC; the app then shows
// it in each viewer's local zone. (Good enough for scheduling; not minute-perfect
// across venue time zones — see README note.)
function parseLocalDate(s) {
  if (!s) return null;
  const m = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/.exec(s);
  if (!m) { const d = new Date(s); return isNaN(d) ? null : d.toISOString(); }
  const [, mo, da, yr, hh, mm] = m;
  return new Date(Date.UTC(+yr, +mo - 1, +da, +hh, +mm)).toISOString();
}

const STAGE_LABEL = {
  group: null, r32: 'Round of 32', r16: 'Round of 16',
  qf: 'Quarterfinal', sf: 'Semifinal', third: 'Third-place play-off', final: 'Final',
};
function stageOf(g) {
  const t = (g.type || '').toLowerCase();
  if (t && STAGE_LABEL[t] !== undefined && STAGE_LABEL[t] !== null) return STAGE_LABEL[t];
  return g.group ? `Group ${g.group}` : 'World Cup';
}
const truthy = v => v === true || v === 'TRUE' || v === 'true' || v === 1 || v === '1';

async function syncFromWorldCup26() {
  await wcLogin();

  const teams = await wc('/get/teams');
  if (!Array.isArray(teams)) throw new Error('teams not iterable');
  const idMap = {}; // API team id -> our teams.id
  for (const t of teams) {
    const id = await upsertTeam({
      code: t.fifa_code, name: t.name_en, flag: t.flag,
      group: t.groups ? `Group ${t.groups}` : null,
    });
    if (id) idMap[String(t.id)] = id;
  }
  console.log(`teams: ${Object.keys(idMap).length}`);

  const venueMap = {};
  try {
    for (const s of await wc('/get/stadiums'))
      venueMap[String(s.id)] = `${s.name_en}${s.city_en ? `, ${s.city_en}` : ''}`;
  } catch (e) { console.warn('stadiums unavailable:', e.message); }

  const games = await wc('/get/games');
  let ok = 0;
  for (const g of games) {
    const finished = truthy(g.finished);
    // knockout TBD games carry "0" ids with real opponents in the *_label fields
    const homeId = g.home_team_id && g.home_team_id !== '0' ? idMap[String(g.home_team_id)] : null;
    const awayId = g.away_team_id && g.away_team_id !== '0' ? idMap[String(g.away_team_id)] : null;
    const hasScore = g.home_score != null && g.away_score != null && (homeId || awayId);
    const inPlay = !finished && (g.minute || String(g.status || '').toLowerCase() === 'live');

    await upsertMatch({
      ext_id: `wc2026-${g.id}`,
      home_team_id: homeId,
      away_team_id: awayId,
      home_score: finished || inPlay ? (g.home_score ?? null) : null,
      away_score: finished || inPlay ? (g.away_score ?? null) : null,
      kickoff: parseLocalDate(g.local_date) || new Date().toISOString(),
      venue: venueMap[String(g.stadium_id)] || null,
      stage: stageOf(g),
      status: finished ? 'finished' : inPlay ? 'live' : 'scheduled',
      minute: g.minute ?? null,
      home_label: homeId ? null : (g.home_team_label || null),
      away_label: awayId ? null : (g.away_team_label || null),
      matchday: g.matchday ?? null,
      stats: g.stats || {},
      updated_at: new Date().toISOString(),
    }) && ok++;
  }
  console.log(`worldcup26.ir: synced ${ok}/${games.length} matches`);
}

// =====================================================================
//  SOURCE 2 — openfootball/worldcup.json  (FALLBACK, public domain)
// =====================================================================
const OPENFOOTBALL_URL = process.env.OPENFOOTBALL_URL ||
  'https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json';
const NAME_ALIASES = {
  'IR Iran': 'Iran', 'Korea Republic': 'South Korea',
  'Côte d\u2019Ivoire': 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast', 'United States': 'USA',
};
const norm = n => (NAME_ALIASES[n] || n || '').trim();
function ofKickoff(date, time) {
  if (!date) return new Date().toISOString();
  const m = /(\d{1,2}):(\d{2})\s*UTC([+-]\d{1,2})?/.exec(time || '');
  if (!m) return new Date(`${date}T12:00:00Z`).toISOString();
  const [, hh, mm, off] = m;
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCHours(+hh - (off ? +off : 0), +mm, 0, 0);
  return d.toISOString();
}
async function syncFromOpenFootball() {
  const res = await fetch(OPENFOOTBALL_URL);
  if (!res.ok) throw new Error(`openfootball -> ${res.status}`);
  const data = await res.json();
  const matches = data.matches || (data.rounds || []).flatMap(r => r.matches || []);
  const { data: teams } = await sb.from('teams').select('id,name');
  const byName = {};
  for (const t of teams || []) byName[t.name.toLowerCase()] = t.id;
  const resolve = n => byName[norm(n).toLowerCase()] ?? null;
  let ok = 0, idx = 0;
  for (const g of matches) {
    idx++;
    const t1 = g.team1?.name || g.team1, t2 = g.team2?.name || g.team2;
    const score = g.score?.ft || (g.score1 != null ? [g.score1, g.score2] : null);
    await upsertMatch({
      ext_id: `of2026-${g.num || idx}`,
      home_team_id: resolve(t1), away_team_id: resolve(t2),
      home_score: score ? score[0] : null, away_score: score ? score[1] : null,
      kickoff: ofKickoff(g.date, g.time),
      venue: g.ground || g.city || (g.stadium?.name ?? null),
      stage: g.group || g.round || 'World Cup',
      status: score ? 'finished' : 'scheduled',
      minute: null, home_label: null, away_label: null, matchday: null,
      stats: {}, updated_at: new Date().toISOString(),
    }) && ok++;
  }
  console.log(`openfootball: synced ${ok}/${matches.length} matches`);
}

// =====================================================================
//  runner
// =====================================================================
(async () => {
  const sources = [
    ['worldcup26.ir', syncFromWorldCup26],
    ['openfootball', syncFromOpenFootball],
  ];
  for (const [name, fn] of sources) {
    try { await fn(); console.log(`done (source: ${name})`); return; }
    catch (e) { console.warn(`${name} failed: ${e.message}`); }
  }
  console.error('All sources failed.');
  process.exit(1);
})().catch(e => { console.error(e); process.exit(1); });
