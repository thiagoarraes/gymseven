import { getStorage } from '../../../../../../server/storage';
import { 
  CreateWorkoutTemplateDto, 
  UpdateWorkoutTemplateDto,
  AddExerciseToTemplateDto,
  UpdateTemplateExerciseDto,
  CreateWorkoutLogDto,
  UpdateWorkoutLogDto,
  CreateWorkoutLogExerciseDto,
  CreateWorkoutLogSetDto,
  UpdateWorkoutLogSetDto,
  WorkoutTemplateResponseDto,
  WorkoutLogResponseDto
} from '../dto';
import { insertWorkoutTemplateSchema, insertWorkoutLogSchema } from '@shared/schema';

export class WorkoutService {
  private storage = getStorage();

  // Workout Templates
  async getUserWorkoutTemplates(userId: string): Promise<WorkoutTemplateResponseDto[]> {
    const storage = await this.storage;
    const templates = await storage.getWorkoutTemplates(userId);
    return this.mapTemplatesToResponse(templates);
  }

  async getWorkoutTemplateById(templateId: string, userId: string): Promise<WorkoutTemplateResponseDto | null> {
    const storage = await this.storage;
    const template = await storage.getWorkoutTemplate(templateId);
    
    if (!template) {
      return null;
    }

    if (template.usuarioId !== userId) {
      throw new Error('Acesso negado ao template de treino');
    }

    return this.mapTemplateToResponse(template);
  }

  async getWorkoutTemplateWithExercises(templateId: string, userId: string): Promise<WorkoutTemplateResponseDto | null> {
    const storage = await this.storage;
    const template = await storage.getWorkoutTemplate(templateId);
    
    if (!template) {
      return null;
    }

    if (template.usuarioId !== userId) {
      throw new Error('Acesso negado ao template de treino');
    }

    const exercises = await storage.getWorkoutTemplateExercises(templateId);
    const templateResponse = this.mapTemplateToResponse(template);
    templateResponse.exercises = exercises.map(ex => ({
      id: ex.id,
      exerciseId: ex.exercicioId,
      exerciseName: ex.exercise?.nome || 'Exercício não encontrado',
      sets: ex.series,
      reps: ex.repeticoes,
      weight: ex.weight || undefined,
      restDurationSeconds: ex.restDurationSeconds || 90,
      order: ex.order,
      exercise: {
        id: ex.exercise?.id || '',
        name: ex.exercise?.nome || 'Exercício não encontrado',
        muscleGroup: ex.exercise?.grupoMuscular || '',
      }
    }));
    templateResponse.totalExercises = exercises.length;

    return templateResponse;
  }

  async createWorkoutTemplate(userId: string, templateData: CreateWorkoutTemplateDto): Promise<WorkoutTemplateResponseDto> {
    const storage = await this.storage;
    
    // Transform DTO to Portuguese using shared schema
    const transformedData = insertWorkoutTemplateSchema.parse({
      ...templateData,
      usuarioId: userId,
    });
    
    const template = await storage.createWorkoutTemplate(transformedData);
    return this.mapTemplateToResponse(template);
  }

  async updateWorkoutTemplate(templateId: string, userId: string, updateData: UpdateWorkoutTemplateDto): Promise<WorkoutTemplateResponseDto | null> {
    const storage = await this.storage;
    
    // Verify template exists and belongs to user
    const existingTemplate = await storage.getWorkoutTemplate(templateId);
    if (!existingTemplate) {
      throw new Error('Template de treino não encontrado');
    }
    
    if (existingTemplate.usuarioId !== userId) {
      throw new Error('Você não tem permissão para editar este template');
    }

    const updatedTemplate = await storage.updateWorkoutTemplate(templateId, updateData);
    if (!updatedTemplate) {
      return null;
    }

    return this.mapTemplateToResponse(updatedTemplate);
  }

  async deleteWorkoutTemplate(templateId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify template exists and belongs to user
    const existingTemplate = await storage.getWorkoutTemplate(templateId);
    if (!existingTemplate) {
      throw new Error('Template de treino não encontrado');
    }
    
    if (existingTemplate.usuarioId !== userId) {
      throw new Error('Você não tem permissão para excluir este template');
    }

    return await storage.deleteWorkoutTemplate(templateId, userId);
  }

