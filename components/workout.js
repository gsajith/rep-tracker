'use client';
import styles from './workout.module.css';
import { useEffect, useRef, useState } from 'react';
import {
  calculateDaysAgo,
  calculateWorkoutTimer,
  readableDate,
} from '@/utils/utils';
import ComboBox from './combobox';
import ExerciseToPreview from './exerciseToPreview';
import { LetsIconsExpandDown } from './SVGIcons/LetsIconsExpand';
import { LetsIconsClose } from './SVGIcons/LetsIconsClose';
import VariableInput from './variableInput';
import { LetsIconsTimeAtack } from './SVGIcons/LetsIconsTimeAtack';
import Modal from './modal';
import { LetsIconsDoneRound } from './SVGIcons/LetsIconsDoneRound';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { LetsIconsTrash } from './SVGIcons/LetsIconsTrash';

const getExerciseStyle = (isDragging, exerciseStyle, draggableStyle) => ({
  userSelect: 'none',
  ...exerciseStyle,
  ...draggableStyle,
});

// TODO: Add note to whole workout
export default function Workout({
  exerciseNames,
  latestExercises,
  saveWorkout,
  saving,
  saveError,
  onOpenSaveConfirm,
  inWorkout,
  setInWorkout,
  exercises,
  setExercises,
  workoutStartTime,
  setWorkoutStartTime,
}) {
  // State for the exercise selector combobox
  const [selectedItem, setSelectedItem] = useState();
  // State for the exercise selector combobox
  const [query, setQuery] = useState('');

  // Tracks which exercise is being previewed from combobox selection
  const [exerciseToPreview, setExerciseToPreview] = useState(null);
  // Tracks name of exercise selected via combobox
  const exerciseName = useRef(null);

  // Tracks in memory the minutes and seconds since workout was started
  const [workoutTimer, setWorkoutTimer] = useState(null);

  // Modal state
  const [modalShown, setModalShown] = useState(false);
  const [trashModalShown, setTrashModalShown] = useState(false);

  useEffect(() => {
    if (workoutStartTime) {
      setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      const timerInterval = setInterval(() => {
        setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [workoutStartTime]);

  useEffect(() => {
    if (!inWorkout) {
      setWorkoutStartTime(null);
      setExercises([]);
      setQuery('');
      setSelectedItem(undefined);
      setExerciseToPreview(null);
      exerciseName.current = null;
      setModalShown(false);
      setTrashModalShown(false);
    }
  }, [inWorkout]);

  const addExercise = (name, preview) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      const exists = newExercises.findIndex(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      );
      if (exists > -1) {
        newExercises.push(newExercises.splice(exists, 1)[0]);
        setExpanded(newExercises.length - 1, true);
      } else {
        newExercises.push(
          preview
            ? {
                name: preview.exercise.name,
                oldReps: preview.exercise.reps,
                oldWeights: preview.exercise.weights,
                oldNotes: preview.exercise.notes,
                time: preview.time,
                reps: [
                  preview.exercise.reps[preview.exercise.reps.length - 1] || 0,
                ],
                weights: [
                  preview.exercise.weights[
                    preview.exercise.weights.length - 1
                  ] || 0,
                ],
                repsDrag: [0],
                weightsDrag: [0],
                notes: '',
                expanded: true,
              }
            : {
                name: name,
                oldReps: null,
                oldWeights: null,
                oldNotes: null,
                reps: [0],
                weights: [0],
                repsDrag: [0],
                weightsDrag: [0],
                notes: '',
                expanded: true,
              }
        );
      }
      return newExercises;
    });
    setExerciseToPreview(null);
    exerciseName.current = null;
    setQuery('');
    setSelectedItem(null);
  };

  useEffect(() => {
    if (
      selectedItem !== null &&
      selectedItem !== undefined &&
      selectedItem.name.length > 0
    ) {
      setExerciseToPreview(latestExercises[selectedItem.name]);
      exerciseName.current = selectedItem.name;
    } else {
      setExerciseToPreview(null);
      exerciseName.current = null;
    }
  }, [selectedItem]);

  // What the Add button would add right now. `query` is non-empty only while
  // the list is open with text in it, which is exactly when Add is reachable,
  // so a typed name that was never picked from the dropdown can be committed.
  // The button used to stay disabled until an option was chosen, which
  // stranded every new user: a fresh account has nothing to choose from.
  const typedName = query.trim();
  const pendingName = typedName || exerciseName.current;
  // A typed name that exactly matches an existing exercise still gets its
  // history, so the sets pre-fill whether it was typed or picked.
  const pendingPreview = typedName
    ? latestExercises?.[typedName]
    : exerciseToPreview;

  const notAlreadyAdded = (name) => {
    const exists = exercises.findIndex(
      (e) => e.name.toLowerCase() === name.toLowerCase()
    );

    return exists === -1;
  };

  const setExpanded = (index, expanded) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      newExercises[index].expanded = expanded;
      return newExercises;
    });
  };

  const updateExerciseReps = (exerciseIndex, setIndex, value) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      newExercises[exerciseIndex].reps[setIndex] = value;
      return newExercises;
    });
  };

  const updateExerciseWeights = (exerciseIndex, setIndex, value) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      newExercises[exerciseIndex].weights[setIndex] = value;
      return newExercises;
    });
  };

  const normalizeWeightsDrag = (value) => {
    if (value <= 200) {
      return Math.floor(value / 40);
    } else {
      return Math.ceil((value - 200) / 40) * 5;
    }
  };

  const normalizeRepsDrag = (value) => {
    return Math.floor(value / 40);
  };

  const updateExerciseRepsDrag = (exerciseIndex, setIndex, value) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      newExercises[exerciseIndex].repsDrag[setIndex] = normalizeRepsDrag(value);
      return newExercises;
    });
  };

  const updateExerciseWeightsDrag = (exerciseIndex, setIndex, value) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      newExercises[exerciseIndex].weightsDrag[setIndex] =
        normalizeWeightsDrag(value);
      return newExercises;
    });
  };

  const addSet = (exerciseIndex, num) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      // A new set copies the one above it. With no set above, `reps[-1]` is
      // undefined and used to reach the input as NaN, which is now reachable
      // for real: removing the last set leaves the exercise standing with none.
      const repsLength = newExercises[exerciseIndex].reps.length;
      if (repsLength < num) {
        newExercises[exerciseIndex].reps.push(
          newExercises[exerciseIndex].reps[repsLength - 1] ?? 0
        );
        newExercises[exerciseIndex].repsDrag.push(0);
      }
      const weightsLength = newExercises[exerciseIndex].weights.length;
      if (weightsLength < num) {
        newExercises[exerciseIndex].weights.push(
          newExercises[exerciseIndex].weights[weightsLength - 1] ?? 0
        );
        newExercises[exerciseIndex].weightsDrag.push(0);
      }
      return newExercises;
    });
  };

  // Removing the last set leaves the exercise in place with no sets. This used
  // to splice the exercise out entirely, so the small grey x sitting a few
  // pixels from "Add a set" silently destroyed the exercise and its notes, with
  // no confirm and no undo. Removing an exercise is now its own named control.
  //
  // The drag arrays are spliced alongside the values they offset so the four
  // stay index-aligned; the old version left them longer than the sets, which
  // is the ragged shape utils/validate.js still has to tolerate on read.
  const deleteSet = (exerciseIndex, setIndex) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      const exercise = { ...newExercises[exerciseIndex] };
      for (const key of ['reps', 'weights', 'repsDrag', 'weightsDrag']) {
        if (Array.isArray(exercise[key]) && exercise[key].length > setIndex) {
          exercise[key] = exercise[key].filter((_, i) => i !== setIndex);
        }
      }
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
  };

  const removeExercise = (exerciseIndex) => {
    setExercises((oldExercises) =>
      oldExercises.filter((_, i) => i !== exerciseIndex)
    );
  };

  const updateExerciseNotes = (exerciseIndex, note) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      newExercises[exerciseIndex].notes = note;
      return newExercises;
    });
  };

  const onDragEnd = (result) => {
    // Dropped outside the list
    if (!result.destination) {
      return;
    }

    const newExercises = Array.from(exercises);
    const [removed] = newExercises.splice(result.source.index, 1);
    newExercises.splice(result.destination.index, 0, removed);
    setExercises(newExercises);
  };

  // A real <button> when it is the start card, a plain container once a
  // workout is running and it holds inputs and buttons of its own. It was a
  // div with onClick in both states, so the primary action of the app could
  // not be focused, activated by keyboard, or announced as anything but text.
  const Shell = inWorkout ? 'div' : 'button';

  return (
    <Shell
      className={
        inWorkout ? styles.container : `${styles.container} ${styles.startup}`
      }
      id={inWorkout ? undefined : 'tour-start'}
      type={inWorkout ? undefined : 'button'}
      onClick={
        inWorkout
          ? undefined
          : () => {
              setInWorkout(true);
              setWorkoutStartTime(Date.now());
            }
      }
    >
      {modalShown && (
        <Modal setShown={setModalShown} label="End this workout?">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: 24,
            }}
          >
            <div style={{ textAlign: 'left' }}>
              Are you sure you want to end this workout?
            </div>
            {saveError && (
              <div className={styles.modalError} role="alert">
                {saveError}
              </div>
            )}
            <button
              className={styles.endWorkoutConfirmButton}
              disabled={saving}
              aria-busy={saving}
              onClick={() => {
                saveWorkout();
              }}
            >
              <LetsIconsDoneRound /> {saving ? 'Saving...' : 'Save & end!'}
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setModalShown(false)}
              disabled={saving}
            >
              Keep going
            </button>
          </div>
        </Modal>
      )}
      {trashModalShown && (
        <Modal setShown={setTrashModalShown} label="Trash this workout?">
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-end',
              gap: 24,
            }}
          >
            <div style={{ textAlign: 'left' }}>
              Are you sure you want to trash this workout?
            </div>
            <button
              className={styles.deleteWorkout}
              onClick={() => {
                setInWorkout(false);
              }}
            >
              <LetsIconsTrash /> Trash it!
            </button>
            <button
              className={styles.cancelButton}
              onClick={() => setTrashModalShown(false)}
            >
              Keep it
            </button>
          </div>
        </Modal>
      )}
      {inWorkout ? (
        <div>
          {exercises.length > 0 && (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="droppable">
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={styles.exercisesContainer}
                  >
                    {exercises.map((exercise, index) => {
                      const numOldSets =
                        (exercise.time &&
                          exercise.expanded &&
                          Math.min(
                            exercise.oldReps?.length,
                            exercise.oldWeights?.length
                          )) ||
                        0;

                      const numSets = Math.min(
                        exercise.reps.length,
                        exercise.weights.length
                      );

                      return (
                        <Draggable
                          key={'exercise' + exercise.name + index}
                          draggableId={'exercise' + exercise.name + index}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              key={exercise.name}
                              className={styles.exerciseContainer}
                              style={getExerciseStyle(
                                snapshot.isDragging,
                                exercise.expanded
                                  ? {
                                      // Per-set estimate raised from 50 with the set
                                      // rows: the inputs are now 44px tall for
                                      // thumbs, and this number is what stops
                                      // the accordion clipping its own content.
                                      maxHeight:
                                        64 * numOldSets + 64 * numSets + 300,
                                    }
                                  : {},
                                provided.draggableProps.style
                              )}
                              tabIndex="-1"
                            >
                              <div
                                className={styles.exercise}
                                style={
                                  !(exercise.time && exercise.expanded)
                                    ? {
                                        borderRadius: 14,
                                        filter: snapshot.isDragging
                                          ? 'brightness(85%)'
                                          : 'revert-layer',
                                      }
                                    : {}
                                }
                              >
                                <div className={styles.exerciseHeader}>
                                  <button
                                    className={styles.exerciseName}
                                    onClick={() => {
                                      setExpanded(index, !exercise.expanded);
                                    }}
                                    aria-expanded={!!exercise.expanded}
                                  >
                                    <span style={{ textAlign: 'left' }}>
                                      {exercise.name}
                                      {!exercise.expanded && (
                                        <span style={{ fontWeight: '400' }}>
                                          •{numSets}{' '}
                                          {numSets === 1 ? 'set' : 'sets'}
                                        </span>
                                      )}
                                    </span>
                                    <LetsIconsExpandDown
                                      style={
                                        exercise.expanded
                                          ? { rotate: '-180deg' }
                                          : {}
                                      }
                                    />
                                  </button>
                                  <button
                                    className={styles.removeExerciseButton}
                                    onClick={() => removeExercise(index)}
                                    aria-label={`Remove ${exercise.name}`}
                                    title={`Remove ${exercise.name}`}
                                  >
                                    <LetsIconsTrash />
                                  </button>
                                </div>
                                {exercise.expanded && (
                                  <>
                                    <div className={styles.setInputs}>
                                      {[...Array(numSets)].map((_e, i) => (
                                        <div
                                          key={index + '-' + 'set' + i}
                                          className={styles.setInputWrapper}
                                          id={
                                            index === 0 && i === 0
                                              ? 'tour-set'
                                              : undefined
                                          }
                                        >
                                          <div
                                            className={styles.setInputContainer}
                                          >
                                            <VariableInput
                                              onTouchMove={(event) => {
                                                const rect =
                                                  event.target.getBoundingClientRect();
                                                const dragValue =
                                                  event.touches[0].clientX -
                                                  rect.left;
                                                updateExerciseRepsDrag(
                                                  index,
                                                  i,
                                                  dragValue
                                                );
                                              }}
                                              onTouchEnd={() => {
                                                updateExerciseReps(
                                                  index,
                                                  i,
                                                  parseInt(exercise.reps[i]) +
                                                    parseInt(
                                                      exercise.repsDrag[i]
                                                    )
                                                );
                                                updateExerciseRepsDrag(
                                                  index,
                                                  i,
                                                  0
                                                );
                                              }}
                                              type="number"
                                              className={styles.setInputNumber}
                                              value={Math.max(
                                                0,
                                                parseInt(exercise.reps[i]) +
                                                  parseInt(exercise.repsDrag[i])
                                              )}
                                              onChange={(e) => {
                                                updateExerciseReps(
                                                  index,
                                                  i,
                                                  e.target.value
                                                );
                                              }}
                                            />
                                            <span
                                              className={styles.setAdornment}
                                              style={{
                                                marginTop: 2,
                                                fontSize: 16,
                                              }}
                                            >
                                              ×
                                            </span>

                                            <VariableInput
                                              onTouchMove={(event) => {
                                                const rect =
                                                  event.target.getBoundingClientRect();
                                                const dragValue =
                                                  event.touches[0].clientX -
                                                  rect.left;
                                                updateExerciseWeightsDrag(
                                                  index,
                                                  i,
                                                  dragValue
                                                );
                                              }}
                                              onTouchEnd={() => {
                                                updateExerciseWeights(
                                                  index,
                                                  i,
                                                  parseInt(
                                                    exercise.weights[i]
                                                  ) +
                                                    parseInt(
                                                      exercise.weightsDrag[i]
                                                    )
                                                );
                                                updateExerciseWeightsDrag(
                                                  index,
                                                  i,
                                                  0
                                                );
                                              }}
                                              type="number"
                                              className={styles.setInputNumber}
                                              value={Math.max(
                                                0,
                                                parseInt(exercise.weights[i]) +
                                                  parseInt(
                                                    exercise.weightsDrag[i]
                                                  )
                                              )}
                                              onChange={(e) => {
                                                updateExerciseWeights(
                                                  index,
                                                  i,
                                                  e.target.value
                                                );
                                              }}
                                            />
                                            <span
                                              className={styles.setAdornment}
                                              style={{
                                                marginLeft: -3,
                                                marginTop: 5,
                                              }}
                                            >
                                              lbs
                                            </span>
                                          </div>

                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                            }}
                                          >
                                            <button
                                              className={styles.deleteSetButton}
                                              onClick={() =>
                                                deleteSet(index, i)
                                              }
                                            >
                                              <LetsIconsClose />
                                            </button>
                                            {i + 1 === numSets && (
                                              <button
                                                className={styles.addSetButton}
                                                onClick={() =>
                                                  addSet(index, numSets + 1)
                                                }
                                              >
                                                Add a set
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {/* "Add a set" normally rides on the last
                                          set's row, so an exercise with none
                                          would otherwise have no way back. */}
                                      {numSets === 0 && (
                                        <button
                                          className={styles.addFirstSetButton}
                                          onClick={() => addSet(index, 1)}
                                        >
                                          Add a set
                                        </button>
                                      )}
                                    </div>
                                    <div
                                      className={styles.notesInputContainer}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        opacity:
                                          (exercise.notes?.length ?? 0) > 0
                                            ? 1
                                            : 'revert-layer',
                                      }}
                                    >
                                      <LetsIconsComment
                                        className={styles.notesInputIcon}
                                      />
                                      <input
                                        type="text"
                                        className={styles.notesInput}
                                        placeholder={`Add notes about ${exercise.name}`}
                                        value={exercise.notes ?? ''}
                                        onChange={(e) =>
                                          updateExerciseNotes(
                                            index,
                                            e.target.value
                                          )
                                        }
                                      />
                                    </div>
                                  </>
                                )}
                              </div>
                              {exercise.time && exercise.expanded && (
                                <div
                                  className={styles.pastExercise}
                                  id={index === 0 ? 'tour-past' : undefined}
                                >
                                  <span>
                                    Previously:{' '}
                                    {readableDate(new Date(exercise.time))} (
                                    {calculateDaysAgo(new Date(exercise.time))})
                                  </span>
                                  <div className={styles.setsContainer}>
                                    {[...Array(numOldSets)].map((_e, i) => (
                                      <div
                                        className={styles.setContainer}
                                        key={i}
                                      >
                                        <span style={{ fontSize: 18 }}>
                                          {exercise.oldReps[i]}
                                        </span>
                                        <span
                                          className={styles.setAdornment}
                                          style={{
                                            marginTop: 2,
                                            fontSize: 16,
                                          }}
                                        >
                                          ×
                                        </span>
                                        <span style={{ fontSize: 18 }}>
                                          {exercise.oldWeights[i]}
                                        </span>
                                        <span
                                          className={styles.setAdornment}
                                          style={{
                                            marginLeft: -3,
                                            marginTop: 5,
                                          }}
                                        >
                                          lbs
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                  {exercise.oldNotes &&
                                    exercise.oldNotes.length > 0 && (
                                      <div style={{ marginTop: 8 }}>
                                        Note: {exercise.oldNotes}
                                      </div>
                                    )}
                                </div>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
          <div style={{ display: 'flex' }} id="tour-add">
            {/* Add sits inside <ComboBox> on purpose: pressing a button that
                lives outside the combobox counts as an outside click, which
                closes the list and clears the query before the handler can
                read it. */}
            <ComboBox
              options={exerciseNames}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              query={query}
              setQuery={setQuery}
            >
              <button
                disabled={!typedName && exerciseToPreview === null}
                className={styles.addButton}
                onClick={() => {
                  addExercise(
                    pendingPreview ? pendingPreview.exercise.name : pendingName,
                    pendingPreview
                  );
                }}
              >
                Add
              </button>
            </ComboBox>
          </div>
          {pendingPreview && notAlreadyAdded(pendingPreview.exercise.name) && (
            <ExerciseToPreview exerciseToPreview={pendingPreview} />
          )}
          {/* !pendingPreview covers both null (nothing chosen) and undefined
              (chosen or typed, but never done before). */}
          {!pendingPreview && pendingName && notAlreadyAdded(pendingName) && (
            <div className={styles.firstTime}>
              This is your first time doing <b>{pendingName}</b>!
            </div>
          )}
          <div className={styles.endWorkoutContainer}>
            <div className={styles.timer}>
              <LetsIconsTimeAtack />
              <span>{workoutTimer}</span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => {
                  // Drop a message from a previous attempt, the same way the
                  // long-press modal clears its delete error. Otherwise "You
                  // are offline" is still sitting there after reconnecting.
                  onOpenSaveConfirm();
                  setModalShown(true);
                }}
                className={styles.endWorkoutButton}
              >
                End workout
              </button>
              <button
                onClick={() => setTrashModalShown(true)}
                className={styles.trashWorkoutButton}
              >
                <LetsIconsTrash />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <span
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Spans rather than divs: this subtree is inside a <button> now,
              which may only contain phrasing content. */}
          <span style={{ width: 150 }}>Start a workout</span>
          <span className={styles.plusContainer}>+</span>
        </span>
      )}
    </Shell>
  );
}
