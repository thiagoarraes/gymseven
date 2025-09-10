import { getStorage } from '../../../../../../server/storage';
import { CreateExerciseDto, UpdateExerciseDto, ExerciseFilterDto, ExerciseResponseDto } from '../dto';
import { insertExerciseSchema } from '@shared/schema';

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
    if (userId && exercise.usuarioId !== userId) {
      throw new Error('Acesso negado ao exercício');
    }

    return this.mapExerciseToResponse(exercise);
  }

  async createExercise(userId: string, exerciseData: CreateExerciseDto): Promise<ExerciseResponseDto> {
    const storage = await this.storage;
    
    // Transform DTO to Portuguese using shared schema
    const transformedData = insertExerciseSchema.parse(exerciseData);
    
    const exercise = await storage.createExercise(transformedData, userId);
    return this.mapExerciseToResponse(exercise);
  }

  async updateExercise(exerciseId: string, userId: string, updateData: UpdateExerciseDto): Promise<ExerciseResponseDto | null> {
    const storage = await this.storage;
    
    // Verify exercise exists and belongs to user
    const existingExercise = await storage.getExercise(exerciseId);
    if (!existingExercise) {
      throw new Error('Exercício não encontrado');
    }
    
    if (existingExercise.usuarioId !== userId) {
      throw new Error('Você não tem permissão para editar este exercício');
    }

    // Transform partial DTO to Portuguese using shared schema  
    const transformedData = {
      ...(updateData.name && { nome: updateData.name }),
      ...(updateData.muscleGroup && { grupoMuscular: updateData.muscleGroup }),
      ...(updateData.description !== undefined && { descricao: updateData.description })
    };
    
    const updatedExercise = await storage.updateExercise(exerciseId, transformedData, userId);
    if (!updatedExercise) {
      return null;
    }

    return this.mapExerciseToResponse(updatedExercise);
  }

  // Progress and weight history methods
  async getExercisesWithProgress(userId: string): Promise<any[]> {
    const storage = await this.storage;
    const exercises = await storage.getExercises(userId);
    
    const exercisesWithProgress = await Promise.all(
      exercises.map(async (exercise) => {
        const stats = await storage.getExerciseStats(exercise.id, userId);
        return {
          ...this.mapExerciseToResponse(exercise),
          lastWeight: stats.lastWeight,
          maxWeight: stats.maxWeight,
          lastUsed: stats.lastUsed,
          totalSessions: stats.totalSessions
        };
      })
    );
    
    return exercisesWithProgress;
  }

  async getExercisesWeightSummary(userId: string): Promise<any[]> {
    const storage = await this.storage;
    const exercises = await storage.getExercises(userId);
    
    const weightSummary = await Promise.all(
      exercises.map(async (exercise) => {
        const stats = await storage.getExerciseStats(exercise.id, userId);
        return {
          exerciseId: exercise.id,
          exerciseName: exercise.nome,
          muscleGroup: exercise.grupoMuscular,
          maxWeight: stats.maxWeight,
          lastWeight: stats.lastWeight,
          totalSessions: stats.totalSessions
        };
      })
    );
    
    return weightSummary.filter(item => item.maxWeight !== null);
  }

  async getExercisesWithWeightHistory(userId: string): Promise<any[]> {
    const storage = await this.storage;
    const exercises = await storage.getExercises(userId);
    
    const exercisesWithHistory = await Promise.all(
      exercises.map(async (exercise) => {
        const history = await storage.getExerciseWeightHistory(exercise.id, userId, 10);
        return {
          ...this.mapExerciseToResponse(exercise),
          weightHistory: history
        };
      })
    );
    
    return exercisesWithHistory;
  }

  async getExerciseWeightHistory(exerciseId: string, userId: string, limit?: number): Promise<any[]> {
    const storage = await this.storage;
    
    // Verify exercise exists and belongs to user
    const exercise = await storage.getExercise(exerciseId);
    if (!exercise || exercise.usuarioId !== userId) {
      throw new Error('Exercício não encontrado ou acesso negado');
    }
    
    return await storage.getExerciseWeightHistory(exerciseId, userId, limit);
  }

  async deleteExercise(exerciseId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify exercise exists and belongs to user
    const existingExercise = await storage.getExercise(exerciseId);
    if (!existingExercise) {
      throw new Error('Exercício não encontrado');
    }
    
    if (existingExercise.usuarioId !== userId) {
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
      name: exercise.nome || exercise.name, // Map from Portuguese to English
      muscleGroup: exercise.grupoMuscular || exercise.muscleGroup, // Map from Portuguese to English
      description: exercise.descricao || exercise.description || undefined,
      createdAt: exercise.createdAt,
    };
  }

  private mapExercisesToResponse(exercises: any[]): ExerciseResponseDto[] {
    return exercises.map(exercise => this.mapExerciseToResponse(exercise));
  }
}