import { supabase } from '../server/supabase-client';

async function checkTables() {
  console.log('🔍 Verificando tabelas no Supabase...');

  try {
    // Listar todas as tabelas
    const { data, error } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');

    if (error) {
      console.error('❌ Erro ao listar tabelas:', error);
      return;
    }

    console.log('📋 Tabelas encontradas:', data?.map(t => t.tablename) || []);

    // Verificar se a tabela users existe
    const hasUsers = data?.some(t => t.tablename === 'users');
    console.log('👤 Tabela users existe:', hasUsers);

    if (hasUsers) {
      // Verificar estrutura da tabela users
      const { data: userColumns, error: columnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_name', 'users')
        .eq('table_schema', 'public');

      if (!columnsError) {
        console.log('📊 Colunas da tabela users:', userColumns);
      }

      // Tentar buscar usuários existentes
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(5);

      if (!usersError) {
        console.log('👥 Usuários existentes:', users?.length || 0);
      } else {
        console.log('❌ Erro ao buscar usuários:', usersError);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkTables();