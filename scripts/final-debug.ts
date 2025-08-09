import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function finalDebug() {
  console.log('🔬 Debug final completo...');
  
  // 1. Verificar workout logs
  const { data: workoutLogs } = await supabase
    .from('workoutLogs')
    .select('*')
    .limit(3);
    
  console.log(`📋 ${workoutLogs?.length || 0} workout logs:`);
  workoutLogs?.forEach((log: any) => {
    console.log(`  ${log.name}: startTime=${log.startTime}, endTime=${log.endTime}, completed=${log.completed}`);
  });
  
  if (workoutLogs && workoutLogs.length > 0) {
    const testLog = workoutLogs[0];
    
    // 2. Verificar workout log exercises
    const { data: logExercises } = await supabase
      .from('workoutLogExercises')
      .select('*')
      .eq('workoutLogId', testLog.id);
    
    console.log(`\n💪 ${logExercises?.length || 0} workout log exercises para ${testLog.name}:`);
    
    if (logExercises && logExercises.length > 0) {
      const testLogExercise = logExercises[0];
      console.log(`  ${testLogExercise.exerciseName} (exerciseId: ${testLogExercise.exerciseId})`);
      
      // 3. Verificar sets
      const { data: sets } = await supabase
        .from('workoutLogSets')
        .select('*')
        .eq('logExerciseId', testLogExercise.id);
      
      console.log(`\n⚖️ ${sets?.length || 0} sets para ${testLogExercise.exerciseName}:`);
      sets?.forEach((set: any) => {
        console.log(`  Set ${set.setNumber}: ${set.reps} reps x ${set.weight}kg`);
      });
      
      // 4. Testar o join específico que está falhando
      console.log('\n🔍 Testando join específico...');
      const { data: joinTest, error: joinError } = await supabase
        .from('workoutLogExercises')
        .select(`
          *,
          workoutLog:workoutLogs(*)
        `)
        .eq('exerciseId', testLogExercise.exerciseId)
        .not('workoutLog.endTime', 'is', null);
      
      if (joinError) {
        console.error('❌ Erro no join:', joinError);
      } else {
        console.log(`✅ Join funcionou: ${joinTest?.length || 0} resultados`);
        joinTest?.forEach((result: any) => {
          console.log(`  ${result.exerciseName} em ${result.workoutLog?.name}`);
        });
      }
    }
  }
  
  // 5. Teste direto do problema
  console.log('\n🎯 Testando problema específico...');
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .limit(1);
  
  if (exercises && exercises.length > 0) {
    const exercise = exercises[0];
    console.log(`🧪 Testando exercício: ${exercise.name}`);
    
    // Query sem join primeiro
    const { data: logExercisesSimple } = await supabase
      .from('workoutLogExercises')
      .select('*')
      .eq('exerciseId', exercise.id);
    
    console.log(`💪 ${logExercisesSimple?.length || 0} logExercises simples encontrados`);
    
    // Query com join
    const { data: logExercisesJoin, error: joinError2 } = await supabase
      .from('workoutLogExercises')
      .select(`
        *,
        workoutLog:workoutLogs(*)
      `)
      .eq('exerciseId', exercise.id)
      .not('workoutLog.endTime', 'is', null);
    
    if (joinError2) {
      console.error('❌ Erro no join completo:', joinError2);
    } else {
      console.log(`🔗 ${logExercisesJoin?.length || 0} logExercises com join e filtro endTime`);
    }
    
    // Query apenas com workoutLogs válidos
    const { data: validWorkoutLogs } = await supabase
      .from('workoutLogs')
      .select('*')
      .not('endTime', 'is', null);
    
    console.log(`✅ ${validWorkoutLogs?.length || 0} workout logs com endTime válido`);
  }
}

finalDebug().catch(console.error);