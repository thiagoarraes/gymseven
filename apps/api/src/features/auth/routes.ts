import { Router } from 'express';
import { AuthController } from './controllers/AuthController';
import { AuthService } from './services/AuthService';
import { AuthMiddleware } from './middleware/authMiddleware';
import { validateBody } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/middleware/errorHandler';
import { loginSchema, registerSchema, changePasswordSchema, updateProfileSchema } from './dto';

// Create instances
const authService = new AuthService();
const authController = new AuthController(authService);
const authMiddleware = new AuthMiddleware(authService);

// Create router
const router = Router();

// Public routes
router.post('/login', 
  validateBody(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

router.post('/register',
  validateBody(registerSchema),
  asyncHandler(authController.register.bind(authController))
);

// Protected routes
router.get('/profile',
  authMiddleware.authenticate,
  asyncHandler(authController.getProfile.bind(authController))
);

router.put('/profile',
  authMiddleware.authenticate,
  validateBody(updateProfileSchema),
  asyncHandler(authController.updateProfile.bind(authController))
);

router.post('/change-password',
  authMiddleware.authenticate,
  validateBody(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController))
);

router.post('/logout',
  authMiddleware.authenticate,
  asyncHandler(authController.logout.bind(authController))
);

router.delete('/account',
  authMiddleware.authenticate,
  asyncHandler(authController.deleteAccount.bind(authController))
);

// Export router and middleware for use in other modules
export { router as authRoutes, authMiddleware };
export default router;