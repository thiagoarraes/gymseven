import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUserIsolation() {
  console.log('🔍 Verificando isolamento de dados por usuário...\n');
  
  try {
    // Check exercises
    const { data: exercises, error: exercisesError } = await supabase
      .from('exercises')
      .select('id, name, user_id, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10);
    
    if (exercisesError) {
      console.error('❌ Erro ao buscar exercícios:', exercisesError);
      return;
    }
    
    console.log('📋 EXERCÍCIOS (últimos 10):');
    console.log('Total encontrados:', exercises?.length || 0);
    exercises?.forEach((ex, i) => {
      console.log(`  ${i + 1}. ${ex.name} | UserID: ${ex.user_id || 'SEM USER_ID'} | ID: ${ex.id.slice(0, 8)}...`);
    });
    
    // Check workout templates
    const { data: templates, error: templatesError } = await supabase
      .from('workoutTemplates')
      .select('id, name, user_id, createdAt')
      .order('createdAt', { ascending: false })
      .limit(10);
    
    if (templatesError) {
      console.error('❌ Erro ao buscar templates:', templatesError);
      return;
    }
    
    console.log('\n📝 TEMPLATES DE TREINO (últimos 10):');
    console.log('Total encontrados:', templates?.length || 0);
    templates?.forEach((tmpl, i) => {
      console.log(`  ${i + 1}. ${tmpl.name} | UserID: ${tmpl.user_id || 'SEM USER_ID'} | ID: ${tmpl.id.slice(0, 8)}...`);
    });
    
    // Check workout logs
    const { data: logs, error: logsError } = await supabase
      .from('workoutLogs')
      .select('id, name, user_id, startTime')
      .order('startTime', { ascending: false })
      .limit(10);
    
    if (logsError) {
      console.error('❌ Erro ao buscar logs:', logsError);
      return;
    }
    
    console.log('\n🏋️ LOGS DE TREINO (últimos 10):');
    console.log('Total encontrados:', logs?.length || 0);
    logs?.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log.name} | UserID: ${log.user_id || 'SEM USER_ID'} | ID: ${log.id.slice(0, 8)}...`);
    });
    
    // Check unique users with data
    const uniqueUserIds = new Set([
      ...(exercises?.map(e => e.user_id).filter(Boolean) || []),
      ...(templates?.map(t => t.user_id).filter(Boolean) || []),
      ...(logs?.map(l => l.user_id).filter(Boolean) || [])
    ]);
    
    console.log('\n👥 RESUMO:');
    console.log(`Usuários únicos com dados: ${uniqueUserIds.size}`);
    console.log(`Exercícios sem userID: ${exercises?.filter(e => !e.user_id).length || 0}`);
    console.log(`Templates sem userID: ${templates?.filter(t => !t.user_id).length || 0}`);
    console.log(`Logs sem userID: ${logs?.filter(l => !l.user_id).length || 0}`);
    
    if (uniqueUserIds.size > 0) {
      console.log('\nUsuários encontrados:');
      Array.from(uniqueUserIds).forEach((userId, i) => {
        console.log(`  ${i + 1}. ${userId}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

checkUserIsolation();