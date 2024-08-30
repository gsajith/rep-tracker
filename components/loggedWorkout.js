import {
  calculateDaysAgo,
  calculateMinutes,
  readableDate,
  readableTime,
} from '@/utils/utils';
import styles from './loggedWorkout.module.css';
import { LetsIconsComment } from './SVGIcons/LetsIconsComment';
import { LetsIconsTimeAtack } from './SVGIcons/LetsIconsTimeAtack';

export default function LoggedWorkout({ data }) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{readableDate(data.end_time)}</span>
        <div className={styles.times}>
          <span>{calculateDaysAgo(data.end_time)}</span>
          <span>{readableTime(data.end_time)}</span>
        </div>
      </div>
      <div className={styles.exercisesContainer}>
        <div className={styles.exercises}>
          {data.exercises.map((exercise) => {
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
              <div className={styles.exercise} key={exercise.id}>
                <div className={styles.exerciseName}>{exercise.name}</div>
                {exercise.notes && exercise.notes.length > 0 && (
                  <div className={styles.commentIcon} title={exercise.notes}>
                    <LetsIconsComment />
                  </div>
                )}
                {numSets > 0 && (
                  <div className={styles.setsContainer}>
                    {[...Array(numSets)].map((_e, i) => (
                      <div className={styles.setContainer}>
                        <span style={{ fontSize: 18 }}>{exercise.reps[i]}</span>
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
                          {exercise.weights[i]}
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
                    {truncateSets && (
                      <div className={styles.setContainer}>
                        <span style={{ fontSize: 18 }}>+ {extraSets} more</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
            style={{
              color: '#A462D8',
              fontWeight: 'bold',
              marginTop: 4,
              textAlign: 'right',
            }}
          >
            {calculateMinutes(data.start_time, data.end_time)} mins
          </span>
          <LetsIconsTimeAtack />
        </span>
      </div>
    </div>
  );
}
