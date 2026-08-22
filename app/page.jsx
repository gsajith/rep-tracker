'use client';
import styles from './page.module.css';
import { useContext, useEffect, useMemo, useState } from 'react';
import { removeWorkout, saveWorkout } from '@/utils/api';
import LoggedWorkout from '@/components/loggedWorkout';
import Workout from '@/components/workout';
import { readableDate, sortWorkoutsByEndTime } from '@/utils/utils';
import { isStoredExerciseList } from '@/utils/validate';
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
    loadError,
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
  // The only sticky key with a validator. The other five hold primitives, where
  // a wrong-shaped value is inert; this one holds objects that the render maps
  // over, so a bad value crashes the page and stays in storage across reloads.
  const [exercises, setExercises] = useStickyState(
    [],
    'exercises',
    isStoredExerciseList
  );

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

  // One message per write, shown in the modal that started it.
  const [saveError, setSaveError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);

  // Which write left this list stale, or null. Carries the verb rather than a
  // bare boolean so the banner can name what actually happened instead of
  // saying "that change" and making the user guess.
  const [staleAfter, setStaleAfter] = useState(null);

  // Sorted copy, never the context array itself. See the note on the helper.
  //
  // Memoised on `workouts` alone: this page also re-renders on saving,
  // deleting, saveError, deleteError and staleAfter, and re-sorting on each of
  // those is pure waste. The stable identity is not currently doing any work,
  // since nothing downstream is memoised on it.
  const sortedWorkouts = useMemo(
    () => sortWorkoutsByEndTime(workouts),
    [workouts]
  );

  // Drop a stale message once the workout is saved or trashed, so reopening the
  // confirm modal later does not show the error from a previous attempt.
  useEffect(() => {
    if (!inWorkout) setSaveError(null);
  }, [inWorkout]);

  const saveWorkoutHandler = async () => {
    if (saving) return;
    setSaveError(null);

    if (!window.navigator.onLine) {
      setSaveError(
        'You are offline. This workout is still on this device, so nothing is lost. Try again once you are back online.'
      );
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
        console.error(error);
        setSaveError(
          'Could not save this workout. It is still here, so you can try again.'
        );
        return;
      }

      // Clearing `inWorkout` runs the reset effect in <Workout />, which empties
      // the exercises and the start time. Nothing races that effect now the
      // reload is gone, so the cleared state is guaranteed to reach localStorage.
      setInWorkout(false);

      // Refresh inside the guard, unlike the delete path below. That effect is
      // passive, so it closes the confirm modal a commit later than this one.
      // Releasing `saving` first would render the modal once more with the
      // button enabled while the exercises are still populated, and a tap
      // landing in that gap would post the same workout twice.
      //
      // The workout is already saved by this point, so a failed refetch means a
      // stale list rather than a lost workout. The banner below says exactly
      // that, which is the difference between a confusing screen and one that
      // looks like the workout vanished.
      setStaleAfter((await refresh()) ? 'save' : null);
    } catch (thrown) {
      // Anything that throws rather than returning an error, chiefly
      // toISOString on a corrupt workoutStartTime. Without this the promise
      // rejects unhandled and the user is back to a modal that does nothing.
      // Safe to blame the save: refresh() no longer rejects, so every throw
      // that reaches here happened before the workout was cleared.
      console.error(thrown);
      setSaveError(
        'Could not save this workout. It is still here, so you can try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteWorkoutHandler = async (workout) => {
    if (deleting) return;
    setDeleteError(null);

    if (!window.navigator.onLine) {
      setDeleteError('You are offline. Try again once you are back online.');
      return;
    }

    setDeleting(true);
    let deleted = false;
    try {
      // Exercises belonging to the workout are removed in the same transaction.
      const { error, status } = await removeWorkout(workout.id);

      // A 404 means the row is already gone, most likely deleted from another
      // device. That is indistinguishable from success here, and the message
      // below would be false and would stay false however many times the user
      // retried, since the row is never coming back.
      if (error && status !== 404) {
        console.error(error);
        setDeleteError(
          'Could not delete this workout. It is still in your list, so you can try again.'
        );
        return;
      }

      if (status === 404) {
        // Not a failure, but worth a trace: it means this device was looking at
        // a workout something else had already removed. console.error rather
        // than warn because error is the only level that survives the
        // production build.
        console.error('Delete returned 404, workout already gone:', workout.id);
      }

      setModalShown(false);
      setLongPressedWorkout(null);
      deleted = true;
    } catch (thrown) {
      console.error(thrown);
      setDeleteError(
        'Could not delete this workout. It is still in your list, so you can try again.'
      );
    } finally {
      setDeleting(false);
    }

    // Safe outside the guard, unlike the save path: this handler closes its own
    // modal, so `modalShown` and `deleting` land in the same commit and the
    // button is gone before the flag is released. Clearing first also stops a
    // long-press during the refetch opening a modal that says "Deleting...".
    if (deleted) {
      setStaleAfter((await refresh()) ? 'delete' : null);
    }
  };

  // Only ever clears the flag. Setting it from the result would be wrong: a
  // retry that fails after a plain load failure would start claiming a change
  // went through when none had. The write paths set it, this only resolves it.
  const retryRefresh = async () => {
    if (loading2) return;
    const error = await refresh();
    if (!error) setStaleAfter(null);
  };

  // Four distinct situations, and saying the wrong one is the whole bug this
  // issue is about. Note the third: the mount path loads three workouts and
  // then backfills the rest, so a failure on the second call leaves a real,
  // partial list on screen. Telling someone their workouts could not be loaded
  // while three of them are visible is its own kind of lie.
  let listNotice = null;
  if (staleAfter === 'save') {
    listNotice = 'Your workout was saved, but this list could not be refreshed.';
  } else if (staleAfter === 'delete') {
    listNotice =
      'That workout was deleted, but this list could not be refreshed.';
  } else if (loadError && workouts.length > 0) {
    listNotice = 'Some of your workouts could not be loaded.';
  } else if (loadError) {
    listNotice = 'Could not load your workouts.';
  }

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
              {deleteError && (
                <div className={styles.modalError} role="alert">
                  {deleteError}
                </div>
              )}
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
          saveError={saveError}
          onOpenSaveConfirm={() => setSaveError(null)}
        />

        {/* The live region is mounted for the life of the page and only its
            text changes. Mounting the region together with its message is the
            case screen readers announce unreliably. */}
        <div role="status" aria-live="polite">
          {!loading && listNotice && (
            <div className={styles.listNotice}>
              <span>{listNotice}</span>
              <button
                className={styles.retryButton}
                onClick={retryRefresh}
                disabled={loading2}
                aria-busy={loading2}
              >
                {loading2 ? 'Retrying' : 'Retry'}
              </button>
            </div>
          )}
        </div>

        {/* No null guard on `workouts`: the provider initialises it to [] and
            only ever replaces it with an array. Three other lines here already
            dereference it unguarded, one of them before any JSX, so this was
            the odd one out rather than the last line of defence. */}
        {(loading || loading2 || workouts.length > 0) && (
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
          sortedWorkouts.length > 0 &&
          sortedWorkouts
            .slice(0, allWorkoutsShown ? Number.MAX_SAFE_INTEGER : 10)
            .map((workout) => (
              <LoggedWorkout
                key={workout.id}
                data={workout}
                onLongPress={() => {
                  setDeleteError(null);
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

        {!loading && !listNotice && workouts.length === 0 && (
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
