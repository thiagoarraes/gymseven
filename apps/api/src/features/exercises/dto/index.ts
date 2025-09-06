import { z } from 'zod';

// Exercise DTOs
export const createExerciseSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  muscleGroup: z.string().min(1, "Grupo muscular é obrigatório"),
  description: z.string().optional().nullable(),
});

export type CreateExerciseDto = z.infer<typeof createExerciseSchema>;

export const updateExerciseSchema = createExerciseSchema.partial();
export type UpdateExerciseDto = z.infer<typeof updateExerciseSchema>;

// Exercise filter DTOs
export const exerciseFilterSchema = z.object({
  muscleGroup: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['name', 'muscleGroup', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

export type ExerciseFilterDto = z.infer<typeof exerciseFilterSchema>;

// Exercise response DTOs
export interface ExerciseResponseDto {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  createdAt: Date;
  progress?: ExerciseProgressDto;
}

export interface ExerciseProgressDto {
  lastWeight?: number;
  lastReps?: number;
  lastDate?: Date;
  totalSessions?: number;
  progressTrend?: 'up' | 'down' | 'stable';
}