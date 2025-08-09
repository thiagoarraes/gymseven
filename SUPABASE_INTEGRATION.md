# Supabase Integration Guide

## Overview
A aplicação GymSeven agora está totalmente integrada com Supabase usando o SDK oficial. O Supabase é usado como banco de dados principal para armazenar exercícios, modelos de treino e logs de treino.

## Configuração

### Opção 1: Variáveis de Ambiente Separadas (Recomendado)
```
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-chave-de-servico
```

### Opção 2: Via DATABASE_URL
```
DATABASE_URL=postgresql://postgres.sua-ref:[SUA-SENHA]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

## Como Configurar

1. **Criar Projeto no Supabase**
   - Vá para [supabase.com](https://supabase.com)
   - Crie um novo projeto
   - Anote a URL do projeto e a chave de serviço

2. **Configurar no Replit**
   - Vá para a aba "Secrets" 
   - Adicione `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
   - Ou use `DATABASE_URL` com a string de conexão

3. **Criar Tabelas**
   Execute o SQL no editor SQL do Supabase:

```sql
-- Criar tabelas para a aplicação GymSeven
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "muscleGroup" TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "videoUrl" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "workoutTemplates" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS "workoutLogs" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  "templateId" UUID REFERENCES "workoutTemplates"(id),
  "startTime" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "endTime" TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS "workoutLogExercises" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "logId" UUID REFERENCES "workoutLogs"(id) ON DELETE CASCADE,
  "exerciseId" UUID REFERENCES exercises(id),
  "exerciseName" TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS "workoutLogSets" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "logExerciseId" UUID REFERENCES "workoutLogExercises"(id) ON DELETE CASCADE,
  "setNumber" INTEGER NOT NULL,
  reps INTEGER,
  weight DECIMAL,
  completed BOOLEAN DEFAULT FALSE
);
```

## Funcionalidades

- ✅ Gerenciamento de exercícios por grupo muscular
- ✅ Criação e edição de modelos de treino
- ✅ Log de treinos com séries e repetições
- ✅ Histórico de progresso de peso
- ✅ Dados persistentes na nuvem
- ✅ Sincronização automática

## Vantagens do Supabase

- **Real-time**: Atualizações em tempo real
- **Backup automático**: Dados seguros na nuvem
- **Escalabilidade**: Cresce com sua aplicação
- **Dashboard**: Interface visual para gerenciar dados
- **API REST automática**: Endpoints gerados automaticamente