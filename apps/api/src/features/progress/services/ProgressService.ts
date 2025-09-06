import { getStorage } from '../../../../../../server/storage';
import { 
  CreateBodyMeasurementDto, 
  UpdateBodyMeasurementDto,
  CreateExercisePRDto,
  UpdateExercisePRDto,
  CreateProgressPhotoDto,
  UpdateProgressPhotoDto,
  CreateProgressGoalDto,
  UpdateProgressGoalDto,
  GetWorkoutStatsDto,
  BodyMeasurementResponseDto,
  ExercisePRResponseDto,
  ProgressPhotoResponseDto,
  ProgressGoalResponseDto,
  WorkoutStatsResponseDto,
  ProgressSummaryResponseDto
} from '../dto';

export class ProgressService {
  private storage = getStorage();

  // Body Measurements
  async getUserBodyMeasurements(userId: string, limit?: number): Promise<BodyMeasurementResponseDto[]> {
    const storage = await this.storage;
    const measurements = await storage.getBodyMeasurements(userId);
    
    // Apply limit if specified and sort by date
    const sortedMeasurements = measurements
      .sort((a, b) => new Date(b.measuredAt).getTime() - new Date(a.measuredAt).getTime());
    
    const limitedMeasurements = limit ? sortedMeasurements.slice(0, limit) : sortedMeasurements;
    
    return this.mapMeasurementsToResponse(limitedMeasurements);
  }

  async getBodyMeasurementById(measurementId: string, userId: string): Promise<BodyMeasurementResponseDto | null> {
    const storage = await this.storage;
    const measurement = await storage.getBodyMeasurement(measurementId);
    
    if (!measurement) {
      return null;
    }

    if (measurement.user_id !== userId) {
      throw new Error('Acesso negado à medição corporal');
    }

    return this.mapMeasurementToResponse(measurement);
  }

  async createBodyMeasurement(userId: string, measurementData: CreateBodyMeasurementDto): Promise<BodyMeasurementResponseDto> {
    const storage = await this.storage;
    const measurement = await storage.createBodyMeasurement({
      ...measurementData,
      user_id: userId,
      measuredAt: measurementData.measuredAt || new Date(),
    });
    return this.mapMeasurementToResponse(measurement);
  }

  async updateBodyMeasurement(measurementId: string, userId: string, updateData: UpdateBodyMeasurementDto): Promise<BodyMeasurementResponseDto | null> {
    const storage = await this.storage;
    
    // Verify measurement exists and belongs to user
    const existingMeasurement = await storage.getBodyMeasurement(measurementId);
    if (!existingMeasurement) {
      throw new Error('Medição corporal não encontrada');
    }
    
    if (existingMeasurement.user_id !== userId) {
      throw new Error('Você não tem permissão para editar esta medição');
    }

    const updatedMeasurement = await storage.updateBodyMeasurement(measurementId, updateData);
    if (!updatedMeasurement) {
      return null;
    }

    return this.mapMeasurementToResponse(updatedMeasurement);
  }

  async deleteBodyMeasurement(measurementId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify measurement exists and belongs to user
    const existingMeasurement = await storage.getBodyMeasurement(measurementId);
    if (!existingMeasurement) {
      throw new Error('Medição corporal não encontrada');
    }
    
    if (existingMeasurement.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir esta medição');
    }

    return await storage.deleteBodyMeasurement(measurementId);
  }

  // Exercise Personal Records
  async getUserExercisePRs(userId: string, exerciseId?: string): Promise<ExercisePRResponseDto[]> {
    const storage = await this.storage;
    const prs = await storage.getExercisePRs(userId, exerciseId);
    return this.mapPRsToResponse(prs);
  }

  async getExercisePRById(prId: string, userId: string): Promise<ExercisePRResponseDto | null> {
    const storage = await this.storage;
    const pr = await storage.getExercisePR(prId);
    
    if (!pr) {
      return null;
    }

    if (pr.user_id !== userId) {
      throw new Error('Acesso negado ao record pessoal');
    }

    return this.mapPRToResponse(pr);
  }

