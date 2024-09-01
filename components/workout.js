'use client';
import { useStickyState } from '@/hooks/useStickyState';
import styles from './workout.module.css';
import { useEffect, useRef, useState } from 'react';
import { calculateWorkoutTimer } from '@/utils/utils';
import ComboBox from './combobox';
import ExerciseToPreview from './exerciseToPreview';

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
            ? preview.exercise
            : {
                name: name,
                reps: [],
                weights: [],
                notes: '',
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
            <div className={styles.exerciseContainer}>
              {exercises.map((exercise) => (
                <div key={exercise.name} className={styles.exercise}>
                  {exercise.name}
                </div>
              ))}
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
