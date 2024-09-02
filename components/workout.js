'use client';
import { useStickyState } from '@/hooks/useStickyState';
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
import { LetsIconsTrash } from './SVGIcons/LetsIconsTrash';

export default function Workout({ exerciseNames, latestExercises }) {
  const [inWorkout, setInWorkout] = useStickyState(false, 'inWorkout');
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(
    null,
    'workoutStartTime'
  );
  const [workoutTimer, setWorkoutTimer] = useState(null);
  const [exerciseToPreview, setExerciseToPreview] = useState(null);
  const exerciseName = useRef(null);
  const [exercises, setExercises] = useState([]);
  const [selectedItem, setSelectedItem] = useState();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (workoutStartTime) {
      setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      const timerInterval = setInterval(() => {
        setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [workoutStartTime]);

  const addExercise = (name, preview) => {
    setExercises((oldExercises) => {
      const exists = oldExercises.findIndex(
        (e) => e.name.toLowerCase() === name.toLowerCase()
      );
      if (exists > -1) {
        oldExercises.push(oldExercises.splice(exists, 1)[0]);
        setExpanded(oldExercises.length - 1, true);
      } else {
        oldExercises.push(
          preview
            ? {
                name: preview.exercise.name,
                oldReps: preview.exercise.reps,
                oldWeights: preview.exercise.weights,
                oldNotes: preview.exercise.notes,
                time: preview.time,
                reps: [0],
                weights: [0],
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
                notes: '',
                expanded: true,
              }
        );
      }
      return oldExercises;
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

  const addSet = (exerciseIndex, num) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      if (newExercises[exerciseIndex].reps.length < num)
        newExercises[exerciseIndex].reps.push(0);
      if (newExercises[exerciseIndex].weights.length < num)
        newExercises[exerciseIndex].weights.push(0);
      return newExercises;
    });
  };

  const deleteSet = (exerciseIndex, setIndex, num) => {
    setExercises((oldExercises) => {
      const newExercises = [...oldExercises];
      if (newExercises[exerciseIndex].reps.length >= num)
        newExercises[exerciseIndex].reps.splice(setIndex, 1);
      if (newExercises[exerciseIndex].weights.length >= num)
        newExercises[exerciseIndex].weights.splice(setIndex, 1);
      return newExercises;
    });
  };
  return (
    <div
      className={`${styles.container} ${!inWorkout && styles.startup}`}
      onClick={() => {
        if (!inWorkout) {
          setInWorkout(!inWorkout);
          setWorkoutStartTime(Date.now());
        } else {
        }
      }}
    >
      {inWorkout ? (
        <div>
          {exercises.length > 0 && (
            <div className={styles.exercisesContainer}>
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
                  <div
                    key={exercise.name}
                    className={styles.exerciseContainer}
                    style={
                      exercise.expanded
                        ? { maxHeight: 150 * numOldSets + 300 }
                        : {}
                    }
                  >
                    <div
                      className={styles.exercise}
                      style={
                        !(exercise.time && exercise.expanded)
                          ? { borderRadius: 14 }
                          : {}
                      }
                    >
                      <button
                        className={styles.exerciseName}
                        onClick={() => {
                          setExpanded(index, !exercise.expanded);
                        }}
                      >
                        {exercise.name}{' '}
                        <LetsIconsExpandDown
                          style={exercise.expanded ? { rotate: '-180deg' } : {}}
                        />
                      </button>
                      {exercise.expanded && (
                        <>
                          <div className={styles.setInputs}>
                            {[...Array(numSets)].map((_e, i) => (
                              <div className={styles.setInputWrapper}>
                                <div className={styles.setInputContainer}>
                                  <input
                                    type="number"
                                    className={styles.setInputNumber}
                                    value={exercise.reps[i]}
                                    onChange={(e) => {
                                      updateExerciseReps(
                                        index,
                                        i,
                                        e.target.value
                                      );
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: '#908E96',
                                      marginTop: 2,
                                      fontSize: 16,
                                    }}
                                  >
                                    ×
                                  </span>
                                  <input
                                    type="number"
                                    className={styles.setInputNumber}
                                    value={exercise.weights[i]}
                                    onChange={(e) => {
                                      updateExerciseWeights(
                                        index,
                                        i,
                                        e.target.value
                                      );
                                    }}
                                  />
                                  <span
                                    style={{
                                      color: '#908E96',
                                      marginLeft: -3,
                                      marginTop: 5,
                                    }}
                                  >
                                    lbs
                                  </span>
                                </div>
                                {i + 1 === numSets ? (
                                  <button
                                    className={styles.addSetButton}
                                    onClick={() => addSet(index, numSets + 1)}
                                  >
                                    Add a set
                                  </button>
                                ) : (
                                  <button
                                    className={styles.deleteSetButton}
                                    onClick={() => deleteSet(index, i, numSets)}
                                  >
                                    <LetsIconsTrash />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          <input
                            type="text"
                            className={styles.notesInput}
                            placeholder="Add notes..."
                          />
                        </>
                      )}
                    </div>
                    {exercise.time && exercise.expanded && (
                      <div className={styles.pastExercise}>
                        <span>
                          Previously: {readableDate(new Date(exercise.time))} (
                          {calculateDaysAgo(new Date(exercise.time))})
                        </span>
                        <div className={styles.setsContainer}>
                          {[...Array(numOldSets)].map((_e, i) => (
                            <div className={styles.setContainer} key={i}>
                              <span style={{ fontSize: 18 }}>
                                {exercise.oldReps[i]}
                              </span>
                              <span
                                style={{
                                  color: '#908E96',
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
                                style={{
                                  color: '#908E96',
                                  marginLeft: -3,
                                  marginTop: 5,
                                }}
                              >
                                lbs
                              </span>
                            </div>
                          ))}
                        </div>
                        {exercise.oldNotes && exercise.oldNotes.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            Note: {exercise.oldNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex' }}>
            <ComboBox
              options={exerciseNames}
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
              query={query}
              setQuery={setQuery}
            />
            <button
              disabled={exerciseToPreview === null}
              className={styles.addButton}
              onClick={() => {
                addExercise(
                  exerciseToPreview
                    ? exerciseToPreview.exercise.name
                    : exerciseName.current,
                  exerciseToPreview
                );
              }}
            >
              Add
            </button>
          </div>
          {exerciseToPreview &&
            notAlreadyAdded(exerciseToPreview.exercise.name) && (
              <ExerciseToPreview exerciseToPreview={exerciseToPreview} />
            )}
          {exerciseToPreview === undefined &&
            notAlreadyAdded(exerciseName.current) && (
              <div className={styles.firstTime}>
                This is your first time doing <b>{exerciseName.current}</b>!
              </div>
            )}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ width: 150 }}>Start a workout</div>
          <div className={styles.plusContainer}>+</div>
        </div>
      )}
    </div>
  );
}
