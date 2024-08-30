"use client";
import { useStickyState } from "@/hooks/useStickyState";
import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { calculateWorkoutTimer } from "@/utils";

export default function Home() {
  const [inWorkout, setInWorkout] = useStickyState(false, "inWorkout");
  const [workoutStartTime, setWorkoutStartTime] = useStickyState(null, "workoutStart");
  const [workoutTimer, setWorkoutTimer] = useState("");

  useEffect(() => {
    if (workoutStartTime) {
      setWorkoutTimer("00:00")
      const timerId = setInterval(() => {
        setWorkoutTimer(calculateWorkoutTimer(workoutStartTime, Date.now()))
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [workoutStartTime]);

  return (
    <main className={styles.main}>
      {!inWorkout && (
        <div className={styles.startWorkout} onClick={() => {
          setInWorkout(true);
          setWorkoutStartTime(Date.now());
        }}>
          Start a workout
        </div>
      )}
      {inWorkout && (
        <div>
          In a workout: {workoutTimer}<br />
          <button onClick={() => {
            setInWorkout(false);
            setWorkoutStartTime(null);
          }}>end</button>
        </div>
      )}
    </main>
  );
}
