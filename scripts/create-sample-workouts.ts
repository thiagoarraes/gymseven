import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para gerar data aleatória nos últimos 30 dias
function getRandomDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(Math.floor(Math.random() * 12) + 6); // Entre 6h e 18h
  date.setMinutes(Math.floor(Math.random() * 60));
  return date;
}

// Função para gerar endTime baseado em startTime
function getEndTime(startTime: Date): Date {
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + Math.floor(Math.random() * 60) + 30); // 30-90 min
  return endTime;
}

async function createSampleWorkouts() {
  console.log('🏋️ Criando treinos de exemplo...');

  // Buscar exercícios existentes
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('*')
    .limit(15);

  if (exercisesError || !exercises || exercises.length === 0) {
    console.error('❌ Erro ao buscar exercícios:', exercisesError);
    return;
  }

  console.log(`✅ Encontrados ${exercises.length} exercícios`);

  // Treinos de exemplo
  const workoutTemplates = [
    { name: 'Treino A - Peito e Tríceps', groups: ['Peito', 'Tríceps'] },
    { name: 'Treino B - Costas e Bíceps', groups: ['Costas', 'Bíceps'] },
    { name: 'Treino C - Pernas', groups: ['Pernas'] },
    { name: 'Treino D - Ombros', groups: ['Ombros'] },
    { name: 'Push Day', groups: ['Peito', 'Ombros', 'Tríceps'] }
  ];

  for (let i = 0; i < 10; i++) {
    const workoutTemplate = workoutTemplates[i % workoutTemplates.length];
    const startTime = getRandomDate(Math.floor(Math.random() * 30));
    const endTime = getEndTime(startTime);

    // Criar workout log
    const { data: workoutLog, error: workoutError } = await supabase
      .from('workoutLogs')
      .insert({
        name: `${workoutTemplate.name} - ${startTime.toLocaleDateString('pt-BR')}`,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      })
      .select()
      .single();

    if (workoutError || !workoutLog) {
      console.error(`❌ Erro ao criar treino ${i + 1}:`, workoutError);
      continue;
    }

    console.log(`✅ Treino ${i + 1} criado: ${workoutLog.name}`);

    // Filtrar exercícios pelos grupos musculares do treino
    const workoutExercises = exercises.filter(ex => 
      workoutTemplate.groups.includes(ex.muscleGroup)
    ).slice(0, Math.floor(Math.random() * 3) + 3); // 3-5 exercícios

    // Criar exercícios do treino
    for (let j = 0; j < workoutExercises.length; j++) {
      const exercise = workoutExercises[j];

      const { data: logExercise, error: logExerciseError } = await supabase
        .from('workoutLogExercises')
        .insert({
          logId: workoutLog.id,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          order: j + 1
        })
        .select()
        .single();

      if (logExerciseError || !logExercise) {
        console.error(`❌ Erro ao criar exercício ${exercise.name}:`, logExerciseError);
        continue;
      }

      // Criar séries para cada exercício
      const numSets = Math.floor(Math.random() * 2) + 3; // 3-4 séries
      for (let k = 0; k < numSets; k++) {
        const weight = Math.floor(Math.random() * 80) + 20; // 20-100kg
        const reps = Math.floor(Math.random() * 8) + 8; // 8-15 reps

        await supabase
          .from('workoutLogSets')
          .insert({
            logExerciseId: logExercise.id,
            setNumber: k + 1,
            weight: weight,
            reps: reps,
            completed: true
          });
      }
    }

    console.log(`  📊 ${workoutExercises.length} exercícios adicionados`);
  }

  console.log('🎉 Todos os treinos de exemplo foram criados!');
}

// Executar script
createSampleWorkouts().catch(console.error);