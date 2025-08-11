import { 
  type User, type InsertUser, type RegisterUser, type LoginUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogSet, type InsertWorkoutLogSet,
  type WeightHistory, type InsertWeightHistory,
  type UserGoal, type InsertUserGoal,
  type UserPreferences, type InsertUserPreferences, type UpdateUserPreferences
} from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { eq, desc, and } from 'drizzle-orm';
import { 
  users, exercises, workoutTemplates, workoutTemplateExercises, 
  workoutLogs, workoutLogExercises, workoutLogSets,
  weightHistory, userGoals, userPreferences
} from '@shared/schema';
import { logDatabaseInfo } from './supabase-check';

export interface IStorage {
  // Auth & Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  updateLastLogin(id: string): Promise<void>;
  
  // Weight History
  getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]>;
  addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory>;
  updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined>;
  deleteWeightEntry(id: string): Promise<boolean>;
  
  // User Goals
  getUserGoals(userId: string): Promise<UserGoal[]>;
  createUserGoal(goal: InsertUserGoal): Promise<UserGoal>;
  updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined>;
  deleteUserGoal(id: string): Promise<boolean>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined>;
  
  // Exercises
  getAllExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;
  getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]>;
  
  // Workout Templates
  getAllWorkoutTemplates(): Promise<WorkoutTemplate[]>;
  getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined>;
  deleteWorkoutTemplate(id: string): Promise<boolean>;
  
  // Workout Template Exercises
  getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]>;
  addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise>;
  updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>): Promise<WorkoutTemplateExercise | undefined>;
  deleteWorkoutTemplateExercise(id: string): Promise<boolean>;
  removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean>;
  
  // Workout Logs
  getAllWorkoutLogs(): Promise<WorkoutLog[]>;
  getWorkoutLog(id: string): Promise<WorkoutLog | undefined>;
  createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog>;
  updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined>;
  deleteWorkoutLog(id: string): Promise<boolean>;
  getRecentWorkoutLogs(limit?: number): Promise<WorkoutLog[]>;
  
  // Workout Log Sets
  getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]>;
  createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet>;
  updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private exercises: Map<string, Exercise>;
  private workoutTemplates: Map<string, WorkoutTemplate>;
  private workoutTemplateExercises: Map<string, WorkoutTemplateExercise>;
  private workoutLogs: Map<string, WorkoutLog>;
  private workoutLogExercises: Map<string, any>;
  private workoutLogSets: Map<string, WorkoutLogSet>;

  constructor() {
    this.users = new Map();
    this.exercises = new Map();
    this.workoutTemplates = new Map();
    this.workoutTemplateExercises = new Map();
    this.workoutLogs = new Map();
    this.workoutLogExercises = new Map();
    this.workoutLogSets = new Map();
    
    // Initialize with sample data
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample exercises
    const exercises = [
      {
        id: randomUUID(),
        name: "Supino Reto",
        muscleGroup: "Peito",
        description: "Exercício fundamental para o desenvolvimento do peitoral",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        videoUrl: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Agachamento Livre",
        muscleGroup: "Pernas",
        description: "Exercício composto para pernas e glúteos",
        imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        videoUrl: null,
        createdAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Puxada Frontal",
        muscleGroup: "Costas",
        description: "Desenvolvimento do latíssimo do dorso",
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        videoUrl: null,
        createdAt: new Date(),
      },
    ];

    exercises.forEach(ex => this.exercises.set(ex.id, ex));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Exercise methods
  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(insertExercise: InsertExercise): Promise<Exercise> {
    const id = randomUUID();
    const exercise: Exercise = { 
      ...insertExercise, 
      id, 
      createdAt: new Date(),
      description: insertExercise.description || null,
      imageUrl: insertExercise.imageUrl || null,
      videoUrl: insertExercise.videoUrl || null
    };
    this.exercises.set(id, exercise);
    return exercise;
  }

  async updateExercise(id: string, updates: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const exercise = this.exercises.get(id);
    if (!exercise) return undefined;
    
    const updated = { ...exercise, ...updates };
    this.exercises.set(id, updated);
    return updated;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values()).filter(ex => ex.muscleGroup === muscleGroup);
  }

  // Workout Template methods
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return Array.from(this.workoutTemplates.values());
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    return this.workoutTemplates.get(id);
  }

  async createWorkoutTemplate(insertTemplate: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const id = randomUUID();
    const template: WorkoutTemplate = { 
      ...insertTemplate, 
      id, 
      createdAt: new Date(),
      description: insertTemplate.description || null
    };
    this.workoutTemplates.set(id, template);
    return template;
  }

  async updateWorkoutTemplate(id: string, updates: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const template = this.workoutTemplates.get(id);
    if (!template) return undefined;
    
    const updated = { ...template, ...updates };
    this.workoutTemplates.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplate(id: string): Promise<boolean> {
    return this.workoutTemplates.delete(id);
  }

  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const templateExercises = Array.from(this.workoutTemplateExercises.values())
      .filter(te => te.templateId === templateId)
      .sort((a, b) => a.order - b.order);

    return templateExercises.map(te => {
      const exercise = this.exercises.get(te.exerciseId);
      return { 
        ...te, 
        exercise: exercise!,
        name: exercise!.name,
        muscleGroup: exercise!.muscleGroup
      };
    });
  }

  async addExerciseToTemplate(insertExercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const id = randomUUID();
    const templateExercise: WorkoutTemplateExercise = { 
      ...insertExercise, 
      id,
      weight: insertExercise.weight || null,
      restDurationSeconds: insertExercise.restDurationSeconds ?? 90
    };
    this.workoutTemplateExercises.set(id, templateExercise);
    return templateExercise;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>): Promise<WorkoutTemplateExercise | undefined> {
    const templateExercise = this.workoutTemplateExercises.get(id);
    if (!templateExercise) return undefined;
    
    const updated = { ...templateExercise, ...updates };
    this.workoutTemplateExercises.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplateExercise(id: string): Promise<boolean> {
    return this.workoutTemplateExercises.delete(id);
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    const entry = Array.from(this.workoutTemplateExercises.entries())
      .find(([, te]) => te.templateId === templateId && te.exerciseId === exerciseId);
    
    if (entry) {
      return this.workoutTemplateExercises.delete(entry[0]);
    }
    return false;
  }

  // Workout Log methods
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values()).sort((a, b) => 
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    return this.workoutLogs.get(id);
  }

  async createWorkoutLog(insertLog: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = randomUUID();
    const log: WorkoutLog = { 
      ...insertLog, 
      id,
      templateId: insertLog.templateId || null,
      startTime: new Date(insertLog.startTime),
      endTime: insertLog.endTime ? new Date(insertLog.endTime) : null
    };
    this.workoutLogs.set(id, log);
    return log;
  }

  async updateWorkoutLog(id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const log = this.workoutLogs.get(id);
    if (!log) return undefined;
    
    const updated = { ...log, ...updates };
    this.workoutLogs.set(id, updated);
    return updated;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    return this.workoutLogs.delete(id);
  }

  async getRecentWorkoutLogs(limit = 10): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  // Workout Log Set methods
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    const logExercises = Array.from(this.workoutLogExercises.values())
      .filter(le => le.logId === logId);
    
    const sets: WorkoutLogSet[] = [];
    for (const logExercise of logExercises) {
      const exerciseSets = Array.from(this.workoutLogSets.values())
        .filter(s => s.logExerciseId === logExercise.id);
      sets.push(...exerciseSets);
    }
    
    return sets.sort((a, b) => a.setNumber - b.setNumber);
  }

  async createWorkoutLogSet(insertSet: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const id = randomUUID();
    const set: WorkoutLogSet = { 
      ...insertSet, 
      id,
      reps: insertSet.reps || null,
      weight: insertSet.weight || null,
      completed: insertSet.completed !== undefined ? insertSet.completed : false
    };
    this.workoutLogSets.set(id, set);
    return set;
  }

  async updateWorkoutLogSet(id: string, updates: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const set = this.workoutLogSets.get(id);
    if (!set) return undefined;
    
    const updated = { ...set, ...updates };
    this.workoutLogSets.set(id, updated);
    return updated;
  }
}



