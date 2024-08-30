export async function createWorkout(
  client,
  startTime,
  endTime,
  exercises,
  notes
) {
  await client.from('workouts').insert({
    start_time: startTime,
    end_time: endTime,
    exercises: exercises,
    notes: notes,
  });
}

export async function createExercise(client, name, reps, weights, notes) {
  await client.from('exercises').insert({
    name: name,
    reps: reps,
    weights: weights,
    notes: notes,
  });
}
