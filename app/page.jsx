'use client';
import styles from './page.module.css';
import { useContext, useEffect, useMemo, useState } from 'react';
import {
  removeWorkout,
  renameRoutine,
  renameWorkout,
  saveWorkout,
} from '@/utils/api';
import LoggedWorkout from '@/components/loggedWorkout';
import Workout from '@/components/workout';
import {
  calculateDaysAgo,
  capitalize,
  formatDuration,
  readableDate,
  sortWorkoutsByEndTime,
  withLatestNumbers,
} from '@/utils/utils';
import { isStoredExerciseList } from '@/utils/validate';
import { useStickyState } from '@/hooks/useStickyState';
import Modal from '@/components/modal';
import { LetsIconsTrash } from '@/components/SVGIcons/LetsIconsTrash';
import { LetsIconsCopy } from '@/components/SVGIcons/LetsIconsCopy';
import { LetsIconsMore } from '@/components/SVGIcons/LetsIconsMore';
import { LetsIconsDoneRound } from '@/components/SVGIcons/LetsIconsDoneRound';
import classNames from 'classnames';
import { WorkoutsContext } from '@/context/workoutsProvider';
import { useLoadDelay } from '@/hooks/useLoadDelay';
import Tour from '@/components/tour';

export default function Home() {
  const {
    workouts,
    loading,
    loading2,
    loadError,
    exerciseNames,
    latestExercises,
    routines,
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
  // a wrong-shaped value is inert; this one holds objects that <Workout /> maps
  // over once `inWorkout` is true, so a bad value crashes the page and stays in
  // storage across reloads.
  const [exercises, setExercises] = useStickyState(
    [],
    'exercises',
    isStoredExerciseList
  );

  const [storedWorkouts, setStoredWorkouts] = useStickyState(
    [],
    'storedWorkouts'
  );

  // The name the in-progress workout will be saved under, which is what groups
  // it into a routine. A plain string or null, so no validator.
  const [workoutName, setWorkoutName] = useStickyState(null, 'workoutName');

  // The name this session inherited from the routine it was started from, if
  // any. A workout joins a routine by being started from its chip; typing a
  // name that already exists is how you would join one by accident, so that is
  // refused. Keeping the inherited name here is what tells the two apart.
  const [inheritedRoutineName, setInheritedRoutineName] = useStickyState(
    null,
    'inheritedRoutineName'
  );

  // Two-act first run. A plain string, so no validator: see components/tour.jsx
  // for the states and why the payoff cannot be shown on day one.
  const [tourStatus, setTourStatus] = useStickyState(null, 'tourStatus');

  const [modalShown, setModalShown] = useState(false);

  const [allWorkoutsShown, setAllWorkoutsShown] = useState(false);

  const [longPressedWorkout, setLongPressedWorkout] = useState(null);

  // Deleting a saved workout used to happen on the first tap, in a modal
  // opened by an accidental long press, with no undo and no way out but the
  // unlabelled shim. It now needs a second, differently worded tap.
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Finishing a workout produced no message of any kind: the card simply
  // disappeared. Every other thing this page can say is an error.
  const [saveSummary, setSaveSummary] = useState(null);

  // Renaming a past workout is how a routine gets created out of history that
  // was logged before names existed. Without it the first "Leg day" could only
  // come from finishing a workout, and everything already logged would be
  // ungroupable forever.
  const [renameValue, setRenameValue] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameError, setRenameError] = useState(null);

  // Renaming a routine has to move every workout under that name at once.
  // Doing them one at a time would leave the older ones behind as a second
  // routine, which is the opposite of what renaming means here.
  const [routineBeingRenamed, setRoutineBeingRenamed] = useState(null);
  const [routineRenameValue, setRoutineRenameValue] = useState('');

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

  // Every routine name already in use, lowercased, so "leg day" cannot become a
  // second "Leg day" the way "pushups" once became a second "Pushups".
  const takenRoutineNames = useMemo(
    () => new Set(routines.map((routine) => routine.name.toLowerCase())),
    [routines]
  );

  // A typed name collides when it is already a routine and is not the name the
  // thing being renamed already carries.
  const nameCollides = (typed, ownName) => {
    const trimmed = (typed ?? '').trim().toLowerCase();
    if (!trimmed) return false;
    if (trimmed === (ownName ?? '').trim().toLowerCase()) return false;
    return takenRoutineNames.has(trimmed);
  };

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
    if (!inWorkout) {
      setSaveError(null);
      // Trashing a workout drops its name with it, so the next blank session
      // does not inherit the routine of the one that was thrown away.
      setWorkoutName(null);
      setInheritedRoutineName(null);
    }
  }, [inWorkout, setWorkoutName, setInheritedRoutineName]);

  // Decide once, after the first load actually resolves. An account with
  // history never sees the tour; replaying it is a settings control rather
  // than something the app guesses at. Held off while loading and after a
  // failed load, where an empty list means "unknown" rather than "new here".
  useEffect(() => {
    if (loading || loadError || tourStatus !== null) return;
    setTourStatus(workouts.length === 0 ? 'act1' : 'done');
  }, [loading, loadError, tourStatus, workouts.length, setTourStatus]);

  // Clears itself rather than sitting there for the rest of the session.
  useEffect(() => {
    if (!saveSummary) return undefined;
    const timer = setTimeout(() => setSaveSummary(null), 8000);
    return () => clearTimeout(timer);
  }, [saveSummary]);

  // Shared by the copy-workout menu and the routine buttons: both start a new
  // session from an old one's exercises, and the only difference is whether a
  // name comes along.
  const startFromWorkout = (workout, name) => {
    const inherited = name ?? workout.name ?? null;
    setInWorkout(false);
    setInWorkout(true);
    setWorkoutStartTime(Date.now());
    setWorkoutName(inherited);
    setInheritedRoutineName(inherited);
    // The exercise list comes from this workout, but the numbers come from
    // whenever each exercise was last done, which is often a later session
    // under a different name. Copying this workout's numbers wholesale handed
    // back weights the user had already moved on from.
    setExercises(() => {
      const copy = structuredClone(workout);
      return withLatestNumbers(copy, latestExercises.current).map(
        (exercise) => ({
          ...exercise,
          repsDrag: Array(exercise.reps.length).fill(0),
          weightsDrag: Array(exercise.weights.length).fill(0),
          notes: '',
          expanded: true,
        })
      );
    });
  };

  const renameWorkoutHandler = async (workout) => {
    if (renaming) return;
    setRenameError(null);

    if (!window.navigator.onLine) {
      setRenameError('You are offline. Try again once you are back online.');
      return;
    }

    setRenaming(true);
    try {
      const { error } = await renameWorkout(workout.id, renameValue);
      if (error) {
        console.error(error);
        setRenameError('Could not save that name.');
        return;
      }
      setModalShown(false);
      setStaleAfter((await refresh()) ? 'rename' : null);
    } catch (thrown) {
      console.error(thrown);
      setRenameError('Could not save that name.');
    } finally {
      setRenaming(false);
    }
  };

  const renameRoutineHandler = async () => {
    if (renaming || !routineBeingRenamed) return;
    setRenameError(null);

    if (!window.navigator.onLine) {
      setRenameError('You are offline. Try again once you are back online.');
      return;
    }

    setRenaming(true);
    try {
      const { error } = await renameRoutine(
        routineBeingRenamed.name,
        routineRenameValue
      );
      if (error) {
        console.error(error);
        setRenameError('Could not rename that routine.');
        return;
      }
      setRoutineBeingRenamed(null);
      setStaleAfter((await refresh()) ? 'rename' : null);
    } catch (thrown) {
      console.error(thrown);
      setRenameError('Could not rename that routine.');
    } finally {
      setRenaming(false);
    }
  };

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
        name: workoutName,
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
      setSaveSummary({
        name: workoutName,
        exercises: exercises.length,
        duration: formatDuration(workoutStartTime, Date.now()),
      });

      setWorkoutName(null);
      setInheritedRoutineName(null);
      setInWorkout(false);

      // The first save graduates act 1 into act 2, which waits for the next
      // workout to show what last time's numbers look like. The second save
      // retires the tour whether or not that step ever found its anchor, so a
      // user who never re-adds an old exercise is not followed around.
      if (tourStatus === 'act1' || tourStatus === 'act1-taught') {
        setTourStatus('act2');
      } else if (tourStatus === 'act2') {
        setTourStatus('done');
      }

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
    listNotice =
      'Your workout was saved, but this list could not be refreshed.';
  } else if (staleAfter === 'delete') {
    listNotice =
      'That workout was deleted, but this list could not be refreshed.';
  } else if (staleAfter === 'rename') {
    listNotice = 'That name was saved, but this list could not be refreshed.';
  } else if (loadError && workouts.length > 0) {
    listNotice = 'Some of your workouts could not be loaded.';
  } else if (loadError) {
    listNotice = 'Could not load your workouts.';
  }

  return (
    shown && (
      <main className={styles.main}>
        <h1 className={styles.srOnly}>Your workouts</h1>
        {modalShown && longPressedWorkout && (
          <Modal
            label={readableDate(longPressedWorkout.start_time)}
            setShown={(shown) => {
              setModalShown(shown);
              if (!shown) setConfirmDelete(false);
            }}
          >
            <div className={styles.copyWorkoutContentWrapper}>
              <button
                className={styles.workoutButton}
                onClick={() => {
                  startFromWorkout(longPressedWorkout);
                  setModalShown(false);
                }}
              >
                <LetsIconsCopy />
                Copy workout
              </button>
              <div className={styles.renameRow}>
                <label className={styles.renameLabel} htmlFor="workout-name">
                  Name this routine
                </label>
                <input
                  id="workout-name"
                  className={styles.renameInput}
                  value={renameValue}
                  placeholder="Leg day"
                  maxLength={200}
                  aria-invalid={nameCollides(
                    renameValue,
                    longPressedWorkout.name
                  )}
                  onChange={(event) => setRenameValue(event.target.value)}
                />
                {nameCollides(renameValue, longPressedWorkout.name) && (
                  <div className={styles.nameTaken} role="alert">
                    That name is taken.
                  </div>
                )}
                {renameError && (
                  <div className={styles.modalError} role="alert">
                    {renameError}
                  </div>
                )}
                <button
                  className={styles.renameButton}
                  disabled={
                    renaming ||
                    nameCollides(renameValue, longPressedWorkout.name)
                  }
                  aria-busy={renaming}
                  onClick={() => renameWorkoutHandler(longPressedWorkout)}
                >
                  {renaming ? 'Saving...' : 'Save name'}
                </button>
              </div>
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
                  if (!confirmDelete) {
                    setConfirmDelete(true);
                    return;
                  }
                  deleteWorkoutHandler(longPressedWorkout);
                }}
              >
                <LetsIconsTrash />
                {deleting
                  ? 'Deleting...'
                  : confirmDelete
                    ? 'Tap again to delete'
                    : 'Delete workout'}
              </button>
              {confirmDelete && !deleting && (
                <button
                  className={styles.keepButton}
                  onClick={() => setConfirmDelete(false)}
                >
                  Keep it
                </button>
              )}
            </div>
          </Modal>
        )}
        <Workout
          workoutName={workoutName}
          setWorkoutName={setWorkoutName}
          nameCollides={(typed) => nameCollides(typed, inheritedRoutineName)}
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

        {saveSummary && (
          <div className={styles.saveSuccess}>
            <LetsIconsDoneRound className={styles.saveSuccessIcon} />
            <span className={styles.saveSuccessText}>
              {saveSummary.name
                ? `${saveSummary.name} saved. `
                : 'Workout saved. '}
              {saveSummary.exercises}{' '}
              {saveSummary.exercises === 1 ? 'exercise' : 'exercises'}
              {saveSummary.duration ? `, ${saveSummary.duration}` : ''}.
            </span>
            <button
              className={styles.dismissButton}
              onClick={() => setSaveSummary(null)}
            >
              Dismiss
            </button>
          </div>
        )}

        {routineBeingRenamed && (
          <Modal
            setShown={() => setRoutineBeingRenamed(null)}
            label="About this routine"
          >
            <div className={styles.renameRow}>
              {/* What starting this routine would give you: the exercises from
                  its most recent session, which is what the chip copies. */}
              {/* Guarded the way loggedWorkout.js guards the same field: a
                  workout with no exercises would otherwise throw inside a
                  dialog, where an error boundary is the only thing left. */}
              <ul className={styles.routineExercises}>
                {(routineBeingRenamed.workout.exercises ?? []).map(
                  (exercise) => (
                    <li key={exercise.id}>{capitalize(exercise.name)}</li>
                  )
                )}
              </ul>
              {/* There is no separate list to edit: a routine is whatever its
                  newest session contained, so the way to change it is to do it
                  differently. */}
              <p className={styles.routineHint}>
                These come from the last time you did it. To change them, start
                the routine, edit the exercises, and save.
              </p>
              <label className={styles.renameLabel} htmlFor="routine-name">
                Routine name
              </label>
              <input
                id="routine-name"
                className={styles.renameInput}
                value={routineRenameValue}
                placeholder="Leg day"
                maxLength={200}
                aria-invalid={nameCollides(
                  routineRenameValue,
                  routineBeingRenamed.name
                )}
                onChange={(event) => setRoutineRenameValue(event.target.value)}
              />
              {nameCollides(routineRenameValue, routineBeingRenamed.name) && (
                <div className={styles.nameTaken} role="alert">
                  That name is taken.
                </div>
              )}
              {renameError && (
                <div className={styles.modalError} role="alert">
                  {renameError}
                </div>
              )}
              <button
                className={styles.renameButton}
                disabled={
                  renaming ||
                  nameCollides(routineRenameValue, routineBeingRenamed.name)
                }
                aria-busy={renaming}
                onClick={renameRoutineHandler}
              >
                {renaming ? 'Renaming...' : 'Rename'}
              </button>
              <button
                className={styles.keepButton}
                onClick={() => setRoutineBeingRenamed(null)}
              >
                Cancel
              </button>
            </div>
          </Modal>
        )}

        {!inWorkout && routines.length > 0 && (
          <section className={styles.routines} aria-label="Your routines">
            <h2 className={styles.routinesHeading}>Start a routine</h2>
            <div className={styles.routineRow}>
              {routines.map((routine) => (
                <div key={routine.name} className={styles.routineChip}>
                  <button
                    type="button"
                    className={styles.routineStart}
                    onClick={() =>
                      startFromWorkout(routine.workout, routine.name)
                    }
                  >
                    <span className={styles.routineName}>{routine.name}</span>
                    <span className={styles.routineWhen}>
                      {calculateDaysAgo(routine.lastDone)}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles.routineMenuButton}
                    aria-label={`Rename ${routine.name}`}
                    onClick={() => {
                      setRenameError(null);
                      setRoutineRenameValue(routine.name);
                      setRoutineBeingRenamed(routine);
                    }}
                  >
                    <LetsIconsMore />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

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
            .map((workout, index) => (
              <LoggedWorkout
                key={workout.id}
                id={index === 0 ? 'tour-workout' : undefined}
                menuLabel={`Options for the workout on ${readableDate(
                  workout.start_time
                )}`}
                data={workout}
                onLongPress={() => {
                  setDeleteError(null);
                  setConfirmDelete(false);
                  setRenameError(null);
                  setRenameValue(workout.name ?? '');
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

        {/* The start card directly above is already the call to action, so
            this says what the list is for instead of repeating the button. */}
        {!loading && !listNotice && workouts.length === 0 && (
          <div className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Nothing logged yet</h2>
            <p className={styles.emptyBody}>
              Finish a workout and it lands here. Do that exercise again next
              week and Rep Tracker fills in what you lifted last time, so the
              only thing left to decide is whether to add a rep.
            </p>
          </div>
        )}
        {!allWorkoutsShown && !loading && !loading2 && workouts.length > 0 && (
          <button
            className={styles.showAllWorkoutsButton}
            onClick={() => setAllWorkoutsShown(true)}
          >
            Show all your workouts
          </button>
        )}
        <Tour
          status={tourStatus}
          setStatus={setTourStatus}
          inWorkout={inWorkout}
          exerciseCount={exercises.length}
        />
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
