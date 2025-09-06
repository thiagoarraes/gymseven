export interface BodyMeasurement {
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
  bmi?: number;
}

export interface ExercisePR {
  id: string;
  exerciseId: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: Date;
  notes?: string;
  oneRepMax?: number;
  exercise?: {
    id: string;
    name: string;
    muscleGroup: string;
  };
}

export interface ProgressPhoto {
  id: string;
  photoUrl: string;
  photoType: 'front' | 'side' | 'back';
  notes?: string;
  takenAt: Date;
  createdAt: Date;
}

export interface ProgressGoal {
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
  progressPercentage?: number;
  exercise?: {
    id: string;
    name: string;
  };
}

export interface WorkoutStats {
  totalWorkouts: number;
  totalSets: number;
  totalReps: number;
  totalVolume: number;
  averageWorkoutDuration: number;
  workoutFrequency: number;
  lastWorkoutDate?: Date;
  strengthProgress?: {
    exerciseId: string;
    exerciseName: string;
    currentPR: number;
    previousPR?: number;
    improvement?: number;
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

export interface ProgressSummary {
  bodyMeasurements: {
    latest?: BodyMeasurement;
    previous?: BodyMeasurement;
    changes: {
      weight?: number;
      bodyFat?: number;
      muscleMass?: number;
    };
  };
  exercisePRs: {
    recent: ExercisePR[];
    totalPRs: number;
  };
  goals: {
    active: ProgressGoal[];
    completed: ProgressGoal[];
    totalGoals: number;
  };
  workoutStats: WorkoutStats;
}

// Request types
export interface CreateBodyMeasurementRequest {
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
  measuredAt?: Date;
}

export interface UpdateBodyMeasurementRequest {
  weight?: number;
  height?: number;
  bodyFat?: number;
  muscleMass?: number;
  waist?: number;
  chest?: number;
  arms?: number;
  thighs?: number;
  notes?: string;
  measuredAt?: Date;
}

export interface CreateExercisePRRequest {
  exerciseId: string;
  weight: number;
  reps: number;
  date?: Date;
  notes?: string;
}

export interface UpdateExercisePRRequest {
  weight?: number;
  reps?: number;
  date?: Date;
  notes?: string;
}

export interface CreateProgressPhotoRequest {
  photoUrl: string;
  photoType: 'front' | 'side' | 'back';
  notes?: string;
  takenAt?: Date;
}

export interface CreateProgressGoalRequest {
  title: string;
  description?: string;
  targetType: 'weight' | 'bodyFat' | 'muscleMass' | 'exercise' | 'custom';
  targetValue: number;
  currentValue?: number;
  targetDate?: Date;
  exerciseId?: string;
}

export interface UpdateProgressGoalRequest {
  title?: string;
  description?: string;
  targetType?: 'weight' | 'bodyFat' | 'muscleMass' | 'exercise' | 'custom';
  targetValue?: number;
  currentValue?: number;
  targetDate?: Date;
  isCompleted?: boolean;
  exerciseId?: string;
}