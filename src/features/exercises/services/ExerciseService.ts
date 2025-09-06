import { ApiClient } from '../../../lib/apiClient';
import { ApiResponse, PaginatedResponse } from '../../../types/api';
import { Exercise, CreateExerciseRequest, UpdateExerciseRequest } from '../types';

export class ExerciseService {
  private apiClient = new ApiClient();

  async getAllExercises(params?: {
    muscleGroup?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Exercise>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.muscleGroup) searchParams.append('muscleGroup', params.muscleGroup);
      if (params?.search) searchParams.append('search', params.search);
      if (params?.page) searchParams.append('page', params.page.toString());
      if (params?.limit) searchParams.append('limit', params.limit.toString());

      const response = await this.apiClient.get<PaginatedResponse<Exercise>>(
        `/api/v2/exercises?${searchParams.toString()}`
      );
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar exercícios',
        data: [],
      };
    }
  }

  async getExerciseById(id: string): Promise<ApiResponse<Exercise>> {
    try {
      const response = await this.apiClient.get<ApiResponse<Exercise>>(`/api/v2/exercises/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar exercício',
      };
    }
  }

  async createExercise(exerciseData: CreateExerciseRequest): Promise<ApiResponse<Exercise>> {
    try {
      const response = await this.apiClient.post<ApiResponse<Exercise>>('/api/v2/exercises', exerciseData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar exercício',
      };
    }
  }

  async updateExercise(id: string, exerciseData: UpdateExerciseRequest): Promise<ApiResponse<Exercise>> {
    try {
      const response = await this.apiClient.put<ApiResponse<Exercise>>(`/api/v2/exercises/${id}`, exerciseData);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar exercício',
      };
    }
  }

  async deleteExercise(id: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<ApiResponse<void>>(`/api/v2/exercises/${id}`);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao excluir exercício',
      };
    }
  }

  async getMuscleGroups(): Promise<ApiResponse<string[]>> {
    try {
      const response = await this.apiClient.get<ApiResponse<string[]>>('/api/v2/exercises/muscle-groups');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar grupos musculares',
        data: [],
      };
    }
  }
}