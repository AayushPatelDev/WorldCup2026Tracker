# Pitchside — World Cup 2026 Tracker

A multi-user FIFA World Cup 2026 web app. Browse **every** match, follow your
**favourite teams**, and get a personal **Favourites** page with a live match
list, an Outlook-style **timetable**, and one-click **calendar export** (.ics).
Live scores update in real time during the tournament.

Built with **Vite + React** (frontend) and **Supabase** (database, auth,
realtime). A separate **sync** script loads fixtures and live scores from a
football data API into Supabase — the browser only ever reads from Supabase, so
no API keys are ever exposed to users.

```
   data API ──►  sync/sync.js  ──►  Supabase  ──►  React app (Vercel)
  (server-side, scheduled)        (DB+auth+RT)      (reads only)
```

---

## Project structure

```
.
├── index.html              # Vite entry HTML
├── package.json
├── vite.config.js
├── vercel.json             # Vercel deployment config
├── .env.example            # copy to .env and fill in
├── db/
│   └── schema.sql          # run once in Supabase SQL editor
├── sync/
│   └── sync.js             # loads data into Supabase (run on a schedule)
└── src/
    ├── main.jsx            # React entry
    ├── styles/
    │   └── app.css         # all styles
    ├── lib/
    │   ├── supabase.js     # Supabase client (reads VITE_ env vars)
    │   └── helpers.js      # date formatting + .ics calendar export
    └── components/
        ├── App.jsx         # top-level app + data loading + tabs
        ├── Auth.jsx        # sign in / sign up
        ├── Flag.jsx        # emoji-or-image flag
        ├── MatchCard.jsx   # one match row
        ├── MatchList.jsx   # matches grouped by day
        ├── Timetable.jsx   # Outlook-style favourites timetable
        └── Teams.jsx       # team picker (grouped A–L)
```

---

## Local development

```bash
npm install
cp .env.example .env        # then edit .env with your real values
npm run dev                 # http://localhost:5173
```

You need at minimum `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`
for the app to load. See **Database setup** below.

---

## Database setup (Supabase)

1. Create a project at supabase.com.
2. **SQL Editor → New query** → paste all of `db/schema.sql` → **Run**. This
   creates the tables, row-level security, realtime, and seeds the 12 groups.
3. (Testing) **Authentication → Providers → Email** → turn off "Confirm email"
   so you can sign in immediately. Re-enable for production.
4. **Settings → API** → copy the **Project URL** and **anon** key into `.env`
   as `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.

---

## Loading data (sync)

`sync/sync.js` uses the free, open-source **worldcup2026 API** (worldcup26.ir),
with **openfootball** as an automatic fallback:

1. **worldcup26.ir** — free & open-source. 48 teams, 16 stadiums, 104 matches,
   live scores during the tournament. Read endpoints need a JWT, so the sync
   registers/logs in once with `WC_EMAIL`/`WC_PASS` to get a token (84-day life).
   **This is the primary source.**
2. **openfootball** — public-domain JSON, schedule only. Used automatically if
   worldcup26.ir is unreachable, so the calendar never goes dark.

```bash
npm run sync                # uses values from .env
```

You need `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (the **service role** key —
server-side only, never the anon key) plus `WC_EMAIL`/`WC_PASS` in `.env`.

### Knockout fixtures

Round-of-32 onward, opponents are TBD until the groups finish. The API supplies
placeholder labels ("Runner-up Group A", "Winner Match 73") which the app shows
in italics. As the bracket fills in, re-running the sync replaces the labels
with real teams automatically.

### Keeping scores fresh

Run the sync on a schedule during the tournament (every ~60s while matches are
live). Options: a cron job on any server, or a **Supabase Edge Function +
pg_cron** so it runs in the cloud with no machine of your own. Each run upserts
on stable ids, so updates and newly-decided fixtures appear automatically.

Example cron (every minute):
```
* * * * * cd /path/to/project && /usr/bin/node sync/sync.js >> sync.log 2>&1
```

---

## Deploying to Vercel

1. Push this repo to GitHub.
2. On vercel.com: **Add New → Project → Import** your GitHub repo. Vercel
   auto-detects Vite (build `npm run build`, output `dist`).
3. **Environment Variables** → add `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` (same values as your `.env`). Do **not** add the
   service key or the data-API key here — those belong only to the sync script.
4. **Deploy.** You get a live `*.vercel.app` URL.
5. In Supabase → **Authentication → URL Configuration**, add your Vercel URL to
   **Site URL** and **Redirect URLs** so login redirects work.

The sync script does **not** run on Vercel — keep it running separately (cron or
a Supabase Edge Function) so the database stays updated.

---

## Pages
- **All Matches** — every fixture, grouped by day, filterable by group and
  status (live / scheduled / finished). A ★ on each team follows/unfollows it.
- **Favourites** — your followed teams (with remove buttons), their live +
  upcoming matches, an "Add all to my calendar" button, and an Outlook-style
  timetable with its own export.
- **Teams** — the full picker, grouped A–L.

## Notes
- The anon key is safe in the browser; row-level security keeps each user's
  favourites private.
- `.env` is gitignored — never commit real keys.
