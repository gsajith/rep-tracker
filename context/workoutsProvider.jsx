'use client';
import { loadWorkouts } from '@/utils/api';
import { useUser } from '@clerk/nextjs';
import { createContext, useEffect, useRef, useState } from 'react';

export const WorkoutsContext = createContext();

export const WorkoutsProvider = ({ children }) => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loading2, setLoading2] = useState(false);
  const [exerciseNames, setExerciseNames] = useState(
    new Set(['bicep curl', 'squats', 'deadlift'])
  );

  // The `useUser()` hook will be used to ensure that Clerk has loaded data about the logged in user
  const { user } = useUser();

  const latestExercises = useRef({});

  useEffect(() => {
    if (!user) return;

    // Loads a few workouts first so the page paints quickly, then backfills the
    // rest. Unchanged in spirit from the Supabase version -- but each call is now
    // a single request instead of one round trip per exercise.
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
  }, [user]);

  function indexExercises(loaded) {
    for (const workout of loaded) {
      for (const exercise of workout.exercises ?? []) {
        addExerciseName(exercise.name.toLowerCase(), workout.end_time, exercise);
      }
    }
  }

  // `workoutEnd` is already a Date here; the loader converts timestamps once.
  function addExerciseName(name, workoutEnd, exercise) {
    if (
      !(name in latestExercises.current) ||
      latestExercises.current[name].time < workoutEnd.getTime()
    ) {
      latestExercises.current[name] = {
        time: workoutEnd.getTime(),
        exercise: exercise,
      };
    }
    setExerciseNames((oldExerciseNames) => {
      return new Set([...oldExerciseNames, name]);
    });
  }

  return (
    <WorkoutsContext.Provider
      value={{
        workouts,
        loading,
        loading2,
        exerciseNames,
        latestExercises,
      }}
    >
      {children}
    </WorkoutsContext.Provider>
  );
};
