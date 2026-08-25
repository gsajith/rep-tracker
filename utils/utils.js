export const calculateWorkoutTimer = (start, end) => {
  let seconds = (end - start) / 1000;
  let minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return pad(minutes) + ':' + pad(seconds);
};

function pad(n) {
  return n < 10 ? '0' + n : n;
}

export function parseISOString(s) {
  var b = s.split(/\D+/);
  return new Date(Date.UTC(b[0], --b[1], b[2], b[3], b[4], b[5], b[6]));
}

export function readableDate(d) {
  const month = d.toLocaleString('default', { month: 'short' });
  const day = d.toLocaleString('default', { day: 'numeric' });
  const year = d.toLocaleString('default', { year: 'numeric' });
  return month + ' ' + day + ', ' + year;
}

export function readableTime(d) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export const calculateMinutes = (start, end) => {
  let seconds = (end - start) / 1000;
  let minutes = Math.ceil(seconds / 60);
  return minutes;
};

export const calculateDaysAgo = (timestamp) => {
  const days = Math.floor((new Date() - timestamp) / 1000 / 60 / 60 / 24);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  // Past a month, a day count stops being something anyone can picture: this
  // account had entries reading "421 days ago".
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  const remainder = Math.floor((days - years * 365) / 30);
  if (remainder === 0) return `${years} year${years === 1 ? '' : 's'} ago`;
  return `${years}y ${remainder}m ago`;
};

export function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Returns a copy sorted newest first. A copy specifically: callers pass the
// array straight out of WorkoutsContext, and Array.prototype.sort reorders in
// place, so sorting the original mutates the provider's state during render and
// every other consumer sees the new order.
export function sortWorkoutsByEndTime(workouts) {
  return [...workouts].sort(
    (a, b) => b.end_time.valueOf() - a.end_time.valueOf()
  );
}

// A workout ends when someone taps End. Sessions that were abandoned instead
// get stamped closed whenever the next one starts, which produced durations
// like "8839 mins" sitting next to a plausible "43 mins" with nothing marking
// the difference. Anything past this bound is reported as unfinished rather
// than as a number, because that is what it is.
export const ABANDONED_AFTER_MINUTES = 6 * 60;

export const formatDuration = (start, end) => {
  const minutes = calculateMinutes(start, end);
  if (!Number.isFinite(minutes) || minutes < 0) return null;
  if (minutes >= ABANDONED_AFTER_MINUTES) return null;
  if (minutes < 90) return `${minutes} min${minutes === 1 ? '' : 's'}`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
};

// Routines are derived from history rather than stored separately: a routine is
// just the set of workouts sharing a name. That keeps "when did I last do Leg
// day" true by construction, and means a routine can never describe something
// the user never actually did.
//
// Returns least-recently-done first, so the routine you are due next is the
// one nearest to hand. Each entry carries when it was last done, so "which did
// I do most recently" is still answerable by reading the other end.
export function deriveRoutines(workouts) {
  const byName = new Map();

  for (const workout of workouts) {
    const name = typeof workout.name === 'string' ? workout.name.trim() : '';
    if (!name) continue;

    const previous = byName.get(name);
    // start_time, matching what the cards display and what decides recency
    // everywhere else in the app.
    if (!previous || workout.start_time > previous.lastDone) {
      byName.set(name, {
        name,
        lastDone: workout.start_time,
        workout,
        count: (previous?.count ?? 0) + 1,
      });
    } else {
      previous.count += 1;
    }
  }

  return [...byName.values()].sort((a, b) => a.lastDone - b.lastDone);
}

// A routine remembers the numbers from the last time that routine ran, but the
// same exercise usually turns up in other workouts in between, so those numbers
// go stale: start a routine a month later and it hands back a month-old weight
// for a lift that moved up last week.
//
// So each exercise is refilled from the most recent session it appears in,
// whichever workout that was. The routine still decides how many sets you do;
// only the numbers come from the newer session, repeating its last set when the
// routine asks for more sets than that session had.
export function withLatestNumbers(workout, latestExercises) {
  const startedAt = workout.start_time.getTime();

  return (workout.exercises ?? []).map((exercise) => {
    // The index is keyed on the lowercased name, and stored names are not.
    const latest = latestExercises?.[exercise.name.toLowerCase()];
    // Nothing newer than the workout being copied, so its own numbers are the
    // most recent ones and it is its own "last time".
    if (!latest || latest.time <= startedAt) {
      return {
        ...exercise,
        oldReps: [...exercise.reps],
        oldWeights: [...exercise.weights],
        oldNotes: exercise.notes,
        time: startedAt,
        prefilled: true,
      };
    }

    const sets = Math.min(
      latest.exercise.reps.length,
      latest.exercise.weights.length
    );
    // The newer session exists but has no usable sets, so it cannot fill
    // anything and this workout is again its own "last time".
    if (sets === 0) {
      return {
        ...exercise,
        oldReps: [...exercise.reps],
        oldWeights: [...exercise.weights],
        oldNotes: exercise.notes,
        time: startedAt,
        prefilled: true,
      };
    }

    const fill = (values, count) =>
      Array.from({ length: count }, (_, i) => values[Math.min(i, sets - 1)]);

    // The numbers to start from, and a record of where they came from. Without
    // the old* fields an exercise copied out of a routine carries no memory of
    // the session it was filled from, so <Workout /> renders no "Previously"
    // panel for it and nothing can tell whether today beat last time. Adding an
    // exercise by hand has always had them, which is why the two routes into
    // the same card behaved differently.
    return {
      ...exercise,
      reps: fill(latest.exercise.reps, exercise.reps.length),
      weights: fill(latest.exercise.weights, exercise.weights.length),
      oldReps: [...latest.exercise.reps],
      oldWeights: [...latest.exercise.weights],
      oldNotes: latest.exercise.notes,
      time: latest.time,
      prefilled: true,
    };
  });
}
