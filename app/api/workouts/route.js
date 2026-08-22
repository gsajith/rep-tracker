import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import { getSql, ts } from '@/utils/db';
import { validateWorkoutPayload } from '@/utils/validate';

export const dynamic = 'force-dynamic';

// Clerk's auth() is async as of v6.
async function requireUser() {
  const { userId } = await auth();
  return userId;
}

const unauthorized = () =>
  Response.json({ data: null, error: 'Unauthorized' }, { status: 401 });

const badRequest = (error) =>
  Response.json({ data: null, error }, { status: 400 });

// GET /api/workouts?limit=100
// Returns workouts newest-first with their exercises inlined, in the order the
// workout's uuid[] recorded them. Always two queries, whatever the limit.
export async function GET(request) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  const sql = getSql();
  const raw = parseInt(request.nextUrl.searchParams.get('limit'), 10);
  const limit = Math.min(Math.max(Number.isNaN(raw) ? 100 : raw, 1), 500);

  const workouts = await sql.query(
    `select id, ${ts('start_time', 'start_time')}, ${ts('end_time', 'end_time')},
            exercises, notes, user_id
     from workouts
     where user_id = $1
     order by start_time desc
     limit $2`,
    [userId, limit]
  );

  const ids = [...new Set(workouts.flatMap((w) => w.exercises ?? []))];

  // reps is bigint[]; without the ::int[] cast the driver returns strings.
  const rows = ids.length
    ? await sql.query(
        `select id, name, reps::int[] as reps, weights, notes, user_id
         from exercises
         where user_id = $1 and id = any($2::uuid[])`,
        [userId, ids]
      )
    : [];

  const byId = new Map(rows.map((e) => [e.id, e]));

  return Response.json({
    data: workouts.map((w) => ({
      ...w,
      // filter(Boolean) guards against a uuid whose exercise row is missing.
      exercises: (w.exercises ?? []).map((id) => byId.get(id)).filter(Boolean),
    })),
    error: null,
  });
}

// POST /api/workouts
// Creates the workout and all of its exercises in one transaction, so a failure
// partway through cannot leave orphaned exercise rows behind.
export async function POST(request) {
  const userId = await requireUser();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ data: null, error: 'Invalid JSON' }, { status: 400 });
  }

  const { startTime, endTime, exercises = [], notes = '' } = body;

  // Everything Postgres would have rejected is rejected here instead. Without
  // this an unparseable startTime reaches the $2::timestamp cast, fails inside
  // the database, and surfaces as a 500 for what is plainly a client error.
  const { error: invalid, exercises: validExercises } = validateWorkoutPayload({
    startTime,
    endTime,
    exercises,
    notes,
  });
  if (invalid) return badRequest(invalid);

  // Ids are generated here so both inserts can go in one transaction without
  // needing the first statement's RETURNING values.
  //
  // The rows come from the validator already coerced. Re-deriving them here
  // would mean two independent readings of the same input, which is exactly how
  // a value that passed a range check went on to overflow bigint.
  // Both id and user_id sit after the spread. user_id was already safe by
  // ordering; id was safe only because the validator happens not to emit that
  // key. Ordering makes neither depend on that.
  const rows = validExercises.map((exercise) => ({
    ...exercise,
    id: randomUUID(),
    user_id: userId,
  }));

  const workoutId = randomUUID();

  try {
    const sql = getSql();
    await sql.transaction([
      sql.query(
        `insert into exercises (id, name, reps, weights, notes, user_id)
         select id, name, reps, weights, notes, user_id
         from jsonb_to_recordset($1::jsonb) as x(
           id uuid, name text, reps bigint[],
           weights double precision[], notes text, user_id text
         )`,
        [JSON.stringify(rows)]
      ),
      sql.query(
        `insert into workouts (id, start_time, end_time, exercises, notes, user_id)
         values ($1, $2::timestamp, $3::timestamp, $4::uuid[], $5, $6)`,
        [
          workoutId,
          startTime,
          endTime,
          rows.map((r) => r.id),
          notes ?? '',
          userId,
        ]
      ),
    ]);
  } catch (error) {
    console.error('POST /api/workouts failed:', error);
    // Fixed string, not error.message. A Postgres error names columns, types
    // and constraints, and the client has no use for any of it.
    return Response.json(
      { data: null, error: 'Could not save the workout' },
      { status: 500 }
    );
  }

  return Response.json(
    { data: { id: workoutId, exercises: rows.map((r) => r.id) }, error: null },
    { status: 201 }
  );
}
