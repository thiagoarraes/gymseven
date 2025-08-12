import { supabase } from '../server/supabase-client';

async function createSimpleSampleData() {
  try {
    console.log('🏗️ Criando dados de exemplo simples para o GymSeven...');

    // Primeiro, vamos verificar se já existem exercícios
    const { data: existingExercises, error: checkError } = await supabase
      .from('exercises')
      .select('id')
      .limit(1);

    if (checkError) {
      console.error('❌ Erro ao verificar exercícios existentes:', checkError);
      return;
    }

    if (existingExercises && existingExercises.length > 0) {
      console.log('📚 Dados já existem no banco');
      return;
    }

    // 1. Criar exercícios (sem userId para compatibilidade)
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
      .insert(exercises)
      .select();

    if (exerciseError) {
      console.error('❌ Erro ao criar exercícios:', exerciseError);
      return;
    }

    console.log(`✅ ${createdExercises.length} exercícios criados`);

    // 2. Obter usuário existente para os templates
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log('⚠️ Nenhum usuário encontrado, criando apenas exercícios');
      return;
    }

    const userId = users[0].id;

    // 3. Criar templates de treino (se a tabela suportar)
    console.log('📋 Criando templates de treino...');
    const workoutTemplates = [
      { name: "Treino A - Peito e Tríceps", description: "Foco no desenvolvimento do peitoral e tríceps" },
      { name: "Treino B - Costas e Bíceps", description: "Desenvolvimento das costas e bíceps" },
      { name: "Treino C - Pernas Completo", description: "Treino completo para membros inferiores" },
      { name: "Treino D - Ombros e Core", description: "Foco em ombros e fortalecimento do core" },
      { name: "Treino Push - Empurrar", description: "Treino de empurrar: peito, ombros e tríceps" },
      { name: "Treino Pull - Puxar", description: "Treino de puxar: costas e bíceps" },
      { name: "Treino Full Body", description: "Treino completo para o corpo todo" },
    ];

    // Tentar criar templates (com ou sem userId dependendo do schema)
    for (const template of workoutTemplates) {
      try {
        // Primeiro tentar com userId
        let templateData: any = { ...template };
        
        // Verificar se a coluna userId existe
        const { error: templateError } = await supabase
          .from('workoutTemplates')
          .insert({ ...templateData, userId })
          .select()
          .single();

        if (templateError && templateError.code === 'PGRST204') {
          // Se userId não existe, tentar sem userId
          const { error: templateError2 } = await supabase
            .from('workoutTemplates')
            .insert(templateData)
            .select()
            .single();

          if (templateError2) {
            console.warn(`⚠️ Não foi possível criar template: ${template.name}`);
            continue;
          }
        } else if (templateError) {
          console.warn(`⚠️ Erro ao criar template: ${template.name}`, templateError);
          continue;
        }

        console.log(`✅ Template criado: ${template.name}`);
      } catch (error) {
        console.warn(`⚠️ Erro ao criar template ${template.name}:`, error);
      }
    }

    console.log('🎉 Dados de exemplo criados com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   • ${exercises.length} exercícios`);
    console.log(`   • ${workoutTemplates.length} templates de treino`);

  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error);
  }
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createSimpleSampleData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createSimpleSampleData };