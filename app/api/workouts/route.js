import { auth } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import { getSql, ts } from '@/utils/db';

export const dynamic = 'force-dynamic';

// Clerk v5's auth() is synchronous (it only became async in v6).
function requireUser() {
  const { userId } = auth();
  return userId;
}

const unauthorized = () =>
  Response.json({ data: null, error: 'Unauthorized' }, { status: 401 });

// GET /api/workouts?limit=100
// Returns workouts newest-first with their exercises inlined, in the order the
// workout's uuid[] recorded them. Always two queries, whatever the limit.
export async function GET(request) {
  const userId = requireUser();
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
  const userId = requireUser();
  if (!userId) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ data: null, error: 'Invalid JSON' }, { status: 400 });
  }

  const { startTime, endTime, exercises = [], notes = '' } = body;
  if (!startTime || !endTime) {
    return Response.json(
      { data: null, error: 'startTime and endTime are required' },
      { status: 400 }
    );
  }
  if (!Array.isArray(exercises)) {
    return Response.json(
      { data: null, error: 'exercises must be an array' },
      { status: 400 }
    );
  }

  // Ids are generated here so both inserts can go in one transaction without
  // needing the first statement's RETURNING values.
  const rows = exercises.map((e) => ({
    id: randomUUID(),
    name: String(e?.name ?? ''),
    reps: (e?.reps ?? []).map((r) => parseInt(r, 10) || 0),
    weights: (e?.weights ?? []).map((w) => parseFloat(w) || 0),
    notes: e?.notes ?? '',
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
    return Response.json(
      { data: null, error: error.message ?? 'Insert failed' },
      { status: 500 }
    );
  }

  return Response.json(
    { data: { id: workoutId, exercises: rows.map((r) => r.id) }, error: null },
    { status: 201 }
  );
}
