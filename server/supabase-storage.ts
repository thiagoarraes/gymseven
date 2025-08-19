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
      console.log('✅ Supabase ready for user data');
      
    } catch (error) {
      console.error('❌ Supabase initialization failed:', error);
      // Don't throw error to prevent app crash
      console.log('⚠️ Continuing with limited functionality...');
    }
  }

  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as User;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return undefined;
    return data as User;
  }

  async createUser(user: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as User;
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
      .update({ lastLoginAt: new Date().toISOString() })
      .eq('id', id);
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    let query = supabase
      .from('weight_history')
      .select('*')
      .eq('userId', userId)
      .order('date', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as WeightHistory[];
  }

  async addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory> {
    const { data, error } = await supabase
      .from('weight_history')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data as WeightHistory;
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const { data, error } = await supabase
      .from('weight_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WeightHistory;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('weight_history')
      .delete()
      .eq('id', id);

    return !error;
  }

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    const { data, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;
    return data as UserGoal[];
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const { data, error } = await supabase
      .from('user_goals')
      .insert(goal)
      .select()
      .single();

    if (error) throw error;
    return data as UserGoal;
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const { data, error } = await supabase
      .from('user_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as UserGoal;
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', id);

    return !error;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('userId', userId)
      .single();

    if (error) return undefined;
    return data as UserPreferences;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const { data, error } = await supabase
      .from('user_preferences')
      .insert(prefs)
      .select()
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const { data, error } = await supabase
      .from('user_preferences')
      .update(updates)
      .eq('userId', userId)
      .select()
      .single();

    if (error) return undefined;
    return data as UserPreferences;
  }

  // Exercises - user-specific only
  async getAllExercises(): Promise<Exercise[]> {
    // Return empty array - exercises should be filtered by user
    return [];
  }

  async getExercises(userId?: string): Promise<Exercise[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;
    return data as Exercise[];
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as Exercise;
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const { data, error } = await supabase
      .from('exercises')
      .insert(exercise)
      .select()
      .single();

    if (error) throw error;
    return data as Exercise;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const { data, error } = await supabase
      .from('exercises')
      .update(exercise)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as Exercise;
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
      .eq('muscleGroup', muscleGroup);

    if (error) throw error;
    return data as Exercise[];
  }

  // Workout Templates - user-specific only
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    // Return empty array - templates should be filtered by user
    return [];
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('userId', userId);

    if (error) throw error;
    return data as WorkoutTemplate[];
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as WorkoutTemplate;
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const { data, error } = await supabase
      .from('workout_templates')
      .insert(template)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutTemplate;
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const { data, error } = await supabase
      .from('workout_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WorkoutTemplate;
  }

  async deleteWorkoutTemplate(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Workout Template Exercises
  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .select(`
        *,
        exercises (*)
      `)
      .eq('templateId', templateId);

    if (error) throw error;
    return data.map(item => ({
      ...item,
      exercise: item.exercises
    })) as (WorkoutTemplateExercise & { exercise: Exercise })[];
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .insert(exercise)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutTemplateExercise;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>): Promise<WorkoutTemplateExercise | undefined> {
    const { data, error } = await supabase
      .from('workout_template_exercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WorkoutTemplateExercise;
  }

  async deleteWorkoutTemplateExercise(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_template_exercises')
      .delete()
      .eq('id', id);

    return !error;
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_template_exercises')
      .delete()
      .eq('templateId', templateId)
      .eq('exerciseId', exerciseId);

    return !error;
  }

  // Workout Logs - user-specific only
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    // Return empty array - logs should be filtered by user
    return [];
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as WorkoutLog;
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert(log)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutLog;
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const { data, error } = await supabase
      .from('workout_logs')
      .update(log)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WorkoutLog;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_logs')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('startTime', { ascending: false });

    if (error) throw error;
    return data as WorkoutLog[];
  }

  async getRecentWorkoutLogs(limit: number = 5): Promise<WorkoutLog[]> {
    // This method should also be user-specific in practice
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .order('startTime', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as WorkoutLog[];
  }

  // Workout Log Set methods
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    const { data, error } = await supabase
      .from('workout_log_sets')
      .select(`
        *,
        workout_log_exercises!inner (
          logId
        )
      `)
      .eq('workout_log_exercises.logId', logId);

    if (error) throw error;
    return data as WorkoutLogSet[];
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const { data, error } = await supabase
      .from('workout_log_sets')
      .insert(set)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutLogSet;
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const { data, error } = await supabase
      .from('workout_log_sets')
      .update(set)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WorkoutLogSet;
  }

  async deleteWorkoutLogSet(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('workout_log_sets')
      .delete()
      .eq('id', id);

    return !error;
  }
}