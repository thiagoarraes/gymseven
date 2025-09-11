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
    try {
      const response = await fetch('/api/v2/workouts/templates', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Check if response is HTML (error page) vs JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned error (${response.status}): Unable to fetch workout templates`);
        }
        
        // Try to get JSON error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch workout templates (${response.status})`);
        } catch {
          throw new Error(`Failed to fetch workout templates (${response.status})`);
        }
      }
      
      const responseData = await response.json();
      // Extract data array from API v2 response structure
      return responseData.data || responseData;
    } catch (error: any) {
      console.error('Error fetching workout templates:', error);
      // Re-throw with a cleaner message
      if (error.message.includes('<!DOCTYPE') || error.message.includes('Unexpected token')) {
        throw new Error('Erro ao carregar treinos - Verifique sua conexão e tente novamente');
      }
      throw new Error(error.message || 'Erro ao carregar treinos');
    }
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
            const responseData = await response.json();
            // Check if response has .data property (API v2 structure)
            const exercises = responseData.data?.exercises || responseData.exercises || responseData;
            
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
      modeloId: data.templateId,
      nome: data.name,
      startTime: new Date().toISOString(),
      completed: false
    });
    return response.json();
  },

  // Get all workout logs
  async getAllLogs(limit?: number): Promise<{ success: boolean; data: WorkoutLog[]; error?: string }> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await fetch(`/api/v2/workouts/logs${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Check if response is HTML (error page) vs JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`Server returned error (${response.status}): Unable to fetch workout logs`);
        }
        
        // Try to get JSON error message
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `Failed to fetch workout logs (${response.status})`);
        } catch {
          throw new Error(`Failed to fetch workout logs (${response.status})`);
        }
      }
      
      const responseData = await response.json();
      return {
        success: true,
        data: responseData.data || responseData
      };
    } catch (error: any) {
      console.error('Error fetching workout logs:', error);
      // Handle JSON parsing errors more gracefully
      let errorMessage = error.message;
      if (error.message.includes('<!DOCTYPE') || error.message.includes('Unexpected token')) {
        errorMessage = 'Erro ao carregar histórico de treinos - Verifique sua conexão';
      }
      
      return {
        success: false,
        data: [],
        error: errorMessage
      };
    }
  }
};