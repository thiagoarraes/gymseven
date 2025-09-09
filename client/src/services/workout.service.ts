import { apiRequest } from '@/lib/queryClient';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  exercises?: WorkoutTemplateExercise[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutTemplateExercise {
  id: string;
  templateId: string;
  exerciseId: string;
  sets: number;
  reps: number | string;
  weight?: number | null;
  restTime?: number | null;
  notes?: string | null;
  order: number;
  exercise?: {
    id: string;
    name: string;
    nome: string;
    muscleGroup?: string;
    grupoMuscular?: string;
  };
}

export interface WorkoutLog {
  id: string;
  templateId?: string;
  name: string;
  userId: string;
  startTime: string;
  endTime?: string;
  completed: boolean;
  notes?: string;
}

export interface CreateWorkoutLogRequest {
  templateId?: string;
  name: string;
  userId: string;
}

export const workoutService = {
  // Get all workout templates for user
  async getWorkoutTemplates(userId: string): Promise<WorkoutTemplate[]> {
    const response = await fetch('/api/v2/workouts/templates', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch workout templates');
    }
    
    return response.json();
  },

  // Get workout templates with exercises
  async getWorkoutTemplatesWithExercises(userId: string): Promise<WorkoutTemplate[]> {
    const templates = await this.getWorkoutTemplates(userId);
    
    // For each template, fetch its exercises
    const templatesWithExercises = await Promise.all(
      templates.map(async (template) => {
        try {
          const response = await fetch(`/api/v2/workouts/templates/${template.id}/exercises`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
            }
          });
          
          if (response.ok) {
            const exercises = await response.json();
            return { ...template, exercises };
          } else {
            return { ...template, exercises: [] };
          }
        } catch (error) {
          console.warn(`Failed to fetch exercises for template ${template.id}:`, error);
          return { ...template, exercises: [] };
        }
      })
    );
    
    return templatesWithExercises;
  },

  // Create workout template
  async createWorkoutTemplate(data: { name: string; description?: string }, userId: string): Promise<WorkoutTemplate> {
    const response = await apiRequest('POST', '/api/v2/workouts/templates', data);
    return response.json();
  },

  // Update workout template
  async updateWorkoutTemplate(id: string, data: { name: string; description?: string }, userId: string): Promise<WorkoutTemplate> {
    const response = await apiRequest('PUT', `/api/v2/workouts/templates/${id}`, data);
    return response.json();
  },

  // Delete workout template
  async deleteWorkoutTemplate(id: string, userId: string): Promise<void> {
    await apiRequest('DELETE', `/api/v2/workouts/templates/${id}`);
  },

  // Create workout log (start workout)
  async createWorkoutLog(data: CreateWorkoutLogRequest): Promise<WorkoutLog> {
    const response = await apiRequest('POST', '/api/workout-logs', {
      templateId: data.templateId,
      name: data.name,
      startTime: new Date().toISOString(),
      completed: false
    });
    return response.json();
  }
};