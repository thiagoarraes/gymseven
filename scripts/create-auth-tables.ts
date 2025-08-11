import { supabase } from '../server/supabase-client';

async function createAuthTables() {
  console.log('🔧 Criando tabelas de autenticação no Supabase...');

  try {
    // Verificar se as tabelas já existem
    const { data: existingTables } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'user_preferences', 'user_goals', 'weight_history']);

    console.log('📋 Tabelas existentes:', existingTables);

    // Criar tabela users
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        date_of_birth DATE,
        height DECIMAL(5,2),
        weight DECIMAL(5,2),
        activity_level VARCHAR(50) DEFAULT 'moderate',
        profile_image_url TEXT,
        bio TEXT,
        is_active BOOLEAN DEFAULT true,
        last_login_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Criar tabela user_preferences
    const createUserPreferencesTable = `
      CREATE TABLE IF NOT EXISTS user_preferences (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        theme VARCHAR(20) DEFAULT 'dark',
        units VARCHAR(20) DEFAULT 'metric',
        language VARCHAR(10) DEFAULT 'pt-BR',
        notifications BOOLEAN DEFAULT true,
        sound_effects BOOLEAN DEFAULT true,
        rest_timer_auto_start BOOLEAN DEFAULT true,
        default_rest_time INTEGER DEFAULT 90,
        week_starts_on INTEGER DEFAULT 1,
        tracking_data VARCHAR(20) DEFAULT 'all',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    // Criar tabela user_goals
    const createUserGoalsTable = `
      CREATE TABLE IF NOT EXISTS user_goals (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        goal_type VARCHAR(50) NOT NULL,
        target_value DECIMAL(10,2),
        target_date DATE,
        current_value DECIMAL(10,2) DEFAULT 0,
        is_achieved BOOLEAN DEFAULT false,
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Criar tabela weight_history
    const createWeightHistoryTable = `
      CREATE TABLE IF NOT EXISTS weight_history (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        weight DECIMAL(5,2) NOT NULL,
        date DATE NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, date)
      );
    `;

    // Executar queries usando RPC (Supabase function)
    const { error: usersError } = await supabase.rpc('exec_sql', { 
      sql_query: createUsersTable 
    });
    
    const { error: preferencesError } = await supabase.rpc('exec_sql', { 
      sql_query: createUserPreferencesTable 
    });
    
    const { error: goalsError } = await supabase.rpc('exec_sql', { 
      sql_query: createUserGoalsTable 
    });
    
    const { error: weightError } = await supabase.rpc('exec_sql', { 
      sql_query: createWeightHistoryTable 
    });

    if (usersError || preferencesError || goalsError || weightError) {
      console.error('❌ Erro ao criar tabelas:', {
        usersError,
        preferencesError,
        goalsError,
        weightError
      });
      
      // Tentar método alternativo: usar SQL direto
      console.log('🔄 Tentando método alternativo...');
      
      // Criar usuário de teste diretamente
      const testUser = {
        id: 'test-user-id',
        email: 'teste@gymseven.com',
        username: 'teste',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOdZRtoNOaoZ92s4KJz2z2Zd8.4Jz8vKu', // senha: 123456
        firstName: 'Usuário',
        lastName: 'Teste',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(testUser);

      if (insertError) {
        console.error('❌ Erro ao inserir usuário teste:', insertError);
      } else {
        console.log('✅ Usuário teste criado com sucesso!');
      }
    } else {
      console.log('✅ Tabelas criadas com sucesso!');
      
      // Criar usuário de teste
      const testUser = {
        email: 'teste@gymseven.com',
        username: 'teste',
        password: '$2a$12$LQv3c1yqBWVHxkd0LQ4YCOdZRtoNOaoZ92s4KJz2z2Zd8.4Jz8vKu', // senha: 123456
        first_name: 'Usuário',
        last_name: 'Teste',
        is_active: true
      };

      const { error: insertError } = await supabase
        .from('users')
        .insert(testUser);

      if (insertError) {
        console.error('❌ Erro ao inserir usuário teste:', insertError);
      } else {
        console.log('✅ Usuário teste criado: teste@gymseven.com / 123456');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createAuthTables();