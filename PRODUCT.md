# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone who signs up. Rep Tracker is a public product with strangers in it, not a
private tool, so a first-run path, discoverable interactions, and unit
expectations are requirements rather than nice-to-haves.

The primary user lifts weights and logs at the gym. The moment that defines the
product: standing at a machine or rack between sets, phone in one hand, thumb
only, roughly twenty seconds of attention before the next set. Target size, tap
count, and getting back to the exact place they left off beat information
density.

The owner is also a daily user with years of real history in the app, so the
expert path has to stay fast while the new-user path gets built. Neither
audience is allowed to win at the other's expense.

## Product Purpose

Rep Tracker records strength workouts: exercises, sets, reps, weight, and notes.
It then shows whether a given exercise is progressing over time.

Success is a set logged in a few seconds without breaking the rhythm of the
workout, and a history complete enough to trust months later when deciding what
weight to put on the bar.

## Positioning

Two touch gestures do work that other trackers do with keyboards and forms:

- Drag horizontally across a reps or weight field to change its value
  (`components/workout.js:431`, `:484`).
- Long-press a past workout to copy it into today's session
  (`app/page.jsx`, via `use-long-press`).

Both are confirmed binding. Combined with an installable PWA and no payment or
subscription anywhere in the product, this is a phone-native logger rather than
a general fitness platform.

## Operating Context

- **The gym floor.** Standing, between sets, one thumb, about twenty seconds.
  Not a desk, not a review session at home.
- **Installed as a PWA.** `public/manifest.json` sets `display: standalone`;
  `next-pwa` generates the service worker. Users run it from a home screen icon,
  not a browser tab.
- **Three surfaces**, reached by a persistent bottom bar: home (`/`, log a
  workout plus the history list), stats (`/stats`), settings (`/settings`).
- **Session state survives reload.** The in-progress workout, its start time,
  and the chosen theme live in `localStorage` through `hooks/useStickyState.js`,
  so closing the app mid-workout does not lose the session.
- **Sign-in gates everything.** Clerk. Signed-out users see a welcome message
  and a sign-in control, and nothing else.
- **Data lives in Neon Postgres**, reached only through the app's own API
  routes.
- **Connectivity is not guaranteed.** Save and delete surface "You are offline.
  Try again once you are back online."; the workout in progress is held in
  `localStorage` until it can be written.

## Capabilities and Constraints

Confirmed functionality:

- Start a workout, add exercises by name (a combobox over previously used
  names), add and delete sets, set reps and weight per set, attach per-exercise
  notes, drag to reorder exercises, then end and save or trash without saving.
- A list of previous workouts, ten at a time, with "Show all your workouts".
- Long-press a past workout to copy it into a new session or delete it.
- Stats: a contribution-calendar view of workout days, and per-exercise Weight,
  Volume (reps x weight), and Table views with a show-empty-days toggle.
- Settings holds the color-style picker, a lbs/kg weight-unit choice, and
  a replay of the guided tour.

Confirmed constraints:

- **Weights are stored in lbs.** Every number in the database and in
  localStorage is pounds; no row records the unit it was typed in, so pounds is
  the only thing a stored number can be read as. The settings choice converts at
  the edges (`utils/units.js`, `context/unitProvider.jsx`) and never rewrites
  what is stored.
- **The database has no row-level security.** Every query in a route handler is
  scoped by the Clerk user id resolved server-side. That scoping is the only
  thing separating one user's data from another's.
- **Timestamps are stored without time zone** and formatted in Postgres with
  `to_char(...)`, so the client reads their wall-clock digits as UTC. Dev and
  production must not render different times.
- **JavaScript, not TypeScript.** Next.js 14 App Router, React 18, Node 22.

Explicitly undecided, and not to be treated as settled:

- **Per-workout units.** The unit is one global display choice. Whether a
  single account needs to log some lifts in kg and others in lbs, which would
  need a unit recorded per set, is unresolved.
- **Discoverability of the two signature gestures.** Neither swipe-to-scrub nor
  long-press-to-copy is announced anywhere in the UI. How a new user learns them
  is unresolved.
- **Non-touch input.** Both gestures use touch events only, with no mouse or
  keyboard equivalent. Whether desktop is a supported context is open.
- **The seven color themes** were not made binding. They exist and work; nothing
  requires future work to keep all seven.
- **First-run experience.** The empty state currently reads "No previous
  workouts found, why not start one?" and there is no other onboarding.

## Brand Commitments

- The name appears three ways in shipped surfaces: "Rep Tracker"
  (`manifest.json`, the signed-out welcome), "RepTracker" (`metadata.title`,
  README). Not yet reconciled.
- Authored by gsajith (`gsajith.com`), recorded in `app/layout.jsx` metadata.
- Icon set: Lets Icons SVGs in `components/SVGIcons/`, plus app icons in
  `public/icons/`.
- Clerk's sign-in UI uses the `shadesOfPurple` base theme from `@clerk/themes`.
- Voice observed in shipped copy is plain, second person, and lightly informal:
  "Save & end!", "Trash it!", "No previous workouts found, why not start one?".
  Recorded as what exists, not confirmed as binding.

## Evidence on Hand

- **Real workout data.** A recovered dump in `.migrate/` (gitignored, personal):
  621 exercises across 69 workouts. Restorable via `.migrate/restore.mjs`.
- **Shipped copy** across all three surfaces, including error and empty states.
- **README.md** documents the architecture, the authorization rule, and the
  timestamp handling.

Absences that future work must not fabricate: there are no testimonials, user
counts, reviews, press, case studies, benchmarks, or pricing. There is no
marketing surface, no screenshots, and no published privacy policy or terms.

## Product Principles

1. **The workout wins.** Logging costs one thumb and a few seconds. Anything
   that adds a step between finishing a set and recording it is a regression,
   whatever else it improves.
2. **Preserve the two gestures, but stop hiding them.** Swipe-to-scrub and
   long-press-to-copy are the product's signature and are binding. Now that
   strangers sign up, each needs a way to be discovered, and neither may remain
   the only route to the job it does.
3. **History is the input to today.** Past workouts decide what weight goes on
   the bar, so the app has to be accurate about what it stored and honest when
   it could not load or save.
4. **One user's data is never another's.** Every query scopes by Clerk user id.
   No client component touches the database.
5. **Public sign-up raises the floor.** Assumptions that held for one expert
   user (touch only, no first run) are open decisions now, not defaults to
   build on.

## Accessibility & Inclusion

No target standard has been confirmed, and none should be claimed.

One product-specific need is established: the two signature interactions are
touch-only with no keyboard or pointer equivalent, which is a known gap now that
the audience is public rather than one person who knows the gestures.

Existing accessibility work in the codebase, as context rather than commitment:
visible focus outlines on interactive controls, `aria-busy` on in-flight
buttons, `role="alert"` on modal errors, and a persistently mounted
`role="status"` live region on the home page.
