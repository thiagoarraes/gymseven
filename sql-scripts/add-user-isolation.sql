-- Add userId columns to enable user data isolation
-- This script adds the missing userId columns to exercises, workoutTemplates, and workoutLogs tables

-- Add userId column to exercises table
ALTER TABLE exercises 
ADD COLUMN user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;

-- Add userId column to workout_templates table  
ALTER TABLE "workoutTemplates"
ADD COLUMN user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;

-- Add userId column to workout_logs table
ALTER TABLE "workoutLogs" 
ADD COLUMN user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;

-- Update existing data to assign to the first user (temporary solution)
-- In production, you would need a proper data migration strategy
DO $$
DECLARE
    first_user_id VARCHAR;
BEGIN
    -- Get the first user ID
    SELECT id INTO first_user_id FROM users LIMIT 1;
    
    IF first_user_id IS NOT NULL THEN
        -- Assign all existing exercises to the first user
        UPDATE exercises 
        SET user_id = first_user_id 
        WHERE user_id IS NULL;
        
        -- Assign all existing workout templates to the first user
        UPDATE "workoutTemplates" 
        SET user_id = first_user_id 
        WHERE user_id IS NULL;
        
        -- Assign all existing workout logs to the first user
        UPDATE "workoutLogs" 
        SET user_id = first_user_id 
        WHERE user_id IS NULL;
        
        RAISE NOTICE 'Assigned existing data to user: %', first_user_id;
    ELSE
        RAISE NOTICE 'No users found - no data migration needed';
    END IF;
END $$;

-- Make userId columns NOT NULL after assigning existing data
ALTER TABLE exercises 
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE "workoutTemplates"
ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE "workoutLogs"
ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_exercises_user_id ON exercises(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_templates_user_id ON "workoutTemplates"(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_logs_user_id ON "workoutLogs"(user_id);