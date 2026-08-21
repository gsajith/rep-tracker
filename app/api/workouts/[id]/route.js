import { auth } from '@clerk/nextjs/server';
import { getSql } from '@/utils/db';

export const dynamic = 'force-dynamic';

// DELETE /api/workouts/:id
// Removes the workout and the exercises it owns. Both scoped by the Clerk user id,
// so one user can never delete another's rows -- this is what the RLS policy
// `enforce_user_id_delete` used to guarantee inside Postgres.
//
// A single data-modifying statement, so it is atomic: the old browser-side flow
// deleted each exercise in a loop and then the workout, which could leave a
// workout pointing at already-deleted exercises if it failed midway.
export async function DELETE(_request, { params }) {
  const { userId } = auth();
  if (!userId) {
    return Response.json({ data: null, error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = params;

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
    return Response.json(
      { data: null, error: error.message ?? 'Delete failed' },
      { status: 500 }
    );
  }
}
