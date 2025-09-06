-- Script SQL para criar todas as tabelas do GymSeven no Supabase
-- Execute este script no SQL Editor do seu painel Supabase

-- 1. Tabela de usuários (principal)
CREATE TABLE IF NOT EXISTS usuarios (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  "firstName" TEXT,
  "lastName" TEXT,
  "dateOfBirth" TIMESTAMP,
  height REAL, -- em cm
  weight REAL, -- em kg
  "activityLevel" TEXT DEFAULT 'moderado',
  "fitnessGoals" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "profileImageUrl" TEXT,
  "experienceLevel" TEXT DEFAULT 'iniciante',
  "preferredWorkoutDuration" INTEGER DEFAULT 60,
  "isActive" BOOLEAN DEFAULT true,
  "emailVerified" BOOLEAN DEFAULT false,
  "lastLoginAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 2. Tabela para histórico de peso
CREATE TABLE IF NOT EXISTS "historicoPeso" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  peso REAL NOT NULL,
  date TIMESTAMP DEFAULT NOW(),
  observacoes TEXT
);

-- 3. Tabela para objetivos pessoais
CREATE TABLE IF NOT EXISTS "objetivosUsuario" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "targetValue" REAL,
  "currentValue" REAL,
  unit TEXT,
  "targetDate" TIMESTAMP,
  "isCompleted" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 4. Tabela para preferências do usuário
CREATE TABLE IF NOT EXISTS "preferenciasUsuario" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  units TEXT DEFAULT 'metric',
  language TEXT DEFAULT 'pt-BR',
  notifications BOOLEAN DEFAULT true,
  "soundEffects" BOOLEAN DEFAULT true,
  "restTimerAutoStart" BOOLEAN DEFAULT true,
  "defaultRestTime" INTEGER DEFAULT 90,
  "weekStartsOn" INTEGER DEFAULT 1,
  "trackingData" TEXT DEFAULT 'all'
);

-- 5. Tabela para conquistas do usuário
CREATE TABLE IF NOT EXISTS "conquistasUsuario" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  "achievementId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP DEFAULT NOW(),
  progress INTEGER DEFAULT 0,
  "isCompleted" BOOLEAN DEFAULT true
);

-- 6. Tabela de exercícios
CREATE TABLE IF NOT EXISTS exercicios (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  "grupoMuscular" TEXT NOT NULL,
  descricao TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 7. Tabela de modelos de treino (templates)
CREATE TABLE IF NOT EXISTS "modelosTreino" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 8. Tabela de exercícios nos modelos de treino
CREATE TABLE IF NOT EXISTS "exerciciosModeloTreino" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "modeloId" VARCHAR NOT NULL REFERENCES "modelosTreino"(id) ON DELETE CASCADE,
  "exercicioId" VARCHAR NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
  series INTEGER NOT NULL,
  repeticoes TEXT NOT NULL,
  weight REAL,
  "restDurationSeconds" INTEGER DEFAULT 90,
  "order" INTEGER NOT NULL
);

-- 9. Tabela de registros de treino (histórico)
CREATE TABLE IF NOT EXISTS "registrosTreino" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "usuarioId" VARCHAR NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  "modeloId" VARCHAR REFERENCES "modelosTreino"(id),
  nome TEXT NOT NULL,
  "startTime" TIMESTAMP NOT NULL,
  "endTime" TIMESTAMP
);

-- 10. Tabela de exercícios nos registros de treino
CREATE TABLE IF NOT EXISTS "exerciciosRegistroTreino" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "registroId" VARCHAR NOT NULL REFERENCES "registrosTreino"(id) ON DELETE CASCADE,
  "exercicioId" VARCHAR NOT NULL REFERENCES exercicios(id),
  "nomeExercicio" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- 11. Tabela de séries nos registros de treino
CREATE TABLE IF NOT EXISTS "seriesRegistroTreino" (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  "exercicioRegistroId" VARCHAR NOT NULL REFERENCES "exerciciosRegistroTreino"(id) ON DELETE CASCADE,
  "setNumber" INTEGER NOT NULL,
  reps INTEGER,
  weight REAL,
  completed BOOLEAN DEFAULT false
);

-- Verificação final - listar todas as tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;