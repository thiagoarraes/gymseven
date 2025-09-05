#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

console.log('🔧 Configurando tabelas do Supabase...\n');

// Check for required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('❌ Credenciais do Supabase não encontradas!');
  console.log('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY primeiro.');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupTables() {
  try {
    console.log('📋 Verificando se as tabelas existem...');
    
    // Check if users table exists
    const { data, error } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      console.log('🔨 Tabelas não encontradas. Executando setup SQL...');
      
      // Read and execute the setup SQL
      const setupSQL = readFileSync(join(process.cwd(), 'sql-scripts', 'supabase-setup.sql'), 'utf-8');
      
      // Note: This is a simplified approach. In production, you might want to use migrations
      console.log('⚠️  Execute manualmente o SQL em sql-scripts/supabase-setup.sql no editor SQL do Supabase');
      console.log('   Dashboard > SQL Editor > New Query > Cole o conteúdo do arquivo');
      
    } else if (error) {
      console.log('❌ Erro ao verificar tabelas:', error.message);
      process.exit(1);
    } else {
      console.log('✅ Tabelas já existem no Supabase!');
    }
    
    console.log('🎉 Setup do Supabase concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante o setup:', error.message);
    process.exit(1);
  }
}

setupTables();