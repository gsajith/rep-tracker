'use client';
import { useStickyState } from '@/hooks/useStickyState';
import styles from './workout.module.css';
import { useEffect, useState } from 'react';
import { calculateWorkoutTimer, capitalize } from '@/utils/utils';
import ComboBox from './combobox';

export default function Workout({ exerciseNames }) {
  const [inWorkout, setInWorkout] = useStickyState(false, 'inWorkout');
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(
    null,
    'workoutStartTime'
  );
  const [workoutTimer, setWorkoutTimer] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    console.log(workoutStartTime);
    if (workoutStartTime) {
      setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
      const timerInterval = setInterval(() => {
        setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()));
        console.log('Timer...', Date.now());
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
          setWorkoutStartTime(null);
        }
      }}
    >
      {inWorkout ? (
        <div>
          {workoutTimer} [
          {Array.from(exerciseNames)
            .map((exercise) => capitalize(exercise.name))
            .join(', ')}
          ]
          <ComboBox options={exerciseNames} />
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
