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
    const response = await apiRequest("GET", "/api/v2/exercises");
    const data = await response.json();
    return data.data || data;
  },

  getById: async (id: string): Promise<Exercise> => {
    const response = await apiRequest("GET", `/api/v2/exercises/${id}`);
    const data = await response.json();
    return data.data || data;
  },

  getByMuscleGroup: async (muscleGroup: string): Promise<Exercise[]> => {
    const response = await apiRequest("GET", `/api/v2/exercises?muscleGroup=${encodeURIComponent(muscleGroup)}`);
    const data = await response.json();
    return data.data || data;
  },

  create: async (exercise: InsertExercise): Promise<Exercise> => {
    const response = await apiRequest("POST", "/api/v2/exercises", exercise);
    const data = await response.json();
    return data.data || data;
  },

  update: async (id: string, updates: Partial<InsertExercise>): Promise<Exercise> => {
    const response = await apiRequest("PUT", `/api/v2/exercises/${id}`, updates);
    const data = await response.json();
    return data.data || data;
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/v2/exercises/${id}`);
  },
};

export const workoutTemplateApi = {
  getAll: async (): Promise<WorkoutTemplate[]> => {
    const response = await apiRequest("GET", "/api/v2/workouts/templates");
    const data = await response.json();
    return data.data || data;
  },

  getById: async (id: string): Promise<WorkoutTemplate> => {
    const response = await apiRequest("GET", `/api/v2/workouts/templates/${id}`);
    const data = await response.json();
    return data.data || data;
  },

  getExercises: async (templateId: string) => {
    const response = await apiRequest("GET", `/api/v2/workouts/templates/${templateId}/exercises`);
    const data = await response.json();
    console.log("🔍 API getExercises response:", data);
    
    let exercises: any[] = [];
    
    // Check if response has data property (API v2 format) and extract exercises array
    if (data && typeof data === 'object' && data.data) {
      console.log("📦 Extracting data.data:", data.data);
      // If data.data has exercises array, return it
      if (data.data.exercises && Array.isArray(data.data.exercises)) {
        console.log("📦 Found exercises array:", data.data.exercises);
        exercises = data.data.exercises;
      }
      // If data.data is itself an array, return it
      else if (Array.isArray(data.data)) {
        exercises = data.data;
      }
    }
    // Check if response has exercises property  
    else if (data && typeof data === 'object' && data.exercises) {
      console.log("📦 Extracting data.exercises:", data.exercises);
      exercises = data.exercises;
    }
    // If data is directly an array
    else if (Array.isArray(data)) {
      console.log("📦 Found direct array data:", data);
      exercises = data;
    }
    
    // Sort exercises by order field to ensure correct sequence
    const sortedExercises = exercises.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
    console.log("📦 Returning sorted exercises by order:", sortedExercises);
    
    if (sortedExercises.length === 0) {
      console.log("📦 Returning empty array - no exercises found");
    }
    
    return sortedExercises;
  },

  create: async (template: InsertWorkoutTemplate): Promise<WorkoutTemplate> => {
    const response = await apiRequest("POST", "/api/v2/workouts/templates", template);
    const data = await response.json();
    return data.data || data;
  },

  update: async (id: string, updates: Partial<InsertWorkoutTemplate>): Promise<WorkoutTemplate> => {
    const response = await apiRequest("PUT", `/api/v2/workouts/templates/${id}`, updates);
    const data = await response.json();
    return data.data || data;
  },

  delete: async (id: string): Promise<void> => {
    await apiRequest("DELETE", `/api/v2/workouts/templates/${id}`);
  },

  addExercise: async (templateId: string, exercise: any) => {
    const response = await apiRequest("POST", `/api/v2/workouts/templates/exercises`, { ...exercise, templateId });
    const data = await response.json();
    return data.data || data;
  },

  updateExercise: async (exerciseId: string, updates: any) => {
    const response = await apiRequest("PUT", `/api/workout-template-exercises/${exerciseId}`, updates);
    const data = await response.json();
    return data.data || data;
  },

  removeExercise: async (templateId: string, exerciseId: string): Promise<void> => {
    await apiRequest("DELETE", `/api/v2/workouts/templates/${templateId}/exercises/${exerciseId}`);
  },
};

export const workoutLogApi = {
  getAll: async (): Promise<WorkoutLog[]> => {
    const response = await apiRequest("GET", "/api/v2/workouts/logs");
    const data = await response.json();
    return data.data || data;
  },

  getRecent: async (): Promise<WorkoutLog[]> => {
    const response = await apiRequest("GET", "/api/v2/workouts/logs?limit=10");
    const data = await response.json();
    return data.data || data;
  },

  getById: async (id: string): Promise<WorkoutLog> => {
    const response = await apiRequest("GET", `/api/v2/workouts/logs/${id}`);
    const data = await response.json();
    return data.data || data;
  },

  create: async (log: InsertWorkoutLog): Promise<WorkoutLog> => {
    const response = await apiRequest("POST", "/api/v2/workouts/logs", log);
    const data = await response.json();
    return data.data || data;
  },

  update: async (id: string, updates: Partial<InsertWorkoutLog>): Promise<WorkoutLog> => {
    const response = await apiRequest("PUT", `/api/v2/workouts/logs/${id}`, updates);
    const data = await response.json();
    return data.data || data;
  },

  getSets: async (logId: string) => {
    const response = await apiRequest("GET", `/api/v2/workouts/logs/${logId}/sets`);
    const data = await response.json();
    return data.data || data;
  },

  getSummary: async (id: string) => {
    const response = await apiRequest("GET", `/api/v2/workouts/logs/${id}/summary`);
    const data = await response.json();
    return data.data || data;
  },

  // Workout log exercises API
  createExercise: async (data: any) => {
    const response = await apiRequest("POST", "/api/v2/workouts/logs/exercises", data);
    const data_response = await response.json();
    return data_response.data || data_response;
  },

  // Workout log sets API
  createSet: async (data: any) => {
    const response = await apiRequest("POST", "/api/v2/workouts/logs/sets", data);
    const data_response = await response.json();
    return data_response.data || data_response;
  },
};

export const exerciseProgressApi = {
  getWeightHistory: async (exerciseId: string, limit: number = 10) => {
    const response = await apiRequest("GET", `/api/v2/exercises/${exerciseId}/weight-history?limit=${limit}`);
    const data = await response.json();
    return data.data || data;
  },
    
  getExercisesWeightSummary: async () => {
    const response = await apiRequest("GET", '/api/v2/exercises/weight-summary');
    const data = await response.json();
    return data.data || data;
  },

  getExercisesWithProgress: async () => {
    const response = await apiRequest("GET", '/api/v2/exercises/with-progress');
    const data = await response.json();
    return data.data || data;
  },

  getExercisesWithWeightHistory: async () => {
    const response = await apiRequest("GET", "/api/v2/exercises/with-weight-history");
    const data = await response.json();
    return data.data || data;
  },
};
