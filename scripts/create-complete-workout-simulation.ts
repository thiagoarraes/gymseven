import { supabase } from '../server/supabase-client.js';

async function createCompleteWorkoutSimulation() {
  console.log('🎯 Criando simulação completa de treinos executados...');
  
  // Get user ID for Thiago
  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('username', 'thiago')
    .single();
    
  if (!user) {
    console.log('❌ Usuário Thiago não encontrado');
    return;
  }
  
  const userId = user.id;
  console.log('✅ Usuário encontrado:', userId);
  
  // Get all exercises
  const { data: exercises } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', userId);
    
  if (!exercises) {
    console.log('❌ Exercícios não encontrados');
    return;
  }
  
  console.log(`✅ ${exercises.length} exercícios encontrados`);
  
  // Get all templates
  const { data: templates } = await supabase
    .from('workoutTemplates')
    .select('*')
    .eq('user_id', userId);
    
  if (!templates) {
    console.log('❌ Templates não encontrados');
    return;
  }
  
  console.log(`✅ ${templates.length} templates encontrados`);
  
  // Clear existing template exercises
  await supabase
    .from('workout_template_exercises')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    
  console.log('🗑️ Templates limpos');
  
  // Create exercise mappings for each template
  const templateExercises = {
    'Treino A - Peito, Ombros, Tríceps': [
      { name: 'Supino Reto', sets: 4, reps: '8-10', weight: 80, rest: 120 },
      { name: 'Supino Inclinado', sets: 3, reps: '8-10', weight: 70, rest: 90 },
      { name: 'Desenvolvimento com Halteres', sets: 3, reps: '10-12', weight: 20, rest: 90 },
      { name: 'Elevação Lateral', sets: 3, reps: '12-15', weight: 12, rest: 60 },
      { name: 'Tríceps Testa', sets: 3, reps: '10-12', weight: 30, rest: 75 },
      { name: 'Mergulho', sets: 3, reps: '8-12', weight: 0, rest: 90 }
    ],
    'Treino B - Costas, Bíceps': [
      { name: 'Puxada Frontal', sets: 4, reps: '8-10', weight: 70, rest: 120 },
      { name: 'Remada Curvada', sets: 3, reps: '8-10', weight: 60, rest: 90 },
      { name: 'Puxada Alta', sets: 3, reps: '10-12', weight: 50, rest: 90 },
      { name: 'Rosca Direta', sets: 3, reps: '10-12', weight: 25, rest: 75 },
      { name: 'Rosca Martelo', sets: 3, reps: '12-15', weight: 20, rest: 60 },
      { name: 'Rosca Concentrada', sets: 2, reps: '12-15', weight: 15, rest: 60 }
    ],
    'Treino C - Pernas, Abdômen': [
      { name: 'Agachamento Livre', sets: 4, reps: '8-12', weight: 100, rest: 150 },
      { name: 'Leg Press', sets: 3, reps: '12-15', weight: 200, rest: 120 },
      { name: 'Stiff', sets: 3, reps: '10-12', weight: 80, rest: 90 },
      { name: 'Panturrilha em Pé', sets: 4, reps: '15-20', weight: 60, rest: 60 },
      { name: 'Abdominal Supra', sets: 3, reps: '20-25', weight: 0, rest: 45 },
      { name: 'Prancha', sets: 3, reps: '30-60s', weight: 0, rest: 45 }
    ]
  };
  
  // Add exercises to templates
  for (const template of templates) {
    const templateName = template.name;
    const exerciseList = templateExercises[templateName as keyof typeof templateExercises];
    
    if (!exerciseList) {
      console.log(`⚠️ Exercícios não definidos para template: ${templateName}`);
      continue;
    }
    
    console.log(`📋 Adicionando exercícios ao ${templateName}...`);
    
    for (let i = 0; i < exerciseList.length; i++) {
      const exerciseConfig = exerciseList[i];
      const exercise = exercises.find(e => e.name === exerciseConfig.name);
      
      if (!exercise) {
        console.log(`⚠️ Exercício não encontrado: ${exerciseConfig.name}`);
        continue;
      }
      
      const { error } = await supabase
        .from('workout_template_exercises')
        .insert({
          template_id: template.id,
          exercise_id: exercise.id,
          sets: exerciseConfig.sets,
          reps: exerciseConfig.reps,
          weight: exerciseConfig.weight,
          rest_duration_seconds: exerciseConfig.rest,
          order: i + 1
        });
        
      if (error) {
        console.log(`❌ Erro ao adicionar ${exerciseConfig.name}:`, error.message);
      } else {
        console.log(`✅ ${exerciseConfig.name} adicionado ao ${templateName}`);
      }
    }
  }
  
  console.log('🏋️ Criando histórico de treinos executados...');
  
  // Clear existing workout logs
  await supabase
    .from('workout_logs')
    .delete()
    .eq('user_id', userId);
    
  // Create workout log pattern: A-B-C-A-B repeat for last 15 days
  const workoutPattern = ['A', 'B', 'C', 'A', 'B', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'];
  const today = new Date();
  
  for (let i = 0; i < workoutPattern.length; i++) {
    const workoutDay = new Date(today);
    workoutDay.setDate(today.getDate() - (workoutPattern.length - 1 - i));
    
    const templateLetter = workoutPattern[i];
    const templateName = templateLetter === 'A' ? 'Treino A - Peito, Ombros, Tríceps' :
                        templateLetter === 'B' ? 'Treino B - Costas, Bíceps' : 
                        'Treino C - Pernas, Abdômen';
    
    const template = templates.find(t => t.name === templateName);
    if (!template) continue;
    
    // Create workout log
    const startTime = new Date(workoutDay);
    startTime.setHours(19 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // 19h-22h
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 60 + Math.floor(Math.random() * 30)); // 60-90 min
    
    const { data: workoutLog, error: logError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        template_id: template.id,
        name: templateName,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        notes: `Treino ${templateLetter} executado - Sessão ${i + 1}`
      })
      .select()
      .single();
      
    if (logError) {
      console.log(`❌ Erro ao criar log: ${logError.message}`);
      continue;
    }
    
    console.log(`✅ Log criado para ${templateName} - ${workoutDay.toLocaleDateString()}`);
    
    // Get template exercises for this workout
    const { data: templateExs } = await supabase
      .from('workout_template_exercises')
      .select(`
        *,
        exercises (*)
      `)
      .eq('template_id', template.id)
      .order('order');
      
    if (!templateExs) continue;
    
    // Create workout log exercises and sets
    for (const templateEx of templateExs) {
      // Create workout log exercise entry
      const { data: logExercise, error: logExError } = await supabase
        .from('workout_log_exercises')
        .insert({
          log_id: workoutLog.id,
          exercise_id: templateEx.exercise_id,
          exercise_name: templateEx.exercises?.name || 'Unknown',
          order: templateEx.order
        })
        .select()
        .single();
        
      if (logExError) {
        console.log(`❌ Erro ao criar exercício do log: ${logExError.message}`);
        continue;
      }
      
      // Create sets for this exercise
      const baseSets = templateEx.sets || 3;
      for (let setNum = 1; setNum <= baseSets; setNum++) {
        let weight = templateEx.weight || 0;
        let reps = 10;
        
        // Add some variation to make it realistic
        if (setNum === 1) {
          // Warm-up set
          weight = Math.max(0, weight * 0.7);
          reps = 12;
        } else if (setNum === baseSets) {
          // Last set - drop weight or do more reps
          if (Math.random() > 0.5) {
            weight = Math.max(0, weight * 0.9);
            reps = Math.floor(reps * 1.2);
          }
        }
        
        // Parse reps from template
        if (templateEx.reps && templateEx.reps.includes('-')) {
          const [minReps, maxReps] = templateEx.reps.split('-').map(Number);
          reps = minReps + Math.floor(Math.random() * (maxReps - minReps + 1));
        }
        
        const { error: setError } = await supabase
          .from('workout_log_sets')
          .insert({
            log_exercise_id: logExercise.id,
            set_number: setNum,
            weight: Math.round(weight),
            reps: reps,
            completed: true,
            rpe: 7 + Math.floor(Math.random() * 3) // RPE 7-9
          });
          
        if (setError) {
          console.log(`❌ Erro ao criar set: ${setError.message}`);
        }
      }
    }
  }
  
  console.log('🎉 Simulação completa de treinos criada!');
  console.log(`📊 Criados: ${workoutPattern.length} treinos executados com exercícios e sets detalhados`);
}

createCompleteWorkoutSimulation().catch(console.error);