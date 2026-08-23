'use client';
import { WorkoutsContext } from '@/context/workoutsProvider';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import GHCalendar from 'react-github-contribution-calendar';
import classNames from 'classnames';
import GroupedButtons from '@/components/stats/groupedButtons';
import Select from 'react-select';
import { capitalize, readableDate } from '@/utils/utils';
import {
  Bar,
  BarChart,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Toggle from '@/components/toggle';
import { useStickyState } from '@/hooks/useStickyState';
import { useLoadDelay } from '@/hooks/useLoadDelay';
import { Exercise } from '@/components/loggedWorkout';

export default function Stats() {
  const { workouts, loading, loading2 } = useContext(WorkoutsContext);
  const [mount, setMount] = useState(false);
  const shown = useLoadDelay();

  const [selectedExerciseStatFormat, setSelectedExerciseStatFormat] =
    useState(0);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [showEmptyDays, setShowEmptyDays] = useStickyState(
    false,
    'showEmptyDays'
  );

  useEffect(() => {
    setMount(true);
  }, []);

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
          date: readableDate(workout.start_time),
          reps: exercise.reps,
          weights: exercise.weights,
          notes: exercise.notes,
        });
      });
    });
    return history;
  }, [workouts]);

  const selectOptions = useMemo(() => {
    const options = Object.keys(exerciseHistory).map((exercise) => ({
      value: exercise,
      label: capitalize(exercise),
    }));
    return options;
  }, [exerciseHistory]);

  const calculateVolume = useCallback((reps, weights) => {
    let volume = 0;
    for (let i = 0; i < reps.length; i++) {
      volume += reps[i] * Math.max(1, weights[i]);
    }
    return volume;
  }, []);

  const getFormatKey = useCallback((format) => {
    switch (format) {
      case 1:
        return 'volume';
      case 0:
      case 2:
      default:
        return 'maxWeight';
    }
  }, []);

  const getFormatLabel = useCallback((format) => {
    switch (format) {
      case 1:
        return 'Volume';
      case 0:
      case 2:
      default:
        return 'Max weight:';
    }
  }, []);

  const generateEmptyDays = useCallback((day1, day2) => {
    const date1 = day1.date;
    const date2 = day2.date;

    const arr = [];
    for (
      const dt = new Date(date1);
      dt < new Date(date2);
      dt.setDate(dt.getDate() + 1)
    ) {
      if (dt.getTime() === new Date(date1).getTime()) {
      } else {
        arr.push(new Date(dt));
      }
    }
    return arr;
  }, []);

  const selectedExerciseData = useMemo(() => {
    if (selectedExercise) {
      const history = exerciseHistory[selectedExercise];
      const mappedHistory = history.map((historyItem) => {
        return {
          ...historyItem,
          maxWeight: Math.max(1, Math.max(...historyItem.weights)),
          volume: calculateVolume(historyItem.reps, historyItem.weights),
        };
      });
      if (selectedExerciseStatFormat !== 2) {
        mappedHistory.reverse();
      }
      const filledHistory = [];
      for (let i = 0; i <= mappedHistory.length - 1; i++) {
        filledHistory.push(mappedHistory[i]);
        if (
          showEmptyDays &&
          i < mappedHistory.length - 1 &&
          selectedExerciseStatFormat !== 2
        ) {
          filledHistory.push(
            ...generateEmptyDays(mappedHistory[i], mappedHistory[i + 1])
          );
        }
      }
      return filledHistory;
    } else {
      return [];
    }
  }, [
    exerciseHistory,
    selectedExercise,
    showEmptyDays,
    selectedExerciseStatFormat,
  ]);

  return (
    shown && (
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Stats</h1>
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
          Individual exercise stats for...
          {mount && (
            <>
              <Select
                isSearchable={false}
                options={selectOptions}
                placeholder="Select an exercise"
                components={{
                  IndicatorSeparator: () => null,
                }}
                onChange={(option) => setSelectedExercise(option.value)}
                styles={{
                  control: (baseStyles, state) => ({
                    ...baseStyles,
                    marginTop: 8,
                    background: 'var(--white)',
                    boxShadow: state.isFocused
                      ? '0 0 0 2px var(--accent)'
                      : 'none',
                    border: '1px solid var(--textSecondary)',
                    '&:hover': {
                      border: state.isFocused
                        ? '1px solid var(--accent)'
                        : '1px solid #aaa',
                    },
                  }),
                  singleValue: (baseStyles, state) => ({
                    ...baseStyles,
                    color: 'var(--accentText)',
                    fontWeight: '600',
                  }),
                  // react-select's default placeholder is #808080, 3.95:1 on
                  // white.
                  placeholder: (baseStyles) => ({
                    ...baseStyles,
                    color: 'var(--textSecondary)',
                  }),
                  input: (baseStyles) => ({
                    ...baseStyles,
                    color: 'var(--text)',
                  }),
                  menu: (baseStyles, state) => ({
                    ...baseStyles,
                    background: 'var(--white)',
                    zIndex: 3,
                  }),
                  option: (baseStyles, state) => ({
                    ...baseStyles,
                    backgroundColor: state.isSelected
                      ? 'var(--accent)'
                      : 'var(--white)',
                    '&:hover': {
                      backgroundColor: state.isSelected
                        ? 'var(--accent)'
                        : 'var(--accentHoverLight)',
                    },
                  }),
                }}
              />
              <GroupedButtons
                selectedItem={selectedExerciseStatFormat}
                setSelectedItem={setSelectedExerciseStatFormat}
                options={['Weight', 'Volume (reps × weight)', 'Table']}
              />
              {selectedExerciseStatFormat !== 2 && (
                <Toggle
                  label={'Show empty days?'}
                  enabled={showEmptyDays}
                  setEnabled={setShowEmptyDays}
                />
              )}
            </>
          )}
          {selectedExercise !== null && selectedExerciseStatFormat !== 2 && (
            <div
              className={styles.exerciseStatsContainer}
              style={{ width: '100%', height: 315 }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={selectedExerciseData.slice(-100)}
                  margin={{
                    top: 12,
                    right: 0,
                    left: -20,
                    bottom: 5,
                  }}
                >
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => {
                      return value.split(',')[0];
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => {
                      return `Date: ${value}`;
                    }}
                    formatter={(value, name, ...props) => {
                      return [
                        value,
                        getFormatLabel(selectedExerciseStatFormat),
                        ...props,
                      ];
                    }}
                    contentStyle={{
                      background: 'var(--background)',
                      borderRadius: 8,
                    }}
                    wrapperStyle={{
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: 'none',
                    }}
                    border={'none'}
                  />
                  <Bar
                    dataKey={getFormatKey(selectedExerciseStatFormat)}
                    fill="var(--accent)"
                    activeBar={
                      <Rectangle
                        fill="var(--secondary)"
                        stroke="var(--secondaryHover)"
                      />
                    }
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          {selectedExercise !== null && selectedExerciseStatFormat === 2 && (
            <div className={styles.exerciseHistory}>
              <div className={styles.exerciseHistoryTable}>
                {selectedExerciseData.map((e, index) => {
                  return (
                    <Exercise
                      key={e.date + '' + index}
                      exercise={e}
                      truncateSets={false}
                      extraSets={0}
                      numSets={e.reps.length}
                      name={selectedExercise}
                      showDate={true}
                      showNote={true}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  );
}
