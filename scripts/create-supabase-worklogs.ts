import { supabase } from '../server/supabase-client';

async function createWorkoutLogSets() {
  try {
    console.log('🔍 Verificando workout log sets...');

    // Buscar todos os workout logs do usuário
    const { data: users } = await supabase.from('users').select('id, username').limit(1);
    if (!users || users.length === 0) return;

    const userId = users[0].id;
    console.log(`✅ Usuário: ${users[0].username}`);

    const { data: workoutLogs } = await supabase
      .from('workoutLogs')
      .select('*')
      .eq('user_id', userId);

    if (!workoutLogs) {
      console.log('❌ Nenhum workout log encontrado');
      return;
    }

    console.log(`📊 ${workoutLogs.length} workout logs encontrados`);

    for (const log of workoutLogs) {
      console.log(`\n🔧 Processando: ${log.name}`);

      // Verificar se já existem logExercises para este log
      const { data: existingLogExercises } = await supabase
        .from('workoutLogExercises')
        .select('*')
        .eq('logId', log.id);

      if (existingLogExercises && existingLogExercises.length > 0) {
        console.log(`  ✅ Log já possui ${existingLogExercises.length} exercícios`);
        
        // Verificar se tem sets
        for (const logExercise of existingLogExercises) {
          const { data: sets } = await supabase
            .from('workoutLogSets')
            .select('*')
            .eq('logExerciseId', logExercise.id);

          if (!sets || sets.length === 0) {
            console.log(`    ⚠️ Exercício ${logExercise.id} sem sets - criando...`);
            
            // Buscar template exercise para obter informações
            const { data: templateExercise } = await supabase
              .from('workoutTemplateExercises')
              .select('*')
              .eq('templateId', log.templateId)
              .eq('exerciseId', logExercise.exerciseId)
              .single();

            if (templateExercise) {
              // Criar sets baseados no template
              for (let setNum = 1; setNum <= templateExercise.sets; setNum++) {
                const { data: exercise } = await supabase
                  .from('exercises')
                  .select('muscleGroup')
                  .eq('id', logExercise.exerciseId)
                  .single();

                const weight = getRandomWeight(exercise?.muscleGroup || 'Unknown');
                const reps = templateExercise.reps + (Math.floor(Math.random() * 3) - 1);

                await supabase
                  .from('workoutLogSets')
                  .insert({
                    logExerciseId: logExercise.id,
                    setNumber: setNum,
                    reps: Math.max(1, reps),
                    weight: weight,
                    completed: true
                  });
              }
              console.log(`    ✅ ${templateExercise.sets} sets criados`);
            }
          } else {
            console.log(`    ✅ Exercício já possui ${sets.length} sets`);
          }
        }
        continue;
      }

      // Se não existem logExercises, criar do zero
      if (!log.templateId) {
        console.log('  ⚠️ Log sem template - pulando');
        continue;
      }

      // Buscar exercícios do template
      const { data: templateExercises } = await supabase
        .from('workoutTemplateExercises')
        .select('*, exercises(*)')
        .eq('templateId', log.templateId)
        .order('order');

      if (!templateExercises) {
        console.log('  ⚠️ Template sem exercícios - pulando');
        continue;
      }

      console.log(`  🔗 Criando ${templateExercises.length} exercícios no log...`);

      // Criar logExercises e sets
      for (const te of templateExercises) {
        const { data: logExercise } = await supabase
          .from('workoutLogExercises')
          .insert({
            logId: log.id,
            exerciseId: te.exerciseId,
            exerciseName: te.exercises.name,
            order: te.order
          })
          .select()
          .single();

        if (!logExercise) continue;

        // Criar sets realistas
        for (let setNum = 1; setNum <= te.sets; setNum++) {
          const weight = getRandomWeight(te.exercises.muscleGroup);
          const reps = te.reps + (Math.floor(Math.random() * 3) - 1);

          await supabase
            .from('workoutLogSets')
            .insert({
              logExerciseId: logExercise.id,
              setNumber: setNum,
              reps: Math.max(1, reps),
              weight: weight,
              completed: true
            });
        }

        console.log(`    ✅ ${te.exercises.name}: ${te.sets} sets criados`);
      }
    }

    console.log('\n🎉 Workout log sets verificados/criados com sucesso!');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

function getRandomWeight(muscleGroup: string): number {
  const baseWeights: Record<string, number> = {
    'Peito': 65,
    'Costas': 60, 
    'Pernas': 100,
    'Ombros': 30,
    'Braços': 25,
    'Core': 0
  };
  const base = baseWeights[muscleGroup] || 50;
  return Math.round(base + (Math.random() * 20 - 10));
}

createWorkoutLogSets().then(() => process.exit(0)).catch(() => process.exit(1));