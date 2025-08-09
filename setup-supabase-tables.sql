-- SQL para criar as tabelas do GymSeven no Supabase
-- Execute este script no editor SQL do seu projeto Supabase

-- Criar tabela de exercícios
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "muscleGroup" TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "videoUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de modelos de treino
CREATE TABLE IF NOT EXISTS "workoutTemplates" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar tabela de exercícios do modelo de treino
CREATE TABLE IF NOT EXISTS "workoutTemplateExercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" UUID REFERENCES "workoutTemplates"(id) ON DELETE CASCADE,
  "exerciseId" UUID REFERENCES exercises(id) ON DELETE CASCADE,
  sets INTEGER NOT NULL,
  reps INTEGER NOT NULL,
  weight DECIMAL,
  "restDuration" INTEGER DEFAULT 90,
  "order" INTEGER NOT NULL
);

-- Criar tabela de logs de treino
CREATE TABLE IF NOT EXISTS "workoutLogs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "templateId" UUID REFERENCES "workoutTemplates"(id),
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "endTime" TIMESTAMP WITH TIME ZONE
);

-- Criar tabela de exercícios do log de treino
CREATE TABLE IF NOT EXISTS "workoutLogExercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "logId" UUID REFERENCES "workoutLogs"(id) ON DELETE CASCADE,
  "exerciseId" UUID REFERENCES exercises(id),
  "exerciseName" TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Criar tabela de séries do log de treino
CREATE TABLE IF NOT EXISTS "workoutLogSets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "logExerciseId" UUID REFERENCES "workoutLogExercises"(id) ON DELETE CASCADE,
  "setNumber" INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL,
  completed BOOLEAN DEFAULT FALSE
);

-- Inserir dados de exemplo (exercícios básicos)
INSERT INTO exercises (name, "muscleGroup", description) VALUES
('Supino Reto', 'Peito', 'Exercício fundamental para o desenvolvimento do peitoral'),
('Agachamento Livre', 'Pernas', 'Exercício composto para pernas e glúteos'),
('Puxada Frontal', 'Costas', 'Desenvolvimento do latíssimo do dorso'),
('Rosca Direta', 'Braços', 'Desenvolvimento do bíceps'),
('Desenvolvimento Militar', 'Ombros', 'Exercício para deltoides')
ON CONFLICT DO NOTHING;

-- Verificar se as tabelas foram criadas
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('exercises', 'workoutTemplates', 'workoutTemplateExercises', 'workoutLogs', 'workoutLogExercises', 'workoutLogSets')
ORDER BY table_name;