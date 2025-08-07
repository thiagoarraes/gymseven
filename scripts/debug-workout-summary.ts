import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWorkoutSummary() {
  const workoutId = '85e48ac1-30e2-4574-bb70-f3da6164a68c';
  
  console.log('🔍 Debugging workout summary for:', workoutId);
  
  // 1. Check workout log
  const { data: workoutLog, error: logError } = await supabase
    .from('workoutLogs')
    .select('*')
    .eq('id', workoutId)
    .single();
  
  console.log('📋 Workout Log:', workoutLog);
  if (logError) console.log('❌ Log Error:', logError);
  
  // 2. Check workout log exercises
  const { data: logExercises, error: exercisesError } = await supabase
    .from('workoutLogExercises')
    .select('*')
    .eq('logId', workoutId);
  
  console.log('🏋️ Log Exercises:', logExercises);
  if (exercisesError) console.log('❌ Exercises Error:', exercisesError);
  
  // 3. Check workout log sets
  if (logExercises && logExercises.length > 0) {
    for (const logExercise of logExercises) {
      const { data: sets, error: setsError } = await supabase
        .from('workoutLogSets')
        .select('*')
        .eq('logExerciseId', logExercise.id);
      
      console.log(`📊 Sets for exercise ${logExercise.id}:`, sets);
      if (setsError) console.log('❌ Sets Error:', setsError);
      
      // Also get exercise details
      const { data: exercise, error: exerciseError } = await supabase
        .from('exercises')
        .select('*')
        .eq('id', logExercise.exerciseId)
        .single();
      
      console.log(`🏋️‍♂️ Exercise details for ${logExercise.exerciseId}:`, exercise);
      if (exerciseError) console.log('❌ Exercise Error:', exerciseError);
    }
  }
  
  // 4. Check available tables
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .like('table_name', '%workout%');
  
  console.log('📁 Available workout tables:', tables);
  if (tablesError) console.log('❌ Tables Error:', tablesError);
}

debugWorkoutSummary().catch(console.error);