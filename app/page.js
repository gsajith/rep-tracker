'use client';
import { useSession, useUser } from '@clerk/nextjs';
import styles from './page.module.css';
import { createClerkSupabaseClient } from '@/utils/supabase/clerk-client';
import { useEffect, useRef, useState } from 'react';
import { createExercise, createWorkout } from '@/utils/supabase/database';
import LoggedWorkout from '@/components/loggedWorkout';
import Workout from '@/components/workout';
import { parseISOString } from '@/utils/utils';

const DEBUG = process.env.NODE_ENV === 'development';

export default function Home() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exerciseNames, setExerciseNames] = useState(
    new Set(['bicep curl', 'squats', 'deadlift'])
  );
  const latestExercises = useRef({});

  // The `useUser()` hook will be used to ensure that Clerk has loaded data about the logged in user
  const { user } = useUser();
  // The `useSession()` hook will be used to get the Clerk `session` object
  const { session } = useSession();

  const client = createClerkSupabaseClient(session);

  useEffect(() => {
    if (!user) return;

    async function loadWorkouts() {
      setLoading(true);
      const { data, error } = await client.from('workouts').select();
      if (!error) {
        for (let i = 0; i < data.length; i++) {
          if (data[i].exercises) {
            for (let j = 0; j < data[i].exercises.length; j++) {
              const { data: exercise, error: exerciseError } = await client
                .from('exercises')
                .select()
                .eq('id', data[i].exercises[j]);
              if (!exerciseError) {
                data[i].exercises[j] = exercise[0];
                addExerciseName(
                  exercise[0].name.toLowerCase(),
                  data[i].end_time,
                  exercise[0]
                );
              }
            }
          }
        }
        setWorkouts(
          data.map((workout) => ({
            ...workout,
            start_time: parseISOString(workout.start_time),
            end_time: parseISOString(workout.end_time),
          }))
        );
      }
      setLoading(false);
    }

    loadWorkouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
    setExerciseNames(
      (oldExerciseNames) => new Set([...oldExerciseNames, name])
    );
  }

  async function handleCreateWorkout(e) {
    e.preventDefault();
    var d = new Date();
    d.setDate(d.getDate() - 134);
    var d2 = new Date();
    d2.setDate(d2.getDate() - 134);
    d.setHours(d.getHours() - 2);
    d.setMinutes(d.getMinutes() - 16);
    createWorkout(
      client,
      d.toISOString(),
      d2.toISOString(),
      ['7d2a19f0-c25f-43dd-9a23-27d0bb82cc88'],
      'New function'
    );
  }

  async function handleCreateExercise(e) {
    e.preventDefault();
    createExercise(client, 'Pushups', [10, 10], [0, 0]);
    // createExercise(client, 'Squats', [8, 8], [30, 30], 'Easy peasy');
    // createExercise(client, 'Dumbbell row', [8], [15]);
    // createExercise(
    //   client,
    //   'Laying dumbbell skullcrushers',
    //   [14, 12, 10, 8],
    //   [15, 15, 10, 10],
    //   'ouch ouch ouch ouch'
    // );
  }

  return (
    <main className={styles.main}>
      <Workout
        exerciseNames={Array.from(exerciseNames).map((exerciseName, index) => ({
          id: index,
          name: exerciseName,
        }))}
        latestExercises={latestExercises.current}
      />

      {DEBUG && (
        <>
          <form onSubmit={handleCreateWorkout}>
            <button type="submit">Add</button>
          </form>
          <form onSubmit={handleCreateExercise}>
            <button type="submit">Add Exercise</button>
          </form>
        </>
      )}

      <div
        style={{
          marginTop: 32,
          marginBottom: 12,
          fontSize: 18,
          fontWeight: 'bold',
          color: '#908E96',
        }}
      >
        Your previous workouts
      </div>

      {loading && <p>Loading...</p>}

      {!loading &&
        workouts.length > 0 &&
        workouts
          .sort((a, b) => b.end_time.valueOf() - a.end_time.valueOf())
          .map((workout) => <LoggedWorkout key={workout.id} data={workout} />)}

      {!loading && workouts.length === 0 && <p> No workouts found</p>}
    </main>
  );
}
