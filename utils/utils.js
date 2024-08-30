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
