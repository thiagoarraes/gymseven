-- Script para padronizar todas as tabelas e colunas para camelCase
-- Executa no Supabase SQL Editor para resolver inconsistências de nomenclatura

-- 1. Renomear tabelas de snake_case para camelCase
ALTER TABLE weight_history RENAME TO "weightHistory";
ALTER TABLE user_goals RENAME TO "userGoals";
ALTER TABLE user_preferences RENAME TO "userPreferences";
ALTER TABLE user_achievements RENAME TO "userAchievements";
ALTER TABLE workout_templates RENAME TO "workoutTemplates";
ALTER TABLE workout_template_exercises RENAME TO "workoutTemplateExercises";
ALTER TABLE workout_logs RENAME TO "workoutLogs";
ALTER TABLE workout_log_exercises RENAME TO "workoutLogExercises";
ALTER TABLE workout_log_sets RENAME TO "workoutLogSets";

-- 2. Renomear colunas da tabela users
ALTER TABLE users RENAME COLUMN first_name TO "firstName";
ALTER TABLE users RENAME COLUMN last_name TO "lastName";
ALTER TABLE users RENAME COLUMN date_of_birth TO "dateOfBirth";
ALTER TABLE users RENAME COLUMN activity_level TO "activityLevel";
ALTER TABLE users RENAME COLUMN fitness_goals TO "fitnessGoals";
ALTER TABLE users RENAME COLUMN profile_image_url TO "profileImageUrl";
ALTER TABLE users RENAME COLUMN experience_level TO "experienceLevel";
ALTER TABLE users RENAME COLUMN preferred_workout_duration TO "preferredWorkoutDuration";
ALTER TABLE users RENAME COLUMN is_active TO "isActive";
ALTER TABLE users RENAME COLUMN email_verified TO "emailVerified";
ALTER TABLE users RENAME COLUMN last_login_at TO "lastLoginAt";
ALTER TABLE users RENAME COLUMN created_at TO "createdAt";
ALTER TABLE users RENAME COLUMN updated_at TO "updatedAt";

-- 3. Renomear colunas da tabela weightHistory
ALTER TABLE "weightHistory" RENAME COLUMN user_id TO "userId";

-- 4. Renomear colunas da tabela userGoals
ALTER TABLE "userGoals" RENAME COLUMN user_id TO "userId";
ALTER TABLE "userGoals" RENAME COLUMN target_value TO "targetValue";
ALTER TABLE "userGoals" RENAME COLUMN current_value TO "currentValue";
ALTER TABLE "userGoals" RENAME COLUMN target_date TO "targetDate";
ALTER TABLE "userGoals" RENAME COLUMN is_completed TO "isCompleted";
ALTER TABLE "userGoals" RENAME COLUMN created_at TO "createdAt";

-- 5. Renomear colunas da tabela userPreferences
ALTER TABLE "userPreferences" RENAME COLUMN user_id TO "userId";
ALTER TABLE "userPreferences" RENAME COLUMN sound_effects TO "soundEffects";
ALTER TABLE "userPreferences" RENAME COLUMN rest_timer_auto_start TO "restTimerAutoStart";
ALTER TABLE "userPreferences" RENAME COLUMN default_rest_time TO "defaultRestTime";
ALTER TABLE "userPreferences" RENAME COLUMN week_starts_on TO "weekStartsOn";
ALTER TABLE "userPreferences" RENAME COLUMN tracking_data TO "trackingData";

-- 6. Renomear colunas da tabela userAchievements
ALTER TABLE "userAchievements" RENAME COLUMN user_id TO "userId";
ALTER TABLE "userAchievements" RENAME COLUMN achievement_id TO "achievementId";
ALTER TABLE "userAchievements" RENAME COLUMN unlocked_at TO "unlockedAt";
ALTER TABLE "userAchievements" RENAME COLUMN is_completed TO "isCompleted";

-- 7. Renomear colunas da tabela exercises
ALTER TABLE exercises RENAME COLUMN user_id TO "userId";
ALTER TABLE exercises RENAME COLUMN muscle_group TO "muscleGroup";
ALTER TABLE exercises RENAME COLUMN created_at TO "createdAt";

-- 8. Renomear colunas da tabela workoutTemplates
ALTER TABLE "workoutTemplates" RENAME COLUMN user_id TO "userId";
ALTER TABLE "workoutTemplates" RENAME COLUMN created_at TO "createdAt";

-- 9. Renomear colunas da tabela workoutTemplateExercises
ALTER TABLE "workoutTemplateExercises" RENAME COLUMN template_id TO "templateId";
ALTER TABLE "workoutTemplateExercises" RENAME COLUMN exercise_id TO "exerciseId";
ALTER TABLE "workoutTemplateExercises" RENAME COLUMN rest_duration_seconds TO "restDurationSeconds";

-- 10. Renomear colunas da tabela workoutLogs
ALTER TABLE "workoutLogs" RENAME COLUMN user_id TO "userId";
ALTER TABLE "workoutLogs" RENAME COLUMN template_id TO "templateId";
ALTER TABLE "workoutLogs" RENAME COLUMN start_time TO "startTime";
ALTER TABLE "workoutLogs" RENAME COLUMN end_time TO "endTime";

-- 11. Renomear colunas da tabela workoutLogExercises
ALTER TABLE "workoutLogExercises" RENAME COLUMN log_id TO "logId";
ALTER TABLE "workoutLogExercises" RENAME COLUMN exercise_id TO "exerciseId";
ALTER TABLE "workoutLogExercises" RENAME COLUMN exercise_name TO "exerciseName";
ALTER TABLE "workoutLogExercises" RENAME COLUMN created_at TO "createdAt";

-- 12. Renomear colunas da tabela workoutLogSets
ALTER TABLE "workoutLogSets" RENAME COLUMN log_exercise_id TO "logExerciseId";
ALTER TABLE "workoutLogSets" RENAME COLUMN set_number TO "setNumber";

-- Verificar o resultado
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;