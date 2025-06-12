'use client';
import { WorkoutsContext } from '@/context/workoutsProvider';
import { useContext, useMemo, useState } from 'react';
import styles from './page.module.css';
import GHCalendar from 'react-github-contribution-calendar';
import classNames from 'classnames';
import GroupedButtons from '@/components/stats/groupedButtons';

export default function Stats() {
  const { workouts, loading, loading2 } = useContext(WorkoutsContext);

  const gh_workoutTimes = useMemo(() => {
    const v = {};
    workouts.forEach((workout) => {
      const tzo = workout.start_time.getTimezoneOffset() * 60000;
      const timeString = new Date(workout.start_time - tzo)
        .toISOString()
        .split('T')[0];
      if (timeString in v) {
        v[timeString] += 1;
      } else {
        v[timeString] = 1;
      }
    });
    return v;
  }, [workouts]);
  const tzoffset = new Date().getTimezoneOffset() * 60000;
  const gh_until = new Date(Date.now() - tzoffset).toISOString().split('T')[0];

  const gh_panelColors = [
    'rgb(from var(--accentHoverLight) r g b / 50%)',
    'rgb(from var(--accent) r g b / 70%)',
    'rgb(from var(--accent) r g b / 100%)',
  ];
  const gh_panelAttributes = { rx: 1, ry: 1 };

  const exerciseHistory = useMemo(() => {
    const history = {};
    workouts.forEach((workout) => {
      const exercises = workout.exercises;
      exercises.forEach((exercise) => {
        if (!(exercise.name in history)) {
          history[exercise.name] = [];
        }
        history[exercise.name].push({
          date: workout.start_time,
          reps: exercise.reps,
          weights: exercise.weights,
        });
      });
    });
    return history;
  }, [workouts]);

  const [selectedExerciseStatFormat, setSelectedExerciseStatFormat] =
    useState(0);

  return (
    <div className={styles.container}>
      <h2>Stats</h2>
      <div
        className={classNames(
          loading || loading2 ? 'shimmerBG' : '',
          styles.calendarContainer
        )}
      >
        <GHCalendar
          values={gh_workoutTimes}
          until={gh_until}
          panelColors={gh_panelColors}
          panelAttributes={gh_panelAttributes}
        />
        <div style={{ textAlign: 'center' }}>
          {loading || loading2 ? 'Loading...' : ''}
        </div>
      </div>
      <div className={styles.exerciseStatsContainer}>
        Individual exercises:
        <GroupedButtons
          selectedItem={selectedExerciseStatFormat}
          setSelectedItem={setSelectedExerciseStatFormat}
          options={['Weight', 'Volume (reps x weight)', 'Table']}
        />
      </div>
    </div>
  );
}
