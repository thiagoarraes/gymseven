import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWeightData() {
  console.log('🔍 Debugging weight data for Afundo exercise...');
  
  // 1. Check recent workout logs
  const { data: recentWorkouts } = await supabase
    .from('workoutLogs')
    .select('*')
    .order('startTime', { ascending: false })
    .limit(5);
  
  console.log('📅 Recent workout logs:', recentWorkouts);
  
  // 2. Check all workout log exercises
  const { data: allLogExercises } = await supabase
    .from('workoutLogExercises')
    .select(`
      *,
      exercise:exercises(*),
      workoutLog:workoutLogs(*)
    `)
    .order('createdAt', { ascending: false })
    .limit(10);
  
  console.log('🏋️ Recent workout log exercises:', allLogExercises);
  
  // 3. Find Afundo exercise
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('name', 'Afundo')
    .single();
  
  console.log('💪 Afundo exercise:', exercise);
  
  if (!exercise) {
    console.log('❌ Afundo exercise not found');
    return;
  }
  
  // 4. Find workout log exercises for Afundo specifically
  const { data: logExercises } = await supabase
    .from('workoutLogExercises')
    .select(`
      *,
      workoutLog:workoutLogs(*)
    `)
    .eq('exerciseId', exercise.id);
  
  console.log('📝 Workout log exercises for Afundo:', logExercises);
  
  if (!logExercises || logExercises.length === 0) {
    console.log('❌ No workout log exercises found for Afundo');
    
    // Check if there are template exercises for this
    const { data: templateExercises } = await supabase
      .from('workoutTemplateExercises')
      .select(`
        *,
        exercise:exercises(*),
        template:workoutTemplates(*)
      `)
      .eq('exerciseId', exercise.id);
    
    console.log('📋 Template exercises with Afundo:', templateExercises);
    return;
  }
  
  // 3. Check workout log sets for each exercise
  for (const logExercise of logExercises) {
    console.log(`\n🏋️ Checking sets for workout log exercise ${logExercise.id}:`);
    
    const { data: sets } = await supabase
      .from('workoutLogSets')
      .select('*')
      .eq('logExerciseId', logExercise.id);
    
    console.log('Sets data:', sets);
    
    if (sets && sets.length > 0) {
      const weights = sets.map(set => set.weight).filter(w => w !== null);
      console.log('Weights found:', weights);
      
      if (weights.length > 0) {
        const maxWeight = Math.max(...weights);
        console.log(`✅ Max weight for this session: ${maxWeight}kg`);
      } else {
        console.log('⚠️ No weight data in sets');
      }
    } else {
      console.log('❌ No sets found for this exercise');
    }
  }
  
  // 4. Check if there are any weight records at all
  const { data: allSets } = await supabase
    .from('workoutLogSets')
    .select('*')
    .not('weight', 'is', null);
  
  console.log(`\n📊 Total sets with weight data in database: ${allSets?.length || 0}`);
  
  if (allSets && allSets.length > 0) {
    console.log('Sample sets with weight:', allSets.slice(0, 3));
  }
}

debugWeightData().catch(console.error);