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
