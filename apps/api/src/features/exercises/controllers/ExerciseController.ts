import { Response } from 'express';
import { ExerciseService } from '../services/ExerciseService';
import { AuthenticatedRequest } from '../../../core/types';
import { ApiResponseHelper } from '../../../core/utils/response';
import { CreateExerciseDto, UpdateExerciseDto, ExerciseFilterDto } from '../dto';

export class ExerciseController {
  constructor(private exerciseService: ExerciseService) {}

  async getAll(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const filters: ExerciseFilterDto = req.query as any;
      const exercises = await this.exerciseService.getUserExercises(req.user.id, filters);
      
      return ApiResponseHelper.success(res, exercises, 'Exercícios recuperados com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const exercise = await this.exerciseService.getExerciseById(id, req.user.id);
      
      if (!exercise) {
        return ApiResponseHelper.notFound(res, 'Exercício não encontrado');
      }
      
      return ApiResponseHelper.success(res, exercise, 'Exercício recuperado com sucesso');
    } catch (error: any) {
      if (error.message.includes('Acesso negado')) {
        return ApiResponseHelper.forbidden(res, error.message);
      }
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async create(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const exerciseData: CreateExerciseDto = req.body;
      const exercise = await this.exerciseService.createExercise(req.user.id, exerciseData);
      
      return ApiResponseHelper.created(res, exercise, 'Exercício criado com sucesso');
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const updateData: UpdateExerciseDto = req.body;
      
      const exercise = await this.exerciseService.updateExercise(id, req.user.id, updateData);
      
      if (!exercise) {
        return ApiResponseHelper.notFound(res, 'Exercício não encontrado');
      }
      
      return ApiResponseHelper.success(res, exercise, 'Exercício atualizado com sucesso');
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

  async delete(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { id } = req.params;
      const deleted = await this.exerciseService.deleteExercise(id, req.user.id);
      
      if (!deleted) {
        return ApiResponseHelper.notFound(res, 'Exercício não encontrado');
      }
      
      return ApiResponseHelper.success(res, null, 'Exercício excluído com sucesso');
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

  async getByMuscleGroup(req: AuthenticatedRequest, res: Response): Promise<Response> {
    try {
      const { muscleGroup } = req.params;
      const exercises = await this.exerciseService.getExercisesByMuscleGroup(muscleGroup, req.user.id);
      
      return ApiResponseHelper.success(res, exercises, `Exercícios de ${muscleGroup} recuperados com sucesso`);
    } catch (error: any) {
      return ApiResponseHelper.error(res, error.message);
    }
  }
}