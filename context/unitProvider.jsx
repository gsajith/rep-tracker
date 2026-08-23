'use client';
import { createContext, useContext, useMemo } from 'react';
import { useStickyState } from '@/hooks/useStickyState';
import {
  isWeightUnit,
  toDisplayWeight,
  toStoredWeight,
  weightUnitLabel,
} from '@/utils/units';

// Falling back to pounds keeps <Exercise /> renderable outside the provider,
// which is what the whole app did until this context was added.
const DEFAULT_VALUE = {
  unit: 'lb',
  setUnit: () => {},
  unitLabel: weightUnitLabel('lb'),
  toDisplay: (stored) => toDisplayWeight(stored, 'lb'),
  toStored: (shown) => toStoredWeight(shown, 'lb'),
};

const WeightUnitContext = createContext(DEFAULT_VALUE);

export const useWeightUnit = () => useContext(WeightUnitContext);

export const WeightUnitProvider = ({ children }) => {
  // Validated on read: a junk value here would not crash a render, it would
  // quietly label every number on screen with the wrong unit, which is worse.
  const [unit, setUnit] = useStickyState('lb', 'weight-unit', isWeightUnit);

  const value = useMemo(
    () => ({
      unit,
      setUnit,
      unitLabel: weightUnitLabel(unit),
      toDisplay: (stored) => toDisplayWeight(stored, unit),
      toStored: (shown) => toStoredWeight(shown, unit),
    }),
    [unit, setUnit]
  );

  return (
    <WeightUnitContext.Provider value={value}>
      {children}
    </WeightUnitContext.Provider>
  );
};
