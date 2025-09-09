import { 
  type User, type InsertUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogSet, type InsertWorkoutLogSet,
  type WorkoutLogExercise, type InsertWorkoutLogExercise,
  type WeightHistory, type InsertWeightHistory,
  type UserGoal, type InsertUserGoal,
  type UserPreferences, type InsertUserPreferences, type UpdateUserPreferences,
  type UserAchievement, type InsertUserAchievement, type UpdateUserAchievement
} from "@shared/schema";
import { IStorage } from "./storage";

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private exercises = new Map<string, Exercise>();
  private workoutTemplates = new Map<string, WorkoutTemplate>();
  private workoutTemplateExercises = new Map<string, WorkoutTemplateExercise>();
  private workoutLogs = new Map<string, WorkoutLog>();
  private workoutLogExercises = new Map<string, WorkoutLogExercise>();
  private workoutLogSets = new Map<string, WorkoutLogSet>();
  private weightHistory = new Map<string, WeightHistory>();
  private userGoals = new Map<string, UserGoal>();
  private userPreferences = new Map<string, UserPreferences>();
  private userAchievements = new Map<string, UserAchievement>();

  constructor() {
    console.log('🚀 Initializing Memory storage...');
    console.log('✅ Memory storage initialized - dados não persistentes');
  }

  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.username === username) return user;
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = generateId();
    const newUser: User = {
      id,
      email: user.email,
      username: user.username,
      password: user.password,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
      height: user.height ?? null,
      weight: user.weight ?? null,
      activityLevel: user.activityLevel ?? null,
      fitnessGoals: user.fitnessGoals ?? null,
      profileImageUrl: user.profileImageUrl ?? null,
      experienceLevel: user.experienceLevel ?? null,
      preferredWorkoutDuration: user.preferredWorkoutDuration ?? null,
      isActive: user.isActive ?? true,
      emailVerified: user.emailVerified ?? false,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastLoginAt = new Date();
      this.users.set(id, user);
    }
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    const entries = Array.from(this.weightHistory.values())
      .filter(entry => entry.usuarioId === userId)
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());
    
    return limit ? entries.slice(0, limit) : entries;
  }

  async addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory> {
    const id = generateId();
    const newEntry: WeightHistory = {
      id,
      usuarioId: entry.usuarioId,
      peso: entry.peso,
      date: entry.date || new Date(),
      observacoes: entry.observacoes ?? null
    };
    this.weightHistory.set(id, newEntry);
    return newEntry;
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const entry = this.weightHistory.get(id);
    if (!entry) return undefined;
    
    const updatedEntry: WeightHistory = { ...entry, ...updates };
    this.weightHistory.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    return this.weightHistory.delete(id);
  }

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return Array.from(this.userGoals.values())
      .filter(goal => goal.usuarioId === userId);
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const id = generateId();
    const newGoal: UserGoal = {
      id,
      usuarioId: goal.usuarioId,
      type: goal.type,
      targetValue: goal.targetValue ?? null,
      currentValue: goal.currentValue ?? null,
      unit: goal.unit ?? null,
      targetDate: goal.targetDate ?? null,
      isCompleted: goal.isCompleted ?? false,
      createdAt: new Date()
    };
    this.userGoals.set(id, newGoal);
    return newGoal;
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const goal = this.userGoals.get(id);
    if (!goal) return undefined;
    
    const updatedGoal: UserGoal = { ...goal, ...updates };
    this.userGoals.set(id, updatedGoal);
    return updatedGoal;
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    return this.userGoals.delete(id);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    for (const prefs of this.userPreferences.values()) {
      if (prefs.usuarioId === userId) return prefs;
    }
    return undefined;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const id = generateId();
    const newPrefs: UserPreferences = {
      id,
      usuarioId: prefs.usuarioId,
      theme: prefs.theme ?? null,
      units: prefs.units ?? null,
      language: prefs.language ?? null,
      notifications: prefs.notifications ?? null,
      soundEffects: prefs.soundEffects ?? null,
      restTimerAutoStart: prefs.restTimerAutoStart ?? null,
      defaultRestTime: prefs.defaultRestTime ?? null,
      weekStartsOn: prefs.weekStartsOn ?? null,
      trackingData: prefs.trackingData ?? null
    };
    this.userPreferences.set(id, newPrefs);
    return newPrefs;
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    for (const [id, prefs] of this.userPreferences.entries()) {
      if (prefs.usuarioId === userId) {
        const updatedPrefs: UserPreferences = { ...prefs, ...updates };
        this.userPreferences.set(id, updatedPrefs);
        return updatedPrefs;
      }
    }
    return undefined;
  }

  // User Achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return Array.from(this.userAchievements.values())
      .filter(achievement => achievement.usuarioId === userId);
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = generateId();
    const newAchievement: UserAchievement = {
      id,
      ...achievement,
      unlockedAt: new Date(),
      progress: achievement.progress ?? 0,
      isCompleted: achievement.isCompleted ?? true
    };
    this.userAchievements.set(id, newAchievement);
    return newAchievement;
  }

  async updateUserAchievement(id: string, updates: UpdateUserAchievement): Promise<UserAchievement | undefined> {
    const achievement = this.userAchievements.get(id);
    if (!achievement) return undefined;
    
    const updatedAchievement: UserAchievement = { ...achievement, ...updates };
    this.userAchievements.set(id, updatedAchievement);
    return updatedAchievement;
  }

  async deleteUserAchievement(id: string): Promise<boolean> {
    return this.userAchievements.delete(id);
  }

  // Exercises
  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercises(userId?: string): Promise<Exercise[]> {
    if (!userId) return this.getAllExercises();
    return Array.from(this.exercises.values())
      .filter(exercise => exercise.usuarioId === userId);
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    const id = generateId();
    const newExercise: Exercise = {
      id,
      usuarioId: userId,
      ...exercise,
      createdAt: new Date()
    };
    this.exercises.set(id, newExercise);
    return newExercise;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    const existingExercise = this.exercises.get(id);
    if (!existingExercise) return undefined;
    if (userId && existingExercise.usuarioId !== userId) return undefined;
    
    const updatedExercise: Exercise = { ...existingExercise, ...exercise };
    this.exercises.set(id, updatedExercise);
    return updatedExercise;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    return Array.from(this.exercises.values())
      .filter(exercise => 
        exercise.grupoMuscular === muscleGroup && 
        (!userId || exercise.usuarioId === userId)
      );
  }

  async getExerciseStats(exerciseId: string, userId: string): Promise<{
    lastWeight: number | null;
    maxWeight: number | null;
    lastUsed: string | null;
    totalSessions: number;
  }> {
    // Find all workout log sets for this exercise and user
    const sets = Array.from(this.workoutLogSets.values()).filter(set => {
      const logExercise = Array.from(this.workoutLogExercises.values()).find(ex => ex.id === set.exercicioRegistroId);
      if (!logExercise) return false;
      
      const workoutLog = this.workoutLogs.get(logExercise.registroId);
      return workoutLog && workoutLog.usuarioId === userId && logExercise.exercicioId === exerciseId;
    });

    const weights = sets.map(set => set.weight).filter(w => w !== null) as number[];
    const lastWeight = weights.length > 0 ? weights[weights.length - 1] : null;
    const maxWeight = weights.length > 0 ? Math.max(...weights) : null;
    
    // Get last used date
    const lastLog = Array.from(this.workoutLogs.values())
      .filter(log => log.usuarioId === userId)
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .find(log => {
        return Array.from(this.workoutLogExercises.values())
          .some(ex => ex.registroId === log.id && ex.exercicioId === exerciseId);
      });

    const lastUsed = lastLog ? lastLog.startTime.toISOString() : null;
    const totalSessions = new Set(sets.map(set => {
      const logExercise = Array.from(this.workoutLogExercises.values()).find(ex => ex.id === set.exercicioRegistroId);
      return logExercise?.registroId;
    })).size;

    return { lastWeight, maxWeight, lastUsed, totalSessions };
  }

  async getExerciseWeightHistory(exerciseId: string, userId: string, limit?: number): Promise<{
    date: string;
    weight: number;
  }[]> {
    const results: { date: string; weight: number }[] = [];
    
    // Find all workout logs for this user
    const userLogs = Array.from(this.workoutLogs.values())
      .filter(log => log.usuarioId === userId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    for (const log of userLogs) {
      // Find exercises in this log that match our exerciseId
      const logExercises = Array.from(this.workoutLogExercises.values())
        .filter(ex => ex.registroId === log.id && ex.exercicioId === exerciseId);

      for (const logEx of logExercises) {
        // Find sets for this exercise
        const sets = Array.from(this.workoutLogSets.values())
          .filter(set => set.exercicioRegistroId === logEx.id && set.weight !== null);

        if (sets.length > 0) {
          const maxWeight = Math.max(...sets.map(s => s.weight!));
          results.push({
            date: log.startTime.toISOString(),
            weight: maxWeight
          });
        }
      }
    }

    return limit ? results.slice(-limit) : results;
  }

  // Workout Templates
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return Array.from(this.workoutTemplates.values());
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    if (!userId) return this.getAllWorkoutTemplates();
    return Array.from(this.workoutTemplates.values())
      .filter(template => template.usuarioId === userId);
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    return this.workoutTemplates.get(id);
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const id = generateId();
    const newTemplate: WorkoutTemplate = {
      id,
      ...template,
      createdAt: new Date()
    };
    this.workoutTemplates.set(id, newTemplate);
    return newTemplate;
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const existing = this.workoutTemplates.get(id);
    if (!existing) return undefined;
    
    const updated: WorkoutTemplate = { ...existing, ...template };
    this.workoutTemplates.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplate(id: string, userId?: string): Promise<boolean> {
    const template = this.workoutTemplates.get(id);
    if (!template) return false;
    if (userId && template.usuarioId !== userId) return false;
    
    return this.workoutTemplates.delete(id);
  }

  // Workout Template Exercises
  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const templateExercises = Array.from(this.workoutTemplateExercises.values())
      .filter(te => te.modeloId === templateId)
      .sort((a, b) => a.order - b.order);

    const results: (WorkoutTemplateExercise & { exercise: Exercise })[] = [];
    for (const te of templateExercises) {
      const exercise = this.exercises.get(te.exercicioId);
      if (exercise) {
        results.push({ ...te, exercise });
      }
    }
    return results;
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const id = generateId();
    const newExercise: WorkoutTemplateExercise = {
      id,
      modeloId: exercise.modeloId,
      exercicioId: exercise.exercicioId,
      series: exercise.series,
      repeticoes: exercise.repeticoes,
      weight: exercise.weight ?? null,
      restDurationSeconds: exercise.restDurationSeconds ?? null,
      order: exercise.order
    };
    this.workoutTemplateExercises.set(id, newExercise);
    return newExercise;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>, userId?: string): Promise<WorkoutTemplateExercise | undefined> {
    const exercise = this.workoutTemplateExercises.get(id);
    if (!exercise) return undefined;
    
    // Check user permission if provided
    if (userId) {
      const template = this.workoutTemplates.get(exercise.modeloId);
      if (!template || template.usuarioId !== userId) return undefined;
    }
    
    const updated: WorkoutTemplateExercise = { ...exercise, ...updates };
    this.workoutTemplateExercises.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplateExercise(id: string, userId?: string): Promise<boolean> {
    const exercise = this.workoutTemplateExercises.get(id);
    if (!exercise) return false;
    
    // Check user permission if provided
    if (userId) {
      const template = this.workoutTemplates.get(exercise.modeloId);
      if (!template || template.usuarioId !== userId) return false;
    }
    
    return this.workoutTemplateExercises.delete(id);
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    for (const [id, te] of this.workoutTemplateExercises.entries()) {
      if (te.modeloId === templateId && te.exercicioId === exerciseId) {
        this.workoutTemplateExercises.delete(id);
        return true;
      }
    }
    return false;
  }

  // Workout Logs
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    const logs = userId 
      ? Array.from(this.workoutLogs.values()).filter(log => log.usuarioId === userId)
      : Array.from(this.workoutLogs.values());
    
    return logs.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    return this.workoutLogs.get(id);
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = generateId();
    const newLog: WorkoutLog = {
      id,
      usuarioId: log.usuarioId,
      modeloId: log.modeloId ?? null,
      nome: log.nome,
      startTime: log.startTime,
      endTime: log.endTime ?? null
    };
    this.workoutLogs.set(id, newLog);
    return newLog;
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const existing = this.workoutLogs.get(id);
    if (!existing) return undefined;
    
    const updated: WorkoutLog = { ...existing, ...log };
    this.workoutLogs.set(id, updated);
    return updated;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    return this.workoutLogs.delete(id);
  }

  async getRecentWorkoutLogs(limit?: number): Promise<WorkoutLog[]> {
    const logs = Array.from(this.workoutLogs.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    
    return limit ? logs.slice(0, limit) : logs;
  }

  // Workout Log Exercises
  async getWorkoutLogExercises(logId: string): Promise<WorkoutLogExercise[]> {
    return Array.from(this.workoutLogExercises.values())
      .filter(ex => ex.registroId === logId)
      .sort((a, b) => a.order - b.order);
  }

  async createWorkoutLogExercise(exercise: InsertWorkoutLogExercise): Promise<WorkoutLogExercise> {
    const id = generateId();
    const newExercise: WorkoutLogExercise = {
      id,
      ...exercise,
      createdAt: new Date()
    };
    this.workoutLogExercises.set(id, newExercise);
    return newExercise;
  }

  // Workout Log Sets
  async getWorkoutLogSets(logId: string): Promise<WorkoutLogSet[]> {
    // Get all exercises for this log first
    const logExercises = Array.from(this.workoutLogExercises.values())
      .filter(ex => ex.registroId === logId);
    
    const exerciseIds = new Set(logExercises.map(ex => ex.id));
    
    return Array.from(this.workoutLogSets.values())
      .filter(set => exerciseIds.has(set.exercicioRegistroId))
      .sort((a, b) => a.setNumber - b.setNumber);
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const id = generateId();
    const newSet: WorkoutLogSet = {
      id,
      exercicioRegistroId: set.exercicioRegistroId,
      setNumber: set.setNumber,
      reps: set.reps ?? null,
      weight: set.weight ?? null,
      completed: set.completed ?? false
    };
    this.workoutLogSets.set(id, newSet);
    return newSet;
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const existing = this.workoutLogSets.get(id);
    if (!existing) return undefined;
    
    const updated: WorkoutLogSet = { ...existing, ...set };
    this.workoutLogSets.set(id, updated);
    return updated;
  }
}