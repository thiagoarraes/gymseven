import { getStorage } from '../../../../../../server/storage';
import { CreateExerciseDto, UpdateExerciseDto, ExerciseFilterDto, ExerciseResponseDto } from '../dto';

export class ExerciseService {
  private storage = getStorage();

  async getUserExercises(userId: string, filters?: ExerciseFilterDto): Promise<ExerciseResponseDto[]> {
    const storage = await this.storage;
    
    if (filters?.muscleGroup) {
      const exercises = await storage.getExercisesByMuscleGroup(filters.muscleGroup, userId);
      return this.mapExercisesToResponse(exercises);
    }
    
    const exercises = await storage.getExercises(userId);
    return this.mapExercisesToResponse(exercises);
  }

  async getExerciseById(exerciseId: string, userId?: string): Promise<ExerciseResponseDto | null> {
    const storage = await this.storage;
    
    const exercise = await storage.getExercise(exerciseId);
    if (!exercise) {
      return null;
    }

    // Verify ownership if userId provided
    if (userId && exercise.user_id !== userId) {
      throw new Error('Acesso negado ao exercício');
    }

    return this.mapExerciseToResponse(exercise);
  }

  async createExercise(userId: string, exerciseData: CreateExerciseDto): Promise<ExerciseResponseDto> {
    const storage = await this.storage;
    
    const exercise = await storage.createExercise(exerciseData, userId);
    return this.mapExerciseToResponse(exercise);
  }

  async updateExercise(exerciseId: string, userId: string, updateData: UpdateExerciseDto): Promise<ExerciseResponseDto | null> {
    const storage = await this.storage;
    
    // Verify exercise exists and belongs to user
    const existingExercise = await storage.getExercise(exerciseId);
    if (!existingExercise) {
      throw new Error('Exercício não encontrado');
    }
    
    if (existingExercise.user_id !== userId) {
      throw new Error('Você não tem permissão para editar este exercício');
    }

    const updatedExercise = await storage.updateExercise(exerciseId, updateData, userId);
    if (!updatedExercise) {
      return null;
    }

    return this.mapExerciseToResponse(updatedExercise);
  }

  async deleteExercise(exerciseId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify exercise exists and belongs to user
    const existingExercise = await storage.getExercise(exerciseId);
    if (!existingExercise) {
      throw new Error('Exercício não encontrado');
    }
    
    if (existingExercise.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir este exercício');
    }

    return await storage.deleteExercise(exerciseId);
  }

  async getExercisesByMuscleGroup(muscleGroup: string, userId: string): Promise<ExerciseResponseDto[]> {
    const storage = await this.storage;
    
    const exercises = await storage.getExercisesByMuscleGroup(muscleGroup, userId);
    return this.mapExercisesToResponse(exercises);
  }

  private mapExerciseToResponse(exercise: any): ExerciseResponseDto {
    return {
      id: exercise.id,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      description: exercise.description || undefined,
      createdAt: exercise.createdAt,
    };
  }

  private mapExercisesToResponse(exercises: any[]): ExerciseResponseDto[] {
    return exercises.map(exercise => this.mapExerciseToResponse(exercise));
  }
}