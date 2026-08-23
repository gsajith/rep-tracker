import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/utils/db';
import { isUuid, normalizeWorkoutName, LIMITS } from '@/utils/validate';

export const dynamic = 'force-dynamic';

// PATCH /api/workouts/:id
// Sets or clears a workout's name, which is what groups workouts into routines.
// Scoped by the Clerk user id like every other query here.
export async function PATCH(request, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;
  if (!isUuid(id)) {
    return Response.json(
      { data: null, error: 'Invalid workout id' },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { data: null, error: 'Body must be JSON' },
      { status: 400 }
    );
  }

  const name = normalizeWorkoutName(body?.name);
  if (name === undefined) {
    return Response.json(
      {
        data: null,
        error: `name must be a string of at most ${LIMITS.nameLength} characters`,
      },
      { status: 400 }
    );
  }

  try {
    const sql = getSql();
    const rows = await sql.query(
      `update workouts set name = $1 where id = $2::uuid and user_id = $3
       returning id, name`,
      [name, id, userId]
    );

    if (rows.length === 0) {
      return Response.json(
        { data: null, error: 'Workout not found' },
        { status: 404 }
      );
    }

    return Response.json({ data: rows[0], error: null });
  } catch (error) {
    console.error('PATCH /api/workouts failed:', error);
    return Response.json(
      { data: null, error: 'Could not rename the workout' },
      { status: 500 }
    );
  }
}

// DELETE /api/workouts/:id
// Removes the workout and the exercises it owns. Both scoped by the Clerk user
// id, so one user can never delete another's rows.
//
// A single data-modifying statement, so it is atomic: a workout can never be
// left pointing at exercises that were already deleted.
export async function DELETE(_request, { params }) {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

  // Without this the $1::uuid cast fails inside Postgres and comes back as a
  // 500 carrying `invalid input syntax for type uuid`, for what is a client
  // sending a malformed id.
  if (!isUuid(id)) {
    return Response.json(
      { data: null, error: 'Invalid workout id' },
      { status: 400 }
    );
  }

  try {
    const sql = getSql();
    const [result] = await sql.query(
      `with target as (
         select id, exercises from workouts where id = $1::uuid and user_id = $2
       ),
       del_ex as (
         delete from exercises
         where user_id = $2
           and id = any(select unnest(exercises) from target)
         returning 1
       ),
       del_w as (
         delete from workouts where id = (select id from target)
         returning 1
       )
       select (select count(*) from del_ex)::int as exercises_deleted,
              (select count(*) from del_w)::int  as workouts_deleted`,
      [id, userId]
    );

    if (!result || result.workouts_deleted === 0) {
      return Response.json(
        { data: null, error: 'Workout not found' },
        { status: 404 }
      );
    }

    return Response.json({ data: result, error: null });
  } catch (error) {
    console.error('DELETE /api/workouts failed:', error);
    // Fixed string, not error.message, for the same reason as the POST handler.
    return Response.json(
      { data: null, error: 'Could not delete the workout' },
      { status: 500 }
    );
  }
}
