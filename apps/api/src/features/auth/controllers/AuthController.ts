import { Response } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../../../core/types';
import { ApiResponseHelper } from '../../../core/utils/response';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto } from '../dto';

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const loginData: LoginDto = req.body;
      const result = await this.authService.login(loginData);
      
      return ApiResponseHelper.success(res, result, 'Login realizado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Credenciais inválidas')) {
        return ApiResponseHelper.unauthorized(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async register(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const registerData: RegisterDto = req.body;
      const result = await this.authService.register(registerData);
      
      return ApiResponseHelper.created(res, result, 'Usuário criado com sucesso');
    } catch (error: any) {
      if (error.message.includes('já está em uso')) {
        return ApiResponseHelper.conflict(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const updateData: UpdateProfileDto = req.body;
      const result = await this.authService.updateProfile(req.user.id, updateData);
      
      return ApiResponseHelper.success(res, { user: result }, 'Perfil atualizado com sucesso');
    } catch (error: any) {
      if (error.message.includes('já está em uso')) {
        return ApiResponseHelper.conflict(res, error.message);
      }
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async changePassword(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const passwordData: ChangePasswordDto = req.body;
      await this.authService.changePassword(req.user.id, passwordData);
      
      return ApiResponseHelper.success(res, null, 'Senha alterada com sucesso');
    } catch (error: any) {
      if (error.message.includes('incorreta')) {
        return ApiResponseHelper.badRequest(res, error.message);
      }
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      await this.authService.deleteAccount(req.user.id);
      
      return ApiResponseHelper.success(res, null, 'Conta excluída com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async logout(req: AuthenticatedRequest, res: Response): Promise<Response> {
    // For JWT, logout is handled client-side by removing the token
    return ApiResponseHelper.success(res, null, 'Logout realizado com sucesso');
  }

  async getProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
    return ApiResponseHelper.success(res, { user: req.user }, 'Perfil recuperado com sucesso');
  }
}