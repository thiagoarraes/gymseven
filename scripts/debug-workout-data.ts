import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWorkoutData() {
  console.log('🔍 Debugando dados de treino...');

  // 1. Verificar workoutLogs
  const { data: workoutLogs } = await supabase
    .from('workoutLogs')
    .select('*')
    .limit(3);
  
  console.log(`📋 ${workoutLogs?.length || 0} workout logs encontrados`);
  
  if (workoutLogs && workoutLogs.length > 0) {
    const firstLog = workoutLogs[0];
    console.log(`📝 Primeiro log: ${firstLog.name}`);
    
    // 2. Verificar workoutLogExercises para este log
    const { data: logExercises } = await supabase
      .from('workoutLogExercises')
      .select('*')
      .eq('logId', firstLog.id);
    
    console.log(`💪 ${logExercises?.length || 0} exercícios encontrados para este log`);
    
    if (logExercises && logExercises.length > 0) {
      const firstExercise = logExercises[0];
      console.log(`🏋️ Primeiro exercício: ${firstExercise.exerciseName}`);
      
      // 3. Verificar workoutLogSets para este exercício
      const { data: sets } = await supabase
        .from('workoutLogSets')
        .select('*')
        .eq('logExerciseId', firstExercise.id);
      
      console.log(`⚖️ ${sets?.length || 0} séries encontradas para este exercício`);
      
      if (sets && sets.length > 0) {
        console.log('📊 Dados das séries:');
        sets.forEach((set: any, index: number) => {
          console.log(`  Série ${index + 1}: ${set.reps} reps x ${set.weight}kg`);
        });
      } else {
        console.log('❌ Nenhuma série encontrada - este é o problema!');
      }
    } else {
      console.log('❌ Nenhum exercício encontrado para este log');
    }
  }

  // 4. Verificar exercícios base
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .limit(5);
  
  console.log(`🎯 ${exercises?.length || 0} exercícios base encontrados`);
  
  // 5. Verificar dados para um exercício específico
  if (exercises && exercises.length > 0) {
    const testExercise = exercises[0];
    console.log(`🧪 Testando exercício: ${testExercise.name}`);
    
    const { data: exerciseHistory } = await supabase
      .from('workoutLogExercises')
      .select(`
        *,
        workoutLog:workoutLogs(*)
      `)
      .eq('exerciseId', testExercise.id);
    
    console.log(`📈 ${exerciseHistory?.length || 0} registros de histórico para este exercício`);
  }
}

debugWorkoutData().catch(console.error);