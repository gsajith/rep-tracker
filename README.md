## RepTracker

### A light-weight workout tracker app (NextJS PWA).

---

## Architecture

- **Next.js 14** (App Router), plain JavaScript
- **Clerk** for auth
- **Neon** (Postgres) for data, reached through the app's own API routes

Data flow:

```
browser  ──fetch──►  /api/workouts        ──►  Neon
utils/api.js         app/api/workouts/…        utils/db.js
                     auth() → Clerk userId
```

`utils/db.js` is server-only. `DATABASE_URL` must never be exposed as a
`NEXT_PUBLIC_` variable.

### Authorization

There is no row-level security in the database — it returns whatever it is asked
for. **Every query in a route handler is scoped by the Clerk user id** resolved
server-side via `auth()`. That scoping is the only thing standing between users'
data: never remove a `where user_id = $1` clause, and never query the database
from a client component.

### Timestamps

`start_time` / `end_time` are `timestamp without time zone`, and the client's
`parseISOString()` reads their wall-clock digits as UTC. Route handlers format
them in Postgres with `to_char(...)` so the driver never turns them into a JS
`Date` in the server's local timezone — which would otherwise render different
times in dev and in production. Keep using the `ts()` helper in `utils/db.js`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in the Clerk keys and DATABASE_URL
npm run dev
```

Use Neon's **pooled** connection string (its host contains `-pooler`).

## Restoring the data dump

A recovered database dump lives in `.migrate/` (gitignored — it contains
personal workout data). To load it into a fresh Neon database:

```bash
node .migrate/restore.mjs --dry-run   # parse + integrity-check, touches nothing
node .migrate/restore.mjs             # create schema, load data, verify counts
node .migrate/restore.mjs --verify    # re-check row counts later
```

The load is idempotent (`on conflict (id) do nothing`), so re-running it is
safe. It should report 621 exercises and 69 workouts.

## Deploy

Deployed on Vercel. `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and
`CLERK_SECRET_KEY` must be set in the Vercel project's environment variables.
