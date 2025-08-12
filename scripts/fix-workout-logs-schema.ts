import { supabase } from '../server/supabase-client';

async function fixWorkoutLogsSchema() {
  try {
    console.log('🔧 Verificando esquema da tabela workoutLogs...');

    // Tentar buscar uma linha da tabela para ver quais colunas existem
    const { data: sample, error: sampleError } = await supabase
      .from('workoutLogs')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('❌ Erro ao buscar amostra:', sampleError);
      return;
    }

    if (sample && sample.length > 0) {
      console.log('📋 Colunas encontradas na tabela workoutLogs:');
      console.log(Object.keys(sample[0]));
      
      if (!Object.keys(sample[0]).includes('userId')) {
        console.log('⚠️ Coluna userId não existe, precisa ser adicionada');
      } else {
        console.log('✅ Coluna userId existe');
      }
    } else {
      console.log('📋 Tabela workoutLogs está vazia, verificando estrutura...');
    }

    // Tentar fazer um INSERT simples para descobrir quais campos são obrigatórios
    console.log('🧪 Testando inserção para descobrir campos obrigatórios...');
    
    const { error: insertError } = await supabase
      .from('workoutLogs')
      .insert({
        name: 'Teste',
        startTime: new Date().toISOString(),
        userId: 'f972dd20-958a-4591-999a-b5eeb36aff75'
      });

    if (insertError) {
      console.log('❌ Erro na inserção (esperado):', insertError.message);
      
      if (insertError.message.includes('userId')) {
        console.log('🎯 Confirmado: problema com coluna userId');
      }
    } else {
      console.log('✅ Inserção bem-sucedida! userId funciona');
      
      // Limpar o teste
      await supabase
        .from('workoutLogs')
        .delete()
        .eq('name', 'Teste');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

fixWorkoutLogsSchema().then(() => process.exit(0)).catch(() => process.exit(1));