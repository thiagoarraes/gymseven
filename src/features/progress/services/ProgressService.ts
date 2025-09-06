import { ApiClient } from '../../../lib/apiClient';
import { ApiResponse } from '../../../types/api';
import { 
  BodyMeasurement, 
  ExercisePR, 
  ProgressPhoto, 
  ProgressGoal,
  WorkoutStats,
  ProgressSummary,
  CreateBodyMeasurementRequest,
  UpdateBodyMeasurementRequest,
  CreateExercisePRRequest,
  UpdateExercisePRRequest,
  CreateProgressPhotoRequest,
  CreateProgressGoalRequest,
  UpdateProgressGoalRequest
} from '../types';

export class ProgressService {
  private apiClient = new ApiClient();

  // Body Measurements
  async getAllMeasurements(limit?: number): Promise<ApiResponse<BodyMeasurement[]>> {
    try {
      const params = limit ? `?limit=${limit}` : '';
      const response = await this.apiClient.get<ApiResponse<BodyMeasurement[]>>(`/api/v2/progress/measurements${params}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar medições',
        data: [],
      };
    }
  }

  async getMeasurementById(id: string): Promise<ApiResponse<BodyMeasurement>> {
    try {
      const response = await this.apiClient.get<ApiResponse<BodyMeasurement>>(`/api/v2/progress/measurements/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar medição',
      };
    }
  }

  async createMeasurement(measurementData: CreateBodyMeasurementRequest): Promise<ApiResponse<BodyMeasurement>> {
    try {
      const response = await this.apiClient.post<ApiResponse<BodyMeasurement>>('/api/v2/progress/measurements', measurementData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar medição',
      };
    }
  }

  async updateMeasurement(id: string, measurementData: UpdateBodyMeasurementRequest): Promise<ApiResponse<BodyMeasurement>> {
    try {
      const response = await this.apiClient.put<ApiResponse<BodyMeasurement>>(`/api/v2/progress/measurements/${id}`, measurementData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar medição',
      };
    }
  }

  async deleteMeasurement(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/progress/measurements/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir medição',
      };
    }
  }

  // Exercise Personal Records
  async getAllPRs(exerciseId?: string): Promise<ApiResponse<ExercisePR[]>> {
    try {
      const params = exerciseId ? `?exerciseId=${exerciseId}` : '';
      const response = await this.apiClient.get<ApiResponse<ExercisePR[]>>(`/api/v2/progress/prs${params}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar records pessoais',
        data: [],
      };
    }
  }

  async createPR(prData: CreateExercisePRRequest): Promise<ApiResponse<ExercisePR>> {
    try {
      const response = await this.apiClient.post<ApiResponse<ExercisePR>>('/api/v2/progress/prs', prData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar record pessoal',
      };
    }
  }

  async updatePR(id: string, prData: UpdateExercisePRRequest): Promise<ApiResponse<ExercisePR>> {
    try {
      const response = await this.apiClient.put<ApiResponse<ExercisePR>>(`/api/v2/progress/prs/${id}`, prData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar record pessoal',
      };
    }
  }

  async deletePR(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/progress/prs/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir record pessoal',
      };
    }
  }

  // Progress Photos
  async getAllPhotos(photoType?: string): Promise<ApiResponse<ProgressPhoto[]>> {
    try {
      const params = photoType ? `?type=${photoType}` : '';
      const response = await this.apiClient.get<ApiResponse<ProgressPhoto[]>>(`/api/v2/progress/photos${params}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar fotos de progresso',
        data: [],
      };
    }
  }

  async createPhoto(photoData: CreateProgressPhotoRequest): Promise<ApiResponse<ProgressPhoto>> {
    try {
      const response = await this.apiClient.post<ApiResponse<ProgressPhoto>>('/api/v2/progress/photos', photoData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar foto de progresso',
      };
    }
  }

  async deletePhoto(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/progress/photos/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir foto de progresso',
      };
    }
  }

  // Progress Goals
  async getAllGoals(isCompleted?: boolean): Promise<ApiResponse<ProgressGoal[]>> {
    try {
      const params = isCompleted !== undefined ? `?completed=${isCompleted}` : '';
      const response = await this.apiClient.get<ApiResponse<ProgressGoal[]>>(`/api/v2/progress/goals${params}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar metas de progresso',
        data: [],
      };
    }
  }

  async createGoal(goalData: CreateProgressGoalRequest): Promise<ApiResponse<ProgressGoal>> {
    try {
      const response = await this.apiClient.post<ApiResponse<ProgressGoal>>('/api/v2/progress/goals', goalData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar meta de progresso',
      };
    }
  }

  async updateGoal(id: string, goalData: UpdateProgressGoalRequest): Promise<ApiResponse<ProgressGoal>> {
    try {
      const response = await this.apiClient.put<ApiResponse<ProgressGoal>>(`/api/v2/progress/goals/${id}`, goalData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar meta de progresso',
      };
    }
  }

  async deleteGoal(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/progress/goals/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir meta de progresso',
      };
    }
  }

  // Statistics and Summary
  async getWorkoutStats(params?: {
    startDate?: Date;
    endDate?: Date;
    exerciseId?: string;
  }): Promise<ApiResponse<WorkoutStats>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('startDate', params.startDate.toISOString());
      if (params?.endDate) searchParams.append('endDate', params.endDate.toISOString());
      if (params?.exerciseId) searchParams.append('exerciseId', params.exerciseId);

      const response = await this.apiClient.get<ApiResponse<WorkoutStats>>(
        `/api/v2/progress/stats?${searchParams.toString()}`
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar estatísticas',
      };
    }
  }

  async getProgressSummary(): Promise<ApiResponse<ProgressSummary>> {
    try {
      const response = await this.apiClient.get<ApiResponse<ProgressSummary>>('/api/v2/progress/summary');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar resumo de progresso',
      };
    }
  }
}