class DatabaseStorage implements IStorage {
  private db;

  constructor() {
    // Build DATABASE_URL from Neon variables if DATABASE_URL is broken or missing
    let connectionString = process.env.DATABASE_URL;
    
    // If DATABASE_URL contains the problematic Supabase URL or is missing, use Neon fallback
    if (!connectionString || connectionString.includes('vlqzjrwxqeyroqsglqwr.supabase.co')) {
      if (process.env.PGHOST && process.env.PGUSER && process.env.PGPASSWORD && process.env.PGDATABASE && process.env.PGPORT) {
        connectionString = `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}`;
        console.log('🔄 Using Neon database instead of broken Supabase connection');
      }
    }
    
    if (!connectionString) {
      throw new Error('DATABASE_URL or Neon environment variables required. Please provide your Supabase connection string.');
    }

    // Enhanced configuration for Supabase and other PostgreSQL providers
    const isSupabase = connectionString.includes('supabase.com');
    const isNeon = connectionString.includes('neon.tech');
    
    const poolConfig = {
      connectionString,
      ssl: (isSupabase || isNeon) ? { rejectUnauthorized: false } : false,
      max: isSupabase ? 15 : 10, // Supabase handles more concurrent connections better
      min: 2,
      idleTimeoutMillis: isSupabase ? 60000 : 30000, // Supabase can handle longer idle times
      connectionTimeoutMillis: isSupabase ? 10000 : 5000, // More time for Supabase connections
      acquireTimeoutMillis: 30000,
      statement_timeout: 30000,
      query_timeout: 30000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000,
    };

    const pool = new Pool(poolConfig);
    
    // Enhanced error handling for pool
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
    });
    
    pool.on('connect', () => {
      console.log('📡 Database connection established');
    });
    
    this.db = drizzle(pool);
    
    // Log database provider info
    logDatabaseInfo();
    
    // Test connection and initialize with retry
    this.initializeWithRetry();
  }

  private async initializeWithRetry(maxRetries = 3) {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        // Test basic connection
        await this.testConnection();
        console.log('✅ Database connection verified');
        
        // Initialize sample data
        await this.initializeSampleData();
        console.log('✅ Database initialization complete');
        break;
        
      } catch (error: any) {
        retries++;
        console.error(`❌ Database initialization attempt ${retries}/${maxRetries} failed:`, error.message || error);
        
        if (retries >= maxRetries) {
          console.error('🔥 All database connection attempts failed. Please check your DATABASE_URL.');
          console.error('🔧 For Supabase: Make sure you are using the "Transaction pooler" connection string');
          console.error('🔧 Ensure your password is correctly replaced in the connection string');
        } else {
          console.log(`⏳ Retrying in ${retries * 2} seconds...`);
          await new Promise(resolve => setTimeout(resolve, retries * 2000));
        }
      }
    }
  }

  private async testConnection() {
    await this.db.execute('SELECT 1 as test');
  }

  private async initializeSampleData() {
    try {
      // Check if we already have exercises
      const existingExercises = await this.db.select().from(exercises).limit(1);
      if (existingExercises.length > 0) {
        console.log('📚 Sample data already exists');
        return;
      }

      console.log('🏗️ Creating sample data...');
      
      // Sample exercises
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
        },
        {
          name: "Leg Press",
          muscleGroup: "Pernas",
          description: "Exercício para quadríceps e glúteos",
          imageUrl: null,
          videoUrl: null,
        },
        {
          name: "Prancha",
          muscleGroup: "Core",
          description: "Fortalecimento do core",
          imageUrl: null,
          videoUrl: null,
        },
        {
          name: "Remada Curvada",
          muscleGroup: "Costas",
          description: "Desenvolvimento das costas",
          imageUrl: null,
          videoUrl: null,
        }
      ];

      await this.db.insert(exercises).values(sampleExercises);
      console.log('✅ Sample exercises created successfully');
      
    } catch (error) {
      console.error('❌ Error creating sample data:', error);
      throw error;
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Exercise methods
  async getAllExercises(): Promise<Exercise[]> {
    return await this.db.select().from(exercises);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const result = await this.db.select().from(exercises).where(eq(exercises.id, id)).limit(1);
    return result[0];
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const result = await this.db.insert(exercises).values(exercise).returning();
    return result[0];
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>): Promise<Exercise | undefined> {
    const result = await this.db.update(exercises).set(exercise).where(eq(exercises.id, id)).returning();
    return result[0];
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await this.db.delete(exercises).where(eq(exercises.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getExercisesByMuscleGroup(muscleGroup: string): Promise<Exercise[]> {
    return await this.db.select().from(exercises).where(eq(exercises.muscleGroup, muscleGroup));
  }

  // Workout Template methods
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return await this.db.select().from(workoutTemplates);
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    const result = await this.db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id)).limit(1);
    return result[0];
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const result = await this.db.insert(workoutTemplates).values(template).returning();
    return result[0];
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const result = await this.db.update(workoutTemplates).set(template).where(eq(workoutTemplates.id, id)).returning();
    return result[0];
  }

  async deleteWorkoutTemplate(id: string): Promise<boolean> {
    const result = await this.db.delete(workoutTemplates).where(eq(workoutTemplates.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Workout Template Exercise methods
  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const result = await this.db.select({
      id: workoutTemplateExercises.id,
      templateId: workoutTemplateExercises.templateId,
      exerciseId: workoutTemplateExercises.exerciseId,
      sets: workoutTemplateExercises.sets,
      reps: workoutTemplateExercises.reps,
      weight: workoutTemplateExercises.weight,
      restDurationSeconds: workoutTemplateExercises.restDurationSeconds,
      order: workoutTemplateExercises.order,
      exercise: exercises
    })
    .from(workoutTemplateExercises)
    .innerJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
    .where(eq(workoutTemplateExercises.templateId, templateId));
    
    return result;
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const result = await this.db.insert(workoutTemplateExercises).values(exercise).returning();
    return result[0];
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>): Promise<WorkoutTemplateExercise | undefined> {
    const result = await this.db.update(workoutTemplateExercises).set(updates).where(eq(workoutTemplateExercises.id, id)).returning();
    return result[0];
  }

  async deleteWorkoutTemplateExercise(id: string): Promise<boolean> {
    const result = await this.db.delete(workoutTemplateExercises).where(eq(workoutTemplateExercises.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    const result = await this.db.delete(workoutTemplateExercises)
      .where(and(eq(workoutTemplateExercises.templateId, templateId), eq(workoutTemplateExercises.exerciseId, exerciseId)));
    return (result.rowCount ?? 0) > 0;
  }

  // Workout Log methods  
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return await this.db.select().from(workoutLogs).orderBy(desc(workoutLogs.startTime));
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    const result = await this.db.select().from(workoutLogs).where(eq(workoutLogs.id, id)).limit(1);
    return result[0];
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const result = await this.db.insert(workoutLogs).values(log).returning();
    return result[0];
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const result = await this.db.update(workoutLogs).set(log).where(eq(workoutLogs.id, id)).returning();
    return result[0];
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    const result = await this.db.delete(workoutLogs).where(eq(workoutLogs.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getRecentWorkoutLogs(limit: number = 5): Promise<WorkoutLog[]> {
    return await this.db.select().from(workoutLogs)
      .orderBy(desc(workoutLogs.startTime))
      .limit(limit);
  }

  // Workout Log Set methods
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    const result = await this.db.select({
      id: workoutLogSets.id,
      logExerciseId: workoutLogSets.logExerciseId,
      setNumber: workoutLogSets.setNumber,
      reps: workoutLogSets.reps,
      weight: workoutLogSets.weight,
      completed: workoutLogSets.completed,
    })
    .from(workoutLogSets)
    .leftJoin(workoutLogExercises, eq(workoutLogSets.logExerciseId, workoutLogExercises.id))
    .where(eq(workoutLogExercises.logId, logId));
    
    return result;
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const result = await this.db.insert(workoutLogSets).values(set).returning();
    return result[0];
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const result = await this.db.update(workoutLogSets).set(set).where(eq(workoutLogSets.id, id)).returning();
    return result[0];
  }
}

// **SUPABASE PRIORITY CONFIGURATION** - Supabase é obrigatório
async function initializeStorage(): Promise<IStorage> {
  console.log('🎯 PROJETO CONFIGURADO PARA SUPABASE PRIORITÁRIO');
  
  try {
    // TENTATIVA 1: Supabase SDK com credenciais específicas (IDEAL)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('🚀 Inicializando Supabase SDK (CONFIGURAÇÃO IDEAL)');
      const { SupabaseStorage } = await import('./supabase-storage');
      return new SupabaseStorage();
    }
    
    // TENTATIVA 2: Tentar extrair Supabase do DATABASE_URL
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase.co')) {
      console.log('🔄 Detectado Supabase via DATABASE_URL, tentando SDK...');
      try {
        const { SupabaseStorage } = await import('./supabase-storage');
        return new SupabaseStorage();
      } catch (supabaseError) {
        console.log('⚠️ Supabase SDK falhou, usando conexão direta PostgreSQL');
        return new DatabaseStorage();
      }
    }
    
    // TENTATIVA 3: PostgreSQL direto (se for Supabase)
    if (process.env.DATABASE_URL) {
      console.log('📊 Usando conexão direta PostgreSQL');
      console.log('💡 Para funcionalidades completas, configure credenciais Supabase SDK');
      return new DatabaseStorage();
    }
    
    // AVISO: Sem banco configurado
    console.log('🔴 ATENÇÃO: SUPABASE NÃO CONFIGURADO!');
    console.log('📝 Este projeto requer Supabase como banco principal');
    console.log('🔧 Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
    console.log('⚠️ Usando storage temporário - dados serão perdidos!');
    return new MemStorage();
    
  } catch (error) {
    console.error('❌ Falha na inicialização do storage:', error);
    console.log('🆘 Usando storage de emergência (dados temporários)');
    return new MemStorage();
  }
}

// Initialize storage asynchronously and export a promise
export const storage = await initializeStorage();


