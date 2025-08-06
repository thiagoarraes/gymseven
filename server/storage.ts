import { 
  type User, type InsertUser,
  type Exercise, type InsertExercise,
  type WorkoutTemplate, type InsertWorkoutTemplate,
  type WorkoutTemplateExercise, type InsertWorkoutTemplateExercise,
  type WorkoutLog, type InsertWorkoutLog,
  type WorkoutLogSet, type InsertWorkoutLogSet
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
      weight: insertExercise.weight || null
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
      endTime: insertLog.endTime ? new Date(insertLog.endTime) : null,
      completed: insertLog.completed !== undefined ? insertLog.completed : false
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

export const storage = new MemStorage();
