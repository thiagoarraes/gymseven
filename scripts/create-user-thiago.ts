import { supabase } from '../server/supabase-client.js';
import bcrypt from 'bcryptjs';

async function createUserThiago() {
  console.log('👤 Criando usuário Thiago...');
  
  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'thiago')
    .single();
    
  if (existingUser) {
    console.log('✅ Usuário Thiago já existe:', existingUser.id);
    return existingUser.id;
  }
  
  // Create user
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  const { data: newUser, error } = await supabase
    .from('users')
    .insert({
      username: 'thiago',
      email: 'thiago@gymseven.com',
      password: hashedPassword,
      first_name: 'Thiago',
      last_name: 'Silva',
      is_active: true
    })
    .select()
    .single();
    
  if (error) {
    console.log('❌ Erro ao criar usuário:', error.message);
    return null;
  }
  
  console.log('✅ Usuário Thiago criado:', newUser.id);
  return newUser.id;
}

createUserThiago().catch(console.error);