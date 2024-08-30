import { readableDate, readableTime } from "@/utils/utils";
import styles from "./loggedWorkout.module.css"
import { LetsIconsComment } from "./SVGIcons/LetsIconsComment";

export default function LoggedWorkout({ data }) {
  console.log(data);
  return <div className={styles.container}>
    <div className={styles.header}>
      <span className={styles.title}>{readableDate(data.end_time)}</span>
      <div className={styles.times}>
        <span>2 days ago</span>
        <span>{readableTime(data.end_time)}</span>
      </div>
    </div>
    <div className={styles.exercisesContainer}>
      <div className={styles.exercises}>
        {data.exercises.map(exercise => {
          return <div className={styles.exercise}>
            <div className={styles.exerciseName}>{exercise.name}</div>
            {exercise.notes && exercise.notes.length > 0 && <div className={styles.commentIcon} title={exercise.notes}><LetsIconsComment /></div>}
          </div>;
        })}
      </div>
    </div>
    <br />{data.notes}
  </div>
}
