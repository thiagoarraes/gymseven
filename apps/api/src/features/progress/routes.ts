import { Router } from 'express';
import { ProgressController } from './controllers/ProgressController';
import { ProgressService } from './services/ProgressService';
import { validateBody, validateQuery, validateParams } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/middleware/errorHandler';
import { 
  createBodyMeasurementSchema, 
  updateBodyMeasurementSchema,
  createExercisePRSchema,
  updateExercisePRSchema,
  createProgressPhotoSchema,
  updateProgressPhotoSchema,
  createProgressGoalSchema,
  updateProgressGoalSchema,
  getWorkoutStatsSchema
} from './dto';
import { z } from 'zod';

// Create instances
const progressService = new ProgressService();
const progressController = new ProgressController(progressService);

// Create router
const router = Router();

// Parameter validation schemas
const idParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

// Query validation schemas
const measurementsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
});

const prsQuerySchema = z.object({
  exerciseId: z.string().uuid().optional(),
});

const photosQuerySchema = z.object({
  type: z.enum(['front', 'side', 'back']).optional(),
});

const goalsQuerySchema = z.object({
  completed: z.enum(['true', 'false']).optional(),
});

const statsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  exerciseId: z.string().uuid().optional(),
});

// Body Measurements Routes
router.get('/measurements',
  validateQuery(measurementsQuerySchema),
  asyncHandler(progressController.getAllMeasurements.bind(progressController))
);

router.get('/measurements/:id',
  validateParams(idParamSchema),
  asyncHandler(progressController.getMeasurementById.bind(progressController))
);

router.post('/measurements',
  validateBody(createBodyMeasurementSchema),
  asyncHandler(progressController.createMeasurement.bind(progressController))
);

router.put('/measurements/:id',
  validateParams(idParamSchema),
  validateBody(updateBodyMeasurementSchema),
  asyncHandler(progressController.updateMeasurement.bind(progressController))
);

router.delete('/measurements/:id',
  validateParams(idParamSchema),
  asyncHandler(progressController.deleteMeasurement.bind(progressController))
);

// Exercise Personal Records Routes
router.get('/prs',
  validateQuery(prsQuerySchema),
  asyncHandler(progressController.getAllPRs.bind(progressController))
);

router.get('/prs/:id',
  validateParams(idParamSchema),
  asyncHandler(progressController.getPRById.bind(progressController))
);

router.post('/prs',
  validateBody(createExercisePRSchema),
  asyncHandler(progressController.createPR.bind(progressController))
);

router.put('/prs/:id',
  validateParams(idParamSchema),
  validateBody(updateExercisePRSchema),
  asyncHandler(progressController.updatePR.bind(progressController))
);

router.delete('/prs/:id',
  validateParams(idParamSchema),
  asyncHandler(progressController.deletePR.bind(progressController))
);

// Progress Photos Routes
router.get('/photos',
  validateQuery(photosQuerySchema),
  asyncHandler(progressController.getAllPhotos.bind(progressController))
);

router.post('/photos',
  validateBody(createProgressPhotoSchema),
  asyncHandler(progressController.createPhoto.bind(progressController))
);

router.delete('/photos/:id',
  validateParams(idParamSchema),
  asyncHandler(progressController.deletePhoto.bind(progressController))
);

// Progress Goals Routes
router.get('/goals',
  validateQuery(goalsQuerySchema),
  asyncHandler(progressController.getAllGoals.bind(progressController))
);

router.post('/goals',
  validateBody(createProgressGoalSchema),
  asyncHandler(progressController.createGoal.bind(progressController))
);

router.put('/goals/:id',
  validateParams(idParamSchema),
  validateBody(updateProgressGoalSchema),
  asyncHandler(progressController.updateGoal.bind(progressController))
);

router.delete('/goals/:id',
  validateParams(idParamSchema),
  asyncHandler(progressController.deleteGoal.bind(progressController))
);

// Statistics and Summary Routes
router.get('/stats',
  validateQuery(statsQuerySchema),
  asyncHandler(progressController.getWorkoutStats.bind(progressController))
);

router.get('/summary',
  asyncHandler(progressController.getProgressSummary.bind(progressController))
);

export { router as progressRoutes };
export default router;