  async createExercisePR(userId: string, prData: CreateExercisePRDto): Promise<ExercisePRResponseDto> {
    const storage = await this.storage;
    
    // Verify exercise exists
    const exercise = await storage.getExercise(prData.exerciseId);
    if (!exercise) {
      throw new Error('Exercício não encontrado');
    }

    const pr = await storage.createExercisePR({
      ...prData,
      user_id: userId,
      date: prData.date || new Date(),
    });
    return this.mapPRToResponse(pr);
  }

  async updateExercisePR(prId: string, userId: string, updateData: UpdateExercisePRDto): Promise<ExercisePRResponseDto | null> {
    const storage = await this.storage;
    
    // Verify PR exists and belongs to user
    const existingPR = await storage.getExercisePR(prId);
    if (!existingPR) {
      throw new Error('Record pessoal não encontrado');
    }
    
    if (existingPR.user_id !== userId) {
      throw new Error('Você não tem permissão para editar este record');
    }

    const updatedPR = await storage.updateExercisePR(prId, updateData);
    if (!updatedPR) {
      return null;
    }

    return this.mapPRToResponse(updatedPR);
  }

  async deleteExercisePR(prId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify PR exists and belongs to user
    const existingPR = await storage.getExercisePR(prId);
    if (!existingPR) {
      throw new Error('Record pessoal não encontrado');
    }
    
    if (existingPR.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir este record');
    }

    return await storage.deleteExercisePR(prId);
  }

  // Progress Photos
  async getUserProgressPhotos(userId: string, photoType?: string): Promise<ProgressPhotoResponseDto[]> {
    const storage = await this.storage;
    const photos = await storage.getProgressPhotos(userId, photoType);
    return this.mapPhotosToResponse(photos);
  }

  async createProgressPhoto(userId: string, photoData: CreateProgressPhotoDto): Promise<ProgressPhotoResponseDto> {
    const storage = await this.storage;
    const photo = await storage.createProgressPhoto({
      ...photoData,
      user_id: userId,
      takenAt: photoData.takenAt || new Date(),
    });
    return this.mapPhotoToResponse(photo);
  }

  async deleteProgressPhoto(photoId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify photo exists and belongs to user
    const existingPhoto = await storage.getProgressPhoto(photoId);
    if (!existingPhoto) {
      throw new Error('Foto de progresso não encontrada');
    }
    
    if (existingPhoto.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir esta foto');
    }

    return await storage.deleteProgressPhoto(photoId);
  }

  // Progress Goals
  async getUserProgressGoals(userId: string, isCompleted?: boolean): Promise<ProgressGoalResponseDto[]> {
    const storage = await this.storage;
    const goals = await storage.getProgressGoals(userId, isCompleted);
    return this.mapGoalsToResponse(goals);
  }

  async createProgressGoal(userId: string, goalData: CreateProgressGoalDto): Promise<ProgressGoalResponseDto> {
    const storage = await this.storage;
    const goal = await storage.createProgressGoal({
      ...goalData,
      user_id: userId,
    });
    return this.mapGoalToResponse(goal);
  }

  async updateProgressGoal(goalId: string, userId: string, updateData: UpdateProgressGoalDto): Promise<ProgressGoalResponseDto | null> {
    const storage = await this.storage;
    
    // Verify goal exists and belongs to user
    const existingGoal = await storage.getProgressGoal(goalId);
    if (!existingGoal) {
      throw new Error('Meta de progresso não encontrada');
    }
    
    if (existingGoal.user_id !== userId) {
      throw new Error('Você não tem permissão para editar esta meta');
    }

    const updatedGoal = await storage.updateProgressGoal(goalId, updateData);
    if (!updatedGoal) {
      return null;
    }

    return this.mapGoalToResponse(updatedGoal);
  }

