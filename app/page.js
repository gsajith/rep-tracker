"use client";
import { useSession, useUser } from "@clerk/nextjs";
import styles from "./page.module.css";
import { createClerkSupabaseClient } from "@/utils/supabase/clerk-client";
import { useEffect, useState } from "react";
import { createWorkout } from "@/utils/supabase/database";
import Workout from "@/components/workout";

export default function Home() {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  // The `useUser()` hook will be used to ensure that Clerk has loaded data about the logged in user
  const { user } = useUser();
  // The `useSession()` hook will be used to get the Clerk `session` object
  const { session } = useSession();

  const client = createClerkSupabaseClient(session);

  useEffect(() => {
    if (!user) return;

    async function loadWorkouts() {
      setLoading(true)
      const { data, error } = await client.from('workouts').select()
      if (!error) setWorkouts(data)
      setLoading(false)
    }

    loadWorkouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleCreateWorkout(e) {
    e.preventDefault();
    createWorkout(client, new Date().toISOString(), new Date().toISOString(), [], "New function")
  }

  return (
    <main className={styles.main}>
      <form onSubmit={handleCreateWorkout}>
        <button type="submit">Add</button>
      </form>

      {loading && <p>Loading...</p>}

      {!loading && workouts.length > 0 && workouts.map((workout) => <Workout data={workout} />)}

      {!loading && workouts.length === 0 && <p> No workouts found</p>}

    </main>
  );
}
