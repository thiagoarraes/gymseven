import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../../../core/types';
import { ApiResponseHelper } from '../../../core/utils/response';

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('🔍 [AUTH MIDDLEWARE V2] Authenticating request to:', req.path);
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('❌ [AUTH MIDDLEWARE V2] No Bearer token found');
        ApiResponseHelper.unauthorized(res, 'Token de acesso requerido');
        return;
      }

      const token = authHeader.substring(7);
      console.log('🔍 [AUTH MIDDLEWARE V2] Token received:', token.substring(0, 20) + '...');
      
      const user = await this.authService.verifyToken(token);
      console.log('✅ [AUTH MIDDLEWARE V2] User authenticated:', user.email);
      
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error: any) {
      console.log('❌ [AUTH MIDDLEWARE V2] Authentication failed:', error.message);
      ApiResponseHelper.unauthorized(res, 'Token inválido ou expirado');
    }
  };

  optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = await this.authService.verifyToken(token);
        (req as AuthenticatedRequest).user = user;
      }
      
      next();
    } catch (error) {
      // Optional auth - continue even if token is invalid
      next();
    }
  };
}