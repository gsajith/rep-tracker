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
import { useWeightUnit } from '@/context/unitProvider';
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
  // Ends at the most recent workout rather than today. The calendar covers a
  // fixed window backwards from `until`, so anyone returning after a break saw
  // a grid of empty cells with their history off the left edge.
  const gh_until = useMemo(() => {
    const latest = workouts.reduce(
      (max, w) => (w.start_time > max ? w.start_time : max),
      new Date(0)
    );
    const end = latest.getTime() > 0 ? latest : new Date();
    return new Date(end.getTime() - tzoffset).toISOString().split('T')[0];
  }, [workouts, tzoffset]);

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

  const { toDisplay, unitLabel } = useWeightUnit();

  const calculateVolume = useCallback((reps, weights) => {
    let volume = 0;
    for (let i = 0; i < reps.length; i++) {
      volume += reps[i] * weights[i];
    }
    return volume;
  }, []);

  // True when nothing in this exercise's history carries a weight: pushups,
  // dips, pull-ups. Charting "max weight" for those drew a flat line at a
  // number nobody entered.
  const isBodyweight = useMemo(() => {
    const history = selectedExercise ? exerciseHistory[selectedExercise] : null;
    if (!history) return false;
    return history.every((item) => item.weights.every((w) => !Number(w)));
  }, [exerciseHistory, selectedExercise]);

  const getFormatKey = useCallback(
    (format) => {
      if (isBodyweight) return format === 1 ? 'totalReps' : 'maxReps';
      return format === 1 ? 'volume' : 'maxWeight';
    },
    [isBodyweight]
  );

  // No trailing colon: Recharts appends its own separator, which is where
  // "Max weight: : 1" came from.
  const getFormatLabel = useCallback(
    (format) => {
      if (isBodyweight) return format === 1 ? 'Total reps' : 'Max reps';
      // Named here because the bars carry no unit anywhere else, and volume in
      // kg is a different number from volume in lbs.
      return format === 1
        ? `Volume (${unitLabel})`
        : `Max weight (${unitLabel})`;
    },
    [isBodyweight, unitLabel]
  );

  const generateEmptyDays = useCallback((day1, day2) => {
    const date1 = day1.date;
    const date2 = day2.date;

    const arr = [];
    for (
      const dt = new Date(date1);
      dt < new Date(date2);
      dt.setDate(dt.getDate() + 1)
    ) {
      if (dt.getTime() !== new Date(date1).getTime()) {
        arr.push({
          date: readableDate(new Date(dt)),
          maxWeight: 0,
          volume: 0,
          maxReps: 0,
          totalReps: 0,
          reps: [],
          weights: [],
        });
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
          maxWeight: historyItem.weights.length
            ? toDisplay(Math.max(...historyItem.weights))
            : 0,
          maxReps: historyItem.reps.length ? Math.max(...historyItem.reps) : 0,
          totalReps: historyItem.reps.reduce((a, r) => a + (Number(r) || 0), 0),
          // Reps are dimensionless, so converting the summed volume is the
          // same as converting every weight that went into it.
          volume: toDisplay(
            calculateVolume(historyItem.reps, historyItem.weights)
          ),
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
    toDisplay,
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
          Individual exercise stats
          {mount && (
            <>
              <Select
                // Was false, over every exercise name ever used, while the
                // home screen's picker over the same data is searchable.
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
                // The unit is named here because the Y axis carries no label:
                // without it a peak of 61 on the chart could be either unit.
                options={
                  isBodyweight
                    ? ['Reps', 'Total reps', 'Table']
                    : [
                        `Weight (${unitLabel})`,
                        `Volume (reps × ${unitLabel})`,
                        'Table',
                      ]
                }
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
          {selectedExercise === null && (
            <p className={styles.pickPrompt}>
              Pick an exercise to see what you have lifted for it over time.
            </p>
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
                      // Min, matching <LoggedWorkout />: stored reps and
                      // weights can be ragged, and a set with no weight was
                      // asking for an element that is not there.
                      numSets={Math.min(e.reps.length, e.weights.length)}
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
