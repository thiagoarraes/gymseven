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
      muscleGroup: dbExercise.muscleGroup, // Supabase uses camelCase
      description: dbExercise.description,
      createdAt: dbExercise.createdAt // Supabase uses camelCase for all columns
    } as Exercise;
  }

  private mapDbWorkoutLogToWorkoutLog(dbLog: any): WorkoutLog {
    return {
      id: dbLog.id,
      user_id: dbLog.user_id,
      templateId: dbLog.template_id || dbLog.templateId,
      name: dbLog.name,
      startTime: dbLog.start_time || dbLog.startTime,
      endTime: dbLog.end_time || dbLog.endTime
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
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return this.mapDbUserToUser(data);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) return undefined;
    return this.mapDbUserToUser(data);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
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

      const { data, error } = await this.supabase
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

    const { data, error } = await this.supabase
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
      const { data: user } = await this.supabase
        .from('users')
        .select('id')
        .eq('id', id)
        .single();

      if (!user) {
        console.log(`❌ User not found: ${id}`);
        return false;
      }

      // Simple deletion - cascade deletes are handled by DB constraints
      const { error } = await this.supabase
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
    await this.supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id);
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    let query = this.supabase
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
    const { data, error } = await this.supabase
      .from('weight_history')
      .insert(entry)
      .select()
      .single();

    if (error) throw error;
    return data as WeightHistory;
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const { data, error } = await this.supabase
      .from('weight_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WeightHistory;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('weight_history')
      .delete()
      .eq('id', id);

    return !error;
  }

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    const { data, error } = await this.supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data as UserGoal[];
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const { data, error } = await this.supabase
      .from('user_goals')
      .insert(goal)
      .select()
      .single();

    if (error) throw error;
    return data as UserGoal;
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const { data, error } = await this.supabase
      .from('user_goals')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as UserGoal;
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('user_goals')
      .delete()
      .eq('id', id);

    return !error;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) return undefined;
    return data as UserPreferences;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const { data, error } = await this.supabase
      .from('user_preferences')
      .insert(prefs)
      .select()
      .single();

    if (error) throw error;
    return data as UserPreferences;
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const { data, error } = await this.supabase
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


    const { data, error } = await this.supabase
      .from('exercises')
      .select('id, user_id, name, muscleGroup, description, createdAt')
      .eq('user_id', userId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('❌ [SUPABASE] Error getting exercises:', error);
      return []; // Return empty array instead of throwing
    }

    return data.map((item: any) => this.mapDbExerciseToExercise(item));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const { data, error } = await this.supabase
      .from('exercises')
      .select('id, user_id, name, muscleGroup, description, createdAt')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return this.mapDbExerciseToExercise(data);
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    // Based on schema check, Supabase uses camelCase for this table
    const dbExercise = {
      name: exercise.name,
      muscleGroup: exercise.muscleGroup, // Supabase uses camelCase
      user_id: userId,
      description: exercise.description || null
    };

    const { data, error } = await this.supabase
      .from('exercises')
      .insert(dbExercise)
      .select('id, user_id, name, muscleGroup, description, createdAt')
      .single();


    if (error) {
      console.error('Exercise creation failed:', error);
      throw new Error(`Database error: ${error.message}`);
    }
    return this.mapDbExerciseToExercise(data);
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    // Map properties correctly for Supabase - use snake_case for database
    const dbUpdate: any = {};
    if (exercise.name !== undefined) dbUpdate.name = exercise.name;
    if (exercise.muscleGroup !== undefined) dbUpdate.muscleGroup = exercise.muscleGroup; // Use camelCase
    if (exercise.description !== undefined) dbUpdate.description = exercise.description;
    // Note: imageUrl and videoUrl removed from schema
    if ((exercise as any).user_id !== undefined) dbUpdate.user_id = (exercise as any).user_id;

    let query = this.supabase
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
    const { error } = await this.supabase
      .from('exercises')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    if (!userId) return [];

    const { data, error } = await this.supabase
      .from('exercises')
      .select('*')
      .eq('muscleGroup', muscleGroup)
      .eq('user_id', userId);

    if (error) throw error;
    return data.map((item: any) => this.mapDbExerciseToExercise(item));
  }

  // Workout Templates - user-specific only
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    // Return empty array - templates should be filtered by user
    return [];
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    if (!userId) return [];

    let { data, error } = await this.supabase
      .from('workoutTemplates')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching workout templates:', error);
      return []; // Return empty array instead of throwing
    }
    return data.map((item: any) => this.mapDbWorkoutTemplateToWorkoutTemplate(item));
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    const { data, error } = await this.supabase
      .from('workoutTemplates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as WorkoutTemplate;
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    console.log('💪 [DEBUG] === WORKOUT TEMPLATE CREATION START ===');
    console.log('💪 [DEBUG] Input template data:', JSON.stringify(template, null, 2));
    
    // Check available columns in workout_templates table
    try {
      console.log('🔍 [DEBUG] Checking workoutTemplates schema...');
      const { data: schemaData, error: schemaError } = await this.supabase
        .from('workoutTemplates')
        .select('*')
        .limit(1);
      
      console.log('🔍 [DEBUG] Workout templates schema check result:', { data: schemaData, error: schemaError });
    } catch (e) {
      console.log('🔍 [DEBUG] Workout templates schema check failed:', e);
    }

    console.log('🎯 [DEBUG] Final template data to insert:', JSON.stringify(template, null, 2));
    console.log('🎯 [DEBUG] Table: workoutTemplates');
    console.log('🎯 [DEBUG] Operation: INSERT');

    let { data, error } = await this.supabase
      .from('workoutTemplates')
      .insert(template)
      .select()
      .single();

    console.log('📤 [DEBUG] Supabase template response - data:', JSON.stringify(data, null, 2));
    console.log('📤 [DEBUG] Supabase template response - error:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('❌ [DEBUG] Workout template creation failed:', error);
      console.error('❌ [DEBUG] Template error details:');
      console.error('   - Code:', error.code);
      console.error('   - Message:', error.message);
      console.error('   - Details:', error.details);
      console.error('   - Hint:', error.hint);
      throw error;
    }
    
    console.log('✅ [DEBUG] Workout template created successfully:', data.id);
    console.log('💪 [DEBUG] === WORKOUT TEMPLATE CREATION END ===');
    return data as WorkoutTemplate;
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const { data, error } = await this.supabase
      .from('workoutTemplates')
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
      let { data: templateCheck, error: checkError } = await this.supabase
        .from('workoutTemplates')
        .select('id, user_id, name')
        .eq('id', id)
        .single();
        
      if (checkError || !templateCheck) {
        return false;
      }
      
      if (templateCheck.user_id !== userId) {
        return false;
      }
    }

    // Before deleting the template, remove references from workout logs to avoid foreign key constraint
    let { error: updateError } = await this.supabase
      .from('workoutLogs')
      .update({ templateId: null })
      .eq('templateId', id);

    if (updateError) {
      return false;
    }

    let query = this.supabase
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
      query = this.supabase
        .from('workoutTemplates')
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
    console.log(`🔍 Fetching exercises for template: ${templateId}`);
    
    const { data, error } = await this.supabase
      .from('workoutTemplateExercises')
      .select(`
        *,
        exercises (*)
      `)
      .eq('templateId', templateId);

    if (error) {
      console.error('Error fetching template exercises:', error);
      console.error('Error fetching template exercises for template:', templateId, error);
      throw error;
    }
    
    console.log(`✅ Found ${data?.length || 0} exercises for template ${templateId}`);
    
    return data.map((item: any) => ({
      id: item.id,
      templateId: item.templateId,
      exerciseId: item.exerciseId,
      sets: item.sets,
      reps: item.reps,
      weight: item.weight,
      restDurationSeconds: item.restDurationSeconds,
      order: item.order,
      exercise: item.exercises
    })) as (WorkoutTemplateExercise & { exercise: Exercise })[];
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    console.log(`➕ Adding exercise to template:`, exercise);
    
    // Use camelCase for Supabase table
    const dbExercise = {
      templateId: exercise.templateId,
      exerciseId: exercise.exerciseId,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      restDurationSeconds: exercise.restDurationSeconds,
      order: exercise.order
    };
    
    const { data, error } = await this.supabase
      .from('workoutTemplateExercises')
      .insert(dbExercise)
      .select()
      .single();

    if (error) {
      console.error('Error adding exercise to template:', error);
      throw error;
    }
    
    console.log(`✅ Exercise added successfully:`, data);
    
    // Data is already in camelCase from Supabase
    return {
      id: data.id,
      templateId: data.templateId,
      exerciseId: data.exerciseId,
      sets: data.sets,
      reps: data.reps,
      weight: data.weight,
      restDurationSeconds: data.restDurationSeconds,
      order: data.order
    } as WorkoutTemplateExercise;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>, userId?: string): Promise<WorkoutTemplateExercise | undefined> {
    console.log(`🔧 Attempting to update template exercise: ${id} for user: ${userId}`);
    console.log(`📝 Updates:`, updates);
    
    try {
      // First verify ownership if userId provided
      if (userId) {
        // Check if the exercise belongs to a template owned by the user
        // Try camelCase first (what PostgREST expects), then snake_case fallback
        console.log('🔍 DEBUG - Starting ownership check...');
        console.log('🔍 DEBUG - Exercise ID:', id);
        console.log('🔍 DEBUG - User ID:', userId);
        
        // First, let's check what tables exist and their relationships
        console.log('🔍 DEBUG - Checking available tables and columns...');
        
        let { data: ownership, error: ownershipError } = await this.supabase
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

        console.log('🔍 DEBUG - First ownership check result:');
        console.log('   - Data:', JSON.stringify(ownership, null, 2));
        console.log('   - Error:', JSON.stringify(ownershipError, null, 2));

        // If relationship fails, try different approaches
        if (ownershipError && (ownershipError.code === 'PGRST205' || ownershipError.code === 'PGRST200')) {
          console.log('🔍 DEBUG - First attempt failed, trying alternative approaches...');
          
          // Try with different table name reference
          const fallback1 = await this.supabase
            .from('workoutTemplateExercises')
            .select(`
              id,
              templateId,
              workoutTemplates!inner(
                id,
                userId
              )
            `)
            .eq('id', id)
            .eq('workoutTemplates.userId', userId)
            .maybeSingle();
            
          console.log('🔍 DEBUG - Fallback 1 (workoutTemplates.userId):');
          console.log('   - Data:', JSON.stringify(fallback1.data, null, 2));
          console.log('   - Error:', JSON.stringify(fallback1.error, null, 2));

          if (fallback1.error) {
            // Try with manual join approach
            console.log('🔍 DEBUG - Trying manual join approach...');
            const exerciseData = await this.supabase
              .from('workoutTemplateExercises')
              .select('id, templateId')
              .eq('id', id)
              .maybeSingle();
              
            console.log('🔍 DEBUG - Exercise data:', JSON.stringify(exerciseData, null, 2));
            
            if (exerciseData.data?.templateId) {
              const templateData = await this.supabase
                .from('workoutTemplates')
                .select('id, userId')
                .eq('id', exerciseData.data.templateId)
                .eq('userId', userId)
                .maybeSingle();
                
              console.log('🔍 DEBUG - Template data:', JSON.stringify(templateData, null, 2));
              
              if (templateData.data) {
                ownership = {
                  id: exerciseData.data.id,
                  templateId: exerciseData.data.templateId,
                  workoutTemplates: templateData.data
                };
                ownershipError = null;
                console.log('✅ DEBUG - Manual join successful');
              } else {
                ownershipError = templateData.error;
                console.log('❌ DEBUG - Manual join failed at template level');
              }
            } else {
              console.log('❌ DEBUG - Manual join failed - no exercise found or no templateId');
            }
          } else {
            ownership = fallback1.data;
            ownershipError = fallback1.error;
            console.log('✅ DEBUG - Fallback 1 successful');
          }
        } else if (!ownershipError) {
          console.log('✅ DEBUG - First ownership check successful');
        }

        if (ownershipError) {
          console.error(`❌ Error checking ownership:`, ownershipError);
          return undefined;
        }

        if (!ownership) {
          console.warn(`🔒 Exercise ${id} not found or user ${userId} doesn't have permission`);
          
          // Check if exercise exists at all
          const { data: existsCheck } = await this.supabase
            .from('workoutTemplateExercises')
            .select('id, templateId')
            .eq('id', id)
            .maybeSingle();
            
          if (existsCheck) {
            const { data: templateOwner } = await this.supabase
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
      
      // Map updates for database
      console.log('🔍 DEBUG - Processing updates...');
      console.log('🔍 DEBUG - Raw updates received:', JSON.stringify(updates, null, 2));
      
      const dbUpdate: any = {};
      Object.keys(updates).forEach(key => {
        const value = (updates as any)[key];
        console.log(`🔍 DEBUG - Processing field: ${key} = ${value}`);
        
        switch (key) {
          case 'restDurationSeconds':
            dbUpdate.restDurationSeconds = value;
            console.log(`   ✅ Mapped restDurationSeconds: ${value}`);
            break;
          case 'exerciseId':
            dbUpdate.exerciseId = value;
            console.log(`   ✅ Mapped exerciseId: ${value}`);
            break;
          case 'templateId':
            dbUpdate.templateId = value;
            console.log(`   ✅ Mapped templateId: ${value}`);
            break;
          case 'sets':
            dbUpdate.sets = value;
            console.log(`   ✅ Mapped sets: ${value}`);
            break;
          case 'reps':
            dbUpdate.reps = value;
            console.log(`   ✅ Mapped reps: ${value}`);
            break;
          case 'weight':
            dbUpdate.weight = value;
            console.log(`   ✅ Mapped weight: ${value}`);
            break;
          case 'order':
            dbUpdate.order = value;
            console.log(`   ✅ Mapped order: ${value}`);
            break;
          default:
            dbUpdate[key] = value;
            console.log(`   ✅ Direct mapping: ${key} = ${value}`);
        }
      });

      console.log('🔍 DEBUG - Final dbUpdate object:', JSON.stringify(dbUpdate, null, 2));

      // Now update the exercise
      console.log('🔍 DEBUG - Executing Supabase update...');
      console.log('🔍 DEBUG - Table: workoutTemplateExercises');
      console.log('🔍 DEBUG - Where: id =', id);
      console.log('🔍 DEBUG - Update data:', JSON.stringify(dbUpdate, null, 2));
      
      const { data, error } = await this.supabase
        .from('workoutTemplateExercises')
        .update(dbUpdate)
        .eq('id', id)
        .select()
        .maybeSingle();

      console.log('🔍 DEBUG - Supabase update result:');
      console.log('   - Data:', JSON.stringify(data, null, 2));
      console.log('   - Error:', JSON.stringify(error, null, 2));

      if (error) {
        console.error(`❌ Supabase error updating template exercise:`, error);
        return undefined;
      }
      
      if (!data) {
        console.warn(`⚠️ Update succeeded but no data returned for exercise ${id}`);
        return undefined;
      }
      
      // Data is already in camelCase from Supabase
      const mappedData = {
        ...data,
        restDuration: data.restDurationSeconds,
        restDurationSeconds: data.restDurationSeconds,
        templateId: data.templateId,
        exerciseId: data.exerciseId,
        createdAt: data.createdAt
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
      const { data: exerciseData, error: checkError } = await this.supabase
        .from('workoutTemplateExercises')
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

    const { error } = await this.supabase
      .from('workoutTemplateExercises')
      .delete()
      .eq('id', id);

    return !error;
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('workoutTemplateExercises')
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
    const { data, error } = await this.supabase
      .from('workoutLogs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data as WorkoutLog;
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    console.log('📝 [DEBUG] === WORKOUT LOG CREATION START ===');
    console.log('📝 [DEBUG] Input log data:', JSON.stringify(log, null, 2));
    
    // Check available columns in workout_logs table
    try {
      console.log('🔍 [DEBUG] Checking workoutLogs schema...');
      const { data: schemaData, error: schemaError } = await this.supabase
        .from('workoutLogs')
        .select('*')
        .limit(1);
      
      console.log('🔍 [DEBUG] Workout logs schema check result:', { data: schemaData, error: schemaError });
    } catch (e) {
      console.log('🔍 [DEBUG] Workout logs schema check failed:', e);
    }

    console.log('🎯 [DEBUG] Final log data to insert:', JSON.stringify(log, null, 2));
    console.log('🎯 [DEBUG] Table: workoutLogs');
    console.log('🎯 [DEBUG] Operation: INSERT');

    const { data, error } = await this.supabase
      .from('workoutLogs')
      .insert(log)
      .select()
      .single();

    console.log('📤 [DEBUG] Supabase log response - data:', JSON.stringify(data, null, 2));
    console.log('📤 [DEBUG] Supabase log response - error:', JSON.stringify(error, null, 2));

    if (error) {
      console.error('❌ [DEBUG] Workout log creation failed:', error);
      console.error('❌ [DEBUG] Log error details:');
      console.error('   - Code:', error.code);
      console.error('   - Message:', error.message);
      console.error('   - Details:', error.details);
      console.error('   - Hint:', error.hint);
      throw error;
    }
    
    console.log('✅ [DEBUG] Workout log created successfully:', data.id);
    console.log('📝 [DEBUG] === WORKOUT LOG CREATION END ===');
    return data as WorkoutLog;
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const { data, error } = await this.supabase
      .from('workoutLogs')
      .update(log)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WorkoutLog;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('workoutLogs')
      .delete()
      .eq('id', id);

    return !error;
  }

  async getWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    if (!userId) return [];

    const { data, error } = await this.supabase
      .from('workoutLogs')
      .select('*')
      .eq('user_id', userId)
      .order('startTime', { ascending: false });

    if (error) {
      console.error('Error fetching workout logs:', error);
      return []; // Return empty array instead of throwing
    }
    return data.map((item: any) => this.mapDbWorkoutLogToWorkoutLog(item));
  }

  async getRecentWorkoutLogs(limit: number = 5): Promise<WorkoutLog[]> {
    // This method should also be user-specific in practice
    const { data, error } = await this.supabase
      .from('workoutLogs')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent workout logs:', error);
      return []; // Return empty array instead of throwing
    }
    return data.map((item: any) => this.mapDbWorkoutLogToWorkoutLog(item));
  }

  // Workout Log Set methods
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    const { data, error } = await this.supabase
      .from('workoutLogSets')
      .select(`
        *,
        workoutLogExercises!inner (
          log_id
        )
      `)
      .eq('workoutLogExercises.log_id', logId);

    if (error) throw error;
    return data as WorkoutLogSet[];
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const { data, error } = await this.supabase
      .from('workoutLogSets')
      .insert(set)
      .select()
      .single();

    if (error) throw error;
    return data as WorkoutLogSet;
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const { data, error } = await this.supabase
      .from('workoutLogSets')
      .update(set)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data as WorkoutLogSet;
  }

  async deleteWorkoutLogSet(id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('workoutLogSets')
      .delete()
      .eq('id', id);

    return !error;
  }

  // User Achievements methods (conquistas isoladas por usuário)
  async getUserAchievements(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  }

  async createUserAchievement(achievement: any): Promise<any> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .insert(achievement)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateUserAchievement(id: string, updates: any): Promise<any | undefined> {
    const { data, error } = await this.supabase
      .from('user_achievements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return undefined;
    return data;
  }

  async deleteUserAchievement(id: string): Promise<boolean> {
    const { error } = await this.supabase
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
      const { data: workoutLogs } = await this.supabase
        .from('workoutLogs')
        .select('id')
        .eq('user_id', userId);
      
      const workoutLogIds = workoutLogs?.map((log: any) => log.id) || [];

      // 2. Get workout log exercises
      const { data: workoutLogExercises } = await this.supabase
        .from('workoutLogExercises')
        .select('id')
        .in('log_id', workoutLogIds);
      
      const workoutLogExerciseIds = workoutLogExercises?.map((ex: any) => ex.id) || [];

      // 3. Delete workout log sets first
      if (workoutLogExerciseIds.length > 0) {
        await this.supabase
          .from('workoutLogSets')
          .delete()
          .in('log_exercise_id', workoutLogExerciseIds);
      }

      // 4. Delete workout log exercises
      if (workoutLogIds.length > 0) {
        await this.supabase
          .from('workoutLogExercises')
          .delete()
          .in('log_id', workoutLogIds);
      }

      // 5. Delete workout logs
      await this.supabase
        .from('workoutLogs')
        .delete()
        .eq('user_id', userId);

      // 6. Get user's workout templates
      const { data: workoutTemplates } = await this.supabase
        .from('workoutTemplates')
        .select('id')
        .eq('user_id', userId);
      
      const templateIds = workoutTemplates?.map((template: any) => template.id) || [];

      // 7. Delete workout template exercises
      if (templateIds.length > 0) {
        await this.supabase
          .from('workoutTemplateExercises')
          .delete()
          .in('templateId', templateIds);
      }

      // 8. Delete workout templates
      await this.supabase
        .from('workoutTemplates')
        .delete()
        .eq('user_id', userId);

      // 9. Delete user exercises
      await this.supabase
        .from('exercises')
        .delete()
        .eq('user_id', userId);

      // 10. Delete user achievements
      await this.supabase
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