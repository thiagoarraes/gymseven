import { z } from 'zod';

// Body Measurement DTOs
export const createBodyMeasurementSchema = z.object({
  weight: z.number().min(20, "Peso deve ser pelo menos 20kg").max(500, "Peso deve ser no máximo 500kg").optional(),
  height: z.number().min(100, "Altura deve ser pelo menos 100cm").max(250, "Altura deve ser no máximo 250cm").optional(),
  bodyFat: z.number().min(0, "Percentual de gordura deve ser positivo").max(50, "Percentual de gordura deve ser no máximo 50%").optional(),
  muscleMass: z.number().min(10, "Massa muscular deve ser pelo menos 10kg").max(200, "Massa muscular deve ser no máximo 200kg").optional(),
  waist: z.number().min(50, "Cintura deve ser pelo menos 50cm").max(200, "Cintura deve ser no máximo 200cm").optional(),
  chest: z.number().min(60, "Peito deve ser pelo menos 60cm").max(200, "Peito deve ser no máximo 200cm").optional(),
  arms: z.number().min(15, "Braços devem ser pelo menos 15cm").max(100, "Braços devem ser no máximo 100cm").optional(),
  thighs: z.number().min(30, "Coxas devem ser pelo menos 30cm").max(150, "Coxas devem ser no máximo 150cm").optional(),
  notes: z.string().max(500, "Observações devem ter no máximo 500 caracteres").optional(),
  measuredAt: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

export type CreateBodyMeasurementDto = z.infer<typeof createBodyMeasurementSchema>;

export const updateBodyMeasurementSchema = createBodyMeasurementSchema.partial();
export type UpdateBodyMeasurementDto = z.infer<typeof updateBodyMeasurementSchema>;

// Exercise PR (Personal Records) DTOs
export const createExercisePRSchema = z.object({
  exerciseId: z.string().uuid("Exercise ID deve ser um UUID válido"),
  weight: z.number().min(0, "Peso deve ser positivo"),
  reps: z.number().min(1, "Repetições devem ser pelo menos 1"),
  date: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
  notes: z.string().max(300, "Observações devem ter no máximo 300 caracteres").optional(),
});

export type CreateExercisePRDto = z.infer<typeof createExercisePRSchema>;

export const updateExercisePRSchema = createExercisePRSchema.partial().omit({ exerciseId: true });
export type UpdateExercisePRDto = z.infer<typeof updateExercisePRSchema>;

// Progress Photo DTOs
export const createProgressPhotoSchema = z.object({
  photoUrl: z.string().url("URL da foto deve ser válida"),
  photoType: z.enum(['front', 'side', 'back'], { 
    errorMap: () => ({ message: "Tipo de foto deve ser: front, side ou back" })
  }),
  notes: z.string().max(300, "Observações devem ter no máximo 300 caracteres").optional(),
  takenAt: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

export type CreateProgressPhotoDto = z.infer<typeof createProgressPhotoSchema>;

export const updateProgressPhotoSchema = createProgressPhotoSchema.partial();
export type UpdateProgressPhotoDto = z.infer<typeof updateProgressPhotoSchema>;

// Progress Goal DTOs
export const createProgressGoalSchema = z.object({
  title: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(100, "Título deve ter no máximo 100 caracteres"),
  description: z.string().max(500, "Descrição deve ter no máximo 500 caracteres").optional(),
  targetType: z.enum(['weight', 'bodyFat', 'muscleMass', 'exercise', 'custom'], {
    errorMap: () => ({ message: "Tipo de meta deve ser: weight, bodyFat, muscleMass, exercise ou custom" })
  }),
  targetValue: z.number().min(0, "Valor alvo deve ser positivo"),
  currentValue: z.number().min(0, "Valor atual deve ser positivo").default(0),
  targetDate: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
  isCompleted: z.boolean().default(false),
  exerciseId: z.string().uuid().optional(), // Para metas de exercício específico
});

export type CreateProgressGoalDto = z.infer<typeof createProgressGoalSchema>;

export const updateProgressGoalSchema = createProgressGoalSchema.partial();
export type UpdateProgressGoalDto = z.infer<typeof updateProgressGoalSchema>;

// Workout Statistics DTOs
export const getWorkoutStatsSchema = z.object({
  startDate: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
  endDate: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
  exerciseId: z.string().uuid().optional(),
});

export type GetWorkoutStatsDto = z.infer<typeof getWorkoutStatsSchema>;

// Response DTOs
export interface BodyMeasurementResponseDto {
  id: string;
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
  measuredAt: Date;
  createdAt: Date;
  bmi?: number; // Calculated field
}

export interface ExercisePRResponseDto {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: Date;
  notes?: string;
  oneRepMax?: number; // Calculated field
  exercise?: {
    id: string;
    name: string;
    muscleGroup: string;
  };
}

export interface ProgressPhotoResponseDto {
  id: string;
  photoUrl: string;
  photoType: 'front' | 'side' | 'back';
  notes?: string;
  takenAt: Date;
  createdAt: Date;
}

export interface ProgressGoalResponseDto {
  id: string;
  title: string;
  description?: string;
  targetType: 'weight' | 'bodyFat' | 'muscleMass' | 'exercise' | 'custom';
  targetValue: number;
  currentValue: number;
  targetDate?: Date;
  isCompleted: boolean;
  exerciseId?: string;
  createdAt: Date;
  updatedAt: Date;
  progressPercentage?: number; // Calculated field
  exercise?: {
    id: string;
    name: string;
  };
}

export interface WorkoutStatsResponseDto {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number; // Total weight lifted
  averageWorkoutDuration: number; // In minutes
  workoutFrequency: number; // Workouts per week
  lastWorkoutDate?: Date;
  strengthProgress?: {
    exerciseId: string;
    exerciseName: string;
    currentPR: number;
    previousPR?: number;
    improvement?: number; // Percentage
  }[];
  bodyComposition?: {
    currentWeight?: number;
    previousWeight?: number;
    weightChange?: number;
    currentBodyFat?: number;
    previousBodyFat?: number;
    bodyFatChange?: number;
  };
}

export interface ProgressSummaryResponseDto {
  bodyMeasurements: {
    latest?: BodyMeasurementResponseDto;
    previous?: BodyMeasurementResponseDto;
    changes: {
      weight?: number;
      bodyFat?: number;
      muscleMass?: number;
    };
  };
  exercisePRs: {
    recent: ExercisePRResponseDto[];
    totalPRs: number;
  };
  goals: {
    active: ProgressGoalResponseDto[];
    completed: ProgressGoalResponseDto[];
    totalGoals: number;
  };
  workoutStats: WorkoutStatsResponseDto;
}