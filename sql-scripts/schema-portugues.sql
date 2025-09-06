-- Schema GymSeven em Português para Supabase
-- Execute no Supabase SQL Editor

-- Habilitar extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "dateOfBirth" TIMESTAMP,
    height REAL, -- em cm
    weight REAL, -- em kg
    "activityLevel" TEXT DEFAULT 'moderado', -- sedentário, leve, moderado, intenso, atleta
    "fitnessGoals" TEXT[] DEFAULT ARRAY[]::TEXT[], -- ganhar massa, perder peso, manter forma, etc.
    "profileImageUrl" TEXT,
    "experienceLevel" TEXT DEFAULT 'iniciante', -- iniciante, intermediário, avançado
    "preferredWorkoutDuration" INTEGER DEFAULT 60, -- em minutos
    "isActive" BOOLEAN DEFAULT true,
    "emailVerified" BOOLEAN DEFAULT false,
    "lastLoginAt" TIMESTAMP,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Tabela historicoPeso
CREATE TABLE IF NOT EXISTS "historicoPeso" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    peso REAL NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    observacoes TEXT
);

-- Tabela objetivosUsuario
CREATE TABLE IF NOT EXISTS "objetivosUsuario" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- weight_loss, muscle_gain, strength, endurance
    "targetValue" REAL,
    "currentValue" REAL,
    unit TEXT, -- kg, lbs, reps, etc.
    "targetDate" TIMESTAMP,
    "isCompleted" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Tabela preferenciasUsuario
CREATE TABLE IF NOT EXISTS "preferenciasUsuario" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark', -- dark, light, auto
    units TEXT DEFAULT 'metric', -- metric, imperial
    language TEXT DEFAULT 'pt-BR',
    notifications BOOLEAN DEFAULT true,
    "soundEffects" BOOLEAN DEFAULT true,
    "restTimerAutoStart" BOOLEAN DEFAULT true,
    "defaultRestTime" INTEGER DEFAULT 90, -- em segundos
    "weekStartsOn" INTEGER DEFAULT 1, -- 0=domingo, 1=segunda
    "trackingData" TEXT DEFAULT 'all' -- all, weight_only, none
);

-- Tabela conquistasUsuario (sistema gamificado isolado por usuário)
CREATE TABLE IF NOT EXISTS "conquistasUsuario" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    "achievementId" TEXT NOT NULL, -- ID da conquista (exemplo: "first_workout", "strength_milestone_100kg")
    "unlockedAt" TIMESTAMP DEFAULT NOW(),
    progress INTEGER DEFAULT 0, -- Progresso atual para conquistas progressivas
    "isCompleted" BOOLEAN DEFAULT true
);

-- Tabela exercicios
CREATE TABLE IF NOT EXISTS exercicios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    "grupoMuscular" TEXT NOT NULL,
    descricao TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Tabela modelosTreino
CREATE TABLE IF NOT EXISTS "modelosTreino" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    descricao TEXT,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Tabela exerciciosModeloTreino
CREATE TABLE IF NOT EXISTS "exerciciosModeloTreino" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "modeloId" UUID NOT NULL REFERENCES "modelosTreino"(id) ON DELETE CASCADE,
    "exercicioId" UUID NOT NULL REFERENCES exercicios(id) ON DELETE CASCADE,
    series INTEGER NOT NULL,
    repeticoes TEXT NOT NULL,
    peso REAL,
    "restDurationSeconds" INTEGER DEFAULT 90,
    "order" INTEGER NOT NULL
);

-- Tabela registrosTreino
CREATE TABLE IF NOT EXISTS "registrosTreino" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "usuarioId" UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    "modeloId" UUID REFERENCES "modelosTreino"(id),
    nome TEXT NOT NULL,
    "startTime" TIMESTAMP NOT NULL,
    "endTime" TIMESTAMP
);

-- Tabela exerciciosRegistroTreino
CREATE TABLE IF NOT EXISTS "exerciciosRegistroTreino" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "registroId" UUID NOT NULL REFERENCES "registrosTreino"(id) ON DELETE CASCADE,
    "exercicioId" UUID NOT NULL REFERENCES exercicios(id),
    "nomeExercicio" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Tabela seriesRegistroTreino
