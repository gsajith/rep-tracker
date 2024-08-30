export const calculateWorkoutTimer = (start, end) => {
  let seconds = (end - start) / 1000;
  let minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return pad(minutes) + ":" + pad(seconds);
}

function pad(n) {
  return (n < 10) ? ("0" + n) : n;
}
