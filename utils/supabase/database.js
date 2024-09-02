import { parseISOString } from '../utils';

export async function createWorkout(
  client,
  startTime,
  endTime,
  exercises,
  notes
) {
  return await client
    .from('workouts')
    .insert({
      start_time: startTime,
      end_time: endTime,
      exercises: exercises,
      notes: notes,
    })
    .select();
}

export async function createExercise(client, name, reps, weights, notes) {
  return await client
    .from('exercises')
    .insert({
      name: name,
      reps: reps,
      weights: weights,
      notes: notes,
    })
    .select();
}

export async function loadWorkoutWithExercises(client, addExerciseName) {
  const { data, error } = await client.from('workouts').select();
  if (!error) {
    for (let i = 0; i < data.length; i++) {
      if (data[i].exercises) {
        for (let j = 0; j < data[i].exercises.length; j++) {
          const { data: exercise, error: exerciseError } = await client
            .from('exercises')
            .select()
            .eq('id', data[i].exercises[j]);
          if (!exerciseError) {
            data[i].exercises[j] = exercise[0];
            addExerciseName(
              exercise[0].name.toLowerCase(),
              data[i].end_time,
              exercise[0]
            );
          } else {
            return { data: null, error: exerciseError };
          }
        }
      }
    }
    return {
      data: data.map((workout) => ({
        ...workout,
        start_time: parseISOString(workout.start_time),
        end_time: parseISOString(workout.end_time),
      })),
      error: null,
    };
  } else {
    return { data: null, error: error };
  }
}
