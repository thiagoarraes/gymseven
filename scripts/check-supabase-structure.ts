import { supabase } from '../server/supabase-client';

async function checkSupabaseStructure() {
  try {
    console.log('🔍 Verificando estrutura real das tabelas do Supabase...');
    
    // Verificar tabela exercises
    console.log('\n📋 Tabela exercises:');
    const { data: exerciseData, error: exerciseError } = await supabase
      .from('exercises')
      .select('*')
      .limit(1);
    
    if (exerciseError) {
      console.log('❌ Erro exercises:', exerciseError.message);
    } else {
      console.log('✅ Exercises funciona');
      if (exerciseData && exerciseData.length > 0) {
        console.log('Estrutura:', Object.keys(exerciseData[0]));
      }
    }
    
    // Verificar workout_templates 
    console.log('\n📋 Tabela workout_templates:');
    const { data: templateData, error: templateError } = await supabase
      .from('workout_templates')
      .select('*')
      .limit(1);
    
    if (templateError) {
      console.log('❌ Erro workout_templates:', templateError.message);
    } else {
      console.log('✅ workout_templates funciona');
      if (templateData && templateData.length > 0) {
        console.log('Estrutura:', Object.keys(templateData[0]));
      }
    }
    
    // Verificar workout_logs
    console.log('\n📋 Tabela workout_logs:');
    const { data: logData, error: logError } = await supabase
      .from('workout_logs')
      .select('*')
      .limit(1);
    
    if (logError) {
      console.log('❌ Erro workout_logs:', logError.message);
    } else {
      console.log('✅ workout_logs funciona');
      if (logData && logData.length > 0) {
        console.log('Estrutura:', Object.keys(logData[0]));
      }
    }
    
    // Listar todas as tabelas disponíveis usando uma consulta SQL
    console.log('\n📋 Listando todas as tabelas:');
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .rpc('get_tables_info')
        .single();
      
      if (tablesError) {
        // Tentar uma abordagem diferente - consulta direta
        console.log('Tentando listar tabelas manualmente...');
        
        const possibleTables = [
          'users', 'exercises', 'workout_templates', 'workout_logs', 
          'workoutsLogs', 'workoutLogs', 'workoutTemplates',
          'workout_template_exercises', 'workout_log_exercises', 'workout_log_sets',
          'weight_history', 'user_goals', 'user_preferences', 'user_achievements'
        ];
        
        for (const tableName of possibleTables) {
          try {
            const { data, error } = await supabase
              .from(tableName)
              .select('*')
              .limit(1);
            
            if (!error) {
              console.log(`✅ Tabela "${tableName}" existe`);
            } else {
              console.log(`❌ Tabela "${tableName}" NÃO existe:`, error.message);
            }
          } catch (err) {
            console.log(`❌ Erro ao verificar "${tableName}"`);
          }
        }
      }
    } catch (rpcError) {
      console.log('RPC não disponível, verificando manualmente...');
    }
    
  } catch (error: any) {
    console.error('❌ Erro geral:', error.message);
  }
}

// Execute
checkSupabaseStructure();