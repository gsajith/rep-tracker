'use client';
import { WorkoutsContext } from '@/context/workoutsProvider';
import { useContext, useMemo } from 'react';
import styles from './page.module.css';
import Calendar from 'react-github-contribution-calendar';
import classNames from 'classnames';

export default function Stats() {
  const { workouts, loading, loading2, exerciseNames, latestExercises } =
    useContext(WorkoutsContext);

  const values = useMemo(() => {
    const v = {};
    workouts.forEach((workout) => {
      const timeString = workout.start_time.toISOString().split('T')[0];
      if (timeString in v) {
        v[timeString] += 1;
      } else {
        v[timeString] = 1;
      }
    });
    return v;
  }, [workouts]);
  const until = new Date().toISOString().split('T')[0];

  const panelColors = [
    'rgb(from var(--accentHoverLight) r g b / 50%)',
    'rgb(from var(--accent) r g b / 70%)',
    'rgb(from var(--accent) r g b / 100%)',
  ];
  const panelAttributes = { rx: 1, ry: 1 };

  return (
    <div className={styles.container}>
      <h2>Stats</h2>
      <div
        className={classNames(
          loading || loading2 ? 'shimmerBG' : '',
          styles.calendarContainer
        )}
      >
        <Calendar
          values={values}
          until={until}
          panelColors={panelColors}
          panelAttributes={panelAttributes}
        />
        <div style={{ textAlign: 'center' }}>
          {loading || loading2 ? 'Loading...' : ''}
        </div>
      </div>
    </div>
  );
}
