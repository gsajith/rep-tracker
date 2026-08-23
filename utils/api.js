'use client';
import { parseISOString } from './utils';

// Browser-side calls to our own API routes. Clerk's session cookie rides along
// automatically, so there is no token to attach and no database credential in
// the browser.
//
// Every function resolves to a { data, error } pair rather than throwing, which
// is the shape the call sites expect.

async function request(url, options) {
  try {
    const res = await fetch(url, options);
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        data: null,
        error: body.error ?? `HTTP ${res.status}`,
        status: res.status,
      };
    }
    return { data: body.data, error: null, status: res.status };
  } catch (error) {
    // fetch only rejects on network failure; the app already gates on
    // navigator.onLine, this covers the rest.
    return { data: null, error: error?.message ?? 'Network error', status: 0 };
  }
}

export async function loadWorkouts(limit = 100) {
  const { data, error } = await request(`/api/workouts?limit=${limit}`);
  if (error) return { data: null, error };

  // A 2xx whose body did not parse leaves `data` undefined, because request()
  // falls back to {} rather than throwing. Mapping over that throws out of a
  // function whose whole contract is to resolve to an { data, error } pair, and
  // every caller then treats a rejected promise as no feedback at all.
  if (!Array.isArray(data)) {
    return { data: null, error: 'Malformed response from /api/workouts' };
  }

  // The API returns naive wall-clock strings, which is what parseISOString
  // expects -- see the timestamp note in utils/db.js.
  return {
    data: data.map((workout) => ({
      ...workout,
      start_time: parseISOString(workout.start_time),
      end_time: parseISOString(workout.end_time),
      name: workout.name ?? null,
    })),
    error: null,
  };
}

// One request creates the workout and all of its exercises together.
export async function saveWorkout({
  startTime,
  endTime,
  exercises,
  notes = '',
  name = null,
}) {
  return request('/api/workouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startTime, endTime, exercises, notes, name }),
  });
}

// Renames a whole routine: every workout under `from` becomes `to`. A routine
// is derived from the names on history, so renaming one workout at a time would
// split the group rather than rename it.
export async function renameRoutine(from, to) {
  return request('/api/workouts', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to }),
  });
}

// Sets or clears a single workout's name. Pass null or '' to unname it.
export async function renameWorkout(workoutId, name) {
  if (!workoutId) return { data: null, error: 'No workout ID' };
  return request(`/api/workouts/${workoutId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
}

// Deletes the workout and the exercises belonging to it.
export async function removeWorkout(workoutId) {
  if (!workoutId) return { data: null, error: 'No workout ID' };
  return request(`/api/workouts/${workoutId}`, { method: 'DELETE' });
}
