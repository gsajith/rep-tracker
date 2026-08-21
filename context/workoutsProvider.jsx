'use client';
import { loadWorkouts } from '@/utils/api';
import { useUser } from '@clerk/nextjs';
import { createContext, useCallback, useEffect, useRef, useState } from 'react';

export const WorkoutsContext = createContext();

// Seeded so a brand new account has something in the combobox.
const DEFAULT_EXERCISE_NAMES = ['bicep curl', 'squats', 'deadlift'];

export const WorkoutsProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(false);
  const [exerciseNames, setExerciseNames] = useState(
    new Set(DEFAULT_EXERCISE_NAMES)
  );

  // Non-null when the most recent load or refetch failed. Cleared by the next
  // successful one. Without it a failed first load is indistinguishable from an
  // account with no workouts in it.
  const [loadError, setLoadError] = useState(null);

  // The `useUser()` hook will be used to ensure that Clerk has loaded data about the logged in user
  const { user } = useUser();

  const latestExercises = useRef({});

  // Rebuilds the index from scratch on every load. Unioning into it would keep
  // the names of deleted workouts around, which only went unnoticed while every
  // write ended in a full page reload.
  const indexExercises = useCallback((loaded) => {
    const names = new Set(DEFAULT_EXERCISE_NAMES);
    const latest = {};

    for (const workout of loaded) {
      for (const exercise of workout.exercises ?? []) {
        const name = exercise.name.toLowerCase();
        names.add(name);

        // `end_time` is already a Date here; the loader converts timestamps once.
        const time = workout.end_time.getTime();
        if (!(name in latest) || latest[name].time < time) {
          latest[name] = { time, exercise };
        }
      }
    }

    latestExercises.current = latest;
    setExerciseNames(names);
  }, []);

  // Refetches everything and replaces the list. Deliberately leaves `loading`
  // alone: the list is already on screen when this runs, and flipping `loading`
  // would swap it for shimmer placeholders on every save.
  // try/finally throughout: a throw out of indexExercises would otherwise leave
  // a loading flag stuck on, and the page reload that used to clear it is gone.
  // Resolves to the error string, or null on success, so a caller can tell
  // "the write failed" from "the write worked but this list is now stale".
  const refresh = useCallback(async () => {
    setLoading2(true);
    try {
      const { data, error } = await loadWorkouts(100);
      if (error) {
        setLoadError(error);
        return error;
      }
      indexExercises(data);
      setWorkouts(data);
      setLoadError(null);
      return null;
    } finally {
      setLoading2(false);
    }
  }, [indexExercises]);

  // Keyed on the id, not the user object: Clerk hands back a new object
  // identity on a session refresh, which would refetch everything.
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    // Loads a few workouts first so the page paints quickly, then backfills
    // the rest. Each call is a single request, not one round trip per exercise.
    async function load() {
      let first;
      setLoading(true);
      try {
        const { data, error } = await loadWorkouts(3);
        first = data;
        if (error) {
          setLoadError(error);
        } else {
          indexExercises(data);
          setWorkouts(data);
          setLoadError(null);
        }
      } finally {
        setLoading(false);
      }

      if (first !== null && first !== undefined && first.length > 0) {
        setLoading2(true);
        try {
          const { data: data2, error: error2 } = await loadWorkouts(100);
          if (error2) {
            setLoadError(error2);
          } else {
            indexExercises(data2);
            setWorkouts(data2);
            setLoadError(null);
          }
        } finally {
          setLoading2(false);
        }
      }
    }

    load();
  }, [userId, indexExercises]);

  return (
    <WorkoutsContext.Provider
      value={{
        workouts,
        loading,
        loading2,
        loadError,
        exerciseNames,
        latestExercises,
        refresh,
      }}
    >
      {children}
    </WorkoutsContext.Provider>
  );
};
