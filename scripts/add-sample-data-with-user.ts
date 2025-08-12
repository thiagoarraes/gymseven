import { supabase } from '../server/supabase-client';

async function addSampleDataWithUser() {
  try {
    console.log('🏗️ Criando dados de exemplo para usuário logado...');

    // Obter o primeiro usuário disponível
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, username')
      .limit(1);

    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado');
      return;
    }

    const userId = users[0].id;
    console.log(`✅ Usando usuário: ${users[0].username} (${userId})`);

    // Verificar se já existem exercícios para este usuário
    const { data: existingExercises, error: checkError } = await supabase
      .from('exercises')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar exercícios existentes:', checkError);
      return;
    }

    if (existingExercises && existingExercises.length > 0) {
      console.log('📚 Usuário já possui exercícios');
      
      // Verificar quantos exercícios existem
      const { data: allExercises, error: countError } = await supabase
        .from('exercises')
        .select('id, name')
        .eq('user_id', userId);

      if (!countError && allExercises) {
        console.log(`📊 Total de exercícios: ${allExercises.length}`);
        console.log('✅ Dados já existem no sistema');
        return;
      }
    }

    // 1. Criar exercícios com userId
    console.log('💪 Criando exercícios...');
    const exercises = [
      // Peito
      { name: "Supino Reto", muscleGroup: "Peito", description: "Exercício fundamental para desenvolvimento do peitoral", user_id: userId },
      { name: "Supino Inclinado", muscleGroup: "Peito", description: "Trabalha a parte superior do peitoral", user_id: userId },
      { name: "Crucifixo", muscleGroup: "Peito", description: "Isolamento do peitoral com movimento de abertura", user_id: userId },
      { name: "Flexão de Braço", muscleGroup: "Peito", description: "Exercício com peso corporal para o peitoral", user_id: userId },
      
      // Costas
      { name: "Puxada Frontal", muscleGroup: "Costas", description: "Desenvolvimento do latíssimo do dorso", user_id: userId },
      { name: "Remada Curvada", muscleGroup: "Costas", description: "Fortalecimento das costas e posteriores", user_id: userId },
      { name: "Pulldown", muscleGroup: "Costas", description: "Exercício para largura das costas", user_id: userId },
      { name: "Remada Sentada", muscleGroup: "Costas", description: "Trabalha a espessura das costas", user_id: userId },
      
      // Pernas
      { name: "Agachamento Livre", muscleGroup: "Pernas", description: "Exercício composto para pernas e glúteos", user_id: userId },
      { name: "Leg Press", muscleGroup: "Pernas", description: "Exercício para quadríceps e glúteos", user_id: userId },
      { name: "Stiff", muscleGroup: "Pernas", description: "Trabalha posteriores da coxa e glúteos", user_id: userId },
      { name: "Panturrilha em Pé", muscleGroup: "Pernas", description: "Desenvolvimento das panturrilhas", user_id: userId },
      { name: "Cadeira Extensora", muscleGroup: "Pernas", description: "Isolamento do quadríceps", user_id: userId },
      { name: "Mesa Flexora", muscleGroup: "Pernas", description: "Isolamento dos posteriores da coxa", user_id: userId },
      
      // Ombros
      { name: "Desenvolvimento Militar", muscleGroup: "Ombros", description: "Exercício para deltoides anterior e medial", user_id: userId },
      { name: "Elevação Lateral", muscleGroup: "Ombros", description: "Isolamento do deltoide medial", user_id: userId },
      { name: "Elevação Posterior", muscleGroup: "Ombros", description: "Trabalha o deltoide posterior", user_id: userId },
      { name: "Desenvolvimento com Halteres", muscleGroup: "Ombros", description: "Movimento completo para ombros", user_id: userId },
      
      // Braços
      { name: "Rosca Direta", muscleGroup: "Braços", description: "Desenvolvimento do bíceps", user_id: userId },
      { name: "Tríceps Pulley", muscleGroup: "Braços", description: "Isolamento do tríceps", user_id: userId },
      { name: "Rosca Martelo", muscleGroup: "Braços", description: "Trabalha bíceps e antebraços", user_id: userId },
      { name: "Tríceps Francês", muscleGroup: "Braços", description: "Exercício para a cabeça longa do tríceps", user_id: userId },
      
      // Core
      { name: "Prancha", muscleGroup: "Core", description: "Fortalecimento do core e estabilização", user_id: userId },
      { name: "Abdominal Reto", muscleGroup: "Core", description: "Trabalha o reto abdominal", user_id: userId },
      { name: "Prancha Lateral", muscleGroup: "Core", description: "Fortalece os oblíquos", user_id: userId },
    ];

    const { data: createdExercises, error: exerciseError } = await supabase
      .from('exercises')
      .insert(exercises)
      .select();

    if (exerciseError) {
      console.error('❌ Erro ao criar exercícios:', exerciseError);
      return;
    }

    console.log(`✅ ${createdExercises.length} exercícios criados`);

    // 2. Criar templates de treino
    console.log('📋 Criando templates de treino...');
    const workoutTemplates = [
      { name: "Treino A - Peito e Tríceps", description: "Foco no desenvolvimento do peitoral e tríceps", user_id: userId },
      { name: "Treino B - Costas e Bíceps", description: "Desenvolvimento das costas e bíceps", user_id: userId },
      { name: "Treino C - Pernas Completo", description: "Treino completo para membros inferiores", user_id: userId },
      { name: "Treino D - Ombros e Core", description: "Foco em ombros e fortalecimento do core", user_id: userId },
      { name: "Treino Push - Empurrar", description: "Treino de empurrar: peito, ombros e tríceps", user_id: userId },
      { name: "Treino Pull - Puxar", description: "Treino de puxar: costas e bíceps", user_id: userId },
      { name: "Treino Full Body", description: "Treino completo para o corpo todo", user_id: userId },
    ];

    const { data: createdTemplates, error: templateError } = await supabase
      .from('workoutTemplates')
      .insert(workoutTemplates)
      .select();

    if (templateError) {
      console.error('❌ Erro ao criar templates:', templateError);
      console.log('⚠️ Continuando apenas com exercícios...');
    } else {
      console.log(`✅ ${createdTemplates.length} templates criados`);

      // 3. Adicionar exercícios aos templates
      console.log('🔗 Adicionando exercícios aos templates...');
      
      const templateExercises = [
        // Treino A - Peito e Tríceps
        { templateName: "Treino A - Peito e Tríceps", exerciseName: "Supino Reto", sets: 4, reps: 12, order: 1 },
        { templateName: "Treino A - Peito e Tríceps", exerciseName: "Supino Inclinado", sets: 3, reps: 10, order: 2 },
        { templateName: "Treino A - Peito e Tríceps", exerciseName: "Crucifixo", sets: 3, reps: 12, order: 3 },
        { templateName: "Treino A - Peito e Tríceps", exerciseName: "Tríceps Pulley", sets: 4, reps: 15, order: 4 },
        
        // Treino B - Costas e Bíceps
        { templateName: "Treino B - Costas e Bíceps", exerciseName: "Puxada Frontal", sets: 4, reps: 12, order: 1 },
        { templateName: "Treino B - Costas e Bíceps", exerciseName: "Remada Curvada", sets: 4, reps: 10, order: 2 },
        { templateName: "Treino B - Costas e Bíceps", exerciseName: "Rosca Direta", sets: 4, reps: 12, order: 3 },
        
        // Treino C - Pernas
        { templateName: "Treino C - Pernas Completo", exerciseName: "Agachamento Livre", sets: 4, reps: 12, order: 1 },
        { templateName: "Treino C - Pernas Completo", exerciseName: "Leg Press", sets: 4, reps: 15, order: 2 },
        { templateName: "Treino C - Pernas Completo", exerciseName: "Stiff", sets: 3, reps: 12, order: 3 },
        
        // Treino Full Body
        { templateName: "Treino Full Body", exerciseName: "Agachamento Livre", sets: 3, reps: 12, order: 1 },
        { templateName: "Treino Full Body", exerciseName: "Supino Reto", sets: 3, reps: 12, order: 2 },
        { templateName: "Treino Full Body", exerciseName: "Puxada Frontal", sets: 3, reps: 12, order: 3 },
        { templateName: "Treino Full Body", exerciseName: "Desenvolvimento Militar", sets: 3, reps: 12, order: 4 },
      ];

      for (const te of templateExercises) {
        // Buscar template
        const template = createdTemplates.find(t => t.name === te.templateName);
        if (!template) continue;

        // Buscar exercício
        const exercise = createdExercises.find(e => e.name === te.exerciseName);
        if (!exercise) continue;

        // Adicionar exercício ao template
        const { error: addError } = await supabase
          .from('workoutTemplateExercises')
          .insert({
            templateId: template.id,
            exerciseId: exercise.id,
            sets: te.sets,
            reps: te.reps,
            order: te.order,
            restDurationSeconds: 90
          });

        if (addError) {
          console.warn(`⚠️ Erro ao adicionar ${te.exerciseName} ao ${te.templateName}`);
        }
      }
    }

    // 4. Criar logs de treino em datas passadas
    console.log('📊 Criando logs de treino...');
    
    if (createdTemplates && createdTemplates.length > 0) {
      const workoutDates = [
        { date: '2025-08-05', time: '18:00' },
        { date: '2025-08-07', time: '19:00' },
        { date: '2025-08-09', time: '18:30' },
        { date: '2025-08-11', time: '17:30' },
        { date: '2025-08-14', time: '18:00' },
        { date: '2025-08-16', time: '19:15' },
      ];

      for (let i = 0; i < Math.min(workoutDates.length, createdTemplates.length); i++) {
        const template = createdTemplates[i];
        const workout = workoutDates[i];
        
        const startTime = new Date(`${workout.date}T${workout.time}:00`);
        const endTime = new Date(startTime);
        endTime.setHours(endTime.getHours() + 1, endTime.getMinutes() + 30); // 1h30 de treino

        const { error: logError } = await supabase
          .from('workoutLogs')
          .insert({
            name: `${template.name} - ${workout.date}`,
            templateId: template.id,
            user_id: userId,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            notes: `Treino realizado com boa intensidade em ${workout.date}`
          });

        if (logError) {
          console.warn(`⚠️ Erro ao criar log: ${template.name}`);
        } else {
          console.log(`✅ Log criado: ${template.name} - ${workout.date}`);
        }
      }
    }

    console.log('🎉 Dados de exemplo criados com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   • ${exercises.length} exercícios`);
    console.log(`   • ${workoutTemplates.length} templates de treino`);
    console.log(`   • Logs de treino em múltiplas datas`);
    console.log(`   • Usuário: ${users[0].username}`);

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
  }
}

// Executar
addSampleDataWithUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));