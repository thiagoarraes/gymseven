import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProgressEndpoint() {
  console.log('🔧 Corrigindo endpoint de progresso...');
  
  // 1. Verificar estrutura de dados
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .limit(3);
    
  if (!exercises || exercises.length === 0) {
    console.log('❌ Nenhum exercício encontrado');
    return;
  }
  
  console.log(`📋 ${exercises.length} exercícios encontrados`);
  
  const exerciseSummaries = [];
  
  for (const exercise of exercises) {
    console.log(`\n🔍 Processando: ${exercise.name}`);
    
    // Buscar workout log exercises
    const { data: logExercises } = await supabase
      .from('workoutLogExercises')
      .select('*')
      .eq('exerciseId', exercise.id);
    
    console.log(`  💪 ${logExercises?.length || 0} logExercises encontrados`);
    
    if (!logExercises || logExercises.length === 0) {
      continue;
    }
    
    // Verificar quais workout logs estão completos
    const validLogExercises = [];
    for (const logExercise of logExercises) {
      const { data: workoutLog } = await supabase
        .from('workoutLogs')
        .select('*')
        .eq('id', logExercise.workoutLogId)
        .not('endTime', 'is', null)
        .single();
      
      if (workoutLog) {
        validLogExercises.push({
          ...logExercise,
          workoutLog
        });
      }
    }
    
    console.log(`  ✅ ${validLogExercises.length} logExercises com workout completo`);
    
    if (validLogExercises.length === 0) {
      continue;
    }
    
    // Buscar sets com peso
    let hasData = false;
    let lastWeight = null;
    let sessionCount = 0;
    
    for (const logExercise of validLogExercises.slice(0, 3)) {
      const { data: sets } = await supabase
        .from('workoutLogSets')
        .select('*')
        .eq('logExerciseId', logExercise.id)
        .not('weight', 'is', null);
      
      console.log(`  ⚖️ ${sets?.length || 0} sets com peso para logExercise ${logExercise.id}`);
      
      if (sets && sets.length > 0) {
        hasData = true;
        sessionCount++;
        if (!lastWeight) {
          lastWeight = Math.max(...sets.map((set: any) => set.weight || 0));
        }
      }
    }
    
    console.log(`  📊 hasData: ${hasData}, lastWeight: ${lastWeight}, sessionCount: ${sessionCount}`);
    
    if (hasData) {
      exerciseSummaries.push({
        exerciseId: exercise.id,
        id: exercise.id,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        lastWeight,
        sessionCount
      });
    }
  }
  
  console.log(`\n🎯 RESULTADO FINAL: ${exerciseSummaries.length} exercícios com dados`);
  exerciseSummaries.forEach(summary => {
    console.log(`  ${summary.name}: ${summary.lastWeight}kg (${summary.sessionCount} sessões)`);
  });
  
  return exerciseSummaries;
}

fixProgressEndpoint().catch(console.error);