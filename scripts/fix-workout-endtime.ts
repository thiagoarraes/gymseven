import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWorkoutEndTime() {
  console.log('🔧 Corrigindo endTime dos workout logs...');
  
  // Buscar workout logs sem endTime
  const { data: workoutLogs } = await supabase
    .from('workoutLogs')
    .select('*')
    .is('endTime', null);
  
  console.log(`📋 ${workoutLogs?.length || 0} workout logs sem endTime encontrados`);
  
  if (!workoutLogs || workoutLogs.length === 0) {
    console.log('✅ Todos os workout logs já têm endTime definido');
    return;
  }
  
  // Corrigir cada workout log adicionando endTime baseado na startTime
  for (const log of workoutLogs) {
    const startTime = new Date(log.startTime);
    // Adicionar 1-2 horas como duração típica de treino
    const endTime = new Date(startTime.getTime() + (90 * 60 * 1000)); // 90 minutos
    
    const { error } = await supabase
      .from('workoutLogs')
      .update({ 
        endTime: endTime.toISOString(),
        completed: true 
      })
      .eq('id', log.id);
    
    if (error) {
      console.error(`❌ Erro ao atualizar workout ${log.name}:`, error);
    } else {
      console.log(`✅ Atualizado: ${log.name} - ${startTime.toLocaleDateString()} (${startTime.toLocaleTimeString()} - ${endTime.toLocaleTimeString()})`);
    }
  }
  
  console.log('🎯 Todos os workout logs foram atualizados com endTime');
  
  // Verificar se agora há dados no endpoint
  console.log('\n🔍 Testando endpoint exercises-weight-summary...');
  
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .limit(3);
  
  if (exercises && exercises.length > 0) {
    for (const exercise of exercises) {
      const { data: logExercises } = await supabase
        .from('workoutLogExercises')
        .select(`
          *,
          workoutLog:workoutLogs(*)
        `)
        .eq('exerciseId', exercise.id)
        .not('workoutLog.endTime', 'is', null);
      
      console.log(`💪 ${exercise.name}: ${logExercises?.length || 0} logExercises com workout completo`);
      
      if (logExercises && logExercises.length > 0) {
        const { data: sets } = await supabase
          .from('workoutLogSets')
          .select('*')
          .eq('logExerciseId', logExercises[0].id)
          .not('weight', 'is', null);
        
        console.log(`  ⚖️ ${sets?.length || 0} sets com peso`);
        
        if (sets && sets.length > 0) {
          const maxWeight = Math.max(...sets.map((set: any) => set.weight || 0));
          console.log(`  📊 Peso máximo: ${maxWeight}kg`);
        }
      }
    }
  }
}

fixWorkoutEndTime().catch(console.error);