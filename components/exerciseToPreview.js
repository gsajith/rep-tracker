import { calculateDaysAgo, readableDate } from '@/utils/utils';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
import styles from './exerciseToPreview.module.css';
import Weight from './weight';

export default function ExerciseToPreview({ exerciseToPreview }) {
  return (
    // id is the tour's anchor for the payoff step; harmless otherwise.
    <div className={styles.exercisePreview} id="tour-preview">
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
                <span>{exerciseToPreview.exercise.reps[i]}</span>
                <span className={styles.setAdornment}>reps</span>
                <Weight
                  lb={exerciseToPreview.exercise.weights[i]}
                  adornmentClassName={styles.setAdornment}
                />
              </div>
            ))}
          </div>
        );
      })()}
      {exerciseToPreview.exercise.notes &&
        exerciseToPreview.exercise.notes.length > 0 && (
          <div className={styles.previewNotes}>
            <span className={styles.previewNotesLabel}>
              <LetsIconsComment /> Notes
            </span>
            <div>{exerciseToPreview.exercise.notes}</div>
          </div>
        )}
    </div>
  );
}
