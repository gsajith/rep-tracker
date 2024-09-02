import { calculateDaysAgo, readableDate } from '@/utils/utils';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
import styles from './exerciseToPreview.module.css';

export default function ExerciseToPreview({ exerciseToPreview }) {
  return (
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
                  className={styles.setAdornment}
                  style={{
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
  );
}
