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
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
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

  useEffect(() => {
    console.log(workoutStartTime);
    if (workoutStartTime) {
      setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      const timerInterval = setInterval(() => {
        setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [workoutStartTime]);

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
          <div style={{ display: 'flex' }}>
            <ComboBox
              options={exerciseNames}
              onSelect={(item) => {
                if (item !== null && item.name.length > 0) {
                  setExerciseToPreview(latestExercises[item.name]);
                  exerciseName.current = item.name;
                } else {
                  setExerciseToPreview(null);
                  exerciseName.current = null;
                }
              }}
            />
            <button
              disabled={exerciseToPreview === null}
              className={styles.addButton}
              onClick={() => console.log('we will add', exerciseName.current)}
            >
              Add
            </button>
          </div>
          {exerciseToPreview && (
            <ExerciseToPreview exerciseToPreview={exerciseToPreview} />
          )}
          {exerciseToPreview === undefined && (
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
