'use client';
import { createContext, useContext, useMemo } from 'react';
import { useStickyState } from '@/hooks/useStickyState';
import {
  isWeightUnit,
  toDisplayWeight,
  toStoredWeight,
  weightUnitLabel,
} from '@/utils/units';

const unitValue = (unit, setUnit) => ({
  unit,
  setUnit,
  unitLabel: weightUnitLabel(unit),
  toDisplay: (stored) => toDisplayWeight(stored, unit),
  toStored: (shown) => toStoredWeight(shown, unit),
});

// The provider wraps <html>, so nothing in the app renders without it. The
// default is here so a component can still be rendered on its own, in pounds,
// which is what it would have done before this context existed.
const WeightUnitContext = createContext(unitValue('lb', () => {}));

export const useWeightUnit = () => useContext(WeightUnitContext);

export const WeightUnitProvider = ({ children }) => {
  // Validated on read: a junk value here would not crash a render, it would
  // quietly label every number on screen with the wrong unit, which is worse.
  const [unit, setUnit] = useStickyState('lb', 'weight-unit', isWeightUnit);

  const value = useMemo(() => unitValue(unit, setUnit), [unit, setUnit]);

  return (
    <WeightUnitContext.Provider value={value}>
      {children}
    </WeightUnitContext.Provider>
  );
};
