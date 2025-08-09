import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWeightSummary() {
  console.log('🔍 Debugando exercises-weight-summary...');
  
  // 1. Verificar exercícios
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .limit(3);
    
  console.log(`📋 ${exercises?.length || 0} exercícios encontrados`);
  
  if (exercises && exercises.length > 0) {
    const testExercise = exercises[0];
    console.log(`🧪 Testando exercício: ${testExercise.name} (${testExercise.id})`);
    
    // 2. Verificar workoutLogExercises para este exercício
    const { data: logExercises } = await supabase
      .from('workoutLogExercises')
      .select(`
        *,
        workoutLog:workoutLogs(*)
      `)
      .eq('exerciseId', testExercise.id)
      .not('workoutLog.endTime', 'is', null);
    
    console.log(`💪 ${logExercises?.length || 0} log exercises (completos) para este exercício`);
    
    if (logExercises && logExercises.length > 0) {
      const firstLogExercise = logExercises[0];
      console.log(`🏋️ Primeiro log: ${firstLogExercise.exerciseName} em ${firstLogExercise.workoutLog?.name}`);
      
      // 3. Verificar sets para este log exercise
      const { data: sets } = await supabase
        .from('workoutLogSets')
        .select('*')
        .eq('logExerciseId', firstLogExercise.id)
        .not('weight', 'is', null);
      
      console.log(`⚖️ ${sets?.length || 0} sets com peso para este log exercise`);
      
      if (sets && sets.length > 0) {
        console.log('📊 Dados dos sets:');
        sets.forEach((set: any, i: number) => {
          console.log(`  Set ${i + 1}: ${set.reps} reps x ${set.weight}kg`);
        });
        
        const maxWeight = Math.max(...sets.map((set: any) => set.weight || 0));
        console.log(`📈 Peso máximo: ${maxWeight}kg`);
      } else {
        console.log('❌ Nenhum set com peso encontrado');
      }
    } else {
      console.log('❌ Nenhum log exercise completo encontrado');
    }
  }
  
  // 4. Simular a lógica do endpoint
  console.log('\n🔧 Simulando lógica do endpoint...');
  
  const exerciseSummaries = [];
  
  if (exercises) {
    for (const exercise of exercises.slice(0, 3)) {
      console.log(`\n🔍 Processando ${exercise.name}...`);
      
      const { data: logExercises } = await supabase
        .from('workoutLogExercises')
        .select(`
          *,
          workoutLog:workoutLogs(*)
        `)
        .eq('exerciseId', exercise.id)
        .not('workoutLog.endTime', 'is', null)
        .order('workoutLog.startTime', { ascending: false })
        .limit(3);
      
      let hasData = false;
      let lastWeight = null;
      let sessionCount = 0;
      
      if (logExercises && logExercises.length > 0) {
        for (const logExercise of logExercises) {
          const { data: sets } = await supabase
            .from('workoutLogSets')
            .select('*')
            .eq('logExerciseId', logExercise.id)
            .not('weight', 'is', null);
          
          if (sets && sets.length > 0) {
            hasData = true;
            sessionCount++;
            if (!lastWeight) {
              lastWeight = Math.max(...sets.map((set: any) => set.weight || 0));
            }
          }
        }
      }
      
      console.log(`  hasData: ${hasData}, lastWeight: ${lastWeight}, sessionCount: ${sessionCount}`);
      
      if (hasData) {
        exerciseSummaries.push({
          id: exercise.id,
          name: exercise.name,
          muscleGroup: exercise.muscleGroup,
          lastWeight,
          sessionCount
        });
      }
    }
  }
  
  console.log(`\n✅ ${exerciseSummaries.length} exercícios com dados encontrados:`);
  exerciseSummaries.forEach((summary: any) => {
    console.log(`  ${summary.name}: ${summary.lastWeight}kg (${summary.sessionCount} sessões)`);
  });
}

debugWeightSummary().catch(console.error);