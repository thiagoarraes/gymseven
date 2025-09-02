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
  type UserAchievement, type InsertUserAchievement, type UpdateUserAchievement
} from "@shared/schema";

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
  
  // User Achievements
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement>;
  updateUserAchievement(id: string, updates: UpdateUserAchievement): Promise<UserAchievement | undefined>;
  deleteUserAchievement(id: string): Promise<boolean>;
  
  // Exercises
  getAllExercises(): Promise<Exercise[]>;
  getExercises(userId?: string): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | undefined>;
  createExercise(exercise: InsertExercise, userId: string): Promise<Exercise>;
  updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined>;
  deleteExercise(id: string): Promise<boolean>;
  getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]>;
  
  // Workout Templates
  getAllWorkoutTemplates(): Promise<WorkoutTemplate[]>;
  getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]>;
  getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined>;
  createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate>;
  updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined>;
  deleteWorkoutTemplate(id: string, userId?: string): Promise<boolean>;
  
  // Workout Template Exercises
  getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]>;
  addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise>;
  updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>): Promise<WorkoutTemplateExercise | undefined>;
  deleteWorkoutTemplateExercise(id: string): Promise<boolean>;
  removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean>;
  
  // Workout Logs
  getAllWorkoutLogs(): Promise<WorkoutLog[]>;
  getWorkoutLogs(userId?: string): Promise<WorkoutLog[]>;
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

// Storage initialization - PostgreSQL
export async function initializeStorage(): Promise<IStorage> {
  try {
    // Use built-in PostgreSQL database
    if (process.env.DATABASE_URL) {
      console.log('🚀 Using PostgreSQL database configuration');
      console.log('✅ Database credentials detected');
      const { PostgreSQLStorage } = await import('./postgresql-storage');
      return new PostgreSQLStorage();
    }
    
    // If no database is configured, throw error
    throw new Error('❌ Database credentials required. Please ensure DATABASE_URL is configured');
    
  } catch (error) {
    console.error('❌ Storage initialization failed:', error);
    throw error;
  }
}

// Initialize storage instance
let _storage: IStorage | undefined;

export async function getStorage(): Promise<IStorage> {
  if (!_storage) {
    _storage = await initializeStorage();
  }
  return _storage;
}

// Note: Export storage instance initialization will be handled by getStorage() function