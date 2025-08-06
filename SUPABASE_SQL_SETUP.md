# Configuração das Tabelas do Supabase

Para usar o Supabase com esta aplicação, você precisa criar as tabelas manualmente no dashboard do Supabase.

## Como criar as tabelas:

1. Vá para https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em "SQL Editor" no menu lateral
4. Cole o código SQL abaixo e execute:

```sql
-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de exercícios
CREATE TABLE IF NOT EXISTS public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "muscleGroup" TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "videoUrl" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de templates de treino
CREATE TABLE IF NOT EXISTS public."workoutTemplates" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de exercícios do template
CREATE TABLE IF NOT EXISTS public."workoutTemplateExercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" UUID REFERENCES public."workoutTemplates"(id) ON DELETE CASCADE,
  "exerciseId" UUID REFERENCES public.exercises(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 1,
  sets INTEGER DEFAULT 3,
  reps INTEGER DEFAULT 10,
  weight DECIMAL,
  "restDuration" INTEGER DEFAULT 60,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de logs de treino
CREATE TABLE IF NOT EXISTS public."workoutLogs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "templateId" UUID REFERENCES public."workoutTemplates"(id),
  name TEXT NOT NULL,
  "startTime" TIMESTAMPTZ DEFAULT now(),
  "endTime" TIMESTAMPTZ,
  notes TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de exercícios do log
CREATE TABLE IF NOT EXISTS public."workoutLogExercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "logId" UUID REFERENCES public."workoutLogs"(id) ON DELETE CASCADE,
  "exerciseId" UUID REFERENCES public.exercises(id),
  "exerciseName" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar tabela de séries do log
CREATE TABLE IF NOT EXISTS public."workoutLogSets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "logExerciseId" UUID REFERENCES public."workoutLogExercises"(id) ON DELETE CASCADE,
  "setNumber" INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL,
  completed BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMPTZ DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON public.exercises("muscleGroup");
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_template_id ON public."workoutTemplateExercises"("templateId");
CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_log_id ON public."workoutLogExercises"("logId");
CREATE INDEX IF NOT EXISTS idx_workout_log_sets_log_exercise_id ON public."workoutLogSets"("logExerciseId");
```

## Depois de executar o SQL:

Reinicie a aplicação para que ela conecte ao Supabase com as tabelas criadas.

## Status atual:

- ✅ SDK do Supabase instalado
- ✅ Variáveis de ambiente configuradas (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)
- ⏳ Tabelas precisam ser criadas manualmente
- ✅ Aplicação com fallback funcionando (usa Neon quando Supabase não está pronto)