export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  instructions?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExerciseRequest {
  name: string;
  muscleGroup: string;
  instructions?: string;
  imageUrl?: string;
}

export interface UpdateExerciseRequest {
  name?: string;
  muscleGroup?: string;
  instructions?: string;
  imageUrl?: string;
}