  async addExerciseToTemplate(userId: string, exerciseData: AddExerciseToTemplateDto): Promise<any> {
    const storage = await this.storage;
    
    // Verify template belongs to user
    const template = await storage.getWorkoutTemplate(exerciseData.templateId);
    if (!template || template.usuarioId !== userId) {
      throw new Error('Template de treino não encontrado ou acesso negado');
    }

    // Map API V2 data to storage format
    const storageData = {
      modeloId: exerciseData.templateId,
      exercicioId: exerciseData.exerciseId,
      series: exerciseData.sets,
      repeticoes: exerciseData.reps,
      weight: exerciseData.weight,
      restDurationSeconds: exerciseData.restDurationSeconds,
      order: exerciseData.order,
    };

    return await storage.addExerciseToTemplate(storageData);
  }

  async updateTemplateExercise(exerciseId: string, userId: string, updateData: UpdateTemplateExerciseDto): Promise<any> {
    const storage = await this.storage;
    return await storage.updateWorkoutTemplateExercise(exerciseId, updateData, userId);
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify template belongs to user
    const template = await storage.getWorkoutTemplate(templateId);
    if (!template || template.usuarioId !== userId) {
      throw new Error('Template de treino não encontrado ou acesso negado');
    }

    return await storage.removeExerciseFromTemplate(templateId, exerciseId);
  }

  // Workout Logs
  async getUserWorkoutLogs(userId: string, limit?: number): Promise<WorkoutLogResponseDto[]> {
    const storage = await this.storage;
    const logs = await storage.getWorkoutLogs(userId);
    
    // Apply limit if specified
    const limitedLogs = limit ? logs.slice(0, limit) : logs;
    
    return this.mapLogsToResponse(limitedLogs);
  }

  async getWorkoutLogById(logId: string, userId: string): Promise<WorkoutLogResponseDto | null> {
    const storage = await this.storage;
    const log = await storage.getWorkoutLog(logId);
    
    if (!log) {
      return null;
    }

    if (log.usuarioId !== userId) {
      throw new Error('Acesso negado ao log de treino');
    }

    return this.mapLogToResponse(log);
  }

  async createWorkoutLog(userId: string, logData: CreateWorkoutLogDto): Promise<WorkoutLogResponseDto> {
    const storage = await this.storage;
    const log = await storage.createWorkoutLog({
      usuarioId: userId,
      nome: logData.name,
      startTime: logData.startTime,
      modeloId: logData.templateId || null,
      endTime: logData.endTime,
    });
    return this.mapLogToResponse(log);
  }

  async updateWorkoutLog(logId: string, userId: string, updateData: UpdateWorkoutLogDto): Promise<WorkoutLogResponseDto | null> {
    const storage = await this.storage;
    
    // Verify log exists and belongs to user
    const existingLog = await storage.getWorkoutLog(logId);
    if (!existingLog) {
      throw new Error('Log de treino não encontrado');
    }
    
    if (existingLog.usuarioId !== userId) {
      throw new Error('Você não tem permissão para editar este log');
    }

    const updatedLog = await storage.updateWorkoutLog(logId, updateData);
    if (!updatedLog) {
      return null;
    }

    return this.mapLogToResponse(updatedLog);
  }

  async deleteWorkoutLog(logId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify log exists and belongs to user
    const existingLog = await storage.getWorkoutLog(logId);
    if (!existingLog) {
      throw new Error('Log de treino não encontrado');
    }
    
    if (existingLog.usuarioId !== userId) {
      throw new Error('Você não tem permissão para excluir este log');
    }

    return await storage.deleteWorkoutLog(logId);
  }

  // Workout Log Exercises and Sets
  async createWorkoutLogExercise(userId: string, exerciseData: CreateWorkoutLogExerciseDto): Promise<any> {
    const storage = await this.storage;
    
    // Verify log belongs to user by checking the log
    const log = await storage.getWorkoutLog(exerciseData.registroId);
    if (!log || log.usuarioId !== userId) {
      throw new Error('Log de treino não encontrado ou acesso negado');
    }

    // Get exercise name for the log
    const exercise = await storage.getExercise(exerciseData.exercicioId);
    if (!exercise) {
      throw new Error('Exercício não encontrado');
    }

    return await storage.createWorkoutLogExercise({
      registroId: exerciseData.registroId,
      exercicioId: exerciseData.exercicioId,
      nomeExercicio: exerciseData.nomeExercicio || exercise.nome,
      order: exerciseData.order,
    });
  }

  async createWorkoutLogSet(userId: string, setData: CreateWorkoutLogSetDto): Promise<any> {
    const storage = await this.storage;
    return await storage.createWorkoutLogSet({
      exercicioRegistroId: setData.logExerciseId,
      setNumber: setData.setNumber,
      weight: setData.weight,
      reps: setData.reps,
      completed: setData.completed,
    });
  }

