import { supabase } from '../server/supabase-client';
import fs from 'fs';
import path from 'path';

async function setupSupabaseTables() {
  try {
    console.log('🎯 Configurando tabelas do Supabase...');
    
    // Read the SQL setup script
    const sqlScript = fs.readFileSync(path.join(process.cwd(), 'sql-scripts', 'supabase-setup.sql'), 'utf8');
    
    // Split the script into individual statements
    const statements = sqlScript
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement && !statement.startsWith('--') && statement !== 'NOTIFY pgsql, \'GymSeven database schema setup completed successfully!\'');
    
    console.log(`📋 Executando ${statements.length} comandos SQL...`);
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`Executando comando ${i + 1}/${statements.length}...`);
          
          // Use rpc for DDL operations
          const { data, error } = await supabase.rpc('exec_sql', { 
            sql_statement: statement + ';' 
          });
          
          if (error) {
            console.log(`⚠️ Comando ${i + 1} (possivelmente já executado):`, error.message);
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (cmdError: any) {
          console.log(`⚠️ Erro no comando ${i + 1}:`, cmdError.message);
        }
      }
    }
    
    // Test the setup by checking if tables exist
    console.log('🔍 Verificando se as tabelas foram criadas...');
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    if (!usersError) {
      console.log('✅ Tabela users encontrada');
    } else {
      console.log('❌ Erro ao acessar tabela users:', usersError.message);
    }
    
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id')
      .limit(1);
    
    if (!exercisesError) {
      console.log('✅ Tabela exercises encontrada');
    } else {
      console.log('❌ Erro ao acessar tabela exercises:', exercisesError.message);
    }
    
    console.log('🎉 Setup do Supabase concluído!');
    
  } catch (error: any) {
    console.error('❌ Erro durante o setup do Supabase:', error.message);
    console.log('📋 Execute manualmente o script sql-scripts/supabase-setup.sql no painel do Supabase');
    console.log('🌐 Acesse: https://supabase.com/dashboard > Seu projeto > SQL Editor');
  }
}

// Execute setup
setupSupabaseTables();