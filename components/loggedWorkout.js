import {
  calculateDaysAgo,
  formatDuration,
  readableDate,
  readableTime,
} from '@/utils/utils';
import styles from './loggedWorkout.module.css';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
import { LetsIconsTimeAtack } from './SVGIcons/LetsIconsTimeAtack';
import { useState } from 'react';
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
  // The note used to be a `title` attribute, which is a desktop hover tooltip:
  // no keyboard path, no screen-reader announcement, and nothing at all on the
  // phone this product is built for. Tapping the icon now reveals it.
  const [noteRevealed, setNoteRevealed] = useState(false);
  const hasNote = Boolean(exercise.notes && exercise.notes.length > 0);
  const noteVisible = showNote || noteRevealed;

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
      {hasNote && !showNote && (
        <button
          type="button"
          className={styles.commentIcon}
          aria-expanded={noteRevealed}
          aria-label={`${noteRevealed ? 'Hide' : 'Show'} note for ${
            exercise.name
          }`}
          onClick={() => setNoteRevealed((shown) => !shown)}
        >
          <LetsIconsComment />
        </button>
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

      {hasNote && noteVisible && (
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
        {/* Dated by when the workout started, matching the clock time and
            the "days ago" beside it. Dating the title by end_time made a
            session that crossed midnight claim the next day: start 11:40pm
            on the 22nd, finish at 12:20am, and the card read the 23rd above
            a time of 11:40 PM. */}
        <span className={styles.titleGroup}>
          <span className={styles.title}>{readableDate(data.start_time)}</span>
          {data.name && <span className={styles.routineName}>{data.name}</span>}
        </span>
        <div className={styles.times}>
          <span>{calculateDaysAgo(data.start_time)}</span>
          <span>{readableTime(data.start_time)}</span>
        </div>
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
        <span className={styles.metaLeft}>
          {/* The card gives no other hint that exercises continue past the
              right edge: the scrollbar is hidden and only the fade marks it. */}
          <span className={styles.exerciseCount}>
            {numExercises} {numExercises === 1 ? 'exercise' : 'exercises'}
          </span>
          {data.notes ? <span>Note: {data.notes}</span> : null}
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
