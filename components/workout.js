'use client';
import { useStickyState } from '@/hooks/useStickyState';
import styles from './workout.module.css';
import { useEffect, useState } from 'react';
import {
  calculateDaysAgo,
  calculateWorkoutTimer,
  readableDate,
} from '@/utils/utils';
import ComboBox from './combobox';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';

export default function Workout({ exerciseNames, latestExercises }) {
  const [inWorkout, setInWorkout] = useStickyState(false, 'inWorkout');
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(
    null,
    'workoutStartTime'
  );
  const [workoutTimer, setWorkoutTimer] = useState(null);
  const [exerciseToPreview, setExerciseToPreview] = useState(null);
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
                } else {
                  setExerciseToPreview(null);
                }
              }}
            />
            <button
              disabled={exerciseToPreview === null}
              className={styles.addButton}
            >
              Add
            </button>
          </div>
          {exerciseToPreview && (
            <div className={styles.exercisePreview}>
              <b className={styles.exercisePreviewTitle}>
                Last time you did this:{' '}
                <span>
                  {readableDate(new Date(exerciseToPreview.time))} (
                  {calculateDaysAgo(new Date(exerciseToPreview.time))})
                </span>
              </b>
              {(() => {
                const numSets = Math.min(
                  exerciseToPreview.exercise.reps.length,
                  exerciseToPreview.exercise.weights.length
                );
                return (
                  <div className={styles.setsContainer}>
                    {[...Array(numSets)].map((_e, i) => (
                      <div className={styles.setContainer} key={i}>
                        <span style={{ fontSize: 18 }}>
                          {exerciseToPreview.exercise.reps[i]}
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
                          {exerciseToPreview.exercise.weights[i]}
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
                );
              })()}
              {exerciseToPreview.exercise.notes &&
                exerciseToPreview.exercise.notes.length > 0 && (
                  <div className={styles.previewNotes}>
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginRight: 4,
                      }}
                    >
                      <LetsIconsComment /> Notes:{' '}
                    </span>
                    <div style={{ marginTop: 2 }}>
                      {exerciseToPreview.exercise.notes}
                    </div>
                  </div>
                )}
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
