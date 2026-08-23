import {
  calculateDaysAgo,
  formatDuration,
  readableDate,
  readableTime,
} from '@/utils/utils';
import styles from './loggedWorkout.module.css';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
import { LetsIconsTimeAtack } from './SVGIcons/LetsIconsTimeAtack';
import { useLongPress } from 'use-long-press';
import { LetsIconsMore } from './SVGIcons/LetsIconsMore';

export function Exercise({
  exercise,
  truncateSets = false,
  extraSets = 0,
  numSets,
  showDate = false,
  showNote = false,
}) {
  return (
    <div
      className={styles.exercise}
      key={exercise.id || (showDate ? exercise.date : '')}
    >
      <div className={styles.exerciseName}>
        {exercise.name}
        {showDate && exercise.name && ' '}
        {showDate && exercise.date}
      </div>
      {exercise.notes && exercise.notes.length > 0 && !showNote && (
        <div className={styles.commentIcon} title={exercise.notes}>
          <LetsIconsComment />
        </div>
      )}
      {numSets > 0 && (
        <div className={styles.setsContainer}>
          {[...Array(numSets)].map((_e, i) => (
            <div className={styles.setContainer} key={i}>
              <span style={{ fontSize: 18 }}>{exercise.reps[i]}</span>
              <span
                className={styles.setAdornment}
                style={{
                  marginTop: 2,
                  fontSize: 16,
                }}
              >
                ×
              </span>
              <span style={{ fontSize: 18 }}>{exercise.weights[i]}</span>
              <span
                className={styles.setAdornment}
                style={{
                  marginLeft: -3,
                  marginTop: 5,
                }}
              >
                lbs
              </span>
            </div>
          ))}
          {truncateSets && (
            <div className={styles.setContainer}>
              <span style={{ fontSize: 18 }}>+ {extraSets} more</span>
            </div>
          )}
        </div>
      )}

      {exercise.notes && exercise.notes.length > 0 && showNote && (
        <div className={styles.notesContainer}>
          <b>Note:</b> {exercise.notes}
        </div>
      )}
    </div>
  );
}

export default function LoggedWorkout({ data, onLongPress, id, menuLabel }) {
  const bind = useLongPress(() => {
    onLongPress();
  });

  const numExercises = data.exercises?.length ?? 0;
  // null when the span is implausible, which means the session was abandoned
  // rather than ended. See formatDuration.
  const duration = formatDuration(data.start_time, data.end_time);

  return (
    <div className={styles.container} id={id} {...bind()}>
      <div className={styles.header}>
        <span className={styles.title}>{readableDate(data.end_time)}</span>
        <div className={styles.times}>
          <span>{calculateDaysAgo(data.start_time)}</span>
          <span>{readableTime(data.start_time)}</span>
        </div>
        {/* The card gave no hint that exercises continue past the right edge:
            no scrollbar, no fade, no count. */}
        <span className={styles.exerciseCount}>
          {numExercises} {numExercises === 1 ? 'exercise' : 'exercises'}
        </span>
        {/* Copy and delete were reachable only by long-pressing the card, which
            exposes no keyboard or screen-reader path and is not announced
            anywhere. This opens the same menu. */}
        <button
          type="button"
          className={styles.menuButton}
          aria-label={menuLabel}
          onClick={onLongPress}
        >
          <LetsIconsMore />
        </button>
      </div>
      <div className={styles.exercisesContainer}>
        <div className={styles.exercises}>
          {data.exercises.map((exercise, index) => {
            let numSets = 0;
            let truncateSets = false;
            let extraSets = 0;
            if (!exercise.reps || !exercise.weights) {
              numSets = 0;
            } else {
              numSets = Math.min(exercise.reps.length, exercise.weights.length);
            }

            if (numSets > 3) {
              extraSets = numSets - 2;
              numSets = 2;
              truncateSets = true;
            }

            return (
              <Exercise
                key={exercise.id}
                exercise={exercise}
                truncateSets={truncateSets}
                extraSets={extraSets}
                numSets={numSets}
              />
            );
          })}
        </div>
      </div>
      <br />
      <div className={styles.metadata}>
        <span style={{ width: 220 }}>
          {data.notes ? 'Note: ' + data.notes : ''}
        </span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            justifyContent: 'flex-end',
          }}
        >
          <span
            className={duration ? styles.minutesLabel : styles.unfinishedLabel}
            title={
              duration
                ? undefined
                : 'This workout was never ended, so its length is the gap until the next one started.'
            }
          >
            {duration ?? 'Not ended'}
          </span>
          <LetsIconsTimeAtack />
        </span>
      </div>
    </div>
  );
}
