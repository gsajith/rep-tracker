'use client';
import styles from './page.module.css';
import { useContext, useEffect, useState } from 'react';
import { removeWorkout, saveWorkout } from '@/utils/api';
import LoggedWorkout from '@/components/loggedWorkout';
import Workout from '@/components/workout';
import { readableDate } from '@/utils/utils';
import { useStickyState } from '@/hooks/useStickyState';
import Modal from '@/components/modal';
import { LetsIconsTrash } from '@/components/SVGIcons/LetsIconsTrash';
import { LetsIconsCopy } from '@/components/SVGIcons/LetsIconsCopy';
import classNames from 'classnames';
import { WorkoutsContext } from '@/context/workoutsProvider';
import { useLoadDelay } from '@/hooks/useLoadDelay';

export default function Home() {
  const {
    workouts,
    loading,
    loading2,
    exerciseNames,
    latestExercises,
    refresh,
  } = useContext(WorkoutsContext);

  const shown = useLoadDelay();

  // Tracks whether workout has been started or not
  const [inWorkout, setInWorkout] = useStickyState(false, 'inWorkout');

  // Tracks in storage the timestamp when current workout was started
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(
    null,
    'workoutStartTime'
  );

  // Tracks in storage exercises have been added to this workout
  const [exercises, setExercises] = useStickyState([], 'exercises');

  const [storedWorkouts, setStoredWorkouts] = useStickyState(
    [],
    'storedWorkouts'
  );

  const [modalShown, setModalShown] = useState(false);

  const [allWorkoutsShown, setAllWorkoutsShown] = useState(false);

  const [longPressedWorkout, setLongPressedWorkout] = useState(null);

  // Separate flags so an in-flight delete cannot disable the save button.
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const saveWorkoutHandler = async () => {
    if (saving) return;
    if (!window.navigator.onLine) {
      // TODO: Handle error fallback (#2)
      return;
    }

    setSaving(true);
    // finally, not a trailing call: an invalid workoutStartTime makes
    // toISOString throw, and without this the button stays disabled for the
    // rest of the session now that the page no longer reloads.
    try {
      // The workout and all of its exercises are created in one transaction
      // now, so a failure can no longer leave orphaned exercise rows behind.
      const { error } = await saveWorkout({
        startTime: new Date(workoutStartTime).toISOString(),
        endTime: new Date().toISOString(),
        exercises: exercises.map((exercise) => ({
          name: exercise.name,
          reps: exercise.reps.map((rep) => parseInt(rep) || 0),
          weights: exercise.weights.map((weight) => parseFloat(weight) || 0),
          notes: exercise.notes,
        })),
        notes: '',
      });

      if (error) {
        // TODO: Handle error fallback (#2)
        console.error(error);
        return;
      }

      // Clearing `inWorkout` runs the reset effect in <Workout />, which empties
      // the exercises and the start time. Nothing races that effect now the
      // reload is gone, so the cleared state is guaranteed to reach localStorage.
      setInWorkout(false);
    } finally {
      setSaving(false);
    }

    // Outside the guard: the workout is already saved, and refresh has its own
    // loading indicator. Keeping the button disabled through the refetch would
    // only delay the modal closing.
    await refresh();
  };

  const deleteWorkoutHandler = async (workout) => {
    if (deleting) return;
    if (!window.navigator.onLine) {
      // TODO: Handle error fallback (#2)
      return;
    }

    setDeleting(true);
    try {
      // Exercises belonging to the workout are removed in the same transaction.
      const { error } = await removeWorkout(workout.id);

      if (error) {
        // TODO: Handle error fallback (#2)
        console.error(error);
        return;
      }

      setModalShown(false);
      setLongPressedWorkout(null);
    } finally {
      setDeleting(false);
    }

    // Cleared before the refetch, so long-pressing another workout during it
    // does not open a modal already showing "Deleting...".
    await refresh();
  };

  return (
    shown && (
      <main className={styles.main}>
        {modalShown && longPressedWorkout && (
          <Modal setShown={setModalShown}>
            <div className={styles.copyWorkoutContentWrapper}>
              <div style={{ textAlign: 'left' }}>
                What would you like to do for your workout on{' '}
                <span style={{ fontWeight: 'bold', color: 'var(--accent)' }}>
                  {readableDate(longPressedWorkout.end_time)}
                </span>
                ?
              </div>
              <button
                className={styles.workoutButton}
                onClick={() => {
                  setInWorkout(false);
                  setInWorkout(true);
                  setWorkoutStartTime(Date.now());
                  setExercises(() => {
                    const newWorkout = structuredClone(longPressedWorkout);
                    newWorkout.exercises = newWorkout.exercises.map(
                      (exercise) => ({
                        ...exercise,
                        repsDrag: Array(exercise.reps.length).fill(0),
                        weightsDrag: Array(exercise.weights.length).fill(0),
                        notes: '',
                        expanded: true,
                      })
                    );

                    return newWorkout.exercises;
                  });
                  setModalShown(false);
                }}
              >
                <LetsIconsCopy />
                Copy workout
              </button>
              <button
                className={`${styles.workoutButton} ${styles.delete}`}
                disabled={deleting}
                aria-busy={deleting}
                onClick={() => {
                  deleteWorkoutHandler(longPressedWorkout);
                }}
              >
                <LetsIconsTrash />
                {deleting ? 'Deleting...' : 'Delete workout'}
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
          exerciseNames={Array.from(exerciseNames).map(
            (exerciseName, index) => ({
              id: index,
              name: exerciseName,
            })
          )}
          latestExercises={latestExercises.current}
          saveWorkout={saveWorkoutHandler}
          saving={saving}
        />

        {(loading ||
          loading2 ||
          (workouts !== null && workouts.length > 0)) && (
          <div className={styles.previousWorkoutsHeader}>
            Your previous workouts
          </div>
        )}

        {loading && (
          <div className={styles.loadingContainer}>
            <div className={classNames('shimmerBG', styles.shimmer)}></div>
            <div className={classNames('shimmerBG', styles.shimmer)}></div>
            <div className={classNames('shimmerBG', styles.shimmer)}></div>
            <div className={classNames('shimmerBG', styles.shimmer)}></div>
          </div>
        )}

        {!loading &&
          workouts.length > 0 &&
          workouts
            .sort((a, b) => b.end_time.valueOf() - a.end_time.valueOf())
            .slice(0, allWorkoutsShown ? Number.MAX_SAFE_INTEGER : 10)
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

        {loading2 && (
          <div className={styles.loadingContainer}>
            <div className={classNames('shimmerBG', styles.shimmer)}></div>
          </div>
        )}

        {!loading && workouts.length === 0 && (
          <p style={{ marginTop: 24 }}>
            No previous workouts found, why not start one?
          </p>
        )}
        {!allWorkoutsShown && !loading && !loading2 && workouts.length > 0 && (
          <button
            className={styles.showAllWorkoutsButton}
            onClick={() => setAllWorkoutsShown(true)}
          >
            Show all your workouts
          </button>
        )}
        <div
          style={{
            height: loading || loading2 || allWorkoutsShown ? 85 : 115,
            width: 1,
          }}
        />
      </main>
    )
  );
}
