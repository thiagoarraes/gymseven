import { Response } from 'express';
import { WorkoutService } from '../services/WorkoutService';
import { AuthenticatedRequest } from '../../../core/types';
import { ApiResponseHelper } from '../../../core/utils/response';
import { 
  CreateWorkoutTemplateDto, 
  UpdateWorkoutTemplateDto,
  AddExerciseToTemplateDto,
  UpdateTemplateExerciseDto,
  CreateWorkoutLogDto,
  UpdateWorkoutLogDto,
  CreateWorkoutLogExerciseDto,
  CreateWorkoutLogSetDto,
  UpdateWorkoutLogSetDto
} from '../dto';

export class WorkoutController {
  constructor(private workoutService: WorkoutService) {}

  // Workout Templates
  async getAllTemplates(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const templates = await this.workoutService.getUserWorkoutTemplates(req.user.id);
      return ApiResponseHelper.success(res, templates, 'Templates de treino recuperados com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getTemplateById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const template = await this.workoutService.getWorkoutTemplateById(id, req.user.id);
      
      if (!template) {
        return ApiResponseHelper.notFound(res, 'Template de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, template, 'Template de treino recuperado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getTemplateWithExercises(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const template = await this.workoutService.getWorkoutTemplateWithExercises(id, req.user.id);
      
      if (!template) {
        return ApiResponseHelper.notFound(res, 'Template de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, template, 'Template de treino com exercícios recuperado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const templateData: CreateWorkoutTemplateDto = req.body;
      const template = await this.workoutService.createWorkoutTemplate(req.user.id, templateData);
      
      return ApiResponseHelper.created(res, template, 'Template de treino criado com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateWorkoutTemplateDto = req.body;
      
      const template = await this.workoutService.updateWorkoutTemplate(id, req.user.id, updateData);
      
      if (!template) {
        return ApiResponseHelper.notFound(res, 'Template de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, template, 'Template de treino atualizado com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async deleteTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.workoutService.deleteWorkoutTemplate(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Template de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, null, 'Template de treino excluído com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async addExerciseToTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const exerciseData: AddExerciseToTemplateDto = req.body;
      const exercise = await this.workoutService.addExerciseToTemplate(req.user.id, exerciseData);
      
      return ApiResponseHelper.created(res, exercise, 'Exercício adicionado ao template com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado') || error.message.includes('acesso negado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateTemplateExercise(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { exerciseId } = req.params;
      const updateData: UpdateTemplateExerciseDto = req.body;
      
      const exercise = await this.workoutService.updateTemplateExercise(exerciseId, req.user.id, updateData);
      
      if (!exercise) {
        return ApiResponseHelper.notFound(res, 'Exercício do template não encontrado');
      }
      
      return ApiResponseHelper.success(res, exercise, 'Exercício do template atualizado com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async removeExerciseFromTemplate(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { templateId, exerciseId } = req.params;
      const removed = await this.workoutService.removeExerciseFromTemplate(templateId, exerciseId, req.user.id);
      
      if (!removed) {
        return ApiResponseHelper.notFound(res, 'Exercício não encontrado no template');
      }
      
      return ApiResponseHelper.success(res, null, 'Exercício removido do template com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado') || error.message.includes('acesso negado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  // Workout Logs
  async getAllLogs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const logs = await this.workoutService.getUserWorkoutLogs(req.user.id, limit);
      
      return ApiResponseHelper.success(res, logs, 'Logs de treino recuperados com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getLogById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const log = await this.workoutService.getWorkoutLogById(id, req.user.id);
      
      if (!log) {
        return ApiResponseHelper.notFound(res, 'Log de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, log, 'Log de treino recuperado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createLog(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const logData: CreateWorkoutLogDto = req.body;
      const log = await this.workoutService.createWorkoutLog(req.user.id, logData);
      
      return ApiResponseHelper.created(res, log, 'Log de treino criado com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateLog(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateWorkoutLogDto = req.body;
      
      const log = await this.workoutService.updateWorkoutLog(id, req.user.id, updateData);
      
      if (!log) {
        return ApiResponseHelper.notFound(res, 'Log de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, log, 'Log de treino atualizado com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async deleteLog(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.workoutService.deleteWorkoutLog(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Log de treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, null, 'Log de treino excluído com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createLogExercise(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const exerciseData: CreateWorkoutLogExerciseDto = req.body;
      const exercise = await this.workoutService.createWorkoutLogExercise(req.user.id, exerciseData);
      
      return ApiResponseHelper.created(res, exercise, 'Exercício adicionado ao log com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado') || error.message.includes('acesso negado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createLogSet(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const setData: CreateWorkoutLogSetDto = req.body;
      const set = await this.workoutService.createWorkoutLogSet(req.user.id, setData);
      
      return ApiResponseHelper.created(res, set, 'Série adicionada ao log com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateLogSet(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { setId } = req.params;
      const updateData: UpdateWorkoutLogSetDto = req.body;
      
      const set = await this.workoutService.updateWorkoutLogSet(setId, req.user.id, updateData);
      
      if (!set) {
        return ApiResponseHelper.notFound(res, 'Série não encontrada');
      }
      
      return ApiResponseHelper.success(res, set, 'Série atualizada com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getLogSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const summary = await this.workoutService.getWorkoutLogSummary(id, req.user.id);
      
      if (!summary) {
        return ApiResponseHelper.notFound(res, 'Treino não encontrado');
      }
      
      return ApiResponseHelper.success(res, summary, 'Resumo do treino recuperado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }
}