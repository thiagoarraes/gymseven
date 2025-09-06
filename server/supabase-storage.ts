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
import { getSupabaseClient } from './supabase-client';
import type { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
  public supabase: any; // Expose supabase client for direct queries
  
  constructor() {
    console.log('🚀 Initializing Supabase storage...');
    this.supabase = getSupabaseClient();
    if (!this.supabase) {
      throw new Error('Supabase client not initialized. Please check your Supabase credentials.');
    }
    this.initializeSupabase();
  }

  // Helper method to map database columns to TypeScript fields
  private mapDbUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      username: dbUser.username,
      password: dbUser.password,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      dateOfBirth: dbUser.date_of_birth,
      height: dbUser.height,
      weight: dbUser.weight,
      activityLevel: dbUser.activity_level,
      fitnessGoals: dbUser.fitness_goals,
      profileImageUrl: dbUser.profile_image_url,
      experienceLevel: dbUser.experience_level,
      preferredWorkoutDuration: dbUser.preferred_workout_duration,
      isActive: dbUser.is_active,
      emailVerified: dbUser.email_verified,
      lastLoginAt: dbUser.last_login_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at
    } as User;
  }

  private mapDbExerciseToExercise(dbExercise: any): Exercise {
    return {
      id: dbExercise.id,
      user_id: dbExercise.user_id,
      name: dbExercise.name,
      muscleGroup: dbExercise.muscleGroup || dbExercise.muscle_group, // Try both naming conventions
      description: dbExercise.description,
      imageUrl: null, // Removed from database
      videoUrl: null, // Removed from database
      createdAt: dbExercise.createdAt || dbExercise.created_at // Try both naming conventions
    } as Exercise;
  }

  private mapDbWorkoutLogToWorkoutLog(dbLog: any): WorkoutLog {
    return {
      id: dbLog.id,
      user_id: dbLog.user_id,
      templateId: dbLog.templateId,
      name: dbLog.name,
      startTime: dbLog.startTime,
      endTime: dbLog.endTime
    } as WorkoutLog;
  }

  private mapDbWorkoutTemplateToWorkoutTemplate(dbTemplate: any): WorkoutTemplate {
    return {
      id: dbTemplate.id,
      user_id: dbTemplate.user_id,
      name: dbTemplate.name,
      description: dbTemplate.description,
      createdAt: dbTemplate.created_at
    } as WorkoutTemplate;
  }

  private async initializeSupabase() {
    try {
      if (!this.supabase) {
        throw new Error('Supabase client not available');
      }
      
      // Test connection first with a simple query
      const { data, error } = await this.supabase
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
    return this.mapDbUserToUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return undefined;
    return this.mapDbUserToUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return undefined;
    return this.mapDbUserToUser(data);
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      // Start with minimal required fields
      const dbUser: any = {
        email: user.email,
        username: user.username,
        password: user.password
      };
      
      // Add optional fields that are provided
      if (user.firstName) dbUser.first_name = user.firstName;
      if (user.lastName) dbUser.last_name = user.lastName;

      console.log('Attempting to create user with data:', JSON.stringify(dbUser, null, 2));

      const { data, error } = await supabase
        .from('users')
        .insert(dbUser)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error details:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('User created successfully:', data);
      return this.mapDbUserToUser(data);
    } catch (err: any) {
      console.error('Create user error:', err);
      throw err;
    }
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    // Map camelCase to snake_case for database columns
    const dbUpdates: any = { ...updates };
    
    if (updates.firstName !== undefined) {
      dbUpdates.first_name = updates.firstName;
      delete dbUpdates.firstName;
    }
    if (updates.lastName !== undefined) {
      dbUpdates.last_name = updates.lastName;
      delete dbUpdates.lastName;
    }
    if (updates.dateOfBirth !== undefined) {
      dbUpdates.date_of_birth = updates.dateOfBirth;
      delete dbUpdates.dateOfBirth;
    }
    if (updates.activityLevel !== undefined) {
      dbUpdates.activity_level = updates.activityLevel;
      delete dbUpdates.activityLevel;
    }
    if (updates.fitnessGoals !== undefined) {
      dbUpdates.fitness_goals = updates.fitnessGoals;
      delete dbUpdates.fitnessGoals;
    }
    if (updates.profileImageUrl !== undefined) {
      dbUpdates.profile_image_url = updates.profileImageUrl;
      delete dbUpdates.profileImageUrl;
    }
    if (updates.experienceLevel !== undefined) {
      dbUpdates.experience_level = updates.experienceLevel;
      delete dbUpdates.experienceLevel;
    }
    if (updates.preferredWorkoutDuration !== undefined) {
      dbUpdates.preferred_workout_duration = updates.preferredWorkoutDuration;
      delete dbUpdates.preferredWorkoutDuration;
    }
    if (updates.isActive !== undefined) {
      dbUpdates.is_active = updates.isActive;
      delete dbUpdates.isActive;
    }
    if (updates.emailVerified !== undefined) {
      dbUpdates.email_verified = updates.emailVerified;
      delete dbUpdates.emailVerified;
    }
    if (updates.lastLoginAt !== undefined) {
      dbUpdates.last_login_at = updates.lastLoginAt;
      delete dbUpdates.lastLoginAt;
    }

    // Let Supabase handle timestamps automatically

    const { data, error } = await supabase
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return this.mapDbUserToUser(data);
  }

  async deleteUser(id: string): Promise<boolean> {
    console.log(`🗑️ Deleting user with ID: ${id}`);
    
    try {
      // Verify user exists
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();

      if (!user) {
        console.log(`❌ User not found: ${id}`);
        return false;
      }

      // Simple deletion - cascade deletes are handled by DB constraints
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) {
        console.error(`❌ Deletion error:`, error);
        return false;
      }

      console.log(`✅ User successfully deleted: ${id}`);
      return true;

    } catch (error) {
      console.error(`❌ Error deleting user ${id}:`, error);
      return false;
    }
  }

  async updateLastLogin(id: string): Promise<void> {
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id);
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    let query = supabase
      .from('weight_history')
      .select('*')
      .eq('user_id', userId)
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
      .eq('user_id', userId);

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
      .eq('user_id', userId)
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
      .eq('user_id', userId)
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

    console.log('🔍 [SUPABASE] Getting exercises for user:', userId);

    const { data, error } = await supabase
      .from('exercises')
      .select('id, user_id, name, muscleGroup, description, createdAt')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ [SUPABASE] Error getting exercises:', error);
      throw error;
    }

    console.log(`🎯 [SUPABASE] Found ${data.length} exercises`);
    return data.map(item => this.mapDbExerciseToExercise(item));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, user_id, name, muscleGroup, description, createdAt')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return this.mapDbExerciseToExercise(data);
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    console.log('🏋️ [SUPABASE] Creating exercise with simplified fields...');
    
    // Only use fields that definitely exist in the database
    const dbExercise = {
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      user_id: userId,
      description: exercise.description || null
    };

    console.log('🎯 [SUPABASE] Inserting exercise:', dbExercise);

    const { data, error } = await supabase
      .from('exercises')
      .insert(dbExercise)
      .select('id, user_id, name, muscleGroup, description, createdAt')
      .single();

    if (error) {
      console.error('❌ [SUPABASE] Exercise creation failed:', error);
      throw new Error(`Database error: ${error.message}`);
    }

    console.log('✅ [SUPABASE] Exercise created successfully:', data.id);
    return this.mapDbExerciseToExercise(data);
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    // Map properties correctly for Supabase - use snake_case for database
    const dbUpdate: any = {};
    if (exercise.name !== undefined) dbUpdate.name = exercise.name;
    if (exercise.muscleGroup !== undefined) dbUpdate.muscle_group = exercise.muscleGroup; // Map to snake_case
    if (exercise.description !== undefined) dbUpdate.description = exercise.description;
    if (exercise.imageUrl !== undefined) dbUpdate.image_url = exercise.imageUrl; // Map to snake_case
    if (exercise.videoUrl !== undefined) dbUpdate.video_url = exercise.videoUrl; // Map to snake_case
    if ((exercise as any).user_id !== undefined) dbUpdate.user_id = (exercise as any).user_id;

    let query = supabase
      .from('exercises')
      .update(dbUpdate)
      .eq('id', id);

    // Add user isolation if userId is provided
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query
      .select()
      .single();

    if (error) {
      console.error('Error updating exercise:', error);
      return undefined;
    }
    return this.mapDbExerciseToExercise(data);
  }

  async deleteExercise(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('muscleGroup', muscleGroup)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map(item => this.mapDbExerciseToExercise(item));
  }

  // Workout Templates - user-specific only
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    // Return empty array - templates should be filtered by user
    return [];
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    if (!userId) return [];

    // Try camelCase first (what PostgREST expects), then snake_case fallback
    let { data, error } = await supabase
      .from('workoutTemplates')
      .select('*')
      .eq('user_id', userId);

    // If camelCase fails, try snake_case
    if (error && error.code === 'PGRST205') {
      const fallback = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', userId);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Error fetching workout templates:', error);
      return []; // Return empty array instead of throwing
    }
    return data.map(item => this.mapDbWorkoutTemplateToWorkoutTemplate(item));
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
    // Try camelCase first (what PostgREST expects), then snake_case fallback
    let { data, error } = await supabase
      .from('workoutTemplates')
      .insert(template)
      .select()
      .single();

    // If camelCase fails, try snake_case
    if (error && error.code === 'PGRST205') {
      const fallback = await supabase
        .from('workout_templates')
        .insert(template)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

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

  async deleteWorkoutTemplate(id: string, userId?: string): Promise<boolean> {
    // First, check if the template exists and verify ownership
    if (userId) {
      // Try camelCase first (what PostgREST expects), then snake_case fallback
      let { data: templateCheck, error: checkError } = await supabase
        .from('workoutTemplates')
        .select('id, user_id, name')
        .eq('id', id)
        .single();

      // If camelCase fails, try snake_case
      if (checkError && checkError.code === 'PGRST205') {
        const fallback = await supabase
          .from('workout_templates')
          .select('id, user_id, name')
          .eq('id', id)
          .single();
        templateCheck = fallback.data;
        checkError = fallback.error;
      }
        
      if (checkError || !templateCheck) {
        return false;
      }
      
      if (templateCheck.user_id !== userId) {
        return false;
      }
    }

    // Before deleting the template, remove references from workout logs to avoid foreign key constraint
    // Try camelCase first (what PostgREST expects), then snake_case fallback
    let { error: updateError } = await supabase
      .from('workoutLogs')
      .update({ templateId: null })
      .eq('templateId', id);

    // If camelCase fails, try snake_case
    if (updateError && updateError.code === 'PGRST205') {
      const fallback = await supabase
        .from('workout_logs')
        .update({ templateId: null })
        .eq('templateId', id);
      updateError = fallback.error;
    }

    if (updateError) {
      return false;
    }

    // Try camelCase first (what PostgREST expects), then snake_case fallback
    let query = supabase
      .from('workoutTemplates')
      .delete()
      .eq('id', id);

    let shouldTrySnakeCase = false;

    // If userId is provided, ensure user owns the template
    if (userId) {
      query = query.eq('user_id', userId);
    }

    let { error, count } = await query;

    // If camelCase fails, try snake_case
    if (error && error.code === 'PGRST205') {
      query = supabase
        .from('workout_templates')
        .delete()
        .eq('id', id);
        
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const fallback = await query;
      error = fallback.error;
      count = fallback.count;
    }
    
    // Return false if error occurred or no rows were affected (template not found or not owned by user)
    return !error && count !== 0;
  }

  // Workout Template Exercises
  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    // Try camelCase first (what PostgREST expects), then snake_case fallback
    let { data, error } = await supabase
      .from('workoutTemplateExercises')
      .select(`
        *,
        exercises (*)
      `)
      .eq('templateId', templateId);

    // If camelCase fails, try snake_case
    if (error && error.code === 'PGRST205') {
      const fallback = await supabase
        .from('workout_template_exercises')
        .select(`
          *,
          exercises (*)
        `)
        .eq('templateId', templateId);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.error('Error fetching template exercises:', error);
      throw error;
    }
    return data.map(item => ({
      ...item,
      exercise: item.exercises
    })) as (WorkoutTemplateExercise & { exercise: Exercise })[];
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    // Try camelCase first (what PostgREST expects), then snake_case fallback
    let { data, error } = await supabase
      .from('workoutTemplateExercises')
      .insert(exercise)
      .select()
      .single();

    // If camelCase fails, try snake_case
    if (error && error.code === 'PGRST205') {
      const fallback = await supabase
        .from('workout_template_exercises')
        .insert(exercise)
        .select()
        .single();
      data = fallback.data;
      error = fallback.error;
    }

    if (error) throw error;
    return data as WorkoutTemplateExercise;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>, userId?: string): Promise<WorkoutTemplateExercise | undefined> {
    console.log(`🔧 Attempting to update template exercise: ${id} for user: ${userId}`);
    console.log(`📝 Updates:`, updates);
    
    try {
      // First verify ownership if userId provided
      if (userId) {
        // Check if the exercise belongs to a template owned by the user
        // Try camelCase first (what PostgREST expects), then snake_case fallback
        let { data: ownership, error: ownershipError } = await supabase
          .from('workoutTemplateExercises')
          .select(`
            id,
            templateId,
            workoutTemplates!inner(
              id,
              user_id
            )
          `)
          .eq('id', id)
          .eq('workoutTemplates.user_id', userId)
          .maybeSingle();

        // If camelCase fails, try snake_case
        if (ownershipError && (ownershipError.code === 'PGRST205' || ownershipError.code === 'PGRST200')) {
          const fallback = await supabase
            .from('workout_template_exercises')
            .select(`
              id,
              templateId,
              workout_templates!inner(
                id,
                user_id
              )
            `)
            .eq('id', id)
            .eq('workout_templates.user_id', userId)
            .maybeSingle();
          ownership = fallback.data;
          ownershipError = fallback.error;
        }

        if (ownershipError) {
          console.error(`❌ Error checking ownership:`, ownershipError);
          return undefined;
        }

        if (!ownership) {
          console.warn(`🔒 Exercise ${id} not found or user ${userId} doesn't have permission`);
          
          // Check if exercise exists at all
          const { data: existsCheck } = await supabase
            .from('workout_template_exercises')
            .select('id, templateId')
            .eq('id', id)
            .maybeSingle();
            
          if (existsCheck) {
            const { data: templateOwner } = await supabase
              .from('workout_templates')
              .select('user_id')
              .eq('id', existsCheck.templateId)
              .single();
            console.warn(`👤 Exercise exists but belongs to user: ${templateOwner?.user_id}, not ${userId}`);
          } else {
            console.warn(`🚫 Exercise ${id} does not exist`);
          }
          
          return undefined;
        }
      }
      
      // Map camelCase to snake_case for database (simple and clean)
      const dbUpdate: any = {};
      Object.keys(updates).forEach(key => {
        switch (key) {
          case 'restDurationSeconds':
            dbUpdate.rest_duration_seconds = updates[key]; // Only use the correct column name
            break;
          case 'exerciseId':
            dbUpdate.exercise_id = updates[key];
            break;
          case 'templateId':
            dbUpdate.template_id = updates[key];
            break;
          default:
            dbUpdate[key] = updates[key];
        }
      });

      // Now update the exercise - use the correct table name from schema
      const { data, error } = await supabase
        .from('workout_template_exercises')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error(`❌ Supabase error updating template exercise:`, error);
        return undefined;
      }
      
      if (!data) {
        console.warn(`⚠️ Update succeeded but no data returned for exercise ${id}`);
        return undefined;
      }
      
      // Map the returned data to match our interface (snake_case -> camelCase)
      const mappedData = {
        ...data,
        restDuration: data.rest_duration_seconds,
        restDurationSeconds: data.rest_duration_seconds,
        templateId: data.template_id,
        exerciseId: data.exercise_id,
        createdAt: data.created_at
      };
      
      console.log(`✅ Successfully updated template exercise ${id}`);
      return mappedData as WorkoutTemplateExercise;
      
    } catch (error) {
      console.error(`💥 Unexpected error updating template exercise ${id}:`, error);
      return undefined;
    }
  }

  async deleteWorkoutTemplateExercise(id: string, userId?: string): Promise<boolean> {
    // If userId is provided, verify ownership before deleting
    if (userId) {
      const { data: exerciseData, error: checkError } = await supabase
        .from('workout_template_exercises')
        .select(`
          id,
          workoutTemplate:workout_templates!inner(
            id,
            user_id
          )
        `)
        .eq('id', id)
        .eq('workout_templates.user_id', userId)
        .single();
      
      if (checkError || !exerciseData) {
        console.error('Template exercise not found or not owned by user:', checkError);
        return false;
      }
    }

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

    if (error) {
      console.error('Error fetching workout logs:', error);
      return []; // Return empty array instead of throwing
    }
    return data.map(item => this.mapDbWorkoutLogToWorkoutLog(item));
  }

  async getRecentWorkoutLogs(limit: number = 5): Promise<WorkoutLog[]> {
    // This method should also be user-specific in practice
    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent workout logs:', error);
      return []; // Return empty array instead of throwing
    }
    return data.map(item => this.mapDbWorkoutLogToWorkoutLog(item));
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

  // User Achievements methods (conquistas isoladas por usuário)
  async getUserAchievements(userId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async createUserAchievement(achievement: any): Promise<any> {
    const { data, error } = await supabase
      .from('user_achievements')
      .insert(achievement)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserAchievement(id: string, updates: any): Promise<any | undefined> {
    const { data, error } = await supabase
      .from('user_achievements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteUserAchievement(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('user_achievements')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Clear all user data but keep the account
  async clearUserData(userId: string): Promise<boolean> {
    try {
      // Delete user-specific data in correct order to avoid foreign key constraints
      
      // 1. Get user's workout logs first
      const { data: workout_logs } = await supabase
        .from('workout_logs')
        .select('id')
        .eq('user_id', userId);
      
      const workoutLogIds = workout_logs?.map(log => log.id) || [];

      // 2. Get workout log exercises
      const { data: workout_log_exercises } = await supabase
        .from('workout_log_exercises')
        .select('id')
        .in('workoutLogId', workoutLogIds);
      
      const workoutLogExerciseIds = workout_log_exercises?.map(ex => ex.id) || [];

      // 3. Delete workout log sets first
      if (workoutLogExerciseIds.length > 0) {
        await supabase
          .from('workout_log_sets')
          .delete()
          .in('workoutLogExerciseId', workoutLogExerciseIds);
      }

      // 4. Delete workout log exercises
      if (workoutLogIds.length > 0) {
        await supabase
          .from('workout_log_exercises')
          .delete()
          .in('workoutLogId', workoutLogIds);
      }

      // 5. Delete workout logs
      await supabase
        .from('workout_logs')
        .delete()
        .eq('user_id', userId);

      // 6. Get user's workout templates
      const { data: workout_templates } = await supabase
        .from('workout_templates')
        .select('id')
        .eq('user_id', userId);
      
      const templateIds = workout_templates?.map(template => template.id) || [];

      // 7. Delete workout template exercises
      if (templateIds.length > 0) {
        await supabase
          .from('workout_template_exercises')
          .delete()
          .in('templateId', templateIds);
      }

      // 8. Delete workout templates
      await supabase
        .from('workout_templates')
        .delete()
        .eq('user_id', userId);

      // 9. Delete user exercises
      await supabase
        .from('exercises')
        .delete()
        .eq('user_id', userId);

      // 10. Delete user achievements
      await supabase
        .from('user_achievements')
        .delete()
        .eq('user_id', userId);

      return true;
    } catch (error) {
      console.error('Error clearing user data:', error);
      return false;
    }
  }
}