  async updateWorkoutLogSet(setId: string, userId: string, updateData: UpdateWorkoutLogSetDto): Promise<any> {
    const storage = await this.storage;
    return await storage.updateWorkoutLogSet(setId, updateData);
  }

  private mapTemplateToResponse(template: any): WorkoutTemplateResponseDto {
    return {
      id: template.id,
      name: template.nome || template.name, // Map from Portuguese to English
      description: template.descricao || template.description || undefined,
      createdAt: template.createdAt,
    };
  }

  private mapTemplatesToResponse(templates: any[]): WorkoutTemplateResponseDto[] {
    return templates.map(template => this.mapTemplateToResponse(template));
  }

  private mapLogToResponse(log: any): WorkoutLogResponseDto {
    const duration = log.endTime && log.startTime ? 
      Math.floor((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000) : 
      undefined;

    return {
      id: log.id,
      templateId: log.modeloId || log.templateId || undefined,
      name: log.nome || log.name,
      startTime: log.startTime,
      endTime: log.endTime || undefined,
      duration,
    };
  }

  private mapLogsToResponse(logs: any[]): WorkoutLogResponseDto[] {
    return logs.map(log => this.mapLogToResponse(log));
  }

  async getWorkoutLogSummary(logId: string, userId: string): Promise<any> {
    const storage = await this.storage;
    
    // Get the workout log
    const log = await storage.getWorkoutLog(logId);
    if (!log) {
      return null;
    }

    if (log.usuarioId !== userId) {
      throw new Error('Acesso negado ao treino');
    }

    // Calculate duration
    const duration = log.endTime 
      ? Math.round((new Date(log.endTime).getTime() - new Date(log.startTime).getTime()) / 1000 / 60)
      : null;

    // Try to get actual workout log exercises and sets
    const logExercises = await storage.getWorkoutLogExercises(logId);
    
    let exercises: any[] = [];
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;

    if (logExercises && logExercises.length > 0) {
      // Use actual logged data
      const exerciseMap = new Map<string, any>();

      for (const logExercise of logExercises) {
        const exercise = await storage.getExercise(logExercise.exercicioId);
        const sets = await storage.getWorkoutLogSets(logExercise.id);
        
        const exerciseId = logExercise.exercicioId;
        const exerciseName = logExercise.nomeExercicio || exercise?.nome || 'Exercício desconhecido';
        const muscleGroup = exercise?.grupoMuscular || 'N/A';

        if (exerciseMap.has(exerciseId)) {
          const existingExercise = exerciseMap.get(exerciseId);
          const newSets = sets?.map(set => ({
            setNumber: set.setNumber,
            reps: set.reps,
            weight: set.weight,
            completed: set.completed
          })) || [];
          existingExercise.sets = [...existingExercise.sets, ...newSets];
        } else {
          const exerciseData = {
            id: exerciseId,
            name: exerciseName,
            muscleGroup: muscleGroup,
            sets: sets?.map(set => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              completed: set.completed
            })) || []
          };
          exerciseMap.set(exerciseId, exerciseData);
        }
      }

      exercises = Array.from(exerciseMap.values());
    } else if (log.modeloId) {
      // If no logged exercises, get from template to show structure
      const templateExercises = await storage.getWorkoutTemplateExercises(log.modeloId);
      
      exercises = await Promise.all(templateExercises.map(async (templateEx) => {
        const exercise = await storage.getExercise(templateEx.exercicioId);
        return {
          id: templateEx.exercicioId,
          name: exercise?.nome || 'Exercício desconhecido',
          muscleGroup: exercise?.grupoMuscular || 'N/A',
          sets: Array.from({ length: templateEx.series }, (_, i) => ({
            setNumber: i + 1,
            reps: null,
            weight: null,
            completed: false
          }))
        };
      }));
    }

    // Calculate totals
    for (const exercise of exercises) {
      if (exercise.sets && exercise.sets.length > 0) {
        totalSets += exercise.sets.length;
        for (const set of exercise.sets) {
          if (set.reps) totalReps += set.reps;
          if (set.weight && set.reps) totalVolume += (set.weight * set.reps);
        }
      }
    }

    return {
      id: log.id,
      name: log.nome,
      startTime: log.startTime,
      endTime: log.endTime,
      duration,
      exercises,
      stats: {
        totalExercises: exercises.length,
        totalSets,
        totalReps,
        totalVolume: Math.round(totalVolume)
      }
    };
  }
}