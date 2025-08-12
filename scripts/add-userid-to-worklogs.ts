import { supabase } from '../server/supabase-client';

async function addUserIdToWorkoutLogs() {
  try {
    console.log('🔧 Adicionando coluna userId à tabela workoutLogs...');

    // Verificar se a coluna já existe
    const { data: existingColumns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'workoutLogs')
      .eq('column_name', 'userId');

    if (columnError) {
      console.log('⚠️ Não foi possível verificar colunas via supabase, tentando via rpc...');
    }

    // Tentar adicionar a coluna diretamente
    const { error } = await supabase.rpc('add_userid_column_to_worklogs');
    
    if (error) {
      console.log('📝 Tentando criar função SQL...');
      
      // Criar função para adicionar a coluna
      const { error: funcError } = await supabase.rpc('sql', {
        query: `
          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'workoutLogs' AND column_name = 'userId'
            ) THEN
              ALTER TABLE "workoutLogs" ADD COLUMN "userId" UUID REFERENCES users(id);
            END IF;
          END $$;
        `
      });

      if (funcError) {
        console.error('❌ Erro criando função:', funcError);
        
        // Último recurso: tentar direto via SQL
        console.log('🔄 Tentando SQL direto...');
        const { error: directError } = await supabase
          .from('workoutLogs')
          .select('userId')
          .limit(1);
          
        if (directError && directError.message.includes('userId')) {
          console.log('✅ Coluna userId precisa ser adicionada');
          console.log('⚠️ Isso precisa ser feito manualmente no painel do Supabase');
          console.log('SQL necessário: ALTER TABLE "workoutLogs" ADD COLUMN "userId" UUID REFERENCES users(id);');
        }
      }
    }

    console.log('✅ Processo de adicionar userId concluído');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

addUserIdToWorkoutLogs().then(() => process.exit(0)).catch(() => process.exit(1));