import { supabase } from '../server/supabase-client';

async function checkUsersTable() {
  console.log('🔍 Verificando estrutura da tabela users...');

  try {
    // Tentar selecionar dados da tabela users para ver quais colunas existem
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Erro ao acessar tabela users:', error);
    } else {
      console.log('✅ Tabela users existe. Estrutura atual:', 
        data && data.length > 0 ? Object.keys(data[0]) : 'Tabela vazia');
    }

    // Tentar inserir apenas com as colunas básicas que devem existir
    console.log('📝 Tentando inserir com colunas básicas...');
    
    const basicUser = {
      id: 'test-user-123',
      email: 'teste@gymseven.com'
    };

    const { data: insertData, error: insertError } = await supabase
      .from('users')
      .insert(basicUser)
      .select();

    if (insertError) {
      console.error('❌ Erro ao inserir:', insertError);
    } else {
      console.log('✅ Usuário básico inserido:', insertData);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUsersTable();