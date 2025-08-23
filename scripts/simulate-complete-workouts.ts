import { supabase } from '../server/supabase-client';

async function simulateCompleteWorkouts() {
  console.log('🏋️ Iniciando simulação de treinos completos...');

  try {
    // 1. Primeiro, encontrar ou criar um usuário de teste
    let user;
    const { data: existingUsers } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (existingUsers && existingUsers.length > 0) {
      user = existingUsers[0];
      console.log(`👤 Usando usuário existente: ${user.username}`);
    } else {
      // Criar usuário de teste
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          email: 'teste@gymseven.com',
          username: 'thiago_teste',
          password: '$2b$10$test.hash',
          first_name: 'Thiago',
          last_name: 'Teste',
          height: 180,
          weight: 75,
          activity_level: 'moderado',
          experience_level: 'intermediário',
          fitness_goals: ['Ganhar massa muscular', 'Aumentar força']
        })
        .select()
        .single();

      if (userError) {
        console.error('Erro ao criar usuário:', userError);
        return;
      }
      user = newUser;
      console.log(`👤 Usuário criado: ${user.username}`);
    }

    // 2. Criar exercícios se não existirem
    const exercisesData = [
      { name: 'Supino Reto', muscleGroup: 'Peito', description: 'Exercício fundamental para peito' },
      { name: 'Agachamento', muscleGroup: 'Pernas', description: 'Exercício composto para pernas' },
      { name: 'Levantamento Terra', muscleGroup: 'Costas', description: 'Exercício composto para costas' },
      { name: 'Desenvolvimento', muscleGroup: 'Ombros', description: 'Exercício para ombros' },
      { name: 'Rosca Direta', muscleGroup: 'Bíceps', description: 'Exercício para bíceps' },
      { name: 'Tríceps Testa', muscleGroup: 'Tríceps', description: 'Exercício para tríceps' },
      { name: 'Remada Curvada', muscleGroup: 'Costas', description: 'Exercício para costas' },
      { name: 'Leg Press', muscleGroup: 'Pernas', description: 'Exercício para pernas' }
    ];

    console.log('💪 Criando exercícios...');
    const createdExercises: any[] = [];
    
    for (const exercise of exercisesData) {
      const { data: existingExercise } = await supabase
        .from('exercises')
        .select('*')
        .eq('name', exercise.name)
        .eq('user_id', user.id)
        .single();

      if (!existingExercise) {
        const { data: newExercise, error } = await supabase
          .from('exercises')
          .insert({
            ...exercise,
            user_id: user.id
          })
          .select()
          .single();

        if (!error) {
          createdExercises.push(newExercise);
          console.log(`  ✅ Criado: ${exercise.name}`);
        }
      } else {
        createdExercises.push(existingExercise);
        console.log(`  ⏭️ Já existe: ${exercise.name}`);
      }
    }

    // 3. Criar templates de treino
    const templatesData = [
      {
        name: 'Treino A - Peito e Tríceps',
        description: 'Foco em peito e tríceps',
        exercises: [
          { name: 'Supino Reto', sets: 4, reps: '8-12', weight: 80, restDuration: 120 },
          { name: 'Desenvolvimento', sets: 3, reps: '10-12', weight: 50, restDuration: 90 },
          { name: 'Tríceps Testa', sets: 3, reps: '12-15', weight: 30, restDuration: 60 }
        ]
      },
      {
        name: 'Treino B - Costas e Bíceps',
        description: 'Foco em costas e bíceps',
        exercises: [
          { name: 'Levantamento Terra', sets: 4, reps: '6-8', weight: 100, restDuration: 180 },
          { name: 'Remada Curvada', sets: 4, reps: '8-10', weight: 70, restDuration: 120 },
          { name: 'Rosca Direta', sets: 3, reps: '10-12', weight: 40, restDuration: 90 }
        ]
      },
      {
        name: 'Treino C - Pernas',
        description: 'Foco em membros inferiores',
        exercises: [
          { name: 'Agachamento', sets: 4, reps: '8-12', weight: 90, restDuration: 150 },
          { name: 'Leg Press', sets: 3, reps: '12-15', weight: 200, restDuration: 120 }
        ]
      }
    ];

    console.log('📋 Criando templates de treino...');
    const createdTemplates: any[] = [];

    for (const template of templatesData) {
      // Criar template
      const { data: newTemplate, error: templateError } = await supabase
        .from('workoutTemplates')
        .insert({
          name: template.name,
          description: template.description,
          user_id: user.id
        })
        .select()
        .single();

      if (templateError) {
        console.error(`Erro ao criar template ${template.name}:`, templateError);
        continue;
      }

      console.log(`  ✅ Template criado: ${template.name}`);
      createdTemplates.push(newTemplate);

      // Adicionar exercícios ao template
      for (let i = 0; i < template.exercises.length; i++) {
        const exerciseData = template.exercises[i];
        const exercise = createdExercises.find(e => e.name === exerciseData.name);
        
        if (exercise) {
          const { error: exerciseError } = await supabase
            .from('workoutTemplateExercises')
            .insert({
              templateId: newTemplate.id,
              exerciseId: exercise.id,
              sets: exerciseData.sets,
              reps: exerciseData.reps,
              weight: exerciseData.weight,
              restDurationSeconds: exerciseData.restDuration,
              order: i + 1
            });

          if (!exerciseError) {
            console.log(`    ✅ Exercício adicionado: ${exerciseData.name}`);
          }
        }
      }
    }

    // 4. Simular treinos concluídos (últimos 30 dias)
    console.log('🏃 Simulando treinos concluídos...');
    const today = new Date();
    const workoutDates: Date[] = [];
    
    // Criar 15 treinos nos últimos 30 dias
    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const workoutDate = new Date(today);
      workoutDate.setDate(workoutDate.getDate() - daysAgo);
      workoutDates.push(workoutDate);
    }

    workoutDates.sort((a, b) => b.getTime() - a.getTime()); // Mais recente primeiro

    for (let i = 0; i < workoutDates.length; i++) {
      const workoutDate = workoutDates[i];
      const template = createdTemplates[i % createdTemplates.length]; // Alternar entre templates
      
      // Criar início e fim do treino
      const startTime = new Date(workoutDate);
      startTime.setHours(Math.floor(Math.random() * 12) + 7); // Entre 7h e 19h
      startTime.setMinutes(Math.floor(Math.random() * 60));
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + Math.floor(Math.random() * 60) + 45); // 45-105 min

      // Criar log do treino
      const { data: workoutLog, error: logError } = await supabase
        .from('workoutLogs')
        .insert({
          user_id: user.id,
          templateId: template.id,
          name: template.name,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
        .select()
        .single();

      if (logError) {
        console.error(`Erro ao criar log de treino:`, logError);
        continue;
      }

      console.log(`  📅 Treino concluído: ${template.name} em ${workoutDate.toLocaleDateString()}`);

      // Buscar exercícios do template
      const { data: templateExercises } = await supabase
        .from('workoutTemplateExercises')
        .select(`
          *,
          exercises (*)
        `)
        .eq('template_id', template.id)
        .order('order');

      if (templateExercises) {
        // Criar workout_log_exercises para cada exercício
        for (const templateExercise of templateExercises) {
          const { data: logExercise, error: exerciseError } = await supabase
            .from('workoutLogExercises')
            .insert({
              logId: workoutLog.id,
              exerciseId: templateExercise.exerciseId,
              exerciseName: templateExercise.exercises.name,
              order: templateExercise.order
            })
            .select()
            .single();

          if (exerciseError) {
            console.error(`Erro ao criar log exercise:`, exerciseError);
            continue;
          }

          // Criar sets para cada exercício
          const numSets = templateExercise.sets;
          for (let setNum = 1; setNum <= numSets; setNum++) {
            // Simular variação de peso e reps
            const baseWeight = templateExercise.weight || 50;
            const weightVariation = Math.floor(Math.random() * 10) - 5; // ±5kg
            const finalWeight = Math.max(baseWeight + weightVariation, 10);
            
            const baseReps = parseInt(templateExercise.reps.split('-')[0]) || 10;
            const repsVariation = Math.floor(Math.random() * 4); // +0 a +3 reps
            const finalReps = baseReps + repsVariation;

            const { error: setError } = await supabase
              .from('workoutLogSets')
              .insert({
                logExerciseId: logExercise.id,
                setNumber: setNum,
                reps: finalReps,
                weight: finalWeight,
                completed: true
              });

            if (!setError) {
              console.log(`    ✅ Set ${setNum}: ${finalReps} reps x ${finalWeight}kg`);
            }
          }
        }
      }
    }

    console.log('✨ Simulação de treinos completos finalizada!');
    console.log(`📊 Resumo:`);
    console.log(`   - Usuário: ${user.username}`);
    console.log(`   - Exercícios: ${createdExercises.length}`);
    console.log(`   - Templates: ${createdTemplates.length}`);
    console.log(`   - Treinos concluídos: ${workoutDates.length}`);

  } catch (error) {
    console.error('❌ Erro na simulação:', error);
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  simulateCompleteWorkouts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { simulateCompleteWorkouts };