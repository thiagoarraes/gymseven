import { 
  type User, type InsertUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogSet, type InsertWorkoutLogSet,
  type WeightHistory, type InsertWeightHistory,
  type UserGoal, type InsertUserGoal,
  type UserPreferences, type InsertUserPreferences, type UpdateUserPreferences
} from "@shared/schema";
import { supabase } from './supabase-client';
import type { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  public supabase = supabase; // Expose supabase client for direct queries
  
  constructor() {
    console.log('🚀 Initializing Supabase storage...');
    this.initializeSupabase();
  }

  private async initializeSupabase() {
    try {
      // Test connection first with a simple query
      const { data, error } = await supabase
        .from('exercises')
        .select('id')
        .limit(1);
      
      if (error && error.code === 'PGRST205') {
        console.log('⚠️ Tables not found, they need to be created in Supabase dashboard');
        console.log('📋 Please run the SQL setup script or create tables manually');
        return; // Don't throw error, just warn
      }
      
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        throw error;
      }
      
      console.log('✅ Supabase connection verified');
      
      // Initialize sample data if needed
      await this.initializeSampleData();
      console.log('✅ Supabase initialization complete');
      
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      // Don't throw error to prevent app crash
      console.log('⚠️ Continuing with limited functionality...');
    }
  }

  private async initializeSampleData() {
    try {
      // Check if we already have exercises
      const { data: existingExercises, error } = await supabase
        .from('exercises')
        .select('id')
        .limit(1);

      if (error) throw error;
      
      if (existingExercises && existingExercises.length > 0) {
        console.log('📚 Sample data already exists in Supabase');
        return;
      }

      console.log('🏗️ Creating sample data in Supabase...');
      
      const sampleExercises = [
        {
          name: "Supino Reto",
          muscleGroup: "Peito",
          description: "Exercício fundamental para o desenvolvimento do peitoral",
          imageUrl: null,
          videoUrl: null,
        },
        {
          name: "Agachamento Livre",
          muscleGroup: "Pernas", 
          description: "Exercício composto para pernas e glúteos",
          imageUrl: null,
          videoUrl: null,
        },
        {
          name: "Puxada Frontal",
          muscleGroup: "Costas",
          description: "Desenvolvimento do latíssimo do dorso",
          imageUrl: null,
          videoUrl: null,
        },
        {
          name: "Rosca Direta",
          muscleGroup: "Braços",
          description: "Desenvolvimento do bíceps",
          imageUrl: null,
          videoUrl: null,
        },
        {
          name: "Desenvolvimento Militar",
          muscleGroup: "Ombros",
          description: "Exercício para deltoides",
          imageUrl: null,
          videoUrl: null,
        }
      ];

      const { error: insertError } = await supabase
        .from('exercises')
        .insert(sampleExercises);

      if (insertError) throw insertError;
      
      console.log('✅ Sample exercises created successfully in Supabase');
      
    } catch (error) {
      console.error('❌ Error creating sample data in Supabase:', error);
      throw error;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return undefined;
    
    // Map snake_case to camelCase
    const user = {
      ...data,
      firstName: data.first_name,
      lastName: data.last_name,
      isActive: data.is_active,
      lastLoginAt: data.last_login_at,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
    
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Map camelCase to snake_case for Supabase compatibility
    const mappedUser = {
      email: insertUser.email,
      username: insertUser.username,
      password: insertUser.password,
      first_name: insertUser.firstName,
      last_name: insertUser.lastName,
      is_active: insertUser.isActive ?? true
    };

    console.log('Creating user with mapped data:', { ...mappedUser, password: '[HIDDEN]' });
    
    const { data, error } = await supabase
      .from('users')
      .insert(mappedUser)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase user creation error:', error);
      throw error;
    }
    
    // Map back to camelCase for response
    const user = {
      ...data,
      firstName: data.first_name,
      lastName: data.last_name,
      isActive: data.is_active,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
    
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    // Map camelCase to snake_case for Supabase compatibility
    const mappedUpdates: any = {};
    
    if (updates.email) mappedUpdates.email = updates.email;
    if (updates.username) mappedUpdates.username = updates.username;
    if (updates.firstName) mappedUpdates.first_name = updates.firstName;
    if (updates.lastName) mappedUpdates.last_name = updates.lastName;
    if (updates.dateOfBirth) mappedUpdates.dateOfBirth = updates.dateOfBirth;
    if (updates.activityLevel) mappedUpdates.activityLevel = updates.activityLevel;
    if (updates.isActive !== undefined) mappedUpdates.is_active = updates.isActive;
    
    const { data, error } = await supabase
      .from('users')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase user update error:', error);
      return undefined;
    }
    
    // Map back to camelCase for response
    const user = {
      ...data,
      firstName: data.first_name,
      lastName: data.last_name,
      isActive: data.is_active,
      lastLoginAt: data.last_login_at,
      createdAt: data.createdAt || data.created_at,
      updatedAt: data.updatedAt || data.updated_at
    };
    
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async updateLastLogin(id: string): Promise<void> {
    await supabase
      .from('users')
      .update({ lastLoginAt: new Date() })
      .eq('id', id);
  }

  // Weight History methods
  async getWeightHistory(userId: string, limit = 50): Promise<WeightHistory[]> {
    const { data, error } = await supabase
      .from('weight_history')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  async addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory> {
    const { data, error } = await supabase
      .from('weight_history')
      .insert(entry)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const { data, error } = await supabase
      .from('weight_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('weight_history')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // User Goals methods
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const { data, error } = await supabase
      .from('user_goals')
      .insert(goal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const { data, error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // User Preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('userId', userId)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert(prefs)
      .select()
      .single();
    
    if (error) {
      console.log('User preferences table not available:', error.message);
      // Return a default preferences object if table doesn't exist
      return {
        id: 'temp-id',
        userId: prefs.userId,
        theme: 'dark',
        units: 'metric',
        language: 'pt-BR',
        notifications: true,
        soundEffects: true,
        restTimerAutoStart: true,
        defaultRestTime: 90,
        weekStartsOn: 1,
        trackingData: 'all'
      } as UserPreferences;
    }
    return data;
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('userId', userId)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }

  // Exercise methods
  async getAllExercises(): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const { data, error } = await supabase
      .from('exercises')
      .update(exercise)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }

  async deleteExercise(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('muscleGroup', muscleGroup)
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  // Workout Template methods
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    const { data, error } = await supabase
      .from('workoutTemplates')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    const { data, error } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const { data, error } = await supabase
      .from('workoutTemplates')
      .insert(template)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const { data, error } = await supabase
      .from('workoutTemplates')
      .update(template)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }

  async deleteWorkoutTemplate(id: string): Promise<boolean> {
    console.log(`🗑️ Attempting to delete workout template: ${id}`);
    
    try {
      // First check if the template exists
      const { data: existingTemplate, error: checkError } = await supabase
        .from('workoutTemplates')
        .select('id')
        .eq('id', id)
        .single();
      
      if (checkError || !existingTemplate) {
        console.log(`❌ Template ${id} not found for deletion`);
        return false;
      }
      
      console.log(`✅ Template ${id} found, checking dependencies...`);
      
      // Check if there are workout logs referencing this template
      const { data: dependentLogs, error: logCheckError } = await supabase
        .from('workoutLogs')
        .select('id')
        .eq('templateId', id);
      
      if (logCheckError) {
        console.error(`❌ Error checking dependent logs:`, logCheckError);
        return false;
      }
      
      // If there are dependent workout logs, delete them first
      if (dependentLogs && dependentLogs.length > 0) {
        console.log(`🔗 Found ${dependentLogs.length} dependent workout logs, deleting them first...`);
        
        for (const log of dependentLogs) {
          const logDeleted = await this.deleteWorkoutLog(log.id);
          if (!logDeleted) {
            console.error(`❌ Failed to delete dependent workout log ${log.id}`);
            return false;
          }
        }
        
        console.log(`✅ All dependent workout logs deleted`);
      }
      
      // Delete template exercises first (they should cascade, but let's be explicit)
      const { error: exerciseDeleteError } = await supabase
        .from('workoutTemplateExercises')
        .delete()
        .eq('templateId', id);
      
      if (exerciseDeleteError) {
        console.error(`❌ Error deleting template exercises:`, exerciseDeleteError);
        // Continue anyway, as this might cascade
      } else {
        console.log(`✅ Template exercises deleted`);
      }
      
      // Now delete the template itself
      const { error } = await supabase
        .from('workoutTemplates')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error(`❌ Error deleting template ${id}:`, error);
        return false;
      }
      
      console.log(`✅ Template ${id} deleted successfully`);
      return true;
      
    } catch (error) {
      console.error(`❌ Unexpected error during template deletion:`, error);
      return false;
    }
  }

  // Workout Template Exercise methods
  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const { data, error } = await supabase
      .from('workoutTemplateExercises')
      .select(`
        *,
        exercise:exercises(*)
      `)
      .eq('templateId', templateId)
      .order('order');
    
    if (error) throw error;
    
    // Map restDuration to restDurationSeconds for consistency
    const mapped = (data || []).map(item => ({
      ...item,
      restDurationSeconds: item.restDuration || item.restDurationSeconds || 90
    }));
    
    return mapped;
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const { data, error } = await supabase
      .from('workoutTemplateExercises')
      .insert(exercise)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>): Promise<WorkoutTemplateExercise | undefined> {
    // Map restDurationSeconds to restDuration for Supabase compatibility
    const mappedUpdates: any = { ...updates };
    if ('restDurationSeconds' in mappedUpdates) {
      mappedUpdates.restDuration = mappedUpdates.restDurationSeconds;
      delete mappedUpdates.restDurationSeconds;
    }
    
    const { data, error } = await supabase
      .from('workoutTemplateExercises')
      .update(mappedUpdates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    
    // Map back to restDurationSeconds for consistency
    const result = {
      ...data,
      restDurationSeconds: data.restDuration || data.restDurationSeconds || 90
    };
    
    return result;
  }

  async deleteWorkoutTemplateExercise(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workoutTemplateExercises')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workoutTemplateExercises')
      .delete()
      .eq('templateId', templateId)
      .eq('exerciseId', exerciseId);
    
    return !error;
  }

  // Workout Log methods
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    const { data, error } = await supabase
      .from('workoutLogs')
      .select('*')
      .order('startTime', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    const { data, error } = await supabase
      .from('workoutLogs')
      .select(`
        *,
        exercises:workoutLogExercises(
          *,
          sets:workoutLogSets(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) return undefined;
    return data;
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const { data, error } = await supabase
      .from('workoutLogs')
      .insert(log)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const { data, error } = await supabase
      .from('workoutLogs')
      .update(log)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workoutLogs')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async getRecentWorkoutLogs(limit = 10): Promise<WorkoutLog[]> {
    const { data, error } = await supabase
      .from('workoutLogs')
      .select('*')
      .order('startTime', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error getting recent workout logs:', error);
      throw error;
    }
    return data || [];
  }

  // Workout Log Set methods
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    // Check table structure first - likely using log_exercise_id instead of logId
    const { data, error } = await supabase
      .from('workout_log_sets')
      .select('*')
      .eq('log_exercise_id', logId) // This might need to be adjusted based on actual schema
      .order('set_number');
    
    if (error) {
      console.error('Error fetching workout log sets:', error);
      return [];
    }
    return data || [];
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const { data, error } = await supabase
      .from('workoutLogSets')
      .insert(set)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const { data, error } = await supabase
      .from('workoutLogSets')
      .update(set)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
  }
}