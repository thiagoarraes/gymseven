import { Response } from 'express';
import { ProgressService } from '../services/ProgressService';
import { AuthenticatedRequest } from '../../../core/types';
import { ApiResponseHelper } from '../../../core/utils/response';
import { 
  CreateBodyMeasurementDto, 
  UpdateBodyMeasurementDto,
  CreateExercisePRDto,
  UpdateExercisePRDto,
  CreateProgressPhotoDto,
  UpdateProgressPhotoDto,
  CreateProgressGoalDto,
  UpdateProgressGoalDto,
  GetWorkoutStatsDto
} from '../dto';

export class ProgressController {
  constructor(private progressService: ProgressService) {}

  // Body Measurements
  async getAllMeasurements(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const measurements = await this.progressService.getUserBodyMeasurements(req.user.id, limit);
      return ApiResponseHelper.success(res, measurements, 'Medições corporais recuperadas com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getMeasurementById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const measurement = await this.progressService.getBodyMeasurementById(id, req.user.id);
      
      if (!measurement) {
        return ApiResponseHelper.notFound(res, 'Medição corporal não encontrada');
      }
      
      return ApiResponseHelper.success(res, measurement, 'Medição corporal recuperada com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createMeasurement(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const measurementData: CreateBodyMeasurementDto = req.body;
      const measurement = await this.progressService.createBodyMeasurement(req.user.id, measurementData);
      
      return ApiResponseHelper.created(res, measurement, 'Medição corporal criada com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateMeasurement(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateBodyMeasurementDto = req.body;
      
      const measurement = await this.progressService.updateBodyMeasurement(id, req.user.id, updateData);
      
      if (!measurement) {
        return ApiResponseHelper.notFound(res, 'Medição corporal não encontrada');
      }
      
      return ApiResponseHelper.success(res, measurement, 'Medição corporal atualizada com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async deleteMeasurement(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.progressService.deleteBodyMeasurement(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Medição corporal não encontrada');
      }
      
      return ApiResponseHelper.success(res, null, 'Medição corporal excluída com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  // Exercise Personal Records
  async getAllPRs(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const exerciseId = req.query.exerciseId as string;
      const prs = await this.progressService.getUserExercisePRs(req.user.id, exerciseId);
      return ApiResponseHelper.success(res, prs, 'Records pessoais recuperados com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getPRById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const pr = await this.progressService.getExercisePRById(id, req.user.id);
      
      if (!pr) {
        return ApiResponseHelper.notFound(res, 'Record pessoal não encontrado');
      }
      
      return ApiResponseHelper.success(res, pr, 'Record pessoal recuperado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createPR(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const prData: CreateExercisePRDto = req.body;
      const pr = await this.progressService.createExercisePR(req.user.id, prData);
      
      return ApiResponseHelper.created(res, pr, 'Record pessoal criado com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrado')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updatePR(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateExercisePRDto = req.body;
      
      const pr = await this.progressService.updateExercisePR(id, req.user.id, updateData);
      
      if (!pr) {
        return ApiResponseHelper.notFound(res, 'Record pessoal não encontrado');
      }
      
      return ApiResponseHelper.success(res, pr, 'Record pessoal atualizado com sucesso');
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

  async deletePR(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.progressService.deleteExercisePR(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Record pessoal não encontrado');
      }
      
      return ApiResponseHelper.success(res, null, 'Record pessoal excluído com sucesso');
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

  // Progress Photos
  async getAllPhotos(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const photoType = req.query.type as string;
      const photos = await this.progressService.getUserProgressPhotos(req.user.id, photoType);
      return ApiResponseHelper.success(res, photos, 'Fotos de progresso recuperadas com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createPhoto(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const photoData: CreateProgressPhotoDto = req.body;
      const photo = await this.progressService.createProgressPhoto(req.user.id, photoData);
      
      return ApiResponseHelper.created(res, photo, 'Foto de progresso criada com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async deletePhoto(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.progressService.deleteProgressPhoto(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Foto de progresso não encontrada');
      }
      
      return ApiResponseHelper.success(res, null, 'Foto de progresso excluída com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  // Progress Goals
  async getAllGoals(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const isCompleted = req.query.completed ? req.query.completed === 'true' : undefined;
      const goals = await this.progressService.getUserProgressGoals(req.user.id, isCompleted);
      return ApiResponseHelper.success(res, goals, 'Metas de progresso recuperadas com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async createGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const goalData: CreateProgressGoalDto = req.body;
      const goal = await this.progressService.createProgressGoal(req.user.id, goalData);
      
      return ApiResponseHelper.created(res, goal, 'Meta de progresso criada com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async updateGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateProgressGoalDto = req.body;
      
      const goal = await this.progressService.updateProgressGoal(id, req.user.id, updateData);
      
      if (!goal) {
        return ApiResponseHelper.notFound(res, 'Meta de progresso não encontrada');
      }
      
      return ApiResponseHelper.success(res, goal, 'Meta de progresso atualizada com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async deleteGoal(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.progressService.deleteProgressGoal(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Meta de progresso não encontrada');
      }
      
      return ApiResponseHelper.success(res, null, 'Meta de progresso excluída com sucesso');
    } catch (error: any) {
      if (error.message.includes('não encontrada')) {
        return ApiResponseHelper.notFound(res, error.message);
      }
      if (error.message.includes('permissão')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  // Statistics and Summary
  async getWorkoutStats(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const params: GetWorkoutStatsDto = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        exerciseId: req.query.exerciseId as string,
      };
      
      const stats = await this.progressService.getWorkoutStats(req.user.id, params);
      return ApiResponseHelper.success(res, stats, 'Estatísticas de treino recuperadas com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getProgressSummary(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const summary = await this.progressService.getProgressSummary(req.user.id);
      return ApiResponseHelper.success(res, summary, 'Resumo de progresso recuperado com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }
}