CREATE TABLE IF NOT EXISTS "seriesRegistroTreino" (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    "exercicioRegistroId" UUID NOT NULL REFERENCES "exerciciosRegistroTreino"(id) ON DELETE CASCADE,
    "setNumber" INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    completed BOOLEAN DEFAULT false
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_historicoPeso_usuarioId ON "historicoPeso"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_historicoPeso_date ON "historicoPeso"(date);
CREATE INDEX IF NOT EXISTS idx_objetivosUsuario_usuarioId ON "objetivosUsuario"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_preferenciasUsuario_usuarioId ON "preferenciasUsuario"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_conquistasUsuario_usuarioId ON "conquistasUsuario"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_exercicios_usuarioId ON exercicios("usuarioId");
CREATE INDEX IF NOT EXISTS idx_exercicios_grupoMuscular ON exercicios("grupoMuscular");
CREATE INDEX IF NOT EXISTS idx_modelosTreino_usuarioId ON "modelosTreino"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_exerciciosModeloTreino_modeloId ON "exerciciosModeloTreino"("modeloId");
CREATE INDEX IF NOT EXISTS idx_exerciciosModeloTreino_exercicioId ON "exerciciosModeloTreino"("exercicioId");
CREATE INDEX IF NOT EXISTS idx_registrosTreino_usuarioId ON "registrosTreino"("usuarioId");
CREATE INDEX IF NOT EXISTS idx_registrosTreino_startTime ON "registrosTreino"("startTime");
CREATE INDEX IF NOT EXISTS idx_exerciciosRegistroTreino_registroId ON "exerciciosRegistroTreino"("registroId");
CREATE INDEX IF NOT EXISTS idx_seriesRegistroTreino_exercicioRegistroId ON "seriesRegistroTreino"("exercicioRegistroId");

-- Habilitar Row Level Security (RLS) para todas as tabelas
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE "historicoPeso" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "objetivosUsuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "preferenciasUsuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conquistasUsuario" ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE "modelosTreino" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exerciciosModeloTreino" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "registrosTreino" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "exerciciosRegistroTreino" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "seriesRegistroTreino" ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS permissivas para desenvolvimento
-- NOTA: Para produção, configure políticas mais restritivas

-- Políticas para usuarios
CREATE POLICY "Permissiva para usuarios" ON usuarios FOR ALL USING (true);

-- Políticas para historicoPeso
CREATE POLICY "Permissiva para historicoPeso" ON "historicoPeso" FOR ALL USING (true);

-- Políticas para objetivosUsuario
CREATE POLICY "Permissiva para objetivosUsuario" ON "objetivosUsuario" FOR ALL USING (true);

-- Políticas para preferenciasUsuario
CREATE POLICY "Permissiva para preferenciasUsuario" ON "preferenciasUsuario" FOR ALL USING (true);

-- Políticas para conquistasUsuario
CREATE POLICY "Permissiva para conquistasUsuario" ON "conquistasUsuario" FOR ALL USING (true);

-- Políticas para exercicios
CREATE POLICY "Permissiva para exercicios" ON exercicios FOR ALL USING (true);

-- Políticas para modelosTreino
CREATE POLICY "Permissiva para modelosTreino" ON "modelosTreino" FOR ALL USING (true);

-- Políticas para exerciciosModeloTreino
CREATE POLICY "Permissiva para exerciciosModeloTreino" ON "exerciciosModeloTreino" FOR ALL USING (true);

-- Políticas para registrosTreino
CREATE POLICY "Permissiva para registrosTreino" ON "registrosTreino" FOR ALL USING (true);

-- Políticas para exerciciosRegistroTreino
CREATE POLICY "Permissiva para exerciciosRegistroTreino" ON "exerciciosRegistroTreino" FOR ALL USING (true);

-- Políticas para seriesRegistroTreino
CREATE POLICY "Permissiva para seriesRegistroTreino" ON "seriesRegistroTreino" FOR ALL USING (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para usuarios
CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Exercícios de exemplo para teste
INSERT INTO usuarios (id, email, username, password, "firstName", "lastName") VALUES
    ('00000000-0000-0000-0000-000000000000', 'system@gymseven.com.br', 'system', 'system', 'System', 'User')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exercicios (id, "usuarioId", nome, "grupoMuscular", descricao) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Supino Reto', 'Peito', 'Exercício fundamental para o desenvolvimento do peitoral'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Agachamento Livre', 'Pernas', 'Exercício composto para pernas e glúteos'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Puxada Frontal', 'Costas', 'Desenvolvimento do latíssimo do dorso')
ON CONFLICT (id) DO NOTHING;

SELECT 'Schema em português criado com sucesso!' as status;