import { ApiClient } from '../../../lib/apiClient';
import { ApiResponse } from '../../../types/api';
import { User } from '../types';

export class AuthService {
  private apiClient = new ApiClient();

  async login(email: string, password: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.apiClient.post<ApiResponse<User>>('/api/v2/auth/login', {
        email,
        password,
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao fazer login',
      };
    }
  }

  async register(email: string, password: string, name: string): Promise<ApiResponse<User>> {
    try {
      const response = await this.apiClient.post<ApiResponse<User>>('/api/v2/auth/register', {
        email,
        password,
        name,
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao criar conta',
      };
    }
  }

  async logout(): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.post<ApiResponse<void>>('/api/v2/auth/logout');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao fazer logout',
      };
    }
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await this.apiClient.get<ApiResponse<User>>('/api/v2/auth/profile');
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao buscar usuário',
      };
    }
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const response = await this.apiClient.put<ApiResponse<User>>('/api/v2/auth/profile', data);
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao atualizar perfil',
      };
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.apiClient.post<ApiResponse<void>>('/api/v2/auth/change-password', {
        currentPassword,
        newPassword,
      });
      return response;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Erro ao alterar senha',
      };
    }
  }
}