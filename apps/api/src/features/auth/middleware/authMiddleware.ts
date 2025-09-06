import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthenticatedRequest } from '../../../core/types';
import { ApiResponseHelper } from '../../../core/utils/response';

export class AuthMiddleware {
  constructor(private authService: AuthService) {}

  authenticate = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        ApiResponseHelper.unauthorized(res, 'Token de acesso requerido');
        return;
      }

      const token = authHeader.substring(7);
      const user = this.authService.verifyToken(token);
      
      (req as AuthenticatedRequest).user = user;
      next();
    } catch (error: any) {
      ApiResponseHelper.unauthorized(res, 'Token inválido ou expirado');
    }
  };

  optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    try {
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = this.authService.verifyToken(token);
        (req as AuthenticatedRequest).user = user;
      }
      
      next();
    } catch (error) {
      // Optional auth - continue even if token is invalid
      next();
    }
  };
}