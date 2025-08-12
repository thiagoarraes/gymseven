import { supabase } from '../server/supabase-client.js';

async function createMissingColumns() {
  try {
    console.log('🔧 Criando colunas em falta na tabela users...');

    // Vamos tentar uma inserção de teste primeiro para ver qual é a estrutura atual
    console.log('📋 Verificando estrutura atual da tabela...');
    
    const { data: existingUser, error: selectError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
      .single();
    
    if (selectError && selectError.code !== 'PGRST116') {
      console.error('Erro ao consultar tabela:', selectError);
      return;
    }

    console.log('📋 Estrutura atual:', Object.keys(existingUser || {}));

    // Tentar inserir um usuário de teste com todas as colunas
    console.log('🧪 Testando inserção com todas as colunas...');
    
    const testUser = {
      email: 'test-temp@exemplo.com',
      username: 'test-temp-user',
      password: 'temp123',
      first_name: 'Test',
      last_name: 'User',
      date_of_birth: new Date('1990-01-01'),
      height: 175.0,
      weight: 70.0,
      activity_level: 'moderado',
      is_active: true
    };

    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro na inserção (esperado se colunas não existem):', insertError.message);
      
      // Se falhou, vamos tentar atualizar a estrutura através do SQL Editor
      // Vamos fazer inserções simples primeiro para confirmar quais colunas existem
      console.log('🔍 Testando colunas uma por uma...');
      
      // Tentar inserir apenas campos básicos
      const basicUser = {
        email: 'test-basic@exemplo.com',
        username: 'test-basic-user',
        password: 'temp123',
        first_name: 'Basic',
        last_name: 'User',
        is_active: true
      };

      const { data: basicInserted, error: basicError } = await supabase
        .from('users')
        .insert(basicUser)
        .select()
        .single();

      if (basicError) {
        console.error('❌ Erro mesmo com campos básicos:', basicError);
        return;
      }

      console.log('✅ Inserção básica funcionou');
      
      // Tentar atualizar com cada campo individual
      const userId = basicInserted.id;
      
      // Testar date_of_birth
      console.log('🧪 Testando date_of_birth...');
      const { error: dateError } = await supabase
        .from('users')
        .update({ date_of_birth: new Date('1990-01-01') })
        .eq('id', userId);
      
      if (dateError) {
        console.log('❌ date_of_birth não existe:', dateError.message);
      } else {
        console.log('✅ date_of_birth existe');
      }

      // Testar height
      console.log('🧪 Testando height...');
      const { error: heightError } = await supabase
        .from('users')
        .update({ height: 175.0 })
        .eq('id', userId);
      
      if (heightError) {
        console.log('❌ height não existe:', heightError.message);
      } else {
        console.log('✅ height existe');
      }

      // Testar weight
      console.log('🧪 Testando weight...');
      const { error: weightError } = await supabase
        .from('users')
        .update({ weight: 70.0 })
        .eq('id', userId);
      
      if (weightError) {
        console.log('❌ weight não existe:', weightError.message);
      } else {
        console.log('✅ weight existe');
      }

      // Testar activity_level
      console.log('🧪 Testando activity_level...');
      const { error: activityError } = await supabase
        .from('users')
        .update({ activity_level: 'moderado' })
        .eq('id', userId);
      
      if (activityError) {
        console.log('❌ activity_level não existe:', activityError.message);
      } else {
        console.log('✅ activity_level existe');
      }

      // Limpar usuário de teste
      await supabase.from('users').delete().eq('id', userId);
      console.log('🧹 Usuário de teste removido');

    } else {
      console.log('✅ Todas as colunas existem! Estrutura:', Object.keys(insertedUser));
      // Limpar usuário de teste
      await supabase.from('users').delete().eq('id', insertedUser.id);
      console.log('🧹 Usuário de teste removido');
    }

  } catch (error) {
    console.error('❌ Erro no script:', error);
  }
}

createMissingColumns();