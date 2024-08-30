export async function createWorkout(client, startTime, endTime, exercises, notes) {
  await client.from("workouts").insert({
    start_time: startTime,
    end_time: endTime,
    exercises: exercises,
    notes: notes
  });
}
