export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  exercises?: WorkoutTemplateExercise[];
  totalExercises?: number;
}

export interface WorkoutTemplateExercise {
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

export interface WorkoutLog {
  id: string;
  templateId?: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  exercises?: WorkoutLogExercise[];
  totalSets?: number;
  totalVolume?: number;
}

export interface WorkoutLogExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  order: number;
  sets?: WorkoutLogSet[];
  totalSets?: number;
  totalVolume?: number;
}

export interface WorkoutLogSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  completed: boolean;
}

// Request types
export interface CreateWorkoutTemplateRequest {
  name: string;
  description?: string;
}

export interface UpdateWorkoutTemplateRequest {
  name?: string;
  description?: string;
}

export interface AddExerciseToTemplateRequest {
  templateId: string;
  exerciseId: string;
  sets: number;
  reps: string;
  weight?: number;
  restDurationSeconds?: number;
  order: number;
}

export interface UpdateTemplateExerciseRequest {
  sets?: number;
  reps?: string;
  weight?: number;
  restDurationSeconds?: number;
  order?: number;
}

export interface CreateWorkoutLogRequest {
  templateId?: string;
  name: string;
  startTime: Date;
  endTime?: Date;
}

export interface UpdateWorkoutLogRequest {
  templateId?: string;
  name?: string;
  startTime?: Date;
  endTime?: Date;
}

export interface CreateWorkoutLogSetRequest {
  logExerciseId: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  completed?: boolean;
}

export interface UpdateWorkoutLogSetRequest {
  reps?: number;
  weight?: number;
  completed?: boolean;
}