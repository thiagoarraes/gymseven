import { 
  type User, type InsertUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogExercise, type InsertWorkoutLogExercise,
  type WorkoutLogSet, type InsertWorkoutLogSet,
  type WeightHistory, type InsertWeightHistory,
  type UserGoal, type InsertUserGoal,
  type UserPreferences, type InsertUserPreferences, type UpdateUserPreferences,
  type UserAchievement, type InsertUserAchievement, type UpdateUserAchievement,
  usuarios, exercicios, modelosTreino, exerciciosModeloTreino,
  registrosTreino, exerciciosRegistroTreino, seriesRegistroTreino,
  historicoPeso, objetivosUsuario, preferenciasUsuario, conquistasUsuario
} from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, desc, and, max, countDistinct, isNotNull } from "drizzle-orm";
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
    const result = await this.db.select().from(usuarios).where(eq(usuarios.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(usuarios).where(eq(usuarios.username, username));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(usuarios).where(eq(usuarios.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    // Convert dateOfBirth string to Date if needed
    const processedUser = {
      ...user,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined
    };
    const result = await this.db.insert(usuarios).values([processedUser]).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    // Convert dateOfBirth string to Date if needed
    const processedUpdates = {
      ...updates,
      dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : undefined
    };
    const result = await this.db.update(usuarios).set(processedUpdates).where(eq(usuarios.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(usuarios).where(eq(usuarios.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.db.update(usuarios).set({ lastLoginAt: new Date() }).where(eq(usuarios.id, id));
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    let query = this.db.select().from(historicoPeso).where(eq(historicoPeso.usuarioId, userId)).orderBy(desc(historicoPeso.date));
    if (limit) {
      query = query.limit(limit) as any;
    }
    return await query;
  }

  async addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory> {
    const result = await this.db.insert(historicoPeso).values(entry).returning();
    return result[0];
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const result = await this.db.update(historicoPeso).set(updates).where(eq(historicoPeso.id, id)).returning();
    return result[0];
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    const result = await this.db.delete(historicoPeso).where(eq(historicoPeso.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return await this.db.select().from(objetivosUsuario).where(eq(objetivosUsuario.usuarioId, userId));
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const result = await this.db.insert(objetivosUsuario).values(goal).returning();
    return result[0];
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const result = await this.db.update(objetivosUsuario).set(updates).where(eq(objetivosUsuario.id, id)).returning();
    return result[0];
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    const result = await this.db.delete(objetivosUsuario).where(eq(objetivosUsuario.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const result = await this.db.select().from(preferenciasUsuario).where(eq(preferenciasUsuario.usuarioId, userId));
    return result[0];
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const result = await this.db.insert(preferenciasUsuario).values(prefs).returning();
    return result[0];
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const result = await this.db.update(preferenciasUsuario).set(updates).where(eq(preferenciasUsuario.usuarioId, userId)).returning();
    return result[0];
  }

  // User Achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await this.db.select().from(conquistasUsuario).where(eq(conquistasUsuario.usuarioId, userId));
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const result = await this.db.insert(conquistasUsuario).values(achievement).returning();
    return result[0];
  }

  async updateUserAchievement(id: string, updates: UpdateUserAchievement): Promise<UserAchievement | undefined> {
    const result = await this.db.update(conquistasUsuario).set(updates).where(eq(conquistasUsuario.id, id)).returning();
    return result[0];
  }

  async deleteUserAchievement(id: string): Promise<boolean> {
    const result = await this.db.delete(conquistasUsuario).where(eq(conquistasUsuario.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Exercises
  async getAllExercises(): Promise<Exercise[]> {
    return await this.db.select().from(exercicios);
  }

  async getExercises(userId?: string): Promise<Exercise[]> {
    if (userId) {
      return await this.db.select().from(exercicios).where(eq(exercicios.usuarioId, userId));
    }
    return await this.db.select().from(exercicios);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const result = await this.db.select().from(exercicios).where(eq(exercicios.id, id));
    return result[0];
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    const result = await this.db.insert(exercicios).values({
      ...exercise,
      usuarioId: userId
    }).returning();
    return result[0];
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    let whereCondition = eq(exercicios.id, id);
    if (userId) {
      whereCondition = and(whereCondition, eq(exercicios.usuarioId, userId)) as any;
    }
    const result = await this.db.update(exercicios).set(exercise).where(whereCondition).returning();
    return result[0];
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await this.db.delete(exercicios).where(eq(exercicios.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    let whereCondition = eq(exercicios.grupoMuscular, muscleGroup);
    if (userId) {
      whereCondition = and(whereCondition, eq(exercicios.usuarioId, userId)) as any;
    }
    return await this.db.select().from(exercicios).where(whereCondition);
  }

  async getExerciseStats(exerciseId: string, userId: string): Promise<{
    lastWeight: number | null;
    maxWeight: number | null;
    lastUsed: string | null;
    totalSessions: number;
  }> {
    try {
      // Get exercise statistics from workout logs where the user completed sets
      const statsQuery = await this.db
        .select({
          maxWeight: max(seriesRegistroTreino.weight),
          lastUsed: max(registrosTreino.startTime),
          totalSessions: countDistinct(registrosTreino.id),
        })
        .from(seriesRegistroTreino)
        .innerJoin(exerciciosRegistroTreino, eq(seriesRegistroTreino.exercicioRegistroId, exerciciosRegistroTreino.id))
        .innerJoin(registrosTreino, eq(exerciciosRegistroTreino.registroId, registrosTreino.id))
        .where(and(
          eq(exerciciosRegistroTreino.exercicioId, exerciseId),
          eq(registrosTreino.usuarioId, userId),
          eq(seriesRegistroTreino.completed, true)
        ));

      // Get last weight from most recent completed set
      const lastWeightQuery = await this.db
        .select({
          weight: seriesRegistroTreino.weight
        })
        .from(seriesRegistroTreino)
        .innerJoin(exerciciosRegistroTreino, eq(seriesRegistroTreino.exercicioRegistroId, exerciciosRegistroTreino.id))
        .innerJoin(registrosTreino, eq(exerciciosRegistroTreino.registroId, registrosTreino.id))
        .where(and(
          eq(exerciciosRegistroTreino.exercicioId, exerciseId),
          eq(registrosTreino.usuarioId, userId),
          eq(seriesRegistroTreino.completed, true),
          isNotNull(seriesRegistroTreino.weight)
        ))
        .orderBy(desc(registrosTreino.startTime), desc(seriesRegistroTreino.setNumber))
        .limit(1);

      const stats = statsQuery[0];
      const lastWeight = lastWeightQuery[0]?.weight || null;

      return {
        lastWeight: lastWeight,
        maxWeight: stats?.maxWeight || null,
        lastUsed: stats?.lastUsed?.toISOString() || null,
        totalSessions: stats?.totalSessions || 0,
      };
    } catch (error) {
      console.error('Error getting exercise stats:', error);
      return {
        lastWeight: null,
        maxWeight: null,
        lastUsed: null,
        totalSessions: 0,
      };
    }
  }

  async getExerciseWeightHistory(exerciseId: string, userId: string, limit = 10): Promise<{
    date: string;
    weight: number;
  }[]> {
    try {
      const weightHistory = await this.db
        .select({
          date: registrosTreino.startTime,
          weight: max(seriesRegistroTreino.weight),
        })
        .from(seriesRegistroTreino)
        .innerJoin(exerciciosRegistroTreino, eq(seriesRegistroTreino.exercicioRegistroId, exerciciosRegistroTreino.id))
        .innerJoin(registrosTreino, eq(exerciciosRegistroTreino.registroId, registrosTreino.id))
        .where(and(
          eq(exerciciosRegistroTreino.exercicioId, exerciseId),
          eq(registrosTreino.usuarioId, userId),
          eq(seriesRegistroTreino.completed, true),
          isNotNull(seriesRegistroTreino.weight)
        ))
        .groupBy(registrosTreino.startTime)
        .orderBy(desc(registrosTreino.startTime))
        .limit(limit);

      return weightHistory.map(entry => ({
        date: entry.date!.toISOString(),
        weight: entry.weight || 0,
      }));
    } catch (error) {
      console.error('Error getting exercise weight history:', error);
      return [];
    }
  }

  // Workout Templates
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return await this.db.select().from(modelosTreino);
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    if (userId) {
      return await this.db.select().from(modelosTreino).where(eq(modelosTreino.usuarioId, userId));
    }
    return await this.db.select().from(modelosTreino);
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    const result = await this.db.select().from(modelosTreino).where(eq(modelosTreino.id, id));
    return result[0];
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const result = await this.db.insert(modelosTreino).values(template).returning();
    return result[0];
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const result = await this.db.update(modelosTreino).set(template).where(eq(modelosTreino.id, id)).returning();
    return result[0];
  }

  async deleteWorkoutTemplate(id: string, userId?: string): Promise<boolean> {
    let whereCondition = eq(modelosTreino.id, id);
    if (userId) {
      whereCondition = and(whereCondition, eq(modelosTreino.usuarioId, userId)) as any;
    }
    const result = await this.db.delete(modelosTreino).where(whereCondition);
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Workout Template Exercises
  async getWorkoutTemplateExercises(modeloId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const rawResults = await this.db
      .select()
      .from(exerciciosModeloTreino)
      .leftJoin(exercicios, eq(exerciciosModeloTreino.exercicioId, exercicios.id))
      .where(eq(exerciciosModeloTreino.modeloId, modeloId));

    // Map the nested join results to the expected flat structure
    return rawResults.map((row: any) => ({
      // Template exercise data
      id: row.exerciciosModeloTreino.id,
      modeloId: row.exerciciosModeloTreino.modeloId,
      exercicioId: row.exerciciosModeloTreino.exercicioId,
      series: row.exerciciosModeloTreino.series,
      repeticoes: row.exerciciosModeloTreino.repeticoes,
      weight: row.exerciciosModeloTreino.weight,
      restDurationSeconds: row.exerciciosModeloTreino.restDurationSeconds,
      order: row.exerciciosModeloTreino.order,
      // Nested exercise data
      exercise: {
        id: row.exercicios.id,
        usuarioId: row.exercicios.usuarioId,
        nome: row.exercicios.nome,
        grupoMuscular: row.exercicios.grupoMuscular,
        descricao: row.exercicios.descricao,
        createdAt: row.exercicios.createdAt,
      }
    }));
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const result = await this.db.insert(exerciciosModeloTreino).values(exercise).returning();
    return result[0];
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>, userId?: string): Promise<WorkoutTemplateExercise | undefined> {
    const result = await this.db.update(exerciciosModeloTreino).set(updates).where(eq(exerciciosModeloTreino.id, id)).returning();
    return result[0];
  }

  async deleteWorkoutTemplateExercise(id: string, userId?: string): Promise<boolean> {
    const result = await this.db.delete(exerciciosModeloTreino).where(eq(exerciciosModeloTreino.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async removeExerciseFromTemplate(modeloId: string, exercicioId: string): Promise<boolean> {
    const result = await this.db.delete(exerciciosModeloTreino)
      .where(and(eq(exerciciosModeloTreino.modeloId, modeloId), eq(exerciciosModeloTreino.exercicioId, exercicioId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Workout Logs
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return await this.db.select().from(registrosTreino);
  }

  async getWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    if (userId) {
      return await this.db.select().from(registrosTreino).where(eq(registrosTreino.usuarioId, userId));
    }
    return await this.db.select().from(registrosTreino);
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    const result = await this.db.select().from(registrosTreino).where(eq(registrosTreino.id, id));
    return result[0];
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const result = await this.db.insert(registrosTreino).values(log).returning();
    return result[0];
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const result = await this.db.update(registrosTreino).set(log).where(eq(registrosTreino.id, id)).returning();
    return result[0];
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    const result = await this.db.delete(registrosTreino).where(eq(registrosTreino.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getRecentWorkoutLogs(limit?: number): Promise<WorkoutLog[]> {
    let query = this.db.select().from(registrosTreino).orderBy(desc(registrosTreino.startTime));
    if (limit) {
      query = query.limit(limit) as any;
    }
    return await query;
  }

  // Workout Log Exercises
  async getWorkoutLogExercises(registroId: string): Promise<WorkoutLogExercise[]> {
    return await this.db.select().from(exerciciosRegistroTreino).where(eq(exerciciosRegistroTreino.registroId, registroId));
  }

  async createWorkoutLogExercise(exercise: InsertWorkoutLogExercise): Promise<WorkoutLogExercise> {
    const result = await this.db.insert(exerciciosRegistroTreino).values(exercise).returning();
    return result[0];
  }

  // Workout Log Sets
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    return await this.db.select().from(seriesRegistroTreino).where(eq(seriesRegistroTreino.exercicioRegistroId, logId));
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const result = await this.db.insert(seriesRegistroTreino).values(set).returning();
    return result[0];
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const result = await this.db.update(seriesRegistroTreino).set(set).where(eq(seriesRegistroTreino.id, id)).returning();
    return result[0];
  }
}