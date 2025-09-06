import { Router } from 'express';
import { ExerciseController } from './controllers/ExerciseController';
import { ExerciseService } from './services/ExerciseService';
import { validateBody, validateQuery, validateParams } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/middleware/errorHandler';
import { createExerciseSchema, updateExerciseSchema, exerciseFilterSchema } from './dto';
import { z } from 'zod';

// Create instances
const exerciseService = new ExerciseService();
const exerciseController = new ExerciseController(exerciseService);

// Create router
const router = Router();

// Parameter validation schemas
const idParamSchema = z.object({
  id: z.string().uuid('ID deve ser um UUID válido'),
});

const muscleGroupParamSchema = z.object({
  muscleGroup: z.string().min(1, 'Grupo muscular é obrigatório'),
});

// Routes
router.get('/',
  validateQuery(exerciseFilterSchema),
  asyncHandler(exerciseController.getAll.bind(exerciseController))
);

router.get('/muscle-group/:muscleGroup',
  validateParams(muscleGroupParamSchema),
  asyncHandler(exerciseController.getByMuscleGroup.bind(exerciseController))
);

router.get('/:id',
  validateParams(idParamSchema),
  asyncHandler(exerciseController.getById.bind(exerciseController))
);

router.post('/',
  validateBody(createExerciseSchema),
  asyncHandler(exerciseController.create.bind(exerciseController))
);

router.put('/:id',
  validateParams(idParamSchema),
  validateBody(updateExerciseSchema),
  asyncHandler(exerciseController.update.bind(exerciseController))
);

router.delete('/:id',
  validateParams(idParamSchema),
  asyncHandler(exerciseController.delete.bind(exerciseController))
);

export { router as exerciseRoutes };
export default router;