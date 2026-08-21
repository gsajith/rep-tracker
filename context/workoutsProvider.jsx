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
  const refresh = useCallback(async () => {
    setLoading2(true);
    const { data, error } = await loadWorkouts(100);
    if (!error) {
      indexExercises(data);
      setWorkouts(data);
    }
    setLoading2(false);
  }, [indexExercises]);

  useEffect(() => {
    if (!user) return;

    // Loads a few workouts first so the page paints quickly, then backfills
    // the rest. Each call is a single request, not one round trip per exercise.
    async function load() {
      setLoading(true);
      const { data, error } = await loadWorkouts(3);
      if (!error) {
        indexExercises(data);
        setWorkouts(data);
      }
      setLoading(false);

      if (data !== null && data.length > 0) {
        setLoading2(true);
        const { data: data2, error: error2 } = await loadWorkouts(100);
        if (!error2) {
          indexExercises(data2);
          setWorkouts(data2);
        }
        setLoading2(false);
      }
    }

    load();
  }, [user, indexExercises]);

  return (
    <WorkoutsContext.Provider
      value={{
        workouts,
        loading,
        loading2,
        exerciseNames,
        latestExercises,
        refresh,
      }}
    >
      {children}
    </WorkoutsContext.Provider>
  );
};