  async deleteProgressGoal(goalId: string, userId: string): Promise<boolean> {
    const storage = await this.storage;
    
    // Verify goal exists and belongs to user
    const existingGoal = await storage.getProgressGoal(goalId);
    if (!existingGoal) {
      throw new Error('Meta de progresso não encontrada');
    }
    
    if (existingGoal.user_id !== userId) {
      throw new Error('Você não tem permissão para excluir esta meta');
    }

    return await storage.deleteProgressGoal(goalId);
  }

  // Workout Statistics
  async getWorkoutStats(userId: string, params: GetWorkoutStatsDto): Promise<WorkoutStatsResponseDto> {
    const storage = await this.storage;
    
    // Get workout logs within date range
    const workoutLogs = await storage.getWorkoutLogsInDateRange(
      userId, 
      params.startDate, 
      params.endDate
    );

    // Calculate basic stats
    const totalWorkouts = workoutLogs.length;
    let totalSets = 0;
    let totalReps = 0;
    let totalVolume = 0;
    let totalDuration = 0;

    for (const log of workoutLogs) {
      if (log.exercises) {
        for (const exercise of log.exercises) {
          if (exercise.sets) {
            totalSets += exercise.sets.length;
            for (const set of exercise.sets) {
              if (set.reps) totalReps += set.reps;
              if (set.weight && set.reps) {
                totalVolume += set.weight * set.reps;
              }
            }
          }
        }
      }
      
      if (log.endTime && log.startTime) {
        const duration = new Date(log.endTime).getTime() - new Date(log.startTime).getTime();
        totalDuration += duration / (1000 * 60); // Convert to minutes
      }
    }

    const averageWorkoutDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
    
    // Calculate workout frequency (workouts per week)
    const dateRange = params.endDate && params.startDate ? 
      (params.endDate.getTime() - params.startDate.getTime()) / (1000 * 60 * 60 * 24 * 7) : 
      4; // Default to 4 weeks if no range specified
    
    const workoutFrequency = dateRange > 0 ? totalWorkouts / dateRange : 0;

    const lastWorkoutDate = workoutLogs.length > 0 ? 
      new Date(Math.max(...workoutLogs.map(log => new Date(log.startTime).getTime()))) : 
      undefined;

    return {
      totalWorkouts,
      totalSets,
      totalReps,
      totalVolume,
      averageWorkoutDuration,
      workoutFrequency,
      lastWorkoutDate,
      strengthProgress: [], // TODO: Implement strength progress calculation
      bodyComposition: undefined, // TODO: Implement body composition comparison
    };
  }

