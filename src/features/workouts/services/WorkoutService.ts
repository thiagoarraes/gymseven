import { ApiClient } from '../../../lib/apiClient';
import { ApiResponse } from '../../../types/api';
import { 
  WorkoutTemplate, 
  WorkoutLog, 
  CreateWorkoutTemplateRequest, 
  UpdateWorkoutTemplateRequest,
  CreateWorkoutLogRequest,
  UpdateWorkoutLogRequest,
  AddExerciseToTemplateRequest,
  UpdateTemplateExerciseRequest,
  CreateWorkoutLogSetRequest,
  UpdateWorkoutLogSetRequest
} from '../types';

export class WorkoutService {
  private apiClient = new ApiClient();

  // Workout Templates
  async getAllTemplates(): Promise<ApiResponse<WorkoutTemplate[]>> {
    try {
      const response = await this.apiClient.get<ApiResponse<WorkoutTemplate[]>>('/api/v2/workouts/templates');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar templates',
        data: [],
      };
    }
  }

  async getTemplateById(id: string): Promise<ApiResponse<WorkoutTemplate>> {
    try {
      const response = await this.apiClient.get<ApiResponse<WorkoutTemplate>>(`/api/v2/workouts/templates/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar template',
      };
    }
  }

  async getTemplateWithExercises(id: string): Promise<ApiResponse<WorkoutTemplate>> {
    try {
      const response = await this.apiClient.get<ApiResponse<WorkoutTemplate>>(`/api/v2/workouts/templates/${id}/exercises`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar template com exercícios',
      };
    }
  }

  async createTemplate(templateData: CreateWorkoutTemplateRequest): Promise<ApiResponse<WorkoutTemplate>> {
    try {
      const response = await this.apiClient.post<ApiResponse<WorkoutTemplate>>('/api/v2/workouts/templates', templateData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar template',
      };
    }
  }

  async updateTemplate(id: string, templateData: UpdateWorkoutTemplateRequest): Promise<ApiResponse<WorkoutTemplate>> {
    try {
      const response = await this.apiClient.put<ApiResponse<WorkoutTemplate>>(`/api/v2/workouts/templates/${id}`, templateData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar template',
      };
    }
  }

  async deleteTemplate(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/workouts/templates/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir template',
      };
    }
  }

  async addExerciseToTemplate(exerciseData: AddExerciseToTemplateRequest): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.post<ApiResponse<any>>('/api/v2/workouts/templates/exercises', exerciseData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao adicionar exercício ao template',
      };
    }
  }

  async updateTemplateExercise(exerciseId: string, exerciseData: UpdateTemplateExerciseRequest): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.put<ApiResponse<any>>(`/api/v2/workouts/templates/exercises/${exerciseId}`, exerciseData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar exercício do template',
      };
    }
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/workouts/templates/${templateId}/exercises/${exerciseId}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao remover exercício do template',
      };
    }
  }

  // Workout Logs
  async getAllLogs(limit?: number): Promise<ApiResponse<WorkoutLog[]>> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await this.apiClient.get<ApiResponse<WorkoutLog[]>>(`/api/v2/workouts/logs${params}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar logs de treino',
        data: [],
      };
    }
  }

  async getLogById(id: string): Promise<ApiResponse<WorkoutLog>> {
    try {
      const response = await this.apiClient.get<ApiResponse<WorkoutLog>>(`/api/v2/workouts/logs/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar log de treino',
      };
    }
  }

  async createLog(logData: CreateWorkoutLogRequest): Promise<ApiResponse<WorkoutLog>> {
    try {
      const response = await this.apiClient.post<ApiResponse<WorkoutLog>>('/api/v2/workouts/logs', logData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar log de treino',
      };
    }
  }

  async updateLog(id: string, logData: UpdateWorkoutLogRequest): Promise<ApiResponse<WorkoutLog>> {
    try {
      const response = await this.apiClient.put<ApiResponse<WorkoutLog>>(`/api/v2/workouts/logs/${id}`, logData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar log de treino',
      };
    }
  }

  async deleteLog(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/workouts/logs/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir log de treino',
      };
    }
  }

  async createLogSet(setData: CreateWorkoutLogSetRequest): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.post<ApiResponse<any>>('/api/v2/workouts/logs/sets', setData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar série',
      };
    }
  }

  async updateLogSet(setId: string, setData: UpdateWorkoutLogSetRequest): Promise<ApiResponse<any>> {
    try {
      const response = await this.apiClient.put<ApiResponse<any>>(`/api/v2/workouts/logs/sets/${setId}`, setData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar série',
      };
    }
  }
}