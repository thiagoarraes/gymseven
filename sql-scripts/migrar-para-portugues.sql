-- Script para migrar banco de dados para nomes em português
-- Executa no Supabase SQL Editor para renomear tabelas e colunas
-- IMPORTANTE: Execute este script apenas uma vez!

-- 1. PRIMEIRO: Verificar quais tabelas existem
-- Descomente a linha abaixo para verificar as tabelas atuais:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- 2. Renomear tabelas para português (apenas se existirem)
DO $$
BEGIN
    -- Renomear tabela users para usuarios
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        ALTER TABLE users RENAME TO usuarios;
    END IF;

    -- Renomear weightHistory para historicoPeso
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weightHistory' AND table_schema = 'public') THEN
        ALTER TABLE "weightHistory" RENAME TO "historicoPeso";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'weight_history' AND table_schema = 'public') THEN
        ALTER TABLE weight_history RENAME TO "historicoPeso";
    END IF;

    -- Renomear userGoals para objetivosUsuario
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'userGoals' AND table_schema = 'public') THEN
        ALTER TABLE "userGoals" RENAME TO "objetivosUsuario";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_goals' AND table_schema = 'public') THEN
        ALTER TABLE user_goals RENAME TO "objetivosUsuario";
    END IF;

    -- Renomear userPreferences para preferenciasUsuario
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'userPreferences' AND table_schema = 'public') THEN
        ALTER TABLE "userPreferences" RENAME TO "preferenciasUsuario";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_preferences' AND table_schema = 'public') THEN
        ALTER TABLE user_preferences RENAME TO "preferenciasUsuario";
    END IF;

    -- Renomear userAchievements para conquistasUsuario
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'userAchievements' AND table_schema = 'public') THEN
        ALTER TABLE "userAchievements" RENAME TO "conquistasUsuario";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_achievements' AND table_schema = 'public') THEN
        ALTER TABLE user_achievements RENAME TO "conquistasUsuario";
    END IF;

    -- Renomear exercises para exercicios
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercises' AND table_schema = 'public') THEN
        ALTER TABLE exercises RENAME TO exercicios;
    END IF;

    -- Renomear workoutTemplates para modelosTreino
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workoutTemplates' AND table_schema = 'public') THEN
        ALTER TABLE "workoutTemplates" RENAME TO "modelosTreino";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_templates' AND table_schema = 'public') THEN
        ALTER TABLE workout_templates RENAME TO "modelosTreino";
    END IF;

    -- Renomear workoutTemplateExercises para exerciciosModeloTreino
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workoutTemplateExercises' AND table_schema = 'public') THEN
        ALTER TABLE "workoutTemplateExercises" RENAME TO "exerciciosModeloTreino";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_template_exercises' AND table_schema = 'public') THEN
        ALTER TABLE workout_template_exercises RENAME TO "exerciciosModeloTreino";
    END IF;

    -- Renomear workoutLogs para registrosTreino
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workoutLogs' AND table_schema = 'public') THEN
        ALTER TABLE "workoutLogs" RENAME TO "registrosTreino";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_logs' AND table_schema = 'public') THEN
        ALTER TABLE workout_logs RENAME TO "registrosTreino";
    END IF;

    -- Renomear workoutLogExercises para exerciciosRegistroTreino
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workoutLogExercises' AND table_schema = 'public') THEN
        ALTER TABLE "workoutLogExercises" RENAME TO "exerciciosRegistroTreino";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_log_exercises' AND table_schema = 'public') THEN
        ALTER TABLE workout_log_exercises RENAME TO "exerciciosRegistroTreino";
    END IF;

    -- Renomear workoutLogSets para seriesRegistroTreino
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workoutLogSets' AND table_schema = 'public') THEN
        ALTER TABLE "workoutLogSets" RENAME TO "seriesRegistroTreino";
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workout_log_sets' AND table_schema = 'public') THEN
        ALTER TABLE workout_log_sets RENAME TO "seriesRegistroTreino";
    END IF;

END $$;

-- 3. Renomear colunas para português nas tabelas usuarios
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'usuarios' AND table_schema = 'public') THEN
        -- Renomear colunas se existirem (em usuarios)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'user_id') THEN
            ALTER TABLE usuarios RENAME COLUMN user_id TO "usuarioId";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'first_name') THEN
            ALTER TABLE usuarios RENAME COLUMN first_name TO "firstName";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'last_name') THEN
            ALTER TABLE usuarios RENAME COLUMN last_name TO "lastName";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'date_of_birth') THEN
            ALTER TABLE usuarios RENAME COLUMN date_of_birth TO "dateOfBirth";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'activity_level') THEN
            ALTER TABLE usuarios RENAME COLUMN activity_level TO "activityLevel";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'fitness_goals') THEN
            ALTER TABLE usuarios RENAME COLUMN fitness_goals TO "fitnessGoals";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'profile_image_url') THEN
            ALTER TABLE usuarios RENAME COLUMN profile_image_url TO "profileImageUrl";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'experience_level') THEN
            ALTER TABLE usuarios RENAME COLUMN experience_level TO "experienceLevel";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'preferred_workout_duration') THEN
            ALTER TABLE usuarios RENAME COLUMN preferred_workout_duration TO "preferredWorkoutDuration";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'is_active') THEN
            ALTER TABLE usuarios RENAME COLUMN is_active TO "isActive";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'email_verified') THEN
            ALTER TABLE usuarios RENAME COLUMN email_verified TO "emailVerified";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'last_login_at') THEN
            ALTER TABLE usuarios RENAME COLUMN last_login_at TO "lastLoginAt";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'created_at') THEN
            ALTER TABLE usuarios RENAME COLUMN created_at TO "createdAt";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'usuarios' AND column_name = 'updated_at') THEN
            ALTER TABLE usuarios RENAME COLUMN updated_at TO "updatedAt";
        END IF;
    END IF;
END $$;

-- 4. Renomear colunas das outras tabelas
DO $$
BEGIN
    -- historicoPeso
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'historicoPeso' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historicoPeso' AND column_name = 'user_id') THEN
            ALTER TABLE "historicoPeso" RENAME COLUMN user_id TO "usuarioId";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historicoPeso' AND column_name = 'weight') THEN
            ALTER TABLE "historicoPeso" RENAME COLUMN weight TO peso;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'historicoPeso' AND column_name = 'notes') THEN
            ALTER TABLE "historicoPeso" RENAME COLUMN notes TO observacoes;
        END IF;
    END IF;

    -- exercicios
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exercicios' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercicios' AND column_name = 'user_id') THEN
            ALTER TABLE exercicios RENAME COLUMN user_id TO "usuarioId";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercicios' AND column_name = 'name') THEN
            ALTER TABLE exercicios RENAME COLUMN name TO nome;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercicios' AND column_name = 'muscle_group') THEN
            ALTER TABLE exercicios RENAME COLUMN muscle_group TO "grupoMuscular";
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercicios' AND column_name = 'description') THEN
            ALTER TABLE exercicios RENAME COLUMN description TO descricao;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exercicios' AND column_name = 'created_at') THEN
            ALTER TABLE exercicios RENAME COLUMN created_at TO "createdAt";
        END IF;
    END IF;

END $$;

-- 5. Verificar resultado final
SELECT 
    'Tabelas migradas com sucesso!' as status,
    table_name as "Tabelas em Português"
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

NOTIFY pgsql, 'Migração para português concluída com sucesso!';