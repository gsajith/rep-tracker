'use client';
import { useStickyState } from '@/hooks/useStickyState';
import styles from './workout.module.css';
import { useEffect, useState } from 'react';
import { calculateWorkoutTimer } from '@/utils/utils';

export default function Workout() {
  const [inWorkout, setInWorkout] = useStickyState(false, 'inWorkout');
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(
    null,
    'workoutStartTime'
  );
  const [workoutTimer, setWorkoutTimer] = useState(null);

  useEffect(() => {
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
        setInWorkout(!inWorkout);
        if (!inWorkout) {
          setWorkoutStartTime(Date.now());
        } else {
          setWorkoutStartTime(null);
        }
      }}
    >
      {inWorkout ? (
        <>Started {workoutTimer}</>
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
