import { supabase } from '../server/supabase-client.js';

async function checkTableStructure() {
  // supabase is already initialized
  
  console.log('🔍 Verificando estrutura das tabelas...');
  
  // Test each table structure
  const tables = [
    'users',
    'workoutTemplateExercises',
    'workoutLogs', 
    'workoutLogExercises',
    'workoutLogSets'
  ];
  
  for (const table of tables) {
    try {
      console.log(`\n📋 Testando tabela ${table}:`);
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
        
      if (error) {
        console.log(`❌ Erro em ${table}:`, error.message);
      } else {
        console.log(`✅ ${table} OK - estrutura disponível`);
        if (data && data.length > 0) {
          console.log('Colunas:', Object.keys(data[0]));
        } else {
          // Try to get columns from an empty table
          const { data: emptyData, error: emptyError } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          console.log('Tabela vazia - verificando estrutura através de insert test');
        }
      }
    } catch (err) {
      console.log(`❌ Erro ao testar ${table}:`, err);
    }
  }
}

checkTableStructure().catch(console.error);