import { Pool } from 'pg';
import type { IStorage } from './storage';
import type { 
  User, InsertUser, Exercise, InsertExercise, 
  WorkoutLog, InsertWorkoutLog, WorkoutTemplate, InsertWorkoutTemplate,
  WorkoutTemplateExercise, InsertWorkoutTemplateExercise,
  WorkoutLogSet, InsertWorkoutLogSet, WeightHistory, InsertWeightHistory,
  UserGoal, InsertUserGoal, UserPreferences, InsertUserPreferences, UpdateUserPreferences,
  UserAchievement, InsertUserAchievement, UpdateUserAchievement
} from '@shared/schema';

export class SimplePostgreSQLStorage implements IStorage {
  private pool: Pool;

  constructor() {
    console.log('🚀 Initializing Simple PostgreSQL storage...');
    
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
    
    console.log('✅ Simple PostgreSQL storage initialized');
  }

  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const query = `
      INSERT INTO users (id, email, username, password, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [require('crypto').randomUUID(), user.email, user.username, user.password, user.firstName || null, user.lastName || null];
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const query = `UPDATE users SET ${setClause} WHERE id = $1 RETURNING *`;
    const values = [id, ...Object.values(updates)];
    const result = await this.pool.query(query, values);
    return result.rows[0] || undefined;
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  }

  // Exercises - Simplified without image_url
  async getAllExercises(): Promise<Exercise[]> {
    return []; // User-specific only
  }

  async getExercises(userId?: string): Promise<Exercise[]> {
    if (!userId) return [];
    
    const result = await this.pool.query(
      'SELECT id, user_id, name, muscle_group, description, created_at FROM exercises WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows.map(row => ({
      id: row.id.toString(),
      user_id: row.user_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      description: row.description,
      createdAt: row.created_at
    }));
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    const result = await this.pool.query(
      'SELECT id, user_id, name, muscle_group, description, created_at FROM exercises WHERE id = $1',
      [id]
    );
    
    if (!result.rows[0]) return undefined;
    
    const row = result.rows[0];
    return {
      id: row.id.toString(),
      user_id: row.user_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      description: row.description,

      createdAt: row.created_at
    };
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    
    const query = `
      INSERT INTO exercises (user_id, name, muscle_group, description)
      VALUES ($1, $2, $3, $4)
      RETURNING id, user_id, name, muscle_group, description, created_at
    `;
    
    const values = [userId, exercise.name, exercise.muscleGroup, exercise.description || null];
    const result = await this.pool.query(query, values);
    
    const row = result.rows[0];
    
    return {
      id: row.id.toString(),
      user_id: row.user_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      description: row.description,

      createdAt: row.created_at
    };
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    const updates: string[] = [];
    const values: any[] = [];
    let valueIndex = 1;

    if (exercise.name !== undefined) {
      updates.push(`name = $${valueIndex++}`);
      values.push(exercise.name);
    }
    if (exercise.muscleGroup !== undefined) {
      updates.push(`muscle_group = $${valueIndex++}`);
      values.push(exercise.muscleGroup);
    }
    if (exercise.description !== undefined) {
      updates.push(`description = $${valueIndex++}`);
      values.push(exercise.description);
    }

    if (updates.length === 0) return this.getExercise(id);

    let query = `UPDATE exercises SET ${updates.join(', ')} WHERE id = $${valueIndex++}`;
    values.push(id);

    if (userId) {
      query += ` AND user_id = $${valueIndex++}`;
      values.push(userId);
    }

    query += ' RETURNING id, user_id, name, muscle_group, description, created_at';

    const result = await this.pool.query(query, values);
    if (!result.rows[0]) return undefined;

    const row = result.rows[0];
    return {
      id: row.id.toString(),
      user_id: row.user_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      description: row.description,

      createdAt: row.created_at
    };
  }

  async deleteExercise(id: string): Promise<boolean> {
    const result = await this.pool.query('DELETE FROM exercises WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    if (!userId) return [];
    const result = await this.pool.query(
      'SELECT id, user_id, name, muscle_group, description, created_at FROM exercises WHERE muscle_group = $1 AND user_id = $2',
      [muscleGroup, userId]
    );
    return result.rows.map(row => ({
      id: row.id.toString(),
      user_id: row.user_id,
      name: row.name,
      muscleGroup: row.muscle_group,
      description: row.description,

      createdAt: row.created_at
    }));
  }

  // Stub implementations for other methods (return empty/mock data for now)
  async getWeightHistory(): Promise<WeightHistory[]> { return []; }
  async addWeightEntry(): Promise<WeightHistory> { throw new Error('Not implemented'); }
  async updateWeightEntry(): Promise<WeightHistory | undefined> { return undefined; }
  async deleteWeightEntry(): Promise<boolean> { return false; }
  async getUserGoals(): Promise<UserGoal[]> { return []; }
  async createUserGoal(): Promise<UserGoal> { throw new Error('Not implemented'); }
  async updateUserGoal(): Promise<UserGoal | undefined> { return undefined; }
  async deleteUserGoal(): Promise<boolean> { return false; }
  async getUserPreferences(): Promise<UserPreferences | undefined> { return undefined; }
  async createUserPreferences(): Promise<UserPreferences> { throw new Error('Not implemented'); }
  async updateUserPreferences(): Promise<UserPreferences | undefined> { return undefined; }
  async getUserAchievements(): Promise<UserAchievement[]> { return []; }
  async createUserAchievement(): Promise<UserAchievement> { throw new Error('Not implemented'); }
  async updateUserAchievement(): Promise<UserAchievement | undefined> { return undefined; }
  async deleteUserAchievement(): Promise<boolean> { return false; }
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> { return []; }
  async getWorkoutTemplates(): Promise<WorkoutTemplate[]> { return []; }
  async getWorkoutTemplate(): Promise<WorkoutTemplate | undefined> { return undefined; }
  async createWorkoutTemplate(): Promise<WorkoutTemplate> { throw new Error('Not implemented'); }
  async updateWorkoutTemplate(): Promise<WorkoutTemplate | undefined> { return undefined; }
  async deleteWorkoutTemplate(): Promise<boolean> { return false; }
  async getWorkoutTemplateExercises(): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> { return []; }
  async addExerciseToTemplate(): Promise<WorkoutTemplateExercise> { throw new Error('Not implemented'); }
  async updateWorkoutTemplateExercise(): Promise<WorkoutTemplateExercise | undefined> { return undefined; }
  async deleteWorkoutTemplateExercise(): Promise<boolean> { return false; }
  async removeExerciseFromTemplate(): Promise<boolean> { return false; }
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> { return []; }
  async getWorkoutLogs(): Promise<WorkoutLog[]> { return []; }
  async getWorkoutLog(): Promise<WorkoutLog | undefined> { return undefined; }
  async createWorkoutLog(): Promise<WorkoutLog> { throw new Error('Not implemented'); }
  async updateWorkoutLog(): Promise<WorkoutLog | undefined> { return undefined; }
  async deleteWorkoutLog(): Promise<boolean> { return false; }
  async getRecentWorkoutLogs(): Promise<WorkoutLog[]> { return []; }
  async getWorkoutLogSets(): Promise<WorkoutLogSet[]> { return []; }
  async createWorkoutLogSet(): Promise<WorkoutLogSet> { throw new Error('Not implemented'); }
  async updateWorkoutLogSet(): Promise<WorkoutLogSet | undefined> { return undefined; }
}