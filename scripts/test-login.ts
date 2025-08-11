import { supabase } from '../server/supabase-client';
import bcrypt from 'bcryptjs';

async function testLogin() {
  console.log('🔍 Testando sistema de login...');

  try {
    // Verificar se o usuário existe
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'teste@gymseven.com');

    if (error) {
      console.error('❌ Erro ao buscar usuário:', error);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ Usuário não encontrado!');
      
      // Criar usuário novamente
      const hashedPassword = await bcrypt.hash('123456', 12);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email: 'teste@gymseven.com',
          username: 'teste',
          password: hashedPassword,
          first_name: 'Usuário',
          last_name: 'Teste',
          is_active: true
        })
        .select();

      if (createError) {
        console.error('❌ Erro ao criar usuário:', createError);
      } else {
        console.log('✅ Usuário criado:', newUser);
      }
      return;
    }

    const user = users[0];
    console.log('✅ Usuário encontrado:', {
      id: user.id,
      email: user.email,
      username: user.username,
      hasPassword: !!user.password,
      passwordLength: user.password?.length || 0
    });

    // Testar verificação de senha
    if (user.password) {
      const isValidPassword = await bcrypt.compare('123456', user.password);
      console.log('🔐 Senha válida:', isValidPassword);
      
      if (!isValidPassword) {
        console.log('🔄 Atualizando senha...');
        const newHashedPassword = await bcrypt.hash('123456', 12);
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ password: newHashedPassword })
          .eq('id', user.id);

        if (updateError) {
          console.error('❌ Erro ao atualizar senha:', updateError);
        } else {
          console.log('✅ Senha atualizada com sucesso');
        }
      }
    } else {
      console.log('❌ Usuário não tem senha definida');
    }

    // Testar login via API
    console.log('🌐 Testando login via API...');
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'teste@gymseven.com',
        password: '123456'
      }),
    });

    const result = await response.json();
    console.log('📊 Resposta da API:', {
      status: response.status,
      result
    });

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testLogin();