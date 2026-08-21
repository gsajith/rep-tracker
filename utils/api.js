'use client';
import { parseISOString } from './utils';

// Browser-side calls to our own API routes. Clerk's session cookie rides along
// automatically, so there is no token to attach and no database credential in the
// browser -- both of which the old Supabase client had to handle itself.
//
// Every function keeps the { data, error } shape the Supabase calls returned, so
// the call sites read the same way they always did.

async function request(url, options) {
  try {
    const res = await fetch(url, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { data: null, error: body.error ?? `HTTP ${res.status}` };
    }
    return { data: body.data, error: null };
  } catch (error) {
    // fetch only rejects on network failure; the app already gates on
    // navigator.onLine, this covers the rest.
    return { data: null, error: error?.message ?? 'Network error' };
  }
}

export async function loadWorkouts(limit = 100) {
  const { data, error } = await request(`/api/workouts?limit=${limit}`);
  if (error) return { data: null, error };

  // The API returns naive wall-clock strings, exactly what PostgREST used to
  // return, so parseISOString keeps behaving the way it always has.
  return {
    data: data.map((workout) => ({
      ...workout,
      start_time: parseISOString(workout.start_time),
      end_time: parseISOString(workout.end_time),
    })),
    error: null,
  };
}

// One request creates the workout and its exercises together, replacing the old
// loop of one insert per exercise followed by a separate workout insert.
export async function saveWorkout({ startTime, endTime, exercises, notes = '' }) {
  return request('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startTime, endTime, exercises, notes }),
  });
}

// Deletes the workout and the exercises belonging to it.
export async function removeWorkout(workoutId) {
  if (!workoutId) return { data: null, error: 'No workout ID' };
  return request(`/api/workouts/${workoutId}`, { method: 'DELETE' });
}
