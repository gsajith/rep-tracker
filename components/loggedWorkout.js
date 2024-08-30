import { parseISOString, readableDate, readableTime } from "@/utils/utils";
import styles from "./loggedWorkout.module.css"

export default function LoggedWorkout({ data }) {
  return <div className={styles.container}>
    {readableDate(parseISOString(data.end_time)) + " " + readableTime(parseISOString(data.end_time))}
    <br />{data.notes}
  </div>
}
