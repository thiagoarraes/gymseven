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
    try {
      console.log('🔍 [SERVICE] getExercisesWithProgress called for user:', userId);
      const storage = await this.storage;
      console.log('🔍 [SERVICE] Storage obtained');
      
      const exercises = await storage.getExercises(userId);
      console.log('🔍 [SERVICE] Found', exercises.length, 'exercises for user');
      
      const exercisesWithProgress = await Promise.all(
        exercises.map(async (exercise) => {
          try {
            console.log('🔍 [SERVICE] Getting stats for exercise:', exercise.id);
            const stats = await storage.getExerciseStats(exercise.id, userId);
            console.log('✅ [SERVICE] Got stats for exercise:', exercise.id, stats);
            return {
              ...this.mapExerciseToResponse(exercise),
              lastWeight: stats.lastWeight,
              maxWeight: stats.maxWeight,
              lastUsed: stats.lastUsed,
              totalSessions: stats.totalSessions
            };
          } catch (error) {
            console.log('⚠️ [SERVICE] Failed to get stats for exercise:', exercise.id, error);
            // If stats fail, return exercise with default values
            return {
              ...this.mapExerciseToResponse(exercise),
              lastWeight: null,
              maxWeight: null,
              lastUsed: null,
              totalSessions: 0
            };
          }
        })
      );
      
      console.log('✅ [SERVICE] Returning', exercisesWithProgress.length, 'exercises with progress');
      return exercisesWithProgress;
    } catch (error) {
      console.error('❌ [SERVICE] Error in getExercisesWithProgress:', error);
      throw new Error('Erro ao buscar exercícios com progresso');
    }
  }

  async getExercisesWeightSummary(userId: string): Promise<any[]> {
    try {
      const storage = await this.storage;
      const exercises = await storage.getExercises(userId);
      
      const weightSummary = await Promise.all(
        exercises.map(async (exercise) => {
          try {
            const stats = await storage.getExerciseStats(exercise.id, userId);
            return {
              exerciseId: exercise.id,
              exerciseName: exercise.nome,
              muscleGroup: exercise.grupoMuscular,
              maxWeight: stats.maxWeight,
              lastWeight: stats.lastWeight,
              totalSessions: stats.totalSessions
            };
          } catch (error) {
            // If stats fail, return exercise with default values
            return {
              exerciseId: exercise.id,
              exerciseName: exercise.nome,
              muscleGroup: exercise.grupoMuscular,
              maxWeight: null,
              lastWeight: null,
              totalSessions: 0
            };
          }
        })
      );
      
      // Return all exercises, not just those with weight data
      return weightSummary;
    } catch (error) {
      console.error('Error in getExercisesWeightSummary:', error);
      throw new Error('Erro ao buscar resumo de peso dos exercícios');
    }
  }

  async getExercisesWithWeightHistory(userId: string): Promise<any[]> {
    try {
      const storage = await this.storage;
      const exercises = await storage.getExercises(userId);
      
      const exercisesWithHistory = await Promise.all(
        exercises.map(async (exercise) => {
          try {
            const history = await storage.getExerciseWeightHistory(exercise.id, userId, 10);
            return {
              ...this.mapExerciseToResponse(exercise),
              weightHistory: history || []
            };
          } catch (error) {
            // If history fails, return exercise with empty history
            return {
              ...this.mapExerciseToResponse(exercise),
              weightHistory: []
            };
          }
        })
      );
      
      return exercisesWithHistory;
    } catch (error) {
      console.error('Error in getExercisesWithWeightHistory:', error);
      throw new Error('Erro ao buscar exercícios com histórico de peso');
    }
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