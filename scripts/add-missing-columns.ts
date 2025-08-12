import { supabase } from '../server/supabase-client.js';

async function addMissingColumns() {
  try {
    console.log('🔧 Verificando e adicionando colunas em falta na tabela users...');

    // Verificar e adicionar date_of_birth
    try {
      console.log('Adicionando coluna date_of_birth...');
      const { error: dateError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS date_of_birth TIMESTAMP'
      });
      if (dateError) {
        console.log('Erro ao adicionar date_of_birth (pode já existir):', dateError.message);
      } else {
        console.log('✅ Coluna date_of_birth adicionada');
      }
    } catch (e) {
      console.log('date_of_birth: tentativa manual falhou');
    }

    // Verificar e adicionar height
    try {
      console.log('Adicionando coluna height...');
      const { error: heightError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS height REAL'
      });
      if (heightError) {
        console.log('Erro ao adicionar height (pode já existir):', heightError.message);
      } else {
        console.log('✅ Coluna height adicionada');
      }
    } catch (e) {
      console.log('height: tentativa manual falhou');
    }

    // Verificar e adicionar weight
    try {
      console.log('Adicionando coluna weight...');
      const { error: weightError } = await supabase.rpc('sql', {
        query: 'ALTER TABLE users ADD COLUMN IF NOT EXISTS weight REAL'
      });
      if (weightError) {
        console.log('Erro ao adicionar weight (pode já existir):', weightError.message);
      } else {
        console.log('✅ Coluna weight adicionada');
      }
    } catch (e) {
      console.log('weight: tentativa manual falhou');
    }

    // Verificar e adicionar activity_level
    try {
      console.log('Adicionando coluna activity_level...');
      const { error: activityError } = await supabase.rpc('sql', {
        query: "ALTER TABLE users ADD COLUMN IF NOT EXISTS activity_level TEXT DEFAULT 'moderado'"
      });
      if (activityError) {
        console.log('Erro ao adicionar activity_level (pode já existir):', activityError.message);
      } else {
        console.log('✅ Coluna activity_level adicionada');
      }
    } catch (e) {
      console.log('activity_level: tentativa manual falhou');
    }

    // Tentar inserção manual via RPC se necessário
    console.log('\n🔧 Testando estrutura final da tabela...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, date_of_birth, height, weight, activity_level')
      .limit(1);
    
    if (testError) {
      console.error('❌ Ainda há problemas com a estrutura da tabela:', testError);
    } else {
      console.log('✅ Estrutura da tabela confirmada:', testData?.[0] || 'Sem dados ainda');
    }

  } catch (error) {
    console.error('Erro no script:', error);
  }
}

addMissingColumns();