import { supabase } from '../server/supabase-client';

async function fixTemplatesSimple() {
  try {
    console.log('🔧 Corrigindo templates com schema atual...');

    const { data: users } = await supabase.from('users').select('id, username').limit(1);
    if (!users || users.length === 0) return;

    const userId = users[0].id;
    console.log(`✅ Usuário: ${users[0].username}`);

    // Buscar templates e exercícios
    const { data: templates } = await supabase.from('workoutTemplates').select('*').eq('user_id', userId);
    const { data: exercises } = await supabase.from('exercises').select('*').eq('user_id', userId);

    if (!templates || !exercises) {
      console.log('❌ Dados não encontrados');
      return;
    }

    // Limpar dados existentes
    for (const template of templates) {
      await supabase.from('workoutTemplateExercises').delete().eq('templateId', template.id);
    }

    // Exercícios para cada template
    const configs = [
      {
        name: "Treino A - Peito e Tríceps",
        exercises: ["Supino Reto", "Supino Inclinado", "Crucifixo", "Tríceps Pulley"]
      },
      {
        name: "Treino B - Costas e Bíceps", 
        exercises: ["Puxada Frontal", "Remada Curvada", "Rosca Direta", "Rosca Martelo"]
      },
      {
        name: "Treino C - Pernas Completo",
        exercises: ["Agachamento Livre", "Leg Press", "Stiff", "Panturrilha em Pé"]
      },
      {
        name: "Treino D - Ombros e Core",
        exercises: ["Desenvolvimento Militar", "Elevação Lateral", "Prancha", "Abdominal Reto"]
      },
      {
        name: "Treino Push - Empurrar",
        exercises: ["Supino Reto", "Desenvolvimento Militar", "Elevação Lateral", "Tríceps Pulley"]
      },
      {
        name: "Treino Pull - Puxar",
        exercises: ["Puxada Frontal", "Remada Curvada", "Rosca Direta", "Rosca Martelo"]
      },
      {
        name: "Treino Full Body",
        exercises: ["Agachamento Livre", "Supino Reto", "Puxada Frontal", "Desenvolvimento Militar"]
      }
    ];

    // Adicionar exercícios aos templates
    for (const config of configs) {
      const template = templates.find(t => t.name === config.name);
      if (!template) continue;

      console.log(`🔗 ${config.name}...`);

      for (let i = 0; i < config.exercises.length; i++) {
        const exerciseName = config.exercises[i];
        const exercise = exercises.find(ex => ex.name === exerciseName);
        if (!exercise) continue;

        // Inserir com campos mínimos que existem no schema
        const { error } = await supabase
          .from('workoutTemplateExercises')
          .insert({
            templateId: template.id,
            exerciseId: exercise.id,
            sets: 3,
            reps: 12,
            order: i + 1
          });

        if (!error) {
          console.log(`  ✅ ${exerciseName} adicionado`);
        } else {
          console.log(`  ❌ ${exerciseName}: ${error.message}`);
        }
      }
    }

    // Corrigir logs de treino
    console.log('📊 Corrigindo logs...');
    const { data: logs } = await supabase.from('workoutLogs').select('*').eq('user_id', userId);

    if (logs) {
      for (const log of logs) {
        if (!log.templateId) continue;

        // Limpar dados existentes
        const { data: existingLogExercises } = await supabase
          .from('workoutLogExercises')
          .select('id')
          .eq('logId', log.id);

        if (existingLogExercises) {
          for (const logEx of existingLogExercises) {
            await supabase.from('workoutLogSets').delete().eq('logExerciseId', logEx.id);
          }
        }
        await supabase.from('workoutLogExercises').delete().eq('logId', log.id);

        // Buscar exercícios do template
        const { data: templateExercises } = await supabase
          .from('workoutTemplateExercises')
          .select('*, exercises(*)')
          .eq('templateId', log.templateId)
          .order('order');

        if (!templateExercises) continue;

        // Criar log exercises e sets
        for (const te of templateExercises) {
          const { data: logExercise } = await supabase
            .from('workoutLogExercises')
            .insert({
              logId: log.id,
              exerciseId: te.exerciseId,
              order: te.order
            })
            .select()
            .single();

          if (!logExercise) continue;

          // Criar sets com dados realistas
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
        }

        console.log(`✅ Log: ${log.name}`);
      }
    }

    console.log('🎉 Correção concluída!');

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
  return base + (Math.random() * 20 - 10);
}

fixTemplatesSimple().then(() => process.exit(0)).catch(() => process.exit(1));