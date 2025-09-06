import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthService } from '../services/AuthService';
import { getStorage } from '../../../../../../server/storage';

// Mock the storage
jest.mock('../../../../../../server/storage');
const mockStorage = getStorage as jest.MockedFunction<typeof getStorage>;

describe('AuthService', () => {
  let authService: AuthService;
  let mockStorageInstance: any;

  beforeEach(() => {
    mockStorageInstance = {
      getUserByEmail: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      deleteUser: jest.fn(),
    };
    mockStorage.mockResolvedValue(mockStorageInstance);
    authService = new AuthService();
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockStorageInstance.getUserByEmail.mockResolvedValue(mockUser);

      const result = await authService.getUserByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockStorageInstance.getUserByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should return null when user not found', async () => {
      mockStorageInstance.getUserByEmail.mockResolvedValue(null);

      const result = await authService.getUserByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });

    it('should handle storage errors', async () => {
      mockStorageInstance.getUserByEmail.mockRejectedValue(new Error('Database error'));

      await expect(authService.getUserByEmail('test@example.com')).rejects.toThrow('Database error');
    });
  });

  describe('createUser', () => {
    it('should create user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
      };
      
      const mockCreatedUser = {
        id: '456',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorageInstance.createUser.mockResolvedValue(mockCreatedUser);

      const result = await authService.createUser(userData);

      expect(result).toEqual(mockCreatedUser);
      expect(mockStorageInstance.createUser).toHaveBeenCalledWith(userData);
    });

    it('should handle creation errors', async () => {
      const userData = {
        email: 'new@example.com',
        name: 'New User',
      };

      mockStorageInstance.createUser.mockRejectedValue(new Error('Creation failed'));

      await expect(authService.createUser(userData)).rejects.toThrow('Creation failed');
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      const userId = '123';
      const updateData = { name: 'Updated Name' };
      
      const mockUpdatedUser = {
        id: userId,
        email: 'test@example.com',
        name: 'Updated Name',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockStorageInstance.updateUser.mockResolvedValue(mockUpdatedUser);

      const result = await authService.updateUser(userId, updateData);

      expect(result).toEqual(mockUpdatedUser);
      expect(mockStorageInstance.updateUser).toHaveBeenCalledWith(userId, updateData);
    });

    it('should return null when user not found', async () => {
      mockStorageInstance.updateUser.mockResolvedValue(null);

      const result = await authService.updateUser('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('deleteUser', () => {
    it('should delete user successfully', async () => {
      mockStorageInstance.deleteUser.mockResolvedValue(true);

      const result = await authService.deleteUser('123');

      expect(result).toBe(true);
      expect(mockStorageInstance.deleteUser).toHaveBeenCalledWith('123');
    });

    it('should return false when user not found', async () => {
      mockStorageInstance.deleteUser.mockResolvedValue(false);

      const result = await authService.deleteUser('nonexistent');

      expect(result).toBe(false);
    });
  });
});