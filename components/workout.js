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
      } else {
        oldExercises.push(
          preview
            ? {
                name: preview.exercise.name,
                oldReps: preview.exercise.reps,
                oldWeights: preview.exercise.weights,
                oldNotes: preview.exercise.notes,
                time: preview.time,
                reps: [],
                weights: [],
                notes: '',
                expanded: true,
              }
            : {
                name: name,
                oldReps: null,
                oldWeights: null,
                oldNotes: null,
                reps: [],
                weights: [],
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
      oldExercises[index].expanded = expanded;
      return oldExercises;
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
                          <span>set1</span>
                          <span>set2</span>
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
