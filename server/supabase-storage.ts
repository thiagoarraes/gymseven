import { 
  type User, type InsertUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogSet, type InsertWorkoutLogSet
} from "@shared/schema";
import { supabase } from './supabase-client';
import type { IStorage } from './storage';

export class SupabaseStorage implements IStorage {
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert(insertUser)
      .select()
      .single();
    
    if (error) throw error;
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
    const { error } = await supabase
      .from('workoutTemplates')
      .delete()
      .eq('id', id);
    
    return !error;
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
    return data || [];
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
    const { data, error } = await supabase
      .from('workoutTemplateExercises')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return undefined;
    return data;
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
      .order('createdAt', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    const { data, error } = await supabase
      .from('workoutLogs')
      .select('*')
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
      .order('createdAt', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data || [];
  }

  // Workout Log Set methods
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    const { data, error } = await supabase
      .from('workoutLogSets')
      .select('*')
      .eq('logId', logId)
      .order('setNumber');
    
    if (error) throw error;
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