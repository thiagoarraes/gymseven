import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function addUserIsolation() {
  console.log('🔧 Adicionando isolamento de usuário às tabelas...\n');
  
  try {
    // Add userId column to exercises table
    console.log('1. Adicionando user_id à tabela exercises...');
    const { error: exercisesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE exercises ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;'
    });
    
    if (exercisesError) {
      console.log('⚠️  Coluna user_id já existe ou erro:', exercisesError.message);
    } else {
      console.log('✅ Coluna user_id adicionada à exercises');
    }

    // Add userId column to workout_templates table  
    console.log('2. Adicionando user_id à tabela workoutTemplates...');
    const { error: templatesError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "workoutTemplates" ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;'
    });
    
    if (templatesError) {
      console.log('⚠️  Coluna user_id já existe ou erro:', templatesError.message);
    } else {
      console.log('✅ Coluna user_id adicionada à workoutTemplates');
    }

    // Add userId column to workout_logs table
    console.log('3. Adicionando user_id à tabela workoutLogs...');
    const { error: logsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE "workoutLogs" ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;'
    });
    
    if (logsError) {
      console.log('⚠️  Coluna user_id já existe ou erro:', logsError.message);
    } else {
      console.log('✅ Coluna user_id adicionada à workoutLogs');
    }

    // Get first user ID
    console.log('4. Buscando primeiro usuário...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('❌ Nenhum usuário encontrado');
      return;
    }
    
    const firstUserId = users[0].id;
    console.log(`👤 Primeiro usuário encontrado: ${firstUserId}`);

    // Update existing exercises
    console.log('5. Atualizando exercícios existentes...');
    const { error: updateExercisesError } = await supabase
      .from('exercises')
      .update({ user_id: firstUserId })
      .is('user_id', null);
    
    if (updateExercisesError) {
      console.log('⚠️  Erro ao atualizar exercícios:', updateExercisesError.message);
    } else {
      console.log('✅ Exercícios atualizados');
    }

    // Update existing workout templates
    console.log('6. Atualizando templates existentes...');
    const { error: updateTemplatesError } = await supabase
      .from('workoutTemplates')
      .update({ user_id: firstUserId })
      .is('user_id', null);
    
    if (updateTemplatesError) {
      console.log('⚠️  Erro ao atualizar templates:', updateTemplatesError.message);
    } else {
      console.log('✅ Templates atualizados');
    }

    // Update existing workout logs
    console.log('7. Atualizando logs existentes...');
    const { error: updateLogsError } = await supabase
      .from('workoutLogs')
      .update({ user_id: firstUserId })
      .is('user_id', null);
    
    if (updateLogsError) {
      console.log('⚠️  Erro ao atualizar logs:', updateLogsError.message);
    } else {
      console.log('✅ Logs atualizados');
    }

    console.log('\n🎉 Isolamento de usuário configurado com sucesso!');
    console.log('📝 Todos os dados existentes foram atribuídos ao primeiro usuário.');
    console.log('🔒 Novos dados serão automaticamente isolados por usuário.');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

addUserIsolation();