import { z } from 'zod';

// Workout Template DTOs
export const createWorkoutTemplateSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  description: z.string().optional().nullable(),
});

export type CreateWorkoutTemplateDto = z.infer<typeof createWorkoutTemplateSchema>;

export const updateWorkoutTemplateSchema = createWorkoutTemplateSchema.partial();
export type UpdateWorkoutTemplateDto = z.infer<typeof updateWorkoutTemplateSchema>;

// Workout Template Exercise DTOs
export const addExerciseToTemplateSchema = z.object({
  templateId: z.string().uuid("Template ID deve ser um UUID válido"),
  exerciseId: z.string().uuid("Exercise ID deve ser um UUID válido"),
  sets: z.number().min(1, "Número de séries deve ser pelo menos 1"),
  reps: z.union([z.string(), z.number()]).transform((val) => String(val)),
  weight: z.number().nullable().optional(),
  restDurationSeconds: z.number().default(90),
  order: z.number().min(0, "Ordem deve ser um número positivo"),
});

export type AddExerciseToTemplateDto = z.infer<typeof addExerciseToTemplateSchema>;

export const updateTemplateExerciseSchema = addExerciseToTemplateSchema.partial().omit({
  templateId: true,
  exerciseId: true,
});
export type UpdateTemplateExerciseDto = z.infer<typeof updateTemplateExerciseSchema>;

// Workout Log DTOs
export const createWorkoutLogSchema = z.object({
  templateId: z.string().uuid().optional(),
  name: z.string().min(1, "Nome do treino é obrigatório"),
  startTime: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
  endTime: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

export type CreateWorkoutLogDto = z.infer<typeof createWorkoutLogSchema>;

export const updateWorkoutLogSchema = createWorkoutLogSchema.partial();
export type UpdateWorkoutLogDto = z.infer<typeof updateWorkoutLogSchema>;

// Workout Log Exercise DTOs
export const createWorkoutLogExerciseSchema = z.object({
  registroId: z.string().uuid("Registro ID deve ser um UUID válido"),
  exercicioId: z.string().uuid("Exercício ID deve ser um UUID válido"),
  nomeExercicio: z.string().optional(),
  order: z.number().min(0, "Ordem deve ser um número positivo"),
});

export type CreateWorkoutLogExerciseDto = z.infer<typeof createWorkoutLogExerciseSchema>;

// Workout Log Set DTOs
export const createWorkoutLogSetSchema = z.object({
  logExerciseId: z.string().uuid("Log Exercise ID deve ser um UUID válido"),
  setNumber: z.number().min(1, "Número da série deve ser pelo menos 1"),
  reps: z.number().min(0, "Número de repetições deve ser positivo").optional(),
  weight: z.number().min(0, "Peso deve ser positivo").nullable().optional(),
  completed: z.boolean().default(false),
});

export type CreateWorkoutLogSetDto = z.infer<typeof createWorkoutLogSetSchema>;

export const updateWorkoutLogSetSchema = createWorkoutLogSetSchema.partial().omit({
  logExerciseId: true,
  setNumber: true,
});
export type UpdateWorkoutLogSetDto = z.infer<typeof updateWorkoutLogSetSchema>;

// Response DTOs
export interface WorkoutTemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  exercises?: WorkoutTemplateExerciseResponseDto[];
  totalExercises?: number;
}

export interface WorkoutTemplateExerciseResponseDto {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  weight?: number;
  restDurationSeconds: number;
  order: number;
  exercise?: {
    id: string;
    name: string;
    muscleGroup: string;
  };
}

export interface WorkoutLogResponseDto {
  id: string;
  templateId?: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  exercises?: WorkoutLogExerciseResponseDto[];
  totalSets?: number;
  totalVolume?: number;
}

export interface WorkoutLogExerciseResponseDto {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets?: WorkoutLogSetResponseDto[];
  totalSets?: number;
  totalVolume?: number;
}

export interface WorkoutLogSetResponseDto {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  completed: boolean;
}