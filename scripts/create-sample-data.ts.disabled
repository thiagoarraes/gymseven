import { supabase } from '../server/supabase-client';
import { randomUUID } from 'crypto';

async function createSampleData() {
  try {
    console.log('🏗️ Criando dados de exemplo para o GymSeven...');

    // Primeiro, vamos obter um usuário real do sistema para associar os dados
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError) throw userError;

    let userId: string;
    if (users && users.length > 0) {
      userId = users[0].id;
      console.log(`✅ Usando usuário existente: ${userId}`);
    } else {
      // Criar um usuário de exemplo se não houver nenhum
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          username: 'demo',
          email: 'demo@gymseven.com',
          password: '$2a$10$example', // Hash de exemplo
          firstName: 'Demo',
          lastName: 'User'
        })
        .select()
        .single();

      if (createUserError) throw createUserError;
      userId = newUser.id;
      console.log(`✅ Usuário demo criado: ${userId}`);
    }

    // 1. Criar exercícios variados
    console.log('💪 Criando exercícios...');
    const exercises = [
      // Peito
      { name: "Supino Reto", muscleGroup: "Peito", description: "Exercício fundamental para desenvolvimento do peitoral" },
      { name: "Supino Inclinado", muscleGroup: "Peito", description: "Trabalha a parte superior do peitoral" },
      { name: "Crucifixo", muscleGroup: "Peito", description: "Isolamento do peitoral com movimento de abertura" },
      { name: "Flexão de Braço", muscleGroup: "Peito", description: "Exercício com peso corporal para o peitoral" },
      
      // Costas
      { name: "Puxada Frontal", muscleGroup: "Costas", description: "Desenvolvimento do latíssimo do dorso" },
      { name: "Remada Curvada", muscleGroup: "Costas", description: "Fortalecimento das costas e posteriores" },
      { name: "Pulldown", muscleGroup: "Costas", description: "Exercício para largura das costas" },
      { name: "Remada Sentada", muscleGroup: "Costas", description: "Trabalha a espessura das costas" },
      
      // Pernas
      { name: "Agachamento Livre", muscleGroup: "Pernas", description: "Exercício composto para pernas e glúteos" },
      { name: "Leg Press", muscleGroup: "Pernas", description: "Exercício para quadríceps e glúteos" },
      { name: "Stiff", muscleGroup: "Pernas", description: "Trabalha posteriores da coxa e glúteos" },
      { name: "Panturrilha em Pé", muscleGroup: "Pernas", description: "Desenvolvimento das panturrilhas" },
      { name: "Cadeira Extensora", muscleGroup: "Pernas", description: "Isolamento do quadríceps" },
      { name: "Mesa Flexora", muscleGroup: "Pernas", description: "Isolamento dos posteriores da coxa" },
      
      // Ombros
      { name: "Desenvolvimento Militar", muscleGroup: "Ombros", description: "Exercício para deltoides anterior e medial" },
      { name: "Elevação Lateral", muscleGroup: "Ombros", description: "Isolamento do deltoide medial" },
      { name: "Elevação Posterior", muscleGroup: "Ombros", description: "Trabalha o deltoide posterior" },
      { name: "Desenvolvimento com Halteres", muscleGroup: "Ombros", description: "Movimento completo para ombros" },
      
      // Braços
      { name: "Rosca Direta", muscleGroup: "Braços", description: "Desenvolvimento do bíceps" },
      { name: "Tríceps Pulley", muscleGroup: "Braços", description: "Isolamento do tríceps" },
      { name: "Rosca Martelo", muscleGroup: "Braços", description: "Trabalha bíceps e antebraços" },
      { name: "Tríceps Francês", muscleGroup: "Braços", description: "Exercício para a cabeça longa do tríceps" },
      
      // Core
      { name: "Prancha", muscleGroup: "Core", description: "Fortalecimento do core e estabilização" },
      { name: "Abdominal Reto", muscleGroup: "Core", description: "Trabalha o reto abdominal" },
      { name: "Prancha Lateral", muscleGroup: "Core", description: "Fortalece os oblíquos" },
    ];

    const { data: createdExercises, error: exerciseError } = await supabase
      .from('exercises')
      .insert(exercises.map(ex => ({ ...ex, userId })))
      .select();

    if (exerciseError) throw exerciseError;
    console.log(`✅ ${createdExercises.length} exercícios criados`);

    // 2. Criar templates de treino
    console.log('📋 Criando templates de treino...');
    const workoutTemplates = [
      {
        name: "Treino A - Peito e Tríceps",
        description: "Foco no desenvolvimento do peitoral e tríceps",
        userId,
        exercises: [
          { exerciseName: "Supino Reto", sets: 4, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Supino Inclinado", sets: 3, reps: 10, restDurationSeconds: 90 },
          { exerciseName: "Crucifixo", sets: 3, reps: 12, restDurationSeconds: 60 },
          { exerciseName: "Tríceps Pulley", sets: 4, reps: 15, restDurationSeconds: 60 },
          { exerciseName: "Tríceps Francês", sets: 3, reps: 12, restDurationSeconds: 60 },
        ]
      },
      {
        name: "Treino B - Costas e Bíceps", 
        description: "Desenvolvimento das costas e bíceps",
        userId,
        exercises: [
          { exerciseName: "Puxada Frontal", sets: 4, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Remada Curvada", sets: 4, reps: 10, restDurationSeconds: 90 },
          { exerciseName: "Pulldown", sets: 3, reps: 12, restDurationSeconds: 60 },
          { exerciseName: "Rosca Direta", sets: 4, reps: 12, restDurationSeconds: 60 },
          { exerciseName: "Rosca Martelo", sets: 3, reps: 15, restDurationSeconds: 60 },
        ]
      },
      {
        name: "Treino C - Pernas Completo",
        description: "Treino completo para membros inferiores",
        userId,
        exercises: [
          { exerciseName: "Agachamento Livre", sets: 4, reps: 12, restDurationSeconds: 120 },
          { exerciseName: "Leg Press", sets: 4, reps: 15, restDurationSeconds: 90 },
          { exerciseName: "Stiff", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Cadeira Extensora", sets: 3, reps: 15, restDurationSeconds: 60 },
          { exerciseName: "Mesa Flexora", sets: 3, reps: 12, restDurationSeconds: 60 },
          { exerciseName: "Panturrilha em Pé", sets: 4, reps: 20, restDurationSeconds: 45 },
        ]
      },
      {
        name: "Treino D - Ombros e Core",
        description: "Foco em ombros e fortalecimento do core",
        userId,
        exercises: [
          { exerciseName: "Desenvolvimento Militar", sets: 4, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Elevação Lateral", sets: 4, reps: 15, restDurationSeconds: 60 },
          { exerciseName: "Elevação Posterior", sets: 3, reps: 15, restDurationSeconds: 60 },
          { exerciseName: "Prancha", sets: 3, reps: 60, restDurationSeconds: 60 },
          { exerciseName: "Abdominal Reto", sets: 3, reps: 20, restDurationSeconds: 45 },
        ]
      },
      {
        name: "Treino Push - Empurrar",
        description: "Treino de empurrar: peito, ombros e tríceps",
        userId,
        exercises: [
          { exerciseName: "Supino Reto", sets: 4, reps: 10, restDurationSeconds: 120 },
          { exerciseName: "Desenvolvimento Militar", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Supino Inclinado", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Elevação Lateral", sets: 3, reps: 15, restDurationSeconds: 60 },
          { exerciseName: "Tríceps Pulley", sets: 3, reps: 15, restDurationSeconds: 60 },
        ]
      },
      {
        name: "Treino Pull - Puxar",
        description: "Treino de puxar: costas e bíceps",
        userId,
        exercises: [
          { exerciseName: "Puxada Frontal", sets: 4, reps: 10, restDurationSeconds: 120 },
          { exerciseName: "Remada Curvada", sets: 4, reps: 10, restDurationSeconds: 90 },
          { exerciseName: "Remada Sentada", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Rosca Direta", sets: 3, reps: 12, restDurationSeconds: 60 },
          { exerciseName: "Rosca Martelo", sets: 3, reps: 15, restDurationSeconds: 60 },
        ]
      },
      {
        name: "Treino Full Body",
        description: "Treino completo para o corpo todo",
        userId,
        exercises: [
          { exerciseName: "Agachamento Livre", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Supino Reto", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Puxada Frontal", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Desenvolvimento Militar", sets: 3, reps: 12, restDurationSeconds: 90 },
          { exerciseName: "Prancha", sets: 3, reps: 45, restDurationSeconds: 60 },
        ]
      }
    ];

    for (const template of workoutTemplates) {
      // Criar o template
      const { data: createdTemplate, error: templateError } = await supabase
        .from('workoutTemplates')
        .insert({
          name: template.name,
          description: template.description,
          userId: template.userId
        })
        .select()
        .single();

      if (templateError) throw templateError;

      // Adicionar exercícios ao template
      for (let i = 0; i < template.exercises.length; i++) {
        const exercise = template.exercises[i];
        
        // Buscar o exercício criado
        const { data: exerciseData, error: findExerciseError } = await supabase
          .from('exercises')
          .select('id')
          .eq('name', exercise.exerciseName)
          .eq('userId', userId)
          .single();

        if (findExerciseError) {
          console.warn(`⚠️ Exercício não encontrado: ${exercise.exerciseName}`);
          continue;
        }

        // Adicionar exercício ao template
        const { error: templateExerciseError } = await supabase
          .from('workoutTemplateExercises')
          .insert({
            templateId: createdTemplate.id,
            exerciseId: exerciseData.id,
            sets: exercise.sets,
            reps: exercise.reps,
            restDurationSeconds: exercise.restDurationSeconds,
            order: i + 1
          });

        if (templateExerciseError) {
          console.error(`❌ Erro ao adicionar exercício ${exercise.exerciseName} ao template:`, templateExerciseError);
        }
      }

      console.log(`✅ Template criado: ${template.name}`);
    }

    // 3. Criar logs de treino em diferentes datas
    console.log('📊 Criando logs de treino...');
    const workoutDates = [
      new Date('2025-08-05'),
      new Date('2025-08-07'), 
      new Date('2025-08-09'),
      new Date('2025-08-11'),
      new Date('2025-08-12'),
      new Date('2025-08-14'),
      new Date('2025-08-16')
    ];

    // Buscar os templates criados
    const { data: templates, error: templatesError } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('userId', userId);

    if (templatesError) throw templatesError;

    for (let i = 0; i < workoutDates.length && i < templates.length; i++) {
      const date = workoutDates[i];
      const template = templates[i];
      
      const startTime = new Date(date);
      startTime.setHours(18, 0, 0, 0); // 18:00
      
      const endTime = new Date(startTime);
      endTime.setHours(19, 30, 0, 0); // 19:30 (1h30 de treino)

      // Criar o log do treino
      const { data: workoutLog, error: logError } = await supabase
        .from('workoutLogs')
        .insert({
          name: `${template.name} - ${date.toLocaleDateString('pt-BR')}`,
          templateId: template.id,
          userId: userId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          notes: `Treino realizado com boa intensidade. Foco na execução correta dos movimentos.`
        })
        .select()
        .single();

      if (logError) throw logError;

      // Buscar exercícios do template
      const { data: templateExercises, error: templateExercisesError } = await supabase
        .from('workoutTemplateExercises')
        .select('*, exercises(*)')
        .eq('templateId', template.id)
        .order('order');

      if (templateExercisesError) throw templateExercisesError;

      // Criar logs dos exercícios com sets realistas
      for (const templateExercise of templateExercises) {
        const { data: logExercise, error: logExerciseError } = await supabase
          .from('workoutLogExercises')
          .insert({
            logId: workoutLog.id,
            exerciseId: templateExercise.exerciseId,
            order: templateExercise.order
          })
          .select()
          .single();

        if (logExerciseError) throw logExerciseError;

        // Criar sets com pesos e repetições realistas
        for (let setNumber = 1; setNumber <= templateExercise.sets; setNumber++) {
          const baseWeight = getBaseWeight(templateExercise.exercises.muscleGroup);
          const weight = baseWeight + (Math.random() * 20 - 10); // Variação de ±10kg
          const reps = templateExercise.reps + (Math.floor(Math.random() * 3) - 1); // Variação de ±1 rep

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

      console.log(`✅ Log de treino criado: ${template.name} - ${date.toLocaleDateString('pt-BR')}`);
    }

    console.log('🎉 Dados de exemplo criados com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   • ${exercises.length} exercícios`);
    console.log(`   • ${workoutTemplates.length} templates de treino`);
    console.log(`   • ${workoutDates.length} logs de treino`);

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
  }
}

function getBaseWeight(muscleGroup: string): number {
  const weights = {
    'Peito': 60,
    'Costas': 55,
    'Pernas': 80,
    'Ombros': 25,
    'Braços': 20,
    'Core': 0
  };
  return weights[muscleGroup as keyof typeof weights] || 40;
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createSampleData };