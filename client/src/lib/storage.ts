import type { Exercise, WorkoutTemplate, WorkoutLog } from "@shared/schema";

const STORAGE_KEYS = {
  exercises: 'gymseven_exercises',
  workoutTemplates: 'gymseven_workout_templates',
  workoutLogs: 'gymseven_workout_logs',
  settings: 'gymseven_settings'
};

export class LocalStorage {
  static get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export class OfflineStorage {
  static getExercises(): Exercise[] {
    return LocalStorage.get<Exercise[]>(STORAGE_KEYS.exercises) || [];
  }

  static saveExercises(exercises: Exercise[]): void {
    LocalStorage.set(STORAGE_KEYS.exercises, exercises);
  }

  static getWorkoutTemplates(): WorkoutTemplate[] {
    return LocalStorage.get<WorkoutTemplate[]>(STORAGE_KEYS.workoutTemplates) || [];
  }

  static saveWorkoutTemplates(templates: WorkoutTemplate[]): void {
    LocalStorage.set(STORAGE_KEYS.workoutTemplates, templates);
  }

  static getWorkoutLogs(): WorkoutLog[] {
    return LocalStorage.get<WorkoutLog[]>(STORAGE_KEYS.workoutLogs) || [];
  }

  static saveWorkoutLogs(logs: WorkoutLog[]): void {
    LocalStorage.set(STORAGE_KEYS.workoutLogs, logs);
  }

  static sync() {
    // TODO: Implement sync with server when online
    if (navigator.onLine) {
      console.log('Syncing with server...');
    }
  }
}
