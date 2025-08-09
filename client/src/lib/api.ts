import { apiRequest } from "./queryClient";
import type { 
  Exercise, 
  InsertExercise, 
  WorkoutTemplate, 
  InsertWorkoutTemplate,
  WorkoutLog,
  InsertWorkoutLog
} from "@shared/schema";

export const exerciseApi = {
  getAll: async (): Promise<Exercise[]> => {
    const response = await apiRequest("GET", "/api/exercises");
    return response.json();
  },

  getById: async (id: string): Promise<Exercise> => {
    const response = await apiRequest("GET", `/api/exercises/${id}`);
    return response.json();
  },

  getByMuscleGroup: async (muscleGroup: string): Promise<Exercise[]> => {
    const response = await apiRequest("GET", `/api/exercises?muscleGroup=${encodeURIComponent(muscleGroup)}`);
    return response.json();
  },

  create: async (exercise: InsertExercise): Promise<Exercise> => {
    const response = await apiRequest("POST", "/api/exercises", exercise);
    return response.json();
  },

  update: async (id: string, updates: Partial<InsertExercise>): Promise<Exercise> => {
    const response = await apiRequest("PUT", `/api/exercises/${id}`, updates);
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/exercises/${id}`);
  },
};

export const workoutTemplateApi = {
  getAll: async (): Promise<WorkoutTemplate[]> => {
    const response = await apiRequest("GET", "/api/workout-templates");
    return response.json();
  },

  getById: async (id: string): Promise<WorkoutTemplate> => {
    const response = await apiRequest("GET", `/api/workout-templates/${id}`);
    return response.json();
  },

  getExercises: async (templateId: string) => {
    const response = await apiRequest("GET", `/api/workout-templates/${templateId}/exercises`);
    return response.json();
  },

  create: async (template: InsertWorkoutTemplate): Promise<WorkoutTemplate> => {
    const response = await apiRequest("POST", "/api/workout-templates", template);
    return response.json();
  },

  update: async (id: string, updates: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate> => {
    const response = await apiRequest("PUT", `/api/workout-templates/${id}`, updates);
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/workout-templates/${id}`);
  },

  addExercise: async (templateId: string, exercise: any) => {
    const response = await apiRequest("POST", `/api/workout-templates/${templateId}/exercises`, exercise);
    return response.json();
  },

  updateExercise: async (exerciseId: string, updates: any) => {
    const response = await apiRequest("PUT", `/api/workout-template-exercises/${exerciseId}`, updates);
    return response.json();
  },

  removeExercise: async (exerciseId: string): Promise<void> => {
    await apiRequest("DELETE", `/api/workout-template-exercises/${exerciseId}`);
  },
};

export const workoutLogApi = {
  getAll: async (): Promise<WorkoutLog[]> => {
    const response = await apiRequest("GET", "/api/workout-logs");
    return response.json();
  },

  getRecent: async (): Promise<WorkoutLog[]> => {
    const response = await apiRequest("GET", "/api/workout-logs?recent=true");
    return response.json();
  },

  getById: async (id: string): Promise<WorkoutLog> => {
    const response = await apiRequest("GET", `/api/workout-logs/${id}`);
    return response.json();
  },

  create: async (log: InsertWorkoutLog): Promise<WorkoutLog> => {
    const response = await apiRequest("POST", "/api/workout-logs", log);
    return response.json();
  },

  update: async (id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog> => {
    const response = await apiRequest("PUT", `/api/workout-logs/${id}`, updates);
    return response.json();
  },

  getSets: async (logId: string) => {
    const response = await apiRequest("GET", `/api/workout-logs/${logId}/sets`);
    return response.json();
  },

  getSummary: async (id: string) => {
    const response = await apiRequest("GET", `/api/workout-logs/${id}/summary`);
    return response.json();
  },

  // Workout log exercises API
  createExercise: async (data: any) => {
    const response = await apiRequest("POST", "/api/workout-log-exercises", data);
    return response.json();
  },

  // Workout log sets API
  createSet: async (data: any) => {
    const response = await apiRequest("POST", "/api/workout-log-sets", data);
    return response.json();
  },
};

export const exerciseProgressApi = {
  getWeightHistory: async (exerciseId: string, limit: number = 10) => {
    const response = await apiRequest("GET", `/api/exercise-weight-history/${exerciseId}?limit=${limit}`);
    return response.json();
  },
    
  getExercisesWeightSummary: async () => {
    const response = await apiRequest("GET", '/api/exercises-weight-summary');
    return response.json();
  },

  getExercisesWithProgress: async () => {
    const response = await apiRequest("GET", '/api/exercises-with-progress');
    return response.json();
  },
};