  // Progress Summary
  async getProgressSummary(userId: string): Promise<ProgressSummaryResponseDto> {
    const storage = await this.storage;

    // Get latest body measurements
    const measurements = await this.getUserBodyMeasurements(userId, 2);
    const latestMeasurement = measurements[0];
    const previousMeasurement = measurements[1];

    // Calculate changes
    const changes: any = {};
    if (latestMeasurement && previousMeasurement) {
      if (latestMeasurement.weight && previousMeasurement.weight) {
        changes.weight = latestMeasurement.weight - previousMeasurement.weight;
      }
      if (latestMeasurement.bodyFat && previousMeasurement.bodyFat) {
        changes.bodyFat = latestMeasurement.bodyFat - previousMeasurement.bodyFat;
      }
      if (latestMeasurement.muscleMass && previousMeasurement.muscleMass) {
        changes.muscleMass = latestMeasurement.muscleMass - previousMeasurement.muscleMass;
      }
    }

    // Get recent PRs
    const recentPRs = await this.getUserExercisePRs(userId);
    const sortedPRs = recentPRs
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    // Get goals
    const activeGoals = await this.getUserProgressGoals(userId, false);
    const completedGoals = await this.getUserProgressGoals(userId, true);

    // Get workout stats for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const workoutStats = await this.getWorkoutStats(userId, {
      startDate: thirtyDaysAgo,
      endDate: new Date(),
    });

    return {
      bodyMeasurements: {
        latest: latestMeasurement,
        previous: previousMeasurement,
        changes,
      },
      exercisePRs: {
        recent: sortedPRs,
        totalPRs: recentPRs.length,
      },
      goals: {
        active: activeGoals,
        completed: completedGoals,
        totalGoals: activeGoals.length + completedGoals.length,
      },
      workoutStats,
    };
  }

  // Helper methods for mapping data
  private mapMeasurementToResponse(measurement: any): BodyMeasurementResponseDto {
    let bmi: number | undefined;
    if (measurement.weight && measurement.height) {
      const heightInMeters = measurement.height / 100;
      bmi = measurement.weight / (heightInMeters * heightInMeters);
    }

    return {
      id: measurement.id,
      weight: measurement.weight,
      height: measurement.height,
      bodyFat: measurement.bodyFat,
      muscleMass: measurement.muscleMass,
      waist: measurement.waist,
      chest: measurement.chest,
      arms: measurement.arms,
      thighs: measurement.thighs,
      notes: measurement.notes,
      measuredAt: measurement.measuredAt,
      createdAt: measurement.createdAt,
      bmi,
    };
  }

  private mapMeasurementsToResponse(measurements: any[]): BodyMeasurementResponseDto[] {
    return measurements.map(measurement => this.mapMeasurementToResponse(measurement));
  }

  private mapPRToResponse(pr: any): ExercisePRResponseDto {
    // Calculate 1RM using Brzycki formula: weight / (1.0278 - 0.0278 * reps)
    let oneRepMax: number | undefined;
    if (pr.weight && pr.reps) {
      if (pr.reps === 1) {
        oneRepMax = pr.weight;
      } else {
        oneRepMax = pr.weight / (1.0278 - 0.0278 * pr.reps);
      }
    }

    return {
      id: pr.id,
      exerciseId: pr.exerciseId,
      exerciseName: pr.exercise?.name || '',
      weight: pr.weight,
      reps: pr.reps,
      date: pr.date,
      notes: pr.notes,
      oneRepMax,
      exercise: pr.exercise ? {
        id: pr.exercise.id,
        name: pr.exercise.name,
        muscleGroup: pr.exercise.muscleGroup,
      } : undefined,
    };
  }

  private mapPRsToResponse(prs: any[]): ExercisePRResponseDto[] {
    return prs.map(pr => this.mapPRToResponse(pr));
  }

  private mapPhotoToResponse(photo: any): ProgressPhotoResponseDto {
    return {
      id: photo.id,
      photoUrl: photo.photoUrl,
      photoType: photo.photoType,
      notes: photo.notes,
      takenAt: photo.takenAt,
      createdAt: photo.createdAt,
    };
  }

  private mapPhotosToResponse(photos: any[]): ProgressPhotoResponseDto[] {
    return photos.map(photo => this.mapPhotoToResponse(photo));
  }

  private mapGoalToResponse(goal: any): ProgressGoalResponseDto {
    let progressPercentage: number | undefined;
    if (goal.targetValue > 0) {
      progressPercentage = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
    }

    return {
      id: goal.id,
      title: goal.title,
      description: goal.description,
      targetType: goal.targetType,
      targetValue: goal.targetValue,
      currentValue: goal.currentValue,
      targetDate: goal.targetDate,
      isCompleted: goal.isCompleted,
      exerciseId: goal.exerciseId,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
      progressPercentage,
      exercise: goal.exercise ? {
        id: goal.exercise.id,
        name: goal.exercise.name,
      } : undefined,
    };
  }

  private mapGoalsToResponse(goals: any[]): ProgressGoalResponseDto[] {
    return goals.map(goal => this.mapGoalToResponse(goal));
  }
}