-- GymSeven Database Schema Setup for Supabase
-- Execute this script in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    date_of_birth TIMESTAMP,
    height REAL, -- em cm
    weight REAL, -- em kg
    activity_level TEXT DEFAULT 'moderado', -- sedentário, leve, moderado, intenso, atleta
    fitness_goals TEXT[] DEFAULT ARRAY[]::TEXT[], -- ganhar massa, perder peso, manter forma, etc.
    profile_image_url TEXT,
    experience_level TEXT DEFAULT 'iniciante', -- iniciante, intermediário, avançado
    preferred_workout_duration INTEGER DEFAULT 60, -- em minutos
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create weight_history table
CREATE TABLE IF NOT EXISTS weight_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    weight REAL NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    notes TEXT
);

-- Create user_goals table
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- weight_loss, muscle_gain, strength, endurance
    target_value REAL,
    current_value REAL,
    unit TEXT, -- kg, lbs, reps, etc.
    target_date TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'dark', -- dark, light, auto
    units TEXT DEFAULT 'metric', -- metric, imperial
    language TEXT DEFAULT 'pt-BR',
    notifications BOOLEAN DEFAULT true,
    sound_effects BOOLEAN DEFAULT true,
    rest_timer_auto_start BOOLEAN DEFAULT true,
    default_rest_time INTEGER DEFAULT 90, -- em segundos
    week_starts_on INTEGER DEFAULT 1, -- 0=domingo, 1=segunda
    tracking_data TEXT DEFAULT 'all' -- all, weight_only, none
);

-- Create user_achievements table (sistema gamificado isolado por usuário)
CREATE TABLE IF NOT EXISTS user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL, -- ID da conquista (exemplo: "first_workout", "strength_milestone_100kg")
    unlocked_at TIMESTAMP DEFAULT NOW(),
    progress INTEGER DEFAULT 0, -- Progresso atual para conquistas progressivas
    is_completed BOOLEAN DEFAULT true
);

-- Create exercises table
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    video_url TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create workout_templates table
CREATE TABLE IF NOT EXISTS workout_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create workout_template_exercises table
CREATE TABLE IF NOT EXISTS workout_template_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    sets INTEGER NOT NULL,
    reps TEXT NOT NULL,
    weight REAL,
    rest_duration_seconds INTEGER DEFAULT 90,
    "order" INTEGER NOT NULL
);

-- Create workout_logs table
CREATE TABLE IF NOT EXISTS workout_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id UUID REFERENCES workout_templates(id),
    name TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP
);

-- Create workout_log_exercises table
CREATE TABLE IF NOT EXISTS workout_log_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_id UUID NOT NULL REFERENCES workout_logs(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    exercise_name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create workout_log_sets table
CREATE TABLE IF NOT EXISTS workout_log_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    log_exercise_id UUID NOT NULL REFERENCES workout_log_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps INTEGER,
    weight REAL,
    completed BOOLEAN DEFAULT false
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_weight_history_user_id ON weight_history(user_id);
CREATE INDEX IF NOT EXISTS idx_weight_history_date ON weight_history(date);
CREATE INDEX IF NOT EXISTS idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_template_id ON workout_template_exercises(template_id);
CREATE INDEX IF NOT EXISTS idx_workout_template_exercises_exercise_id ON workout_template_exercises(exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_start_time ON workout_logs(start_time);
CREATE INDEX IF NOT EXISTS idx_workout_log_exercises_log_id ON workout_log_exercises(log_id);
CREATE INDEX IF NOT EXISTS idx_workout_log_sets_log_exercise_id ON workout_log_sets(log_exercise_id);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_template_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_log_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_log_sets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user isolation
-- Note: These policies assume you'll handle authentication at the application level
-- For now, we'll create permissive policies and handle security in the app

-- Users table policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (true); -- Permissive for now

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (true); -- Permissive for now

CREATE POLICY "Allow user creation" ON users
    FOR INSERT WITH CHECK (true); -- Permissive for now

-- Weight history policies
CREATE POLICY "Users can manage their own weight history" ON weight_history
    FOR ALL USING (true); -- Permissive for now

-- User goals policies
CREATE POLICY "Users can manage their own goals" ON user_goals
    FOR ALL USING (true); -- Permissive for now

-- User preferences policies
CREATE POLICY "Users can manage their own preferences" ON user_preferences
    FOR ALL USING (true); -- Permissive for now

-- User achievements policies
CREATE POLICY "Users can manage their own achievements" ON user_achievements
    FOR ALL USING (true); -- Permissive for now

-- Exercises policies
CREATE POLICY "Users can manage their own exercises" ON exercises
    FOR ALL USING (true); -- Permissive for now

-- Workout templates policies
CREATE POLICY "Users can manage their own workout templates" ON workout_templates
    FOR ALL USING (true); -- Permissive for now

-- Workout template exercises policies
CREATE POLICY "Users can manage their own workout template exercises" ON workout_template_exercises
    FOR ALL USING (true); -- Permissive for now

-- Workout logs policies
CREATE POLICY "Users can manage their own workout logs" ON workout_logs
    FOR ALL USING (true); -- Permissive for now

-- Workout log exercises policies
CREATE POLICY "Users can manage their own workout log exercises" ON workout_log_exercises
    FOR ALL USING (true); -- Permissive for now

-- Workout log sets policies
CREATE POLICY "Users can manage their own workout log sets" ON workout_log_sets
    FOR ALL USING (true); -- Permissive for now

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample exercises for testing
INSERT INTO exercises (id, user_id, name, muscle_group, description) VALUES
    ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'Supino Reto', 'Peito', 'Exercício fundamental para o desenvolvimento do peitoral'),
    ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'Agachamento Livre', 'Pernas', 'Exercício composto para pernas e glúteos'),
    ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'Puxada Frontal', 'Costas', 'Desenvolvimento do latíssimo do dorso')
ON CONFLICT (id) DO NOTHING;

-- Create a system user for sample data
INSERT INTO users (id, email, username, password, first_name, last_name) VALUES
    ('00000000-0000-0000-0000-000000000000', 'system@gymseven.com.br', 'system', 'system', 'System', 'User')
ON CONFLICT (id) DO NOTHING;

NOTIFY pgsql, 'GymSeven database schema setup completed successfully!';