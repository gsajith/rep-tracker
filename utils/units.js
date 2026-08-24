// Every weight in the database and in localStorage is pounds. That is what the
// app recorded for its whole life before this setting existed, and no row
// carries the unit it was typed in, so pounds is the only thing a stored number
// can be read as. The kg setting converts on the way out and back on the way
// in; relabelling the numbers in place would have turned a 135 lb bench into a
// 135 kg one.

export const WEIGHT_UNITS = ['lb', 'kg'];

const LB_PER_KG = 2.20462262185;

export const isWeightUnit = (value) => WEIGHT_UNITS.includes(value);

// "lbs" reads as a plural, "kg" does not.
export const weightUnitLabel = (unit) => (unit === 'kg' ? 'kg' : 'lbs');

const roundTo = (value, places) => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

// A stored pound value as the number to show. Anything that does not parse
// comes back as NaN on purpose: a set input that has been cleared holds "",
// and coercing that to 0 would refill the field the moment it was emptied.
//
// One decimal place, in both units. It covers the 2.5 kg plate jumps a kg gym
// works in, and it keeps the variable-width set input from growing by four
// digits the first time a converted number lands on a long fraction.
export const toDisplayWeight = (storedLb, unit) => {
  const lb = parseFloat(storedLb);
  if (Number.isNaN(lb)) return NaN;
  return roundTo(unit === 'kg' ? lb / LB_PER_KG : lb, 1);
};

// The inverse: a shown number back to the pounds that get stored.
//
// Pounds pass through untouched rather than being parsed, so that in the unit
// this app has always used, what a set input writes to state is character for
// character what it wrote before this file existed, "" included.
//
// Two decimals of pounds is finer than the one decimal kg is shown at, which is
// what stops a value from drifting a tenth every time it makes the round trip.
export const toStoredWeight = (displayValue, unit) => {
  if (unit !== 'kg') return displayValue;
  const shown = parseFloat(displayValue);
  if (Number.isNaN(shown)) return displayValue;
  return roundTo(shown * LB_PER_KG, 2);
};
