import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSpecificExercise() {
  console.log('🔍 Testando exercício específico: Supino reto');
  
  // ID do Supino reto conforme mostrado no debug anterior
  const exerciseId = '134f5a23-5179-44cb-bbaa-6895d6564f6c';
  
  // Buscar exercício
  const { data: exercise } = await supabase
    .from('exercises')
    .select('*')
    .eq('id', exerciseId)
    .single();
  
  console.log(`📋 Exercício: ${exercise?.name}`);
  
  // Buscar logs deste exercício
  const { data: logExercises, error } = await supabase
    .from('workoutLogExercises')
    .select(`
      *,
      workoutLog:workoutLogs(*)
    `)
    .eq('exerciseId', exerciseId)
    .order('order');
  
  console.log(`💪 ${logExercises?.length || 0} logs encontrados`);
  if (error) console.log('❌ Erro:', error);
  
  if (logExercises && logExercises.length > 0) {
    for (const logExercise of logExercises) {
      console.log(`\n🏋️ Log: ${logExercise.exerciseName} em ${logExercise.workoutLog?.name}`);
      
      // Buscar séries
      const { data: sets } = await supabase
        .from('workoutLogSets')
        .select('*')
        .eq('logExerciseId', logExercise.id)
        .not('weight', 'is', null)
        .order('setNumber');
      
      console.log(`⚖️ ${sets?.length || 0} séries com peso`);
      
      if (sets && sets.length > 0) {
        sets.forEach((set: any) => {
          console.log(`  Série ${set.setNumber}: ${set.reps} reps x ${set.weight}kg`);
        });
        
        const maxWeight = Math.max(...sets.map((set: any) => set.weight || 0));
        console.log(`📈 Peso máximo: ${maxWeight}kg`);
      }
    }
  }
}

testSpecificExercise().catch(console.error);