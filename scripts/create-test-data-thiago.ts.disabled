import { supabase } from '../server/supabase-client';

async function createTestDataForThiago() {
  try {
    console.log('🎯 Criando dados de teste para o usuário Thiago...');
    
    // ID do usuário Thiago (baseado no log)
    const userId = '4290d265-b012-4aa6-bf4a-339396c994f2';
    
    console.log('📋 Criando exercícios para cada grupo muscular...');
    
    // Exercícios para Treino A (Peito, Ombros, Tríceps)
    const exercisesA = [
      { name: 'Supino Reto', muscle_group: 'Peito', description: 'Exercício principal para peitoral' },
      { name: 'Supino Inclinado', muscle_group: 'Peito', description: 'Para a parte superior do peitoral' },
      { name: 'Desenvolvimento com Halteres', muscle_group: 'Ombros', description: 'Desenvolvimento dos deltoides' },
      { name: 'Elevação Lateral', muscle_group: 'Ombros', description: 'Isolamento do deltoide lateral' },
      { name: 'Tríceps Testa', muscle_group: 'Tríceps', description: 'Isolamento do tríceps' },
      { name: 'Mergulho', muscle_group: 'Tríceps', description: 'Exercício composto para tríceps' }
    ];
    
    // Exercícios para Treino B (Costas, Bíceps)
    const exercisesB = [
      { name: 'Puxada Frontal', muscle_group: 'Costas', description: 'Desenvolvimento do latíssimo' },
      { name: 'Remada Curvada', muscle_group: 'Costas', description: 'Para espessura das costas' },
      { name: 'Puxada Alta', muscle_group: 'Costas', description: 'Trabalha largura das costas' },
      { name: 'Rosca Direta', muscle_group: 'Bíceps', description: 'Exercício básico para bíceps' },
      { name: 'Rosca Martelo', muscle_group: 'Bíceps', description: 'Variação da rosca direta' },
      { name: 'Rosca Concentrada', muscle_group: 'Bíceps', description: 'Isolamento do bíceps' }
    ];
    
    // Exercícios para Treino C (Pernas, Abdômen)
    const exercisesC = [
      { name: 'Agachamento Livre', muscle_group: 'Pernas', description: 'Exercício completo para pernas' },
      { name: 'Leg Press', muscle_group: 'Pernas', description: 'Exercício para quadríceps e glúteos' },
      { name: 'Stiff', muscle_group: 'Pernas', description: 'Para posterior da coxa' },
      { name: 'Panturrilha em Pé', muscle_group: 'Pernas', description: 'Isolamento da panturrilha' },
      { name: 'Abdominal Supra', muscle_group: 'Abdômen', description: 'Exercício básico para abdômen' },
      { name: 'Prancha', muscle_group: 'Abdômen', description: 'Fortalecimento do core' }
    ];
    
    // Inserir exercícios
    const allExercises = [...exercisesA, ...exercisesB, ...exercisesC];
    const exerciseIds: Record<string, string> = {};
    
    for (const exercise of allExercises) {
      const { data, error } = await supabase
        .from('exercises')
        .insert({
          user_id: userId,
          name: exercise.name,
          muscleGroup: exercise.muscle_group, 
          description: exercise.description
        })
        .select()
        .single();
      
      if (error) {
        console.log(`⚠️ Exercício ${exercise.name} já existe ou erro:`, error.message);
      } else {
        exerciseIds[exercise.name] = data.id;
        console.log(`✅ Exercício ${exercise.name} criado`);
      }
    }
    
    // Buscar exercícios existentes se não conseguiu criar
    if (Object.keys(exerciseIds).length < allExercises.length) {
      const { data: existingExercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', userId);
      
      if (existingExercises) {
        for (const ex of existingExercises) {
          exerciseIds[ex.name] = ex.id;
        }
      }
    }
    
    console.log('📋 Criando templates de treino A, B, C...');
    
    // Criar templates de treino
    const templates = [
      { name: 'Treino A - Peito, Ombros, Tríceps', description: 'Treino focado na parte superior do corpo' },
      { name: 'Treino B - Costas, Bíceps', description: 'Treino para costas e bíceps' },
      { name: 'Treino C - Pernas, Abdômen', description: 'Treino completo para membros inferiores' }
    ];
    
    const templateIds: Record<string, string> = {};
    
    for (const template of templates) {
      const { data, error } = await supabase
        .from('workoutTemplates')
        .insert({
          user_id: userId,
          ...template
        })
        .select()
        .single();
      
      if (error) {
        console.log(`⚠️ Template ${template.name} já existe ou erro:`, error.message);
      } else {
        templateIds[template.name] = data.id;
        console.log(`✅ Template ${template.name} criado`);
      }
    }
    
    // Buscar templates existentes se não conseguiu criar
    if (Object.keys(templateIds).length < templates.length) {
      const { data: existingTemplates } = await supabase
        .from('workoutTemplates')
        .select('*')
        .eq('user_id', userId);
      
      if (existingTemplates) {
        for (const template of existingTemplates) {
          templateIds[template.name] = template.id;
        }
      }
    }
    
    console.log('📋 Adicionando exercícios aos templates...');
    
    // Adicionar exercícios aos templates (apenas se os templates foram criados)
    const templateExercises = [
      // Treino A
      ...exercisesA.map((ex, index) => ({
        templateId: templateIds['Treino A - Peito, Ombros, Tríceps'],
        exerciseId: exerciseIds[ex.name],
        sets: 3,
        reps: index < 2 ? '8-10' : '10-12',
        weight: index < 2 ? 80 : 15,
        restDurationSeconds: 90,
        order: index + 1
      })),
      // Treino B
      ...exercisesB.map((ex, index) => ({
        templateId: templateIds['Treino B - Costas, Bíceps'],
        exerciseId: exerciseIds[ex.name],
        sets: 3,
        reps: index < 3 ? '8-10' : '10-12',
        weight: index < 3 ? 70 : 12,
        restDurationSeconds: 90,
        order: index + 1
      })),
      // Treino C
      ...exercisesC.map((ex, index) => ({
        templateId: templateIds['Treino C - Pernas, Abdômen'],
        exerciseId: exerciseIds[ex.name],
        sets: index > 3 ? 4 : 3,
        reps: index < 2 ? '8-12' : '12-15',
        weight: index < 2 ? 100 : null,
        restDurationSeconds: index > 3 ? 60 : 120,
        order: index + 1
      }))
    ].filter(item => item.templateId && item.exerciseId);
    
    for (const templateExercise of templateExercises) {
      const { error } = await supabase
        .from('workoutTemplateExercises')
        .insert(templateExercise);
      
      if (error) {
        console.log(`⚠️ Erro ao adicionar exercício ao template:`, error.message);
      }
    }
    
    console.log('🏋️ Criando histórico de treinos concluídos (padrão ABCAB)...');
    
    // Criar logs de treinos concluídos (últimos 10 dias, padrão ABCAB)
    const workoutPattern = ['A', 'B', 'C', 'A', 'B'];
    const today = new Date();
    
    for (let i = 0; i < 10; i++) {
      const workoutDate = new Date(today);
      workoutDate.setDate(today.getDate() - (9 - i)); // Últimos 10 dias
      
      const patternIndex = i % workoutPattern.length;
      const workoutType = workoutPattern[patternIndex];
      const templateName = `Treino ${workoutType} - ${
        workoutType === 'A' ? 'Peito, Ombros, Tríceps' :
        workoutType === 'B' ? 'Costas, Bíceps' :
        'Pernas, Abdômen'
      }`;
      
      const startTime = new Date(workoutDate);
      startTime.setHours(Math.floor(Math.random() * 4) + 18); // Entre 18h e 22h
      
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + Math.floor(Math.random() * 30) + 45); // 45-75 min
      
      const { data: workoutLog, error: logError } = await supabase
        .from('workoutLogs')
        .insert({
          user_id: userId,
          templateId: templateIds[templateName],
          name: templateName,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        })
        .select()
        .single();
      
      if (logError) {
        console.log(`⚠️ Erro ao criar log do ${templateName}:`, logError.message);
      } else {
        console.log(`✅ Treino ${workoutType} do dia ${workoutDate.toLocaleDateString()} criado`);
      }
    }
    
    console.log('🎉 Dados de teste criados com sucesso para o usuário Thiago!');
    console.log('📊 Criados: 18 exercícios, 3 templates, 10 treinos concluídos');
    
  } catch (error: any) {
    console.error('❌ Erro ao criar dados de teste:', error.message);
  }
}

// Execute
createTestDataForThiago();