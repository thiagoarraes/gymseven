import { supabase } from '../server/supabase-client';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  console.log('👤 Criando usuário de teste...');

  try {
    // Hash da senha "123456"
    const hashedPassword = await bcrypt.hash('123456', 12);
    console.log('🔐 Senha criptografada gerada');

    // Dados do usuário teste
    const testUser = {
      email: 'teste@gymseven.com',
      username: 'teste',
      password: hashedPassword,
      firstName: 'Usuário',
      lastName: 'Teste',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('📝 Tentando inserir usuário...');

    // Tentar inserir na tabela users
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select();

    if (error) {
      console.error('❌ Erro ao inserir usuário:', error);
      
      // Tentar com snake_case
      const testUserSnake = {
        email: 'teste@gymseven.com',
        username: 'teste', 
        password: hashedPassword,
        first_name: 'Usuário',
        last_name: 'Teste',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('🔄 Tentando com snake_case...');
      
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .insert(testUserSnake)
        .select();

      if (error2) {
        console.error('❌ Erro com snake_case:', error2);
      } else {
        console.log('✅ Usuário criado com sucesso!');
        console.log('📧 Email: teste@gymseven.com');
        console.log('🔑 Senha: 123456');
        console.log('👤 Dados:', data2);
      }
    } else {
      console.log('✅ Usuário criado com sucesso!');
      console.log('📧 Email: teste@gymseven.com');
      console.log('🔑 Senha: 123456');
      console.log('👤 Dados:', data);
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTestUser();