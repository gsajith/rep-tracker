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

// Date.parse is far more permissive than Postgres. It accepts a bare year, and
// it silently rolls impossible dates forward: 2026-02-30 becomes 2 March rather
// than an error. Postgres rejects both, so leaning on Date.parse alone left the
// exact 500s this issue is about, just for narrower inputs.
const ISO_RE =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d{1,6})?)?(Z|[+-]\d{2}:?\d{2})?$/;

// Returns milliseconds, or null when the value cannot be a timestamp. The
// caller passes the ORIGINAL string to SQL; this number is only for comparing
// the two ends of a workout. Reformatting the string would change what lands in
// a `timestamp without time zone` column, and the round trip back out through
// to_char and parseISOString depends on exactly what went in.
export function timestampMs(value) {
  // No trimming. A padded string would pass a trimmed check and then reach SQL
  // with its padding intact, which is the same check-and-use mismatch that this
  // file has already been bitten by. The regex rejects whitespace outright.
  if (typeof value !== 'string') return null;
  if (!ISO_RE.test(value)) return null;

  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return null;

  // The regex accepts 2026-02-30 as well-formed, so round-trip the calendar
  // part. If the components come back different, JavaScript rolled the date
  // over and Postgres would have refused it.
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const roundTrip = new Date(Date.UTC(year, month - 1, day));
  if (
    roundTrip.getUTCFullYear() !== year ||
    roundTrip.getUTCMonth() !== month - 1 ||
    roundTrip.getUTCDate() !== day
  ) {
    return null;
  }

  return ms;
}

// One authenticated request should not be able to insert an unbounded row.
// These sit far above anything a real workout produces: the migrated data
// averages about nine exercises per workout.
export const LIMITS = {
  exercisesPerWorkout: 100,
  setsPerExercise: 100,
  nameLength: 200,
  notesLength: 2000,
  // reps is bigint[] and weights is double precision[]. These sit far below
  // either column's range, so an out-of-range value is refused here rather than
  // reaching Postgres and coming back as a 500.
  maxReps: 100000,
  maxWeight: 100000,
};

// The coercions the stored rows are built from. They live here, next to the
// range checks that guard them, because the previous arrangement had this file
// checking Number(entry) while the handler stored parseInt(entry, 10) || 0.
// Those disagree: "99999999999999999999e-40" is 1e-20 to one and 1e20 to the
// other, so it passed a 0..100000 range check and then overflowed bigint.
const toReps = (value) => parseInt(value, 10) || 0;
const toWeight = (value) => parseFloat(value) || 0;

// Range-checks the COERCED value, never the raw one. Checking anything other
// than the exact number that gets stored is how all four of this file's bugs
// happened.
function outOfRange(values, label, max, min) {
  for (const value of values) {
    if (!Number.isFinite(value)) return `${label} must all be numbers`;
    if (value < min || value > max) {
      return `${label} must all be between ${min} and ${max}`;
    }
  }
  return null;
}

// Returns `{ error }` on rejection, or `{ error: null, exercises }` where those
// exercises are the coerced rows the handler should insert.
//
// Returning the rows is the point. Validating here and coercing again in the
// handler meant two independent readings of the same input, and every value
// that got past this file did so through that gap. There is now one coercion,
// and the range checks guard exactly the numbers that get stored.
export function validateWorkoutPayload({
  startTime,
  endTime,
  exercises,
  notes,
}) {
  const reject = (error) => ({ error, exercises: null });

  const startMs = timestampMs(startTime);
  if (startMs === null) return reject('startTime must be a valid timestamp');

  const endMs = timestampMs(endTime);
  if (endMs === null) return reject('endTime must be a valid timestamp');

  if (endMs < startMs) return reject('endTime must not be before startTime');

  if (!Array.isArray(exercises)) return reject('exercises must be an array');
  if (exercises.length > LIMITS.exercisesPerWorkout) {
    return reject(
      `exercises must contain at most ${LIMITS.exercisesPerWorkout} items`
    );
  }

  // Type first, then length. Checking length behind `typeof === 'string'` alone
  // would let a non-string slip past both checks and reach the insert.
  if (notes !== undefined && typeof notes !== 'string') {
    return reject('notes must be a string');
  }
  if (notes !== undefined && notes.length > LIMITS.notesLength) {
    return reject(`notes must be at most ${LIMITS.notesLength} characters`);
  }

  const coerced = [];

  for (const exercise of exercises) {
    if (exercise === null || typeof exercise !== 'object') {
      return reject('each exercise must be an object');
    }
    // Type before length, the same order as notes. Written the other way round
    // this cap does nothing at all for a non-string: the handler wraps name in
    // String(), so an array of 50,000 entries becomes a 99,999-character name
    // that no length check ever saw.
    if (exercise.name !== undefined && typeof exercise.name !== 'string') {
      return reject('exercise name must be a string');
    }
    if (
      exercise.name !== undefined &&
      exercise.name.length > LIMITS.nameLength
    ) {
      return reject(
        `exercise name must be at most ${LIMITS.nameLength} characters`
      );
    }
    if (exercise.reps !== undefined && !Array.isArray(exercise.reps)) {
      return reject('exercise reps must be an array');
    }
    if (exercise.weights !== undefined && !Array.isArray(exercise.weights)) {
      return reject('exercise weights must be an array');
    }
    if ((exercise.reps?.length ?? 0) > LIMITS.setsPerExercise) {
      return reject(`an exercise may have at most ${LIMITS.setsPerExercise} sets`);
    }
    if ((exercise.weights?.length ?? 0) > LIMITS.setsPerExercise) {
      return reject(`an exercise may have at most ${LIMITS.setsPerExercise} sets`);
    }
    if (exercise.notes !== undefined && typeof exercise.notes !== 'string') {
      return reject('exercise notes must be a string');
    }
    if (
      exercise.notes !== undefined &&
      exercise.notes.length > LIMITS.notesLength
    ) {
      return reject(
        `exercise notes must be at most ${LIMITS.notesLength} characters`
      );
    }

    // Coerce, then range-check what the coercion produced, then keep that exact
    // value. Nothing downstream re-reads the raw input.
    const reps = (exercise.reps ?? []).map(toReps);
    const weights = (exercise.weights ?? []).map(toWeight);

    const badReps = outOfRange(reps, 'reps', LIMITS.maxReps, 0);
    if (badReps) return reject(badReps);

    const badWeights = outOfRange(
      weights,
      'weights',
      LIMITS.maxWeight,
      -LIMITS.maxWeight
    );
    if (badWeights) return reject(badWeights);

    coerced.push({
      name: String(exercise.name ?? ''),
      reps,
      weights,
      notes: exercise.notes ?? '',
    });
  }

  return { error: null, exercises: coerced };
}

// Shape check for the in-progress workout kept in localStorage under
// "exercises". Distinct from validateWorkoutPayload above, which guards what a
// client sends to the API: this guards what the app reads back out of its own
// storage, and the two shapes differ. The stored one also carries repsDrag,
// weightsDrag and expanded, none of which ever reach the server.
//
// Checks only the fields whose absence crashes a render: app/page.jsx and
// components/workout.js read name.toLowerCase(), reps.length and
// weights.length. Anything stricter would be guessing at a shape nobody has
// been bitten by.
export function isStoredExerciseList(value) {
  return (
    Array.isArray(value) &&
    value.every(
      (exercise) =>
        exercise !== null &&
        typeof exercise === 'object' &&
        typeof exercise.name === 'string' &&
        Array.isArray(exercise.reps) &&
        Array.isArray(exercise.weights)
    )
  );
}
