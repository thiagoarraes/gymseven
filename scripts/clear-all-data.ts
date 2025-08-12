import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function clearAllData() {
  console.log('🗑️ Iniciando limpeza de todos os dados...\n');
  
  try {
    // Delete in order due to foreign key constraints
    console.log('🗑️ Excluindo workout log sets...');
    const { error: setsError } = await supabase
      .from('workoutLogSets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (setsError) {
      console.error('Erro ao excluir sets:', setsError);
    } else {
      console.log('✅ Workout log sets excluídos');
    }

    console.log('🗑️ Excluindo workout log exercises...');
    const { error: logExercisesError } = await supabase
      .from('workoutLogExercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (logExercisesError) {
      console.error('Erro ao excluir log exercises:', logExercisesError);
    } else {
      console.log('✅ Workout log exercises excluídos');
    }

    console.log('🗑️ Excluindo workout logs...');
    const { error: logsError } = await supabase
      .from('workoutLogs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (logsError) {
      console.error('Erro ao excluir logs:', logsError);
    } else {
      console.log('✅ Workout logs excluídos');
    }

    console.log('🗑️ Excluindo workout template exercises...');
    const { error: templateExercisesError } = await supabase
      .from('workoutTemplateExercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (templateExercisesError) {
      console.error('Erro ao excluir template exercises:', templateExercisesError);
    } else {
      console.log('✅ Workout template exercises excluídos');
    }

    console.log('🗑️ Excluindo workout templates...');
    const { error: templatesError } = await supabase
      .from('workoutTemplates')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (templatesError) {
      console.error('Erro ao excluir templates:', templatesError);
    } else {
      console.log('✅ Workout templates excluídos');
    }

    console.log('🗑️ Excluindo exercises...');
    const { error: exercisesError } = await supabase
      .from('exercises')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (exercisesError) {
      console.error('Erro ao excluir exercises:', exercisesError);
    } else {
      console.log('✅ Exercises excluídos');
    }

    console.log('🗑️ Excluindo weight history...');
    const { error: weightError } = await supabase
      .from('weightHistory')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (weightError) {
      console.error('Erro ao excluir weight history:', weightError);
    } else {
      console.log('✅ Weight history excluído');
    }

    console.log('🗑️ Excluindo user goals...');
    const { error: goalsError } = await supabase
      .from('userGoals')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (goalsError) {
      console.error('Erro ao excluir goals:', goalsError);
    } else {
      console.log('✅ User goals excluídos');
    }

    // Verify deletion by counting remaining records
    console.log('\n📊 Verificando dados restantes...');
    
    const tables = [
      'exercises',
      'workoutTemplates', 
      'workoutTemplateExercises',
      'workoutLogs',
      'workoutLogExercises', 
      'workoutLogSets',
      'weightHistory',
      'userGoals'
    ];

    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`Erro ao contar ${table}:`, error);
      } else {
        console.log(`${table}: ${count || 0} registros restantes`);
      }
    }

    console.log('\n✅ Limpeza de dados concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a limpeza:', error);
    throw error;
  }
}

clearAllData().catch(console.error);