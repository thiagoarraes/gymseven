import { Router, Application } from 'express';
import { authRoutes, authMiddleware } from '../features/auth/routes';
import { exerciseRoutes } from '../features/exercises/routes';
import { getFeatureFlags } from '../core/config/featureFlags';

export const setupRoutes = (app: Application): void => {
  const flags = getFeatureFlags();
  const apiRouter = Router();

  // Setup API v2 routes with feature flags
  if (flags.useNewAuthModule) {
    console.log('🔄 Using new authentication module');
    apiRouter.use('/auth', authRoutes);
  } else {
    console.log('📱 Using legacy authentication module');
  }

  if (flags.useNewExerciseModule) {
    console.log('🔄 Using new exercise module');
    apiRouter.use('/exercises', authMiddleware.authenticate, exerciseRoutes);
  } else {
    console.log('💪 Using legacy exercise module');
  }

  // Mount API v2 routes
  app.use('/api/v2', apiRouter);

  // Health check endpoint
  apiRouter.get('/health', (req, res) => {
    res.json({
      status: 'success',
      message: 'API v2 is running',
      features: flags,
      timestamp: new Date().toISOString(),
    });
  });

  console.log('✅ API v2 routes configured');
};