import { supabase } from '../server/supabase-client';
import bcrypt from 'bcryptjs';

async function createTestUser() {
  try {
    console.log('🔧 Criando usuário de teste...');

    // Hash da senha
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Verificar se usuário já existe
    const { data: existingUser } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'teste@gymseven.com')
      .single();

    if (existingUser) {
      console.log('✅ Usuário de teste já existe:', existingUser.username);
      return existingUser;
    }

    // Criar usuário
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email: 'teste@gymseven.com',
        username: 'teste',
        password: hashedPassword,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erro criando usuário:', error);
      return null;
    }

    console.log('✅ Usuário de teste criado:', user.username);
    return user;

  } catch (error) {
    console.error('❌ Erro:', error);
    return null;
  }
}

createTestUser().then(() => process.exit(0)).catch(() => process.exit(1));