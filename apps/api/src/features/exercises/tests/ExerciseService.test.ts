import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ExerciseService } from '../services/ExerciseService';
import { getStorage } from '../../../../../../server/storage';

// Mock the storage
jest.mock('../../../../../../server/storage');
const mockStorage = getStorage as jest.MockedFunction<typeof getStorage>;

describe('ExerciseService', () => {
  let exerciseService: ExerciseService;
  let mockStorageInstance: any;

  beforeEach(() => {
    mockStorageInstance = {
      getAllExercises: jest.fn(),
      getExercise: jest.fn(),
      createExercise: jest.fn(),
      updateExercise: jest.fn(),
      deleteExercise: jest.fn(),
      getMuscleGroups: jest.fn(),
    };
    mockStorage.mockResolvedValue(mockStorageInstance);
    exerciseService = new ExerciseService();
  });

  describe('getAllExercises', () => {
    it('should return paginated exercises', async () => {
      const mockExercises = [
        {
          id: '1',
          name: 'Push Up',
          muscleGroup: 'Chest',
          instructions: 'Do push ups',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'Pull Up',
          muscleGroup: 'Back',
          instructions: 'Do pull ups',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockStorageInstance.getAllExercises.mockResolvedValue({
        exercises: mockExercises,
        total: 2,
      });

      const result = await exerciseService.getAllExercises({
        page: 1,
        limit: 10,
      });

      expect(result.exercises).toEqual(mockExercises);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.totalPages).toBe(1);
    });

    it('should filter by muscle group', async () => {
      const mockExercises = [
        {
          id: '1',
          name: 'Push Up',
          muscleGroup: 'Chest',
          instructions: 'Do push ups',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockStorageInstance.getAllExercises.mockResolvedValue({
        exercises: mockExercises,
        total: 1,
      });

      const result = await exerciseService.getAllExercises({
        muscleGroup: 'Chest',
        page: 1,
        limit: 10,
      });

      expect(result.exercises).toEqual(mockExercises);
      expect(mockStorageInstance.getAllExercises).toHaveBeenCalledWith({
        muscleGroup: 'Chest',
        search: undefined,
        offset: 0,
        limit: 10,
      });
    });

    it('should search exercises by name', async () => {
      const mockExercises = [
        {
          id: '1',
          name: 'Push Up',
          muscleGroup: 'Chest',
          instructions: 'Do push ups',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockStorageInstance.getAllExercises.mockResolvedValue({
        exercises: mockExercises,
        total: 1,
      });

      const result = await exerciseService.getAllExercises({
        search: 'push',
        page: 1,
        limit: 10,
      });

      expect(result.exercises).toEqual(mockExercises);
      expect(mockStorageInstance.getAllExercises).toHaveBeenCalledWith({
        muscleGroup: undefined,
        search: 'push',
        offset: 0,
        limit: 10,
      });
    });
  });

  describe('getExerciseById', () => {
    it('should return exercise when found', async () => {
      const mockExercise = {
        id: '1',
        name: 'Push Up',
        muscleGroup: 'Chest',
        instructions: 'Do push ups',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorageInstance.getExercise.mockResolvedValue(mockExercise);

      const result = await exerciseService.getExerciseById('1');

      expect(result).toEqual(mockExercise);
      expect(mockStorageInstance.getExercise).toHaveBeenCalledWith('1');
    });

    it('should return null when exercise not found', async () => {
      mockStorageInstance.getExercise.mockResolvedValue(null);

      const result = await exerciseService.getExerciseById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('createExercise', () => {
    it('should create exercise successfully', async () => {
      const exerciseData = {
        name: 'New Exercise',
        muscleGroup: 'Legs',
        instructions: 'Do the exercise',
      };

      const mockCreatedExercise = {
        id: '3',
        ...exerciseData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorageInstance.createExercise.mockResolvedValue(mockCreatedExercise);

      const result = await exerciseService.createExercise(exerciseData);

      expect(result).toEqual(mockCreatedExercise);
      expect(mockStorageInstance.createExercise).toHaveBeenCalledWith(exerciseData);
    });

    it('should handle creation errors', async () => {
      const exerciseData = {
        name: 'New Exercise',
        muscleGroup: 'Legs',
        instructions: 'Do the exercise',
      };

      mockStorageInstance.createExercise.mockRejectedValue(new Error('Creation failed'));

      await expect(exerciseService.createExercise(exerciseData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateExercise', () => {
    it('should update exercise successfully', async () => {
      const exerciseId = '1';
      const updateData = { name: 'Updated Exercise' };

      const mockUpdatedExercise = {
        id: exerciseId,
        name: 'Updated Exercise',
        muscleGroup: 'Chest',
        instructions: 'Do push ups',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorageInstance.updateExercise.mockResolvedValue(mockUpdatedExercise);

      const result = await exerciseService.updateExercise(exerciseId, updateData);

      expect(result).toEqual(mockUpdatedExercise);
      expect(mockStorageInstance.updateExercise).toHaveBeenCalledWith(exerciseId, updateData);
    });

    it('should return null when exercise not found', async () => {
      mockStorageInstance.updateExercise.mockResolvedValue(null);

      const result = await exerciseService.updateExercise('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteExercise', () => {
    it('should delete exercise successfully', async () => {
      mockStorageInstance.deleteExercise.mockResolvedValue(true);

      const result = await exerciseService.deleteExercise('1');

      expect(result).toBe(true);
      expect(mockStorageInstance.deleteExercise).toHaveBeenCalledWith('1');
    });

    it('should return false when exercise not found', async () => {
      mockStorageInstance.deleteExercise.mockResolvedValue(false);

      const result = await exerciseService.deleteExercise('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('getMuscleGroups', () => {
    it('should return unique muscle groups', async () => {
      const mockMuscleGroups = ['Chest', 'Back', 'Legs', 'Arms', 'Shoulders'];

      mockStorageInstance.getMuscleGroups.mockResolvedValue(mockMuscleGroups);

      const result = await exerciseService.getMuscleGroups();

      expect(result).toEqual(mockMuscleGroups);
      expect(mockStorageInstance.getMuscleGroups).toHaveBeenCalled();
    });

    it('should handle empty muscle groups', async () => {
      mockStorageInstance.getMuscleGroups.mockResolvedValue([]);

      const result = await exerciseService.getMuscleGroups();

      expect(result).toEqual([]);
    });
  });
});