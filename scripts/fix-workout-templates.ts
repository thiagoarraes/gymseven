import { supabase } from '../server/supabase-client';

async function fixWorkoutTemplates() {
  try {
    console.log('🔧 Corrigindo templates de treino...');

    // Obter usuário
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }

    const userId = users[0].id;
    console.log(`✅ Usando usuário: ${users[0].username}`);

    // Buscar todos os templates e exercícios do usuário
    const { data: templates, error: templatesError } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('user_id', userId);

    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);

    if (templatesError || exercisesError) {
      console.error('❌ Erro ao buscar dados:', { templatesError, exercisesError });
      return;
    }

    if (!templates || !exercises) {
      console.log('❌ Templates ou exercícios não encontrados');
      return;
    }

    console.log(`📋 ${templates.length} templates encontrados`);
    console.log(`💪 ${exercises.length} exercícios encontrados`);

    // Limpar exercícios existentes dos templates
    for (const template of templates) {
      await supabase
        .from('workoutTemplateExercises')
        .delete()
        .eq('templateId', template.id);
    }

    // Função para encontrar exercício por nome
    const findExercise = (name: string) => exercises.find(ex => ex.name === name);

    // Configurações de exercícios para cada template
    const templateConfigs = [
      {
        name: "Treino A - Peito e Tríceps",
        exercises: [
          { name: "Supino Reto", sets: 4, reps: 12, order: 1 },
          { name: "Supino Inclinado", sets: 3, reps: 10, order: 2 },
          { name: "Crucifixo", sets: 3, reps: 12, order: 3 },
          { name: "Flexão de Braço", sets: 3, reps: 15, order: 4 },
          { name: "Tríceps Pulley", sets: 4, reps: 15, order: 5 },
          { name: "Tríceps Francês", sets: 3, reps: 12, order: 6 },
        ]
      },
      {
        name: "Treino B - Costas e Bíceps",
        exercises: [
          { name: "Puxada Frontal", sets: 4, reps: 12, order: 1 },
          { name: "Remada Curvada", sets: 4, reps: 10, order: 2 },
          { name: "Pulldown", sets: 3, reps: 12, order: 3 },
          { name: "Remada Sentada", sets: 3, reps: 12, order: 4 },
          { name: "Rosca Direta", sets: 4, reps: 12, order: 5 },
          { name: "Rosca Martelo", sets: 3, reps: 15, order: 6 },
        ]
      },
      {
        name: "Treino C - Pernas Completo",
        exercises: [
          { name: "Agachamento Livre", sets: 4, reps: 12, order: 1 },
          { name: "Leg Press", sets: 4, reps: 15, order: 2 },
          { name: "Stiff", sets: 3, reps: 12, order: 3 },
          { name: "Cadeira Extensora", sets: 3, reps: 15, order: 4 },
          { name: "Mesa Flexora", sets: 3, reps: 12, order: 5 },
          { name: "Panturrilha em Pé", sets: 4, reps: 20, order: 6 },
        ]
      },
      {
        name: "Treino D - Ombros e Core",
        exercises: [
          { name: "Desenvolvimento Militar", sets: 4, reps: 12, order: 1 },
          { name: "Elevação Lateral", sets: 4, reps: 15, order: 2 },
          { name: "Elevação Posterior", sets: 3, reps: 15, order: 3 },
          { name: "Desenvolvimento com Halteres", sets: 3, reps: 12, order: 4 },
          { name: "Prancha", sets: 3, reps: 60, order: 5 },
          { name: "Abdominal Reto", sets: 3, reps: 20, order: 6 },
        ]
      },
      {
        name: "Treino Push - Empurrar",
        exercises: [
          { name: "Supino Reto", sets: 4, reps: 10, order: 1 },
          { name: "Desenvolvimento Militar", sets: 3, reps: 12, order: 2 },
          { name: "Supino Inclinado", sets: 3, reps: 12, order: 3 },
          { name: "Elevação Lateral", sets: 3, reps: 15, order: 4 },
          { name: "Tríceps Pulley", sets: 3, reps: 15, order: 5 },
        ]
      },
      {
        name: "Treino Pull - Puxar",
        exercises: [
          { name: "Puxada Frontal", sets: 4, reps: 10, order: 1 },
          { name: "Remada Curvada", sets: 4, reps: 10, order: 2 },
          { name: "Remada Sentada", sets: 3, reps: 12, order: 3 },
          { name: "Rosca Direta", sets: 3, reps: 12, order: 4 },
          { name: "Rosca Martelo", sets: 3, reps: 15, order: 5 },
        ]
      },
      {
        name: "Treino Full Body",
        exercises: [
          { name: "Agachamento Livre", sets: 3, reps: 12, order: 1 },
          { name: "Supino Reto", sets: 3, reps: 12, order: 2 },
          { name: "Puxada Frontal", sets: 3, reps: 12, order: 3 },
          { name: "Desenvolvimento Militar", sets: 3, reps: 12, order: 4 },
          { name: "Prancha", sets: 3, reps: 45, order: 5 },
        ]
      }
    ];

    // Adicionar exercícios a cada template
    for (const config of templateConfigs) {
      const template = templates.find(t => t.name === config.name);
      if (!template) {
        console.log(`⚠️ Template não encontrado: ${config.name}`);
        continue;
      }

      console.log(`🔗 Adicionando exercícios ao ${config.name}...`);

      for (const exerciseConfig of config.exercises) {
        const exercise = findExercise(exerciseConfig.name);
        if (!exercise) {
          console.log(`⚠️ Exercício não encontrado: ${exerciseConfig.name}`);
          continue;
        }

        const { error: insertError } = await supabase
          .from('workoutTemplateExercises')
          .insert({
            templateId: template.id,
            exerciseId: exercise.id,
            sets: exerciseConfig.sets,
            reps: exerciseConfig.reps,
            order: exerciseConfig.order,
            restDurationSeconds: 90,
            weight: null
          });

        if (insertError) {
          console.error(`❌ Erro ao adicionar ${exerciseConfig.name}:`, insertError);
        }
      }

      console.log(`✅ ${config.name} configurado`);
    }

    // Agora vamos corrigir os logs de treino adicionando exercícios e sets
    console.log('📊 Corrigindo logs de treino...');

    const { data: workoutLogs, error: logsError } = await supabase
      .from('workoutLogs')
      .select('*')
      .eq('user_id', userId);

    if (logsError || !workoutLogs) {
      console.log('⚠️ Nenhum log de treino encontrado');
      return;
    }

    for (const log of workoutLogs) {
      // Limpar dados existentes do log
      await supabase.from('workoutLogSets').delete().eq('logExerciseId', log.id);
      await supabase.from('workoutLogExercises').delete().eq('logId', log.id);

      if (!log.templateId) continue;

      // Buscar exercícios do template
      const { data: templateExercises, error: teError } = await supabase
        .from('workoutTemplateExercises')
        .select('*, exercises(*)')
        .eq('templateId', log.templateId)
        .order('order');

      if (teError || !templateExercises) continue;

      // Criar log exercises e sets
      for (const templateExercise of templateExercises) {
        const { data: logExercise, error: leError } = await supabase
          .from('workoutLogExercises')
          .insert({
            logId: log.id,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order
          })
          .select()
          .single();

        if (leError || !logExercise) continue;

        // Criar sets com dados realistas
        for (let setNumber = 1; setNumber <= templateExercise.sets; setNumber++) {
          const baseWeight = getBaseWeight(templateExercise.exercises.muscleGroup);
          const weight = baseWeight + (Math.random() * 20 - 10);
          const reps = templateExercise.reps + (Math.floor(Math.random() * 3) - 1);

          await supabase
            .from('workoutLogSets')
            .insert({
              logExerciseId: logExercise.id,
              setNumber: setNumber,
              reps: Math.max(1, reps),
              weight: Math.max(0, weight),
              completed: true
            });
        }
      }

      console.log(`✅ Log corrigido: ${log.name}`);
    }

    console.log('🎉 Templates e logs corrigidos com sucesso!');

  } catch (error) {
    console.error('❌ Erro ao corrigir templates:', error);
  }
}

function getBaseWeight(muscleGroup: string): number {
  const weights: Record<string, number> = {
    'Peito': 60,
    'Costas': 55,
    'Pernas': 80,
    'Ombros': 25,
    'Braços': 20,
    'Core': 0
  };
  return weights[muscleGroup] || 40;
}

// Executar
fixWorkoutTemplates()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));