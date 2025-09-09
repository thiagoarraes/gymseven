import { randomUUID } from 'crypto';
import type { IStorage } from './storage';
import type {
  User, InsertUser,
  Exercise, InsertExercise,
  WorkoutTemplate, InsertWorkoutTemplate,
  WorkoutTemplateExercise, InsertWorkoutTemplateExercise,
  WorkoutLog, InsertWorkoutLog,
  WorkoutLogExercise, InsertWorkoutLogExercise,
  WorkoutLogSet, InsertWorkoutLogSet,
  WeightHistory, InsertWeightHistory,
  UserGoal, InsertUserGoal,
  UserPreferences, InsertUserPreferences, UpdateUserPreferences,
  UserAchievement, InsertUserAchievement, UpdateUserAchievement
} from '@shared/schema';

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private exercises = new Map<string, Exercise>();
  private templates = new Map<string, WorkoutTemplate>();
  private templateExercises = new Map<string, WorkoutTemplateExercise>();
  private workoutLogs = new Map<string, WorkoutLog>();
  private logExercises = new Map<string, WorkoutLogExercise>();
  private logSets = new Map<string, WorkoutLogSet>();
  private weightHistory = new Map<string, WeightHistory>();
  private goals = new Map<string, UserGoal>();
  private preferences = new Map<string, UserPreferences>();
  private achievements = new Map<string, UserAchievement>();

  // Auth & Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    for (const u of this.users.values()) if (u.username === username) return u;
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const u of this.users.values()) if (u.email === email) return u;
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = randomUUID();
    const now = new Date();
    const newUser: User = {
      id,
      email: user.email,
      username: user.username,
      password: user.password,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
      height: (user as any).height ?? null,
      weight: (user as any).weight ?? null,
      activityLevel: 'moderado',
      fitnessGoals: [],
      profileImageUrl: null,
      experienceLevel: 'iniciante',
      preferredWorkoutDuration: 60,
      isActive: true,
      emailVerified: false,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const existing = this.users.get(id);
    if (!existing) return undefined;
    const updated: User = {
      ...existing,
      email: updates.email ?? existing.email,
      username: updates.username ?? existing.username,
      password: (updates as any).password ?? existing.password,
      firstName: updates.firstName ?? existing.firstName,
      lastName: updates.lastName ?? existing.lastName,
      dateOfBirth: updates.dateOfBirth ? new Date(updates.dateOfBirth) : existing.dateOfBirth,
      height: (updates as any).height ?? existing.height,
      weight: (updates as any).weight ?? existing.weight,
      profileImageUrl: (updates as any).profileImageUrl ?? existing.profileImageUrl,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    const u = this.users.get(id);
    if (u) {
      this.users.set(id, { ...u, lastLoginAt: new Date() });
    }
  }

  // Weight History
  async getWeightHistory(userId: string, limit?: number): Promise<WeightHistory[]> {
    const list = Array.from(this.weightHistory.values()).filter(h => h.usuarioId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }

  async addWeightEntry(entry: InsertWeightHistory): Promise<WeightHistory> {
    const id = randomUUID();
    const item: WeightHistory = {
      id,
      usuarioId: (entry as any).usuarioId!,
      peso: (entry as any).peso ?? (entry as any).weight ?? 0,
      date: (entry as any).date ? new Date((entry as any).date) : new Date(),
      observacoes: (entry as any).observacoes ?? null,
    };
    this.weightHistory.set(id, item);
    return item;
  }

  async updateWeightEntry(id: string, updates: Partial<InsertWeightHistory>): Promise<WeightHistory | undefined> {
    const existing = this.weightHistory.get(id);
    if (!existing) return undefined;
    const updated: WeightHistory = {
      ...existing,
      peso: (updates as any).peso ?? (updates as any).weight ?? existing.peso,
      date: (updates as any).date ? new Date((updates as any).date) : existing.date,
      observacoes: (updates as any).observacoes ?? existing.observacoes,
    };
    this.weightHistory.set(id, updated);
    return updated;
  }

  async deleteWeightEntry(id: string): Promise<boolean> {
    return this.weightHistory.delete(id);
  }

  // User Goals
  async getUserGoals(userId: string): Promise<UserGoal[]> {
    return Array.from(this.goals.values()).filter(g => g.usuarioId === userId);
  }

  async createUserGoal(goal: InsertUserGoal): Promise<UserGoal> {
    const id = randomUUID();
    const item: UserGoal = {
      id,
      usuarioId: (goal as any).usuarioId!,
      type: (goal as any).type,
      targetValue: (goal as any).targetValue ?? null,
      currentValue: (goal as any).currentValue ?? null,
      unit: (goal as any).unit ?? null,
      targetDate: (goal as any).targetDate ? new Date((goal as any).targetDate) : null,
      isCompleted: (goal as any).isCompleted ?? false,
      createdAt: new Date(),
    };
    this.goals.set(id, item);
    return item;
  }

  async updateUserGoal(id: string, updates: Partial<InsertUserGoal>): Promise<UserGoal | undefined> {
    const existing = this.goals.get(id);
    if (!existing) return undefined;
    const updated: UserGoal = {
      ...existing,
      type: (updates as any).type ?? existing.type,
      targetValue: (updates as any).targetValue ?? existing.targetValue,
      currentValue: (updates as any).currentValue ?? existing.currentValue,
      unit: (updates as any).unit ?? existing.unit,
      targetDate: (updates as any).targetDate ? new Date((updates as any).targetDate) : existing.targetDate,
      isCompleted: (updates as any).isCompleted ?? existing.isCompleted,
    };
    this.goals.set(id, updated);
    return updated;
  }

  async deleteUserGoal(id: string): Promise<boolean> {
    return this.goals.delete(id);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    for (const p of this.preferences.values()) if (p.usuarioId === userId) return p;
    return undefined;
  }

  async createUserPreferences(prefs: InsertUserPreferences): Promise<UserPreferences> {
    const id = randomUUID();
    const item: UserPreferences = {
      id,
      usuarioId: (prefs as any).usuarioId!,
      theme: (prefs as any).theme ?? 'dark',
      units: (prefs as any).units ?? 'metric',
      language: (prefs as any).language ?? 'pt-BR',
      notifications: (prefs as any).notifications ?? true,
      soundEffects: (prefs as any).soundEffects ?? true,
      restTimerAutoStart: (prefs as any).restTimerAutoStart ?? true,
      defaultRestTime: (prefs as any).defaultRestTime ?? 90,
      weekStartsOn: (prefs as any).weekStartsOn ?? 1,
      trackingData: (prefs as any).trackingData ?? 'all',
    };
    this.preferences.set(id, item);
    return item;
  }

  async updateUserPreferences(userId: string, updates: UpdateUserPreferences): Promise<UserPreferences | undefined> {
    const pref = await this.getUserPreferences(userId);
    if (!pref) return undefined;
    const updated: UserPreferences = { ...pref, ...(updates as any) } as UserPreferences;
    this.preferences.set(pref.id, updated);
    return updated;
  }

  // User Achievements
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return Array.from(this.achievements.values()).filter(a => a.usuarioId === userId);
  }

  async createUserAchievement(achievement: InsertUserAchievement): Promise<UserAchievement> {
    const id = randomUUID();
    const item: UserAchievement = {
      id,
      usuarioId: (achievement as any).usuarioId!,
      achievementId: (achievement as any).achievementId,
      unlockedAt: new Date(),
      progress: (achievement as any).progress ?? 0,
      isCompleted: (achievement as any).isCompleted ?? true,
    };
    this.achievements.set(id, item);
    return item;
  }

  async updateUserAchievement(id: string, updates: UpdateUserAchievement): Promise<UserAchievement | undefined> {
    const existing = this.achievements.get(id);
    if (!existing) return undefined;
    const updated: UserAchievement = { ...existing, ...(updates as any) } as UserAchievement;
    this.achievements.set(id, updated);
    return updated;
  }

  async deleteUserAchievement(id: string): Promise<boolean> {
    return this.achievements.delete(id);
  }

  // Exercises
  async getAllExercises(): Promise<Exercise[]> {
    return Array.from(this.exercises.values());
  }

  async getExercises(userId?: string): Promise<Exercise[]> {
    const list = Array.from(this.exercises.values());
    return userId ? list.filter(e => e.usuarioId === userId) : list;
  }

  async getExercise(id: string): Promise<Exercise | undefined> {
    return this.exercises.get(id);
  }

  async createExercise(exercise: InsertExercise, userId: string): Promise<Exercise> {
    const id = randomUUID();
    const item: Exercise = {
      id,
      usuarioId: userId,
      nome: (exercise as any).nome ?? (exercise as any).name,
      grupoMuscular: (exercise as any).grupoMuscular ?? (exercise as any).muscleGroup,
      descricao: (exercise as any).descricao ?? (exercise as any).description ?? null,
      createdAt: new Date(),
    } as Exercise;
    this.exercises.set(id, item);
    return item;
  }

  async updateExercise(id: string, exercise: Partial<InsertExercise>, userId?: string): Promise<Exercise | undefined> {
    const existing = this.exercises.get(id);
    if (!existing) return undefined;
    if (userId && existing.usuarioId !== userId) return undefined;
    const updated: Exercise = {
      ...existing,
      nome: (exercise as any).nome ?? (exercise as any).name ?? existing.nome,
      grupoMuscular: (exercise as any).grupoMuscular ?? (exercise as any).muscleGroup ?? existing.grupoMuscular,
      descricao: (exercise as any).descricao ?? (exercise as any).description ?? existing.descricao,
    };
    this.exercises.set(id, updated);
    return updated;
  }

  async deleteExercise(id: string): Promise<boolean> {
    return this.exercises.delete(id);
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId?: string): Promise<Exercise[]> {
    return (await this.getExercises(userId)).filter(e => e.grupoMuscular === muscleGroup);
  }

  async getExerciseStats(exerciseId: string, userId: string): Promise<{ lastWeight: number | null; maxWeight: number | null; lastUsed: string | null; totalSessions: number; }> {
    const logs = Array.from(this.workoutLogs.values()).filter(l => l.usuarioId === userId);
    let lastWeight: number | null = null;
    let maxWeight: number | null = null;
    let lastUsed: string | null = null;
    let totalSessions = 0;
    for (const log of logs) {
      const les = Array.from(this.logExercises.values()).filter(le => le.registroId === log.id && le.exercicioId === exerciseId);
      if (les.length > 0) {
        totalSessions += 1;
        lastUsed = new Date(log.startTime).toISOString();
        for (const le of les) {
          const sets = Array.from(this.logSets.values()).filter(s => s.exercicioRegistroId === le.id && s.weight != null);
          for (const s of sets) {
            const w = (s.weight as number) ?? 0;
            lastWeight = w;
            maxWeight = Math.max(maxWeight ?? 0, w);
          }
        }
      }
    }
    return { lastWeight, maxWeight, lastUsed, totalSessions };
  }

  async getExerciseWeightHistory(exerciseId: string, userId: string, limit?: number): Promise<{ date: string; weight: number; }[]> {
    const entries: { date: string; weight: number }[] = [];
    for (const log of Array.from(this.workoutLogs.values()).filter(l => l.usuarioId === userId)) {
      for (const le of Array.from(this.logExercises.values()).filter(le => le.registroId === log.id && le.exercicioId === exerciseId)) {
        for (const s of Array.from(this.logSets.values()).filter(s => s.exercicioRegistroId === le.id && s.weight != null)) {
          entries.push({ date: new Date(log.startTime).toISOString(), weight: (s.weight as number) });
        }
      }
    }
    entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return typeof limit === 'number' ? entries.slice(-limit) : entries;
  }

  // Workout Templates
  async getAllWorkoutTemplates(): Promise<WorkoutTemplate[]> {
    return Array.from(this.templates.values());
  }

  async getWorkoutTemplates(userId?: string): Promise<WorkoutTemplate[]> {
    const list = Array.from(this.templates.values());
    return userId ? list.filter(t => t.usuarioId === userId) : list;
  }

  async getWorkoutTemplate(id: string): Promise<WorkoutTemplate | undefined> {
    return this.templates.get(id);
  }

  async createWorkoutTemplate(template: InsertWorkoutTemplate): Promise<WorkoutTemplate> {
    const id = randomUUID();
    const item: WorkoutTemplate = {
      id,
      usuarioId: (template as any).usuarioId!,
      nome: (template as any).nome ?? (template as any).name,
      descricao: (template as any).descricao ?? (template as any).description ?? null,
      createdAt: new Date(),
    } as WorkoutTemplate;
    this.templates.set(id, item);
    return item;
  }

  async updateWorkoutTemplate(id: string, template: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate | undefined> {
    const existing = this.templates.get(id);
    if (!existing) return undefined;
    const updated: WorkoutTemplate = {
      ...existing,
      nome: (template as any).nome ?? (template as any).name ?? existing.nome,
      descricao: (template as any).descricao ?? (template as any).description ?? existing.descricao,
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplate(id: string, userId?: string): Promise<boolean> {
    const t = this.templates.get(id);
    if (!t) return false;
    if (userId && t.usuarioId !== userId) return false;
    // remove related template exercises
    for (const te of Array.from(this.templateExercises.values())) if (te.modeloId === id) this.templateExercises.delete(te.id);
    return this.templates.delete(id);
  }

  async getWorkoutTemplateExercises(templateId: string): Promise<(WorkoutTemplateExercise & { exercise: Exercise })[]> {
    const list = Array.from(this.templateExercises.values()).filter(te => te.modeloId === templateId);
    return list.map(te => ({
      ...te,
      exercise: this.exercises.get(te.exercicioId) as Exercise,
    }));
  }

  async addExerciseToTemplate(exercise: InsertWorkoutTemplateExercise): Promise<WorkoutTemplateExercise> {
    const id = randomUUID();
    const item: WorkoutTemplateExercise = {
      id,
      modeloId: (exercise as any).modeloId,
      exercicioId: (exercise as any).exercicioId,
      series: (exercise as any).series,
      repeticoes: String((exercise as any).repeticoes ?? (exercise as any).reps ?? ''),
      weight: (exercise as any).weight ?? null,
      restDurationSeconds: (exercise as any).restDurationSeconds ?? 90,
      order: (exercise as any).order ?? 1,
    } as WorkoutTemplateExercise;
    this.templateExercises.set(id, item);
    return item;
  }

  async updateWorkoutTemplateExercise(id: string, updates: Partial<InsertWorkoutTemplateExercise>, userId?: string): Promise<WorkoutTemplateExercise | undefined> {
    const existing = this.templateExercises.get(id);
    if (!existing) return undefined;
    if (userId) {
      const tpl = existing && this.templates.get(existing.modeloId);
      if (tpl && tpl.usuarioId !== userId) return undefined;
    }
    const updated: WorkoutTemplateExercise = {
      ...existing,
      series: (updates as any).series ?? existing.series,
      repeticoes: (updates as any).repeticoes != null ? String((updates as any).repeticoes) : (updates as any).reps != null ? String((updates as any).reps) : existing.repeticoes,
      weight: (updates as any).weight ?? existing.weight,
      restDurationSeconds: (updates as any).restDurationSeconds ?? existing.restDurationSeconds,
      order: (updates as any).order ?? existing.order,
    };
    this.templateExercises.set(id, updated);
    return updated;
  }

  async deleteWorkoutTemplateExercise(id: string, userId?: string): Promise<boolean> {
    const existing = this.templateExercises.get(id);
    if (!existing) return false;
    if (userId) {
      const tpl = this.templates.get(existing.modeloId);
      if (tpl && tpl.usuarioId !== userId) return false;
    }
    return this.templateExercises.delete(id);
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<boolean> {
    let removed = false;
    for (const te of Array.from(this.templateExercises.values())) {
      if (te.modeloId === templateId && te.exercicioId === exerciseId) {
        this.templateExercises.delete(te.id);
        removed = true;
      }
    }
    return removed;
  }

  // Workout Logs
  async getAllWorkoutLogs(): Promise<WorkoutLog[]> {
    return Array.from(this.workoutLogs.values());
  }

  async getWorkoutLogs(userId?: string): Promise<WorkoutLog[]> {
    const list = Array.from(this.workoutLogs.values()).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
    return userId ? list.filter(l => l.usuarioId === userId) : list;
  }

  async getWorkoutLog(id: string): Promise<WorkoutLog | undefined> {
    return this.workoutLogs.get(id);
  }

  async createWorkoutLog(log: InsertWorkoutLog): Promise<WorkoutLog> {
    const id = randomUUID();
    const item: WorkoutLog = {
      id,
      usuarioId: (log as any).usuarioId!,
      modeloId: (log as any).modeloId ?? null,
      nome: (log as any).nome ?? (log as any).name ?? 'Treino',
      startTime: new Date((log as any).startTime ?? new Date()),
      endTime: (log as any).endTime ? new Date((log as any).endTime) : null,
    } as WorkoutLog;
    this.workoutLogs.set(id, item);
    return item;
  }

  async updateWorkoutLog(id: string, log: Partial<InsertWorkoutLog>): Promise<WorkoutLog | undefined> {
    const existing = this.workoutLogs.get(id);
    if (!existing) return undefined;
    const updated: WorkoutLog = {
      ...existing,
      nome: (log as any).nome ?? (log as any).name ?? existing.nome,
      startTime: (log as any).startTime ? new Date((log as any).startTime) : existing.startTime,
      endTime: (log as any).endTime ? new Date((log as any).endTime) : existing.endTime,
      modeloId: (log as any).modeloId ?? existing.modeloId,
    };
    this.workoutLogs.set(id, updated);
    return updated;
  }

  async deleteWorkoutLog(id: string): Promise<boolean> {
    // Cascade delete related entries
    for (const le of Array.from(this.logExercises.values())) if (le.registroId === id) this.logExercises.delete(le.id);
    for (const s of Array.from(this.logSets.values())) {
      const le = this.logExercises.get(s.exercicioRegistroId);
      if (!le || le.registroId === id) this.logSets.delete(s.id);
    }
    return this.workoutLogs.delete(id);
  }

  async getRecentWorkoutLogs(limit?: number): Promise<WorkoutLog[]> {
    const list = await this.getWorkoutLogs();
    return typeof limit === 'number' ? list.slice(0, limit) : list;
  }

  // Workout Log Exercises
  async getWorkoutLogExercises(logId: string): Promise<WorkoutLogExercise[]> {
    return Array.from(this.logExercises.values()).filter(le => le.registroId === logId);
  }

  async createWorkoutLogExercise(exercise: InsertWorkoutLogExercise): Promise<WorkoutLogExercise> {
    const id = randomUUID();
    const item: WorkoutLogExercise = {
      id,
      registroId: (exercise as any).registroId,
      exercicioId: (exercise as any).exercicioId,
      nomeExercicio: (exercise as any).nomeExercicio,
      order: (exercise as any).order ?? 1,
      createdAt: new Date(),
    } as WorkoutLogExercise;
    this.logExercises.set(id, item);
    return item;
  }

  // Workout Log Sets
  async getWorkoutLogSets(logExerciseId: string): Promise<WorkoutLogSet[]> {
    return Array.from(this.logSets.values()).filter(s => s.exercicioRegistroId === logExerciseId);
  }

  async createWorkoutLogSet(set: InsertWorkoutLogSet): Promise<WorkoutLogSet> {
    const id = randomUUID();
    const item: WorkoutLogSet = {
      id,
      exercicioRegistroId: (set as any).exercicioRegistroId,
      setNumber: (set as any).setNumber,
      reps: (set as any).reps ?? null,
      weight: (set as any).weight ?? null,
      completed: (set as any).completed ?? false,
    } as WorkoutLogSet;
    this.logSets.set(id, item);
    return item;
  }

  async updateWorkoutLogSet(id: string, set: Partial<InsertWorkoutLogSet>): Promise<WorkoutLogSet | undefined> {
    const existing = this.logSets.get(id);
    if (!existing) return undefined;
    const updated: WorkoutLogSet = {
      ...existing,
      setNumber: (set as any).setNumber ?? existing.setNumber,
      reps: (set as any).reps ?? existing.reps,
      weight: (set as any).weight ?? existing.weight,
      completed: (set as any).completed ?? existing.completed,
    };
    this.logSets.set(id, updated);
    return updated;
  }
}
