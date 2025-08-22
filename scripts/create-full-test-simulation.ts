import { supabase } from '../server/supabase-client.js';
import bcrypt from 'bcryptjs';

async function createFullTestSimulation() {
  console.log('🎯 Criando simulação completa do zero...');
  
  // Create user Thiago if not exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('username', 'thiago')
    .single();
    
  let userId = existingUser?.id;
  
  if (!existingUser) {
    const hashedPassword = await bcrypt.hash('123456', 10);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        username: 'thiago',
        email: 'thiago@gymseven.com',
        password: hashedPassword,
        first_name: 'Thiago',
        last_name: 'Silva',
        is_active: true
      })
      .select()
      .single();
      
    if (error) {
      console.log('❌ Erro ao criar usuário:', error.message);
      return;
    }
    userId = newUser.id;
    console.log('✅ Usuário Thiago criado:', userId);
  } else {
    console.log('✅ Usuário Thiago encontrado:', userId);
  }
  
  // Clear existing data
  await supabase.from('workout_log_sets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('workout_log_exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('workout_logs').delete().eq('user_id', userId);
  await supabase.from('workout_template_exercises').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('workout_templates').delete().eq('user_id', userId);
  await supabase.from('exercises').delete().eq('user_id', userId);
  
  console.log('🗑️ Dados existentes limpos');
  
  // Create exercises
  const exercisesData = [
    // Peito
    { name: 'Supino Reto', muscle_group: 'Peito', description: 'Exercício básico para peito' },
    { name: 'Supino Inclinado', muscle_group: 'Peito', description: 'Foco na parte superior do peito' },
    { name: 'Crucifixo', muscle_group: 'Peito', description: 'Exercício de isolamento para peito' },
    
    // Ombros
    { name: 'Desenvolvimento com Halteres', muscle_group: 'Ombros', description: 'Exercício para deltoides' },
    { name: 'Elevação Lateral', muscle_group: 'Ombros', description: 'Isolamento para deltoide medial' },
    { name: 'Elevação Frontal', muscle_group: 'Ombros', description: 'Isolamento para deltoide anterior' },
    
    // Tríceps
    { name: 'Tríceps Testa', muscle_group: 'Tríceps', description: 'Exercício para tríceps na barra' },
    { name: 'Mergulho', muscle_group: 'Tríceps', description: 'Exercício com peso corporal' },
    { name: 'Tríceps Corda', muscle_group: 'Tríceps', description: 'Exercício no cabo' },
    
    // Costas
    { name: 'Puxada Frontal', muscle_group: 'Costas', description: 'Exercício básico para costas' },
    { name: 'Remada Curvada', muscle_group: 'Costas', description: 'Exercício com barra' },
    { name: 'Puxada Alta', muscle_group: 'Costas', description: 'Exercício no cabo' },
    { name: 'Remada Sentada', muscle_group: 'Costas', description: 'Exercício no cabo sentado' },
    
    // Bíceps
    { name: 'Rosca Direta', muscle_group: 'Bíceps', description: 'Exercício básico para bíceps' },
    { name: 'Rosca Martelo', muscle_group: 'Bíceps', description: 'Variação da rosca' },
    { name: 'Rosca Concentrada', muscle_group: 'Bíceps', description: 'Exercício de isolamento' },
    
    // Pernas
    { name: 'Agachamento Livre', muscle_group: 'Pernas', description: 'Exercício básico para pernas' },
    { name: 'Leg Press', muscle_group: 'Pernas', description: 'Exercício na máquina' },
    { name: 'Stiff', muscle_group: 'Pernas', description: 'Exercício para posteriores' },
    { name: 'Cadeira Extensora', muscle_group: 'Pernas', description: 'Isolamento para quadríceps' },
    { name: 'Mesa Flexora', muscle_group: 'Pernas', description: 'Isolamento para posteriores' },
    { name: 'Panturrilha em Pé', muscle_group: 'Panturrilha', description: 'Exercício para panturrilhas' },
    
    // Abdômen
    { name: 'Abdominal Supra', muscle_group: 'Abdômen', description: 'Exercício básico abdominal' },
    { name: 'Prancha', muscle_group: 'Abdômen', description: 'Exercício isométrico' },
    { name: 'Abdominal Lateral', muscle_group: 'Abdômen', description: 'Exercício para oblíquos' }
  ];
  
  const exerciseIds: Record<string, string> = {};
  
  console.log('💪 Criando exercícios...');
  for (const exercise of exercisesData) {
    const { data, error } = await supabase
      .from('exercises')
      .insert({
        user_id: userId,
        ...exercise
      })
      .select()
      .single();
      
    if (error) {
      console.log(`❌ Erro ao criar ${exercise.name}:`, error.message);
    } else {
      exerciseIds[exercise.name] = data.id;
      console.log(`✅ ${exercise.name} criado`);
    }
  }
  
  // Create workout templates
  const templates = [
    { name: 'Treino A - Peito, Ombros, Tríceps', description: 'Treino de membros superiores - push' },
    { name: 'Treino B - Costas, Bíceps', description: 'Treino de membros superiores - pull' },
    { name: 'Treino C - Pernas, Abdômen', description: 'Treino de membros inferiores' }
  ];
  
  const templateIds: Record<string, string> = {};
  
  console.log('📋 Criando templates...');
  for (const template of templates) {
    const { data, error } = await supabase
      .from('workoutTemplates')
      .insert({
        user_id: userId,
        ...template
      })
      .select()
      .single();
      
    if (error) {
      console.log(`❌ Erro ao criar template:`, error.message);
    } else {
      templateIds[template.name] = data.id;
      console.log(`✅ Template ${template.name} criado`);
    }
  }
  
  // Add exercises to templates
  const templateExercises = {
    'Treino A - Peito, Ombros, Tríceps': [
      { name: 'Supino Reto', sets: 4, reps: '6-8', weight: 80, rest: 180, order: 1 },
      { name: 'Supino Inclinado', sets: 3, reps: '8-10', weight: 70, rest: 120, order: 2 },
      { name: 'Crucifixo', sets: 3, reps: '10-12', weight: 20, rest: 90, order: 3 },
      { name: 'Desenvolvimento com Halteres', sets: 3, reps: '8-10', weight: 25, rest: 120, order: 4 },
      { name: 'Elevação Lateral', sets: 3, reps: '12-15', weight: 12, rest: 60, order: 5 },
      { name: 'Tríceps Testa', sets: 3, reps: '10-12', weight: 35, rest: 90, order: 6 },
      { name: 'Mergulho', sets: 3, reps: '8-12', weight: 0, rest: 90, order: 7 }
    ],
    'Treino B - Costas, Bíceps': [
      { name: 'Puxada Frontal', sets: 4, reps: '6-8', weight: 70, rest: 180, order: 1 },
      { name: 'Remada Curvada', sets: 3, reps: '8-10', weight: 65, rest: 120, order: 2 },
      { name: 'Puxada Alta', sets: 3, reps: '10-12', weight: 50, rest: 90, order: 3 },
      { name: 'Remada Sentada', sets: 3, reps: '10-12', weight: 55, rest: 90, order: 4 },
      { name: 'Rosca Direta', sets: 3, reps: '10-12', weight: 30, rest: 75, order: 5 },
      { name: 'Rosca Martelo', sets: 3, reps: '12-15', weight: 22, rest: 60, order: 6 },
      { name: 'Rosca Concentrada', sets: 2, reps: '12-15', weight: 15, rest: 60, order: 7 }
    ],
    'Treino C - Pernas, Abdômen': [
      { name: 'Agachamento Livre', sets: 4, reps: '6-10', weight: 120, rest: 180, order: 1 },
      { name: 'Leg Press', sets: 3, reps: '12-15', weight: 250, rest: 120, order: 2 },
      { name: 'Stiff', sets: 3, reps: '10-12', weight: 80, rest: 90, order: 3 },
      { name: 'Cadeira Extensora', sets: 3, reps: '12-15', weight: 45, rest: 75, order: 4 },
      { name: 'Mesa Flexora', sets: 3, reps: '12-15', weight: 40, rest: 75, order: 5 },
      { name: 'Panturrilha em Pé', sets: 4, reps: '15-20', weight: 60, rest: 60, order: 6 },
      { name: 'Abdominal Supra', sets: 3, reps: '20-25', weight: 0, rest: 45, order: 7 },
      { name: 'Prancha', sets: 3, reps: '30-60s', weight: 0, rest: 45, order: 8 }
    ]
  };
  
  console.log('🔗 Adicionando exercícios aos templates...');
  for (const [templateName, exercises] of Object.entries(templateExercises)) {
    const templateId = templateIds[templateName];
    if (!templateId) continue;
    
    for (const exercise of exercises) {
      const exerciseId = exerciseIds[exercise.name];
      if (!exerciseId) {
        console.log(`⚠️ Exercício ${exercise.name} não encontrado`);
        continue;
      }
      
      const { error } = await supabase
        .from('workout_template_exercises')
        .insert({
          template_id: templateId,
          exercise_id: exerciseId,
          sets: exercise.sets,
          reps: exercise.reps,
          weight: exercise.weight,
          rest_duration_seconds: exercise.rest,
          order: exercise.order
        });
        
      if (error) {
        console.log(`❌ Erro ao adicionar ${exercise.name} ao ${templateName}:`, error.message);
      } else {
        console.log(`✅ ${exercise.name} adicionado ao ${templateName}`);
      }
    }
  }
  
  // Create realistic workout logs with exercises and sets
  console.log('🏋️ Criando histórico de treinos executados...');
  
  const workoutPattern = ['A', 'B', 'C', 'A', 'B', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A'];
  const today = new Date();
  
  for (let i = 0; i < workoutPattern.length; i++) {
    const workoutDay = new Date(today);
    workoutDay.setDate(today.getDate() - (workoutPattern.length - 1 - i));
    
    const templateLetter = workoutPattern[i];
    const templateName = templateLetter === 'A' ? 'Treino A - Peito, Ombros, Tríceps' :
                        templateLetter === 'B' ? 'Treino B - Costas, Bíceps' : 
                        'Treino C - Pernas, Abdômen';
    
    const templateId = templateIds[templateName];
    if (!templateId) continue;
    
    // Create workout log
    const startTime = new Date(workoutDay);
    startTime.setHours(19 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 60)); // 19h-22h
    
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 70 + Math.floor(Math.random() * 20)); // 70-90 min
    
    const { data: workoutLog, error: logError } = await supabase
      .from('workout_logs')
      .insert({
        user_id: userId,
        template_id: templateId,
        name: templateName,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      })
      .select()
      .single();
      
    if (logError) {
      console.log(`❌ Erro ao criar log: ${logError.message}`);
      continue;
    }
    
    console.log(`✅ Treino ${templateLetter} criado para ${workoutDay.toLocaleDateString()}`);
    
    // Get template exercises for this workout
    const { data: templateExs } = await supabase
      .from('workout_template_exercises')
      .select(`
        *,
        exercises (*)
      `)
      .eq('template_id', templateId)
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
      
      // Create realistic sets
      const baseSets = templateEx.sets || 3;
      const baseWeight = templateEx.weight || 0;
      
      for (let setNum = 1; setNum <= baseSets; setNum++) {
        let weight = baseWeight;
        let reps = 10;
        
        // Add realistic progression/variation
        if (setNum === 1 && baseWeight > 0) {
          // Warm-up set
          weight = Math.round(baseWeight * 0.75);
          reps = 12;
        } else if (setNum === baseSets && baseSets > 2) {
          // Last set - drop set or extra reps
          if (Math.random() > 0.6) {
            weight = Math.round(baseWeight * 0.85);
            reps = Math.floor(reps * 1.3);
          }
        } else if (baseWeight > 0) {
          // Add slight weight progression over time
          const progression = Math.floor(i / 3) * 2.5; // 2.5kg every 3 workouts
          weight = Math.round(baseWeight + progression);
        }
        
        // Parse reps from template
        if (templateEx.reps && templateEx.reps.includes('-')) {
          const [minReps, maxReps] = templateEx.reps.split('-').map(Number);
          if (minReps && maxReps) {
            reps = minReps + Math.floor(Math.random() * (maxReps - minReps + 1));
          }
        }
        
        const { error: setError } = await supabase
          .from('workout_log_sets')
          .insert({
            log_exercise_id: logExercise.id,
            set_number: setNum,
            weight: weight,
            reps: reps,
            completed: true
          });
          
        if (setError) {
          console.log(`❌ Erro ao criar set: ${setError.message}`);
        }
      }
    }
  }
  
  console.log('🎉 Simulação completa criada com sucesso!');
  console.log(`📊 Resumo:`);
  console.log(`   • 25 exercícios criados`);
  console.log(`   • 3 templates de treino criados`);
  console.log(`   • ${workoutPattern.length} treinos executados`);
  console.log(`   • Exercícios e sets detalhados para cada treino`);
  console.log(`   • Progressão realística de cargas e repetições`);
}

createFullTestSimulation().catch(console.error);