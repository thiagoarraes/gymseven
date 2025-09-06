// Script para criar tabelas diretamente no Supabase usando queries SQL individuais
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Credenciais do Supabase não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🔗 Conectando ao Supabase...');
    console.log(`📍 URL: ${supabaseUrl}`);
    
    // Query 1: Criar tabela usuarios
    console.log('📋 Criando tabela usuarios...');
    const { error: error1 } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS usuarios (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        "firstName" TEXT,
        "lastName" TEXT,
        "dateOfBirth" TIMESTAMP,
        height REAL,
        weight REAL,
        "activityLevel" TEXT DEFAULT 'moderado',
        "fitnessGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "profileImageUrl" TEXT,
        "experienceLevel" TEXT DEFAULT 'iniciante',
        "preferredWorkoutDuration" INTEGER DEFAULT 60,
        "isActive" BOOLEAN DEFAULT true,
        "emailVerified" BOOLEAN DEFAULT false,
        "lastLoginAt" TIMESTAMP,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    if (error1) {
      console.error('❌ Erro ao criar tabela usuarios:', error1);
    } else {
      console.log('✅ Tabela usuarios criada');
    }
    
    // Query 2: Criar tabela exercicios
    console.log('📋 Criando tabela exercicios...');
    const { error: error2 } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS exercicios (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        "grupoMuscular" TEXT NOT NULL,
        descricao TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    if (error2) {
      console.error('❌ Erro ao criar tabela exercicios:', error2);
    } else {
      console.log('✅ Tabela exercicios criada');
    }
    
    // Query 3: Criar tabela modelosTreino
    console.log('📋 Criando tabela modelosTreino...');
    const { error: error3 } = await supabase.sql`
      CREATE TABLE IF NOT EXISTS "modelosTreino" (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nome TEXT NOT NULL,
        descricao TEXT,
        "createdAt" TIMESTAMP DEFAULT NOW()
      )
    `;
    
    if (error3) {
      console.error('❌ Erro ao criar tabela modelosTreino:', error3);
    } else {
      console.log('✅ Tabela modelosTreino criada');
    }
    
    // Verificar tabelas criadas
    console.log('🔍 Verificando tabelas criadas...');
    const { data: tables, error: checkError } = await supabase
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public');
      
    if (checkError) {
      console.log('ℹ️ Não foi possível verificar as tabelas:', checkError);
    } else {
      console.log('📋 Tabelas encontradas no Supabase:');
      tables?.forEach(table => console.log(`  - ${table.tablename}`));
    }
    
    console.log('✅ Processo de criação de tabelas concluído!');
    
  } catch (error) {
    console.error('❌ Erro inesperado:', error);
  }
}

createTables();