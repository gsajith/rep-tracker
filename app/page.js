'use client';
import { useSession, useUser } from '@clerk/nextjs';
import styles from './page.module.css';
import { createClerkSupabaseClient } from '@/utils/supabase/clerk-client';
import { useEffect, useRef, useState } from 'react';
import {
  createExercise,
  createWorkout,
  deleteExercise,
  deleteWorkout,
  loadWorkoutWithExercises,
} from '@/utils/supabase/database';
import LoggedWorkout from '@/components/loggedWorkout';
import Workout from '@/components/workout';
import { parseISOString } from '@/utils/utils';
import { useStickyState } from '@/hooks/useStickyState';
import Modal from '@/components/modal';
import { LetsIconsTrash } from '@/components/SVGIcons/LetsIconsTrash';
import { LetsIconsCopy } from '@/components/SVGIcons/LetsIconsCopy';

const DEBUG = process.env.NODE_ENV === 'development' && false;

// TODO: Long press workout to copy it over?
export default function Home() {
  const [workouts, setWorkouts] = useState([]);

  // Tracks whether workout has been started or not
  const [inWorkout, setInWorkout] = useStickyState(false, 'inWorkout');

  // Tracks in storage the timestamp when current workout was started
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(
    null,
    'workoutStartTime'
  );

  // Tracks in storage exercises have been added to this workout
  const [exercises, setExercises] = useStickyState([], 'exercises');

  const [modalShown, setModalShown] = useState(false);

  const [longPressedWorkout, setLongPressedWorkout] = useState(null);

  const [storedWorkouts, setStoredWorkouts] = useStickyState(
    [],
    'storedWorkouts'
  );
  const [loading, setLoading] = useState(true);
  const [exerciseNames, setExerciseNames] = useState(
    new Set(['bicep curl', 'squats', 'deadlift'])
  );
  const latestExercises = useRef({});

  // The `useUser()` hook will be used to ensure that Clerk has loaded data about the logged in user
  const { user } = useUser();
  // The `useSession()` hook will be used to get the Clerk `session` object
  const { session } = useSession();

  let client = useRef(null);

  useEffect(() => {
    if (session) {
      client.current = createClerkSupabaseClient(session);
    }
  }, [session]);

  useEffect(() => {
    if (!user || !client.current) return;

    async function loadWorkouts() {
      setLoading(true);
      const { data, error } = await loadWorkoutWithExercises(
        client.current,
        addExerciseName
      );
      if (!error) {
        setWorkouts(data);
      }
      setLoading(false);
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

  const saveWorkoutHandler = async () => {
    // TODO: Add loading for this and dont reload page
    let hasError = false;
    if (window.navigator.onLine) {
      console.log('Saving...');
      const errors = [];
      const exerciseIds = [];
      for (let i = 0; i < exercises.length; i++) {
        const { data: exercise, error: exerciseError } = await createExercise(
          client.current,
          exercises[i].name,
          exercises[i].reps.map((rep) => parseInt(rep) || 0),
          exercises[i].weights.map((weight) => parseFloat(weight) || 0),
          exercises[i].notes
        );
        if (!exerciseError) {
          exerciseIds.push(exercise[0].id);
        } else {
          hasError = true;
          errors.push(exerciseError);
          console.error(exerciseError);
        }
      }
      if (!hasError) {
        const { data: _w, error: workoutError } = await createWorkout(
          client.current,
          new Date(workoutStartTime).toISOString(),
          new Date().toISOString(),
          exerciseIds,
          ''
        );
        if (!workoutError) {
          // TODO: Handle error fallback
        } else {
          hasError = true;
          errors.push(workoutError);
          console.error(workoutError);
        }

        // TODO: Only do this if no errors
        setInWorkout(false);
        location.reload();
      }
    }
    if (!window.navigator.onLine || hasError) {
      // TODO: Handle error fallback
    }
  };

  const deleteWorkoutHandler = async (workout) => {
    // TODO: add loading for this and dont reload page
    let hasError = false;
    if (window.navigator.onLine) {
      console.log('Deleting...', workout);
      const errors = [];
      const exercises = workout.exercises;
      for (let i = 0; i < exercises.length; i++) {
        const { data: _e, error: exerciseError } = await deleteExercise(
          client.current,
          exercises[i].id
        );
        if (exerciseError) {
          hasError = true;
          errors.push(exerciseError);
          console.error(exerciseError);
        }
      }
      if (!hasError) {
        const { data: _w, error: workoutError } = await deleteWorkout(
          client.current,
          workout.id
        );
        if (!workoutError) {
          // TODO: Handle error fallback
        } else {
          hasError = true;
          errors.push(workoutError);
          console.error(workoutError);
        }

        // TODO: Only do this if no errors
        location.reload();
      }
    }
    if (!window.navigator.onLine || hasError) {
      // TODO: Handle error fallback
    }
  };

  return (
    <main className={styles.main}>
      {modalShown && (
        <Modal setShown={setModalShown}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: 24,
            }}
          >
            <div style={{ textAlign: 'left' }}>What would you like to do?</div>
            <button
              className={styles.workoutButton}
              onClick={() => {
                setInWorkout(false);
                setInWorkout(true);
                setWorkoutStartTime(Date.now());
                setExercises(
                  longPressedWorkout.exercises.map((exercise) => ({
                    ...exercise,
                    notes: '',
                    expanded: true,
                  }))
                );
                setModalShown(false);
              }}
            >
              <LetsIconsCopy />
              Copy workout
            </button>
            <button
              className={`${styles.workoutButton} ${styles.delete}`}
              onClick={() => {
                deleteWorkoutHandler(longPressedWorkout);
              }}
            >
              <LetsIconsTrash />
              Delete workout
            </button>
          </div>
        </Modal>
      )}
      <Workout
        inWorkout={inWorkout}
        setInWorkout={setInWorkout}
        exercises={exercises}
        setExercises={setExercises}
        workoutStartTime={workoutStartTime}
        setWorkoutStartTime={setWorkoutStartTime}
        exerciseNames={Array.from(exerciseNames).map((exerciseName, index) => ({
          id: index,
          name: exerciseName,
        }))}
        latestExercises={latestExercises.current}
        saveWorkout={saveWorkoutHandler}
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

      <div className={styles.previousWorkoutsHeader}>
        Your previous workouts
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            className="shimmerBG"
            style={{
              maxWidth: 368,
              width: '100%',
              height: 150,
              borderRadius: 16,
            }}
          ></div>

          <div
            className="shimmerBG"
            style={{
              maxWidth: 368,
              width: '100%',
              height: 150,
              borderRadius: 16,
            }}
          ></div>

          <div
            className="shimmerBG"
            style={{
              maxWidth: 368,
              width: '100%',
              height: 150,
              borderRadius: 16,
            }}
          ></div>
        </div>
      )}

      {!loading &&
        workouts.length > 0 &&
        workouts
          .sort((a, b) => b.end_time.valueOf() - a.end_time.valueOf())
          .map((workout) => (
            <LoggedWorkout
              key={workout.id}
              data={workout}
              onLongPress={() => {
                setLongPressedWorkout(workout);
                setModalShown(true);
              }}
            />
          ))}

      {!loading && workouts.length === 0 && <p> No workouts found</p>}
    </main>
  );
}
