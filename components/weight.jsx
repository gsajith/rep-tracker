import { useWeightUnit } from '@/context/unitProvider';

// Every read-only weight on screen renders through here, so a new one cannot
// accidentally ship in pounds while the rest of the app is in kg, and the
// missing-value case is handled once instead of at each call site.
//
// `lb` is the stored value, always pounds. See utils/units.js.
export default function Weight({ lb, adornmentClassName }) {
  const { toDisplay, unitLabel } = useWeightUnit();
  const shown = toDisplay(lb);

  // Ragged reps/weights arrays are real in stored data, which utils/validate.js
  // tolerates on read, so a set can ask for a weight that is not there. The
  // raw value used to render as an empty gap; converting it would put the text
  // "NaN" next to a rep count instead.
  if (!Number.isFinite(shown)) return null;

  return (
    <>
      <span style={{ fontSize: 18 }}>{shown}</span>
      <span
        className={adornmentClassName}
        style={{ marginLeft: -3, marginTop: 5 }}
      >
        {unitLabel}
      </span>
    </>
  );
}
