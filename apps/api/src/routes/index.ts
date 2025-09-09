import { Router, Application } from 'express';
import { authRoutes, authMiddleware } from '../features/auth/routes';
import { exerciseRoutes } from '../features/exercises/routes';
import { workoutRoutes } from '../features/workouts/routes';
import { progressRoutes } from '../features/progress/routes';
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

  if (flags.useNewWorkoutModule) {
    console.log('🔄 Using new workout module');
    // Create a wrapper for the async middleware to ensure proper Promise handling
    const authWrapper = (req: any, res: any, next: any) => {
      console.log('🔍 [ROUTER] Applying auth middleware for:', req.path);
      authMiddleware.authenticate(req, res, next).catch((error: any) => {
        console.error('❌ [ROUTER] Auth middleware error:', error);
        next(error);
      });
    };
    apiRouter.use('/workouts', authWrapper, workoutRoutes);
  } else {
    console.log('🏋️ Using legacy workout module');
  }

  if (flags.useNewProgressModule) {
    console.log('🔄 Using new progress module');
    apiRouter.use('/progress', authMiddleware.authenticate, progressRoutes);
  } else {
    console.log('📊 Using legacy progress module');
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