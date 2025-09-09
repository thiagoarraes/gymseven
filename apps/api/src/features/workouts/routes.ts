import { Router } from 'express';
import { WorkoutController } from './controllers/WorkoutController';
import { WorkoutService } from './services/WorkoutService';
import { validateBody, validateQuery, validateParams } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/middleware/errorHandler';
import { 
  createWorkoutTemplateSchema, 
  updateWorkoutTemplateSchema,
  addExerciseToTemplateSchema,
  updateTemplateExerciseSchema,
  createWorkoutLogSchema,
  updateWorkoutLogSchema,
  createWorkoutLogExerciseSchema,
  createWorkoutLogSetSchema,
  updateWorkoutLogSetSchema
} from './dto';
import { z } from 'zod';

// Create instances
const workoutService = new WorkoutService();
const workoutController = new WorkoutController(workoutService);

// Create router
const router = Router();

// Parameter validation schemas
const idParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

const templateExerciseParamSchema = z.object({
  templateId: z.string().uuid('Template ID deve ser um UUID válido'),
  exerciseId: z.string().uuid('Exercise ID deve ser um UUID válido'),
});

const exerciseIdParamSchema = z.object({
  exerciseId: z.string().uuid('Exercise ID deve ser um UUID válido'),
});

const setIdParamSchema = z.object({
  setId: z.string().uuid('Set ID deve ser um UUID válido'),
});

// Query validation schemas
const logsQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).optional(),
});

// Workout Templates Routes
router.get('/templates',
  asyncHandler(workoutController.getAllTemplates.bind(workoutController))
);

router.get('/templates/:id',
  validateParams(idParamSchema),
  asyncHandler(workoutController.getTemplateById.bind(workoutController))
);

router.get('/templates/:id/exercises',
  validateParams(idParamSchema),
  asyncHandler(workoutController.getTemplateWithExercises.bind(workoutController))
);

router.post('/templates',
  // Skip DTO validation, let shared schema handle transformation
  asyncHandler(workoutController.createTemplate.bind(workoutController))
);

router.put('/templates/:id',
  validateParams(idParamSchema),
  validateBody(updateWorkoutTemplateSchema),
  asyncHandler(workoutController.updateTemplate.bind(workoutController))
);

router.delete('/templates/:id',
  validateParams(idParamSchema),
  asyncHandler(workoutController.deleteTemplate.bind(workoutController))
);

router.post('/templates/exercises',
  validateBody(addExerciseToTemplateSchema),
  asyncHandler(workoutController.addExerciseToTemplate.bind(workoutController))
);

router.put('/templates/exercises/:exerciseId',
  validateParams(exerciseIdParamSchema),
  validateBody(updateTemplateExerciseSchema),
  asyncHandler(workoutController.updateTemplateExercise.bind(workoutController))
);

router.delete('/templates/:templateId/exercises/:exerciseId',
  validateParams(templateExerciseParamSchema),
  asyncHandler(workoutController.removeExerciseFromTemplate.bind(workoutController))
);

// Workout Logs Routes
router.get('/logs',
  validateQuery(logsQuerySchema),
  asyncHandler(workoutController.getAllLogs.bind(workoutController))
);

router.get('/logs/:id',
  validateParams(idParamSchema),
  asyncHandler(workoutController.getLogById.bind(workoutController))
);

router.post('/logs',
  validateBody(createWorkoutLogSchema),
  asyncHandler(workoutController.createLog.bind(workoutController))
);

router.put('/logs/:id',
  validateParams(idParamSchema),
  validateBody(updateWorkoutLogSchema),
  asyncHandler(workoutController.updateLog.bind(workoutController))
);

router.delete('/logs/:id',
  validateParams(idParamSchema),
  asyncHandler(workoutController.deleteLog.bind(workoutController))
);

router.post('/logs/exercises',
  validateBody(createWorkoutLogExerciseSchema),
  asyncHandler(workoutController.createLogExercise.bind(workoutController))
);

router.post('/logs/sets',
  validateBody(createWorkoutLogSetSchema),
  asyncHandler(workoutController.createLogSet.bind(workoutController))
);

router.put('/logs/sets/:setId',
  validateParams(setIdParamSchema),
  validateBody(updateWorkoutLogSetSchema),
  asyncHandler(workoutController.updateLogSet.bind(workoutController))
);

export { router as workoutRoutes };
export default router;