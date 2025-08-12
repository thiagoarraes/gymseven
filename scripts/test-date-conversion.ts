import { supabase } from '../server/supabase-client';

async function testDirectInsert() {
  try {
    console.log('🧪 Teste direto de inserção...');

    // Buscar um workout log específico
    const { data: log } = await supabase
      .from('workoutLogs')
      .select('*')
      .limit(1)
      .single();

    if (!log) {
      console.log('❌ Nenhum log encontrado');
      return;
    }

    console.log(`📊 Log: ${log.name} (ID: ${log.id})`);
    console.log(`🎯 Template ID: ${log.templateId}`);

    // Buscar exercícios do template
    const { data: templateExercises, error: teError } = await supabase
      .from('workoutTemplateExercises')
      .select('*, exercises(*)')
      .eq('templateId', log.templateId);

    if (teError) {
      console.error('❌ Erro buscando template exercises:', teError);
      return;
    }

    if (!templateExercises || templateExercises.length === 0) {
      console.log('❌ Nenhum exercício no template');
      return;
    }

    console.log(`💪 ${templateExercises.length} exercícios no template`);

    // Tentar inserir um logExercise manualmente
    const firstTemplateExercise = templateExercises[0];
    console.log(`🎯 Testando exercício: ${firstTemplateExercise.exercises.name}`);

    const { data: insertedLogExercise, error: insertError } = await supabase
      .from('workoutLogExercises')
      .insert({
        logId: log.id,
        exerciseId: firstTemplateExercise.exerciseId,
        exerciseName: firstTemplateExercise.exercises.name,
        order: 1
      })
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro inserindo logExercise:', insertError);
      return;
    }

    console.log(`✅ LogExercise criado: ${insertedLogExercise.id}`);

    // Tentar inserir um set
    const { data: insertedSet, error: setError } = await supabase
      .from('workoutLogSets')
      .insert({
        logExerciseId: insertedLogExercise.id,
        setNumber: 1,
        reps: 12,
        weight: 60,
        completed: true
      })
      .select()
      .single();

    if (setError) {
      console.error('❌ Erro inserindo set:', setError);
      return;
    }

    console.log(`✅ Set criado: ${insertedSet.id}`);

    // Verificar se foram criados
    const { data: verifyLogExercises } = await supabase
      .from('workoutLogExercises')
      .select('*')
      .eq('logId', log.id);

    console.log(`🔍 LogExercises no banco: ${verifyLogExercises?.length || 0}`);

    const { data: verifySets } = await supabase
      .from('workoutLogSets')
      .select('*')
      .eq('logExerciseId', insertedLogExercise.id);

    console.log(`🔍 Sets no banco: ${verifySets?.length || 0}`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

testDirectInsert().then(() => process.exit(0)).catch(() => process.exit(1));