import { neon } from '@neondatabase/serverless';

// Server-only. Never import this from a 'use client' component -- DATABASE_URL
// is a secret and must not reach the browser.
//
// There is no row-level security behind this connection: the database will
// return whatever it is asked for. Authorization lives entirely in the route
// handlers, which resolve the Clerk user id server-side and constrain every
// query by it. A query without a user_id predicate is a data leak.
//
// Initialised lazily: neon() throws when handed an empty connection string, and
// doing that at module scope would break `next build` on any machine that has no
// DATABASE_URL in the environment.

let client;

export function getSql() {
  if (!client) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error('DATABASE_URL is not set');
    client = neon(url);
  }
  return client;
}

// The app's parseISOString() rebuilds a Date from the *wall-clock* digits and
// treats them as UTC, so the API has to hand back naive timestamp strings. The
// driver would instead return a JS Date parsed in the server's local
// timezone -- UTC on Vercel, but something else on a laptop -- which would render
// different times in dev and prod. Formatting in Postgres sidesteps that: the
// digits that go in are the digits that come out.
export const ts = (col, as) =>
  `to_char(${col}, 'YYYY-MM-DD"T"HH24:MI:SS.MS') as ${as}`;
