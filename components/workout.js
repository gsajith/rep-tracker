import { parseISOString, readableDate, readableTime } from "@/utils/utils";
import styles from "./workout.module.css"

export default function Workout({ data }) {
  return <div key={data.id} className={styles.container}>
    {readableDate(parseISOString(data.end_time)) + " " + readableTime(parseISOString(data.end_time))}
    <br />{data.notes}
  </div>
}
