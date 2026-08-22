// Input validation for the route handlers. Pure functions with no database and
// no request object, so they can be executed directly.

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Strictly canonical. Postgres accepts some looser spellings, but every id this
// app produces comes from randomUUID(), so anything else is a bad request
// rather than something to be lenient about.
export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
}

// Returns milliseconds, or null when the value cannot be a timestamp. The
// caller passes the ORIGINAL string to SQL; this number is only for comparing
// the two ends of a workout. Reformatting the string would change what lands in
// a `timestamp without time zone` column, and the round trip back out through
// to_char and parseISOString depends on exactly what went in.
export function timestampMs(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

// One authenticated request should not be able to insert an unbounded row.
// These sit far above anything a real workout produces: the migrated data
// averages about nine exercises per workout.
export const LIMITS = {
  exercisesPerWorkout: 100,
  setsPerExercise: 100,
  nameLength: 200,
  notesLength: 2000,
};

// Returns an error string, or null when the payload is acceptable. One function
// rather than a chain, so the handler stays a short list of guard clauses.
export function validateWorkoutPayload({
  startTime,
  endTime,
  exercises,
  notes,
}) {
  const startMs = timestampMs(startTime);
  if (startMs === null) return 'startTime must be a valid timestamp';

  const endMs = timestampMs(endTime);
  if (endMs === null) return 'endTime must be a valid timestamp';

  if (endMs < startMs) return 'endTime must not be before startTime';

  if (!Array.isArray(exercises)) return 'exercises must be an array';
  if (exercises.length > LIMITS.exercisesPerWorkout) {
    return `exercises must contain at most ${LIMITS.exercisesPerWorkout} items`;
  }

  // Type first, then length. Checking length behind `typeof === 'string'` alone
  // would let a non-string slip past both checks and reach the insert.
  if (notes !== undefined && typeof notes !== 'string') {
    return 'notes must be a string';
  }
  if (notes !== undefined && notes.length > LIMITS.notesLength) {
    return `notes must be at most ${LIMITS.notesLength} characters`;
  }

  for (const exercise of exercises) {
    if (exercise === null || typeof exercise !== 'object') {
      return 'each exercise must be an object';
    }
    if (
      typeof exercise.name === 'string' &&
      exercise.name.length > LIMITS.nameLength
    ) {
      return `exercise name must be at most ${LIMITS.nameLength} characters`;
    }
    if (exercise.reps !== undefined && !Array.isArray(exercise.reps)) {
      return 'exercise reps must be an array';
    }
    if (exercise.weights !== undefined && !Array.isArray(exercise.weights)) {
      return 'exercise weights must be an array';
    }
    if ((exercise.reps?.length ?? 0) > LIMITS.setsPerExercise) {
      return `an exercise may have at most ${LIMITS.setsPerExercise} sets`;
    }
    if ((exercise.weights?.length ?? 0) > LIMITS.setsPerExercise) {
      return `an exercise may have at most ${LIMITS.setsPerExercise} sets`;
    }
    if (exercise.notes !== undefined && typeof exercise.notes !== 'string') {
      return 'exercise notes must be a string';
    }
    if (
      exercise.notes !== undefined &&
      exercise.notes.length > LIMITS.notesLength
    ) {
      return `exercise notes must be at most ${LIMITS.notesLength} characters`;
    }
  }

  return null;
}
