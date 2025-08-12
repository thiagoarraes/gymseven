import { supabase } from '../server/supabase-client';

async function checkUserIsolation() {
  try {
    console.log('🔍 Verificando isolamento de dados do usuário...');

    // Verificar usuarios
    const { data: users } = await supabase.from('users').select('id, username, email');
    console.log(`👥 Usuários: ${users?.length || 0}`);
    users?.forEach(user => console.log(`  - ${user.username} (${user.email})`));

    if (!users || users.length === 0) return;

    const userId = users[0].id;
    console.log(`\n🎯 Testando dados para usuário: ${users[0].username}`);

    // Verificar exercícios
    const { data: exercises } = await supabase
      .from('exercises')
      .select('*')
      .eq('user_id', userId);
    console.log(`💪 Exercícios: ${exercises?.length || 0}`);

    // Verificar templates
    const { data: templates } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('user_id', userId);
    console.log(`📋 Templates: ${templates?.length || 0}`);

    // Verificar logs
    const { data: logs } = await supabase
      .from('workoutLogs')
      .select('*')
      .eq('user_id', userId);
    console.log(`📊 Logs: ${logs?.length || 0}`);

    if (logs && logs.length > 0) {
      const testLog = logs[0];
      console.log(`\n🔍 Analisando log: ${testLog.name}`);

      // Verificar logExercises
      const { data: logExercises } = await supabase
        .from('workoutLogExercises')
        .select('*')
        .eq('logId', testLog.id);
      console.log(`  📝 LogExercises: ${logExercises?.length || 0}`);

      if (logExercises && logExercises.length > 0) {
        const testLogExercise = logExercises[0];
        
        // Verificar sets
        const { data: sets } = await supabase
          .from('workoutLogSets')
          .select('*')
          .eq('logExerciseId', testLogExercise.id);
        console.log(`  🎯 Sets para exercício ${testLogExercise.id}: ${sets?.length || 0}`);
        
        if (sets && sets.length > 0) {
          sets.forEach(set => {
            console.log(`    Set ${set.setNumber}: ${set.reps} reps @ ${set.weight}kg (completed: ${set.completed})`);
          });
        }
      }
    }

    console.log('\n✅ Verificação concluída');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkUserIsolation().then(() => process.exit(0)).catch(() => process.exit(1));