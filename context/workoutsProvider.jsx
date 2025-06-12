'use client';
import { createClerkSupabaseClient } from '@/utils/supabase/clerk-client';
import { loadWorkoutWithExercisesWithLimit } from '@/utils/supabase/database';
import { parseISOString } from '@/utils/utils';
import { useSession, useUser } from '@clerk/nextjs';
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
  // The `useSession()` hook will be used to get the Clerk `session` object
  const { session } = useSession();

  let client = useRef(null);

  const latestExercises = useRef({});

  useEffect(() => {
    if (session) {
      client.current = createClerkSupabaseClient(session);
    }
  }, [session]);

  useEffect(() => {
    if (!user || !client.current) return;

    async function loadWorkouts() {
      setLoading(true);
      const { data, error } = await loadWorkoutWithExercisesWithLimit(
        client.current,
        addExerciseName,
        3
      );
      if (!error) {
        setWorkouts(data);
      }
      setLoading(false);
      if (data !== null && data.length > 0) {
        setLoading2(true);
        const { data: data2, error: error2 } =
          await loadWorkoutWithExercisesWithLimit(
            client.current,
            addExerciseName,
            100
          );
        if (!error2) {
          setWorkouts(data2);
        }
        setLoading2(false);
      }
    }

    loadWorkouts();
  }, [user, client]);

  function addExerciseName(name, workoutEndISO, exercise) {
    if (
      !(name in latestExercises.current) ||
      latestExercises.current[name].time <
        parseISOString(workoutEndISO).getTime()
    ) {
      latestExercises.current[name] = {
        time: parseISOString(workoutEndISO).getTime(),
        exercise: exercise,
      };
    }
    setExerciseNames((oldExerciseNames) => {
      return new Set([...oldExerciseNames, name]);
    });
  }

  return (
    <WorkoutsContext.Provider
      value={{ workouts, loading, loading2, exerciseNames, latestExercises }}
    >
      {children}
    </WorkoutsContext.Provider>
  );
};
