import { 
  type User, type InsertUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogSet, type InsertWorkoutLogSet,
  type WeightHistory, type InsertWeightHistory,
  type UserGoal, type InsertUserGoal,
  type UserPreferences, type InsertUserPreferences, type UpdateUserPreferences,
  type UserAchievement, type InsertUserAchievement, type UpdateUserAchievement,
  users, exercises, workoutTemplates, workoutTemplateExercises,
  workoutLogs, workoutLogExercises, workoutLogSets,
  weightHistory, userGoals, userPreferences, userAchievements
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and } from "drizzle-orm";
import type { IStorage } from './storage';

export class PostgreSQLStorage implements IStorage {
  private db: ReturnType<typeof drizzle>;
  private pool: Pool;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('🚀 Initializing PostgreSQL storage...');
    
    // Create PostgreSQL pool
    this.pool = new Pool({ connectionString: process.env.DATABASE_URL });
    
    // Create drizzle instance
    this.db = drizzle({ client: this.pool });
    
    console.log('✅ PostgreSQL storage initialized');
  }

  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(user).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const result = await this.db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, id));
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    let query = this.db.select().from(weightHistory).where(eq(weightHistory.userId, userId)).orderBy(desc(weightHistory.date));
    if (limit) {
      query = query.limit(limit) as any;
    }
    return await query;
  }

  async addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory> {
    const result = await this.db.insert(weightHistory).values(entry).returning();
    return result[0];
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const result = await this.db.update(weightHistory).set(updates).where(eq(weightHistory.id, id)).returning();
    return result[0];
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(weightHistory).where(eq(weightHistory.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return await this.db.select().from(userGoals).where(eq(userGoals.userId, userId));
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const result = await this.db.insert(userGoals).values(goal).returning();
    return result[0];
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const result = await this.db.update(userGoals).set(updates).where(eq(userGoals.id, id)).returning();
    return result[0];
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    const result = await this.db.delete(userGoals).where(eq(userGoals.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const result = await this.db.select().from(userPreferences).where(eq(userPreferences.userId, userId));
    return result[0];
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const result = await this.db.insert(userPreferences).values(prefs).returning();
    return result[0];
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const result = await this.db.update(userPreferences).set(updates).where(eq(userPreferences.userId, userId)).returning();
    return result[0];
  }

  // User Achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await this.db.select().from(userAchievements).where(eq(userAchievements.user_id, userId));
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await this.db.insert(userAchievements).values(achievement).returning();
    return result[0];
  }

  async updateUserAchievement(id: string, updates: UpdateUserAchievement): Promise<UserAchievement | undefined> {
    const result = await this.db.update(userAchievements).set(updates).where(eq(userAchievements.id, id)).returning();
    return result[0];
  }

  async deleteUserAchievement(id: string): Promise<boolean> {
    const result = await this.db.delete(userAchievements).where(eq(userAchievements.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Exercises
  async getAllExercises(): Promise<Exercise[]> {
    return await this.db.select().from(exercises);
  }

  async getExercises(userId?: string): Promise<Exercise[]> {
    if (userId) {
      return await this.db.select().from(exercises).where(eq(exercises.user_id, userId));
    }
    return await this.db.select().from(exercises);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const result = await this.db.select().from(exercises).where(eq(exercises.id, id));
    return result[0];
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    const result = await this.db.insert(exercises).values({
      ...exercise,
      user_id: userId
    }).returning();
    return result[0];
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    let whereCondition = eq(exercises.id, id);
    if (userId) {
      whereCondition = and(whereCondition, eq(exercises.user_id, userId)) as any;
    }
    const result = await this.db.update(exercises).set(exercise).where(whereCondition).returning();
    return result[0];
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await this.db.delete(exercises).where(eq(exercises.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    let whereCondition = eq(exercises.muscleGroup, muscleGroup);
    if (userId) {
      whereCondition = and(whereCondition, eq(exercises.user_id, userId)) as any;
    }
    return await this.db.select().from(exercises).where(whereCondition);
  }

  // Workout Templates
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return await this.db.select().from(workoutTemplates);
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    if (userId) {
      return await this.db.select().from(workoutTemplates).where(eq(workoutTemplates.user_id, userId));
    }
    return await this.db.select().from(workoutTemplates);
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    const result = await this.db.select().from(workoutTemplates).where(eq(workoutTemplates.id, id));
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

  async deleteWorkoutTemplate(id: string, userId?: string): Promise<boolean> {
    let whereCondition = eq(workoutTemplates.id, id);
    if (userId) {
      whereCondition = and(whereCondition, eq(workoutTemplates.user_id, userId)) as any;
    }
    const result = await this.db.delete(workoutTemplates).where(whereCondition);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Workout Template Exercises
  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    return await this.db
      .select()
      .from(workoutTemplateExercises)
      .leftJoin(exercises, eq(workoutTemplateExercises.exerciseId, exercises.id))
      .where(eq(workoutTemplateExercises.templateId, templateId)) as any;
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
    return result.rowCount !== null && result.rowCount > 0;
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    const result = await this.db.delete(workoutTemplateExercises)
      .where(and(eq(workoutTemplateExercises.templateId, templateId), eq(workoutTemplateExercises.exerciseId, exerciseId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Workout Logs
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return await this.db.select().from(workoutLogs);
  }

  async getWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    if (userId) {
      return await this.db.select().from(workoutLogs).where(eq(workoutLogs.user_id, userId));
    }
    return await this.db.select().from(workoutLogs);
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    const result = await this.db.select().from(workoutLogs).where(eq(workoutLogs.id, id));
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
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRecentWorkoutLogs(limit?: number): Promise<WorkoutLog[]> {
    let query = this.db.select().from(workoutLogs).orderBy(desc(workoutLogs.startTime));
    if (limit) {
      query = query.limit(limit) as any;
    }
    return await query;
  }

  // Workout Log Sets
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    return await this.db.select().from(workoutLogSets).where(eq(workoutLogSets.logExerciseId, logId));
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