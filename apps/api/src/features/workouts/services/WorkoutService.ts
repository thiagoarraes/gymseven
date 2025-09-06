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

    if (template.user_id !== userId) {
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

    if (template.user_id !== userId) {
      throw new Error('Acesso negado ao template de treino');
    }

    const exercises = await storage.getWorkoutTemplateExercises(templateId);
    const templateResponse = this.mapTemplateToResponse(template);
    templateResponse.exercises = exercises.map(ex => ({
      id: ex.id,
      exerciseId: ex.exerciseId,
      exerciseName: ex.exercise.name,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight || undefined,
      restDurationSeconds: ex.restDurationSeconds,
      order: ex.order,
      exercise: {
        id: ex.exercise.id,
        name: ex.exercise.name,
        muscleGroup: ex.exercise.muscleGroup,
      }
    }));
    templateResponse.totalExercises = exercises.length;

    return templateResponse;
  }

  async createWorkoutTemplate(userId: string, templateData: CreateWorkoutTemplateDto): Promise<WorkoutTemplateResponseDto> {
    const storage = await this.storage;
    const template = await storage.createWorkoutTemplate({
      ...templateData,
      user_id: userId,
    });
    return this.mapTemplateToResponse(template);
  }

  async updateWorkoutTemplate(templateId: string, userId: string, updateData: UpdateWorkoutTemplateDto): Promise<WorkoutTemplateResponseDto | null> {
    const storage = await this.storage;
    
    // Verify template exists and belongs to user
    const existingTemplate = await storage.getWorkoutTemplate(templateId);
    if (!existingTemplate) {
      throw new Error('Template de treino não encontrado');
    }
    
    if (existingTemplate.user_id !== userId) {
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
    
    if (existingTemplate.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir este template');
    }

    return await storage.deleteWorkoutTemplate(templateId, userId);
  }

  async addExerciseToTemplate(userId: string, exerciseData: AddExerciseToTemplateDto): Promise<any> {
    const storage = await this.storage;
    
    // Verify template belongs to user
    const template = await storage.getWorkoutTemplate(exerciseData.templateId);
    if (!template || template.user_id !== userId) {
      throw new Error('Template de treino não encontrado ou acesso negado');
    }

    return await storage.addExerciseToTemplate(exerciseData);
  }

  async updateTemplateExercise(exerciseId: string, userId: string, updateData: UpdateTemplateExerciseDto): Promise<any> {
    const storage = await this.storage;
    return await storage.updateWorkoutTemplateExercise(exerciseId, updateData, userId);
  }

  async removeExerciseFromTemplate(templateId: string, exerciseId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify template belongs to user
    const template = await storage.getWorkoutTemplate(templateId);
    if (!template || template.user_id !== userId) {
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

    if (log.user_id !== userId) {
      throw new Error('Acesso negado ao log de treino');
    }

    return this.mapLogToResponse(log);
  }

  async createWorkoutLog(userId: string, logData: CreateWorkoutLogDto): Promise<WorkoutLogResponseDto> {
    const storage = await this.storage;
    const log = await storage.createWorkoutLog({
      ...logData,
      user_id: userId,
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
    
    if (existingLog.user_id !== userId) {
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
    
    if (existingLog.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir este log');
    }

    return await storage.deleteWorkoutLog(logId);
  }

  // Workout Log Exercises and Sets
  async createWorkoutLogExercise(userId: string, exerciseData: CreateWorkoutLogExerciseDto): Promise<any> {
    const storage = await this.storage;
    
    // Verify log belongs to user by checking the log
    const log = await storage.getWorkoutLog(exerciseData.logId);
    if (!log || log.user_id !== userId) {
      throw new Error('Log de treino não encontrado ou acesso negado');
    }

    // Get exercise name for the log
    const exercise = await storage.getExercise(exerciseData.exerciseId);
    if (!exercise) {
      throw new Error('Exercício não encontrado');
    }

    return await storage.createWorkoutLogSet({
      logId: exerciseData.logId,
      exerciseId: exerciseData.exerciseId,
      exerciseName: exercise.name,
      order: exerciseData.order,
    } as any);
  }

  async createWorkoutLogSet(userId: string, setData: CreateWorkoutLogSetDto): Promise<any> {
    const storage = await this.storage;
    return await storage.createWorkoutLogSet(setData);
  }

  async updateWorkoutLogSet(setId: string, userId: string, updateData: UpdateWorkoutLogSetDto): Promise<any> {
    const storage = await this.storage;
    return await storage.updateWorkoutLogSet(setId, updateData);
  }

  private mapTemplateToResponse(template: any): WorkoutTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description || undefined,
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
      templateId: log.templateId || undefined,
      name: log.name,
      startTime: log.startTime,
      endTime: log.endTime || undefined,
      duration,
    };
  }

  private mapLogsToResponse(logs: any[]): WorkoutLogResponseDto[] {
    return logs.map(log => this.mapLogToResponse(log));
  }
}