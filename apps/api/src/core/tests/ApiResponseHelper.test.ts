import { describe, it, expect, jest } from '@jest/globals';
import { Response } from 'express';
import { ApiResponseHelper } from '../utils/response';

describe('ApiResponseHelper', () => {
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('success', () => {
    it('should send success response with data and message', () => {
      const data = { id: '1', name: 'Test' };
      const message = 'Success message';

      ApiResponseHelper.success(mockRes as Response, data, message);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });

    it('should send success response with default message', () => {
      const data = { id: '1', name: 'Test' };

      ApiResponseHelper.success(mockRes as Response, data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Operação realizada com sucesso',
      });
    });

    it('should send success response without data', () => {
      ApiResponseHelper.success(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Operação realizada com sucesso',
      });
    });
  });

  describe('created', () => {
    it('should send created response with data and message', () => {
      const data = { id: '1', name: 'Test' };
      const message = 'Created successfully';

      ApiResponseHelper.created(mockRes as Response, data, message);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message,
      });
    });

    it('should send created response with default message', () => {
      const data = { id: '1', name: 'Test' };

      ApiResponseHelper.created(mockRes as Response, data);

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Recurso criado com sucesso',
      });
    });
  });

  describe('error', () => {
    it('should send error response with custom message', () => {
      const message = 'Custom error message';

      ApiResponseHelper.error(mockRes as Response, message);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: message,
      });
    });

    it('should send error response with default message', () => {
      ApiResponseHelper.error(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Erro interno do servidor',
      });
    });
  });

  describe('notFound', () => {
    it('should send not found response with custom message', () => {
      const message = 'Resource not found';

      ApiResponseHelper.notFound(mockRes as Response, message);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: message,
      });
    });

    it('should send not found response with default message', () => {
      ApiResponseHelper.notFound(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Recurso não encontrado',
      });
    });
  });

  describe('forbidden', () => {
    it('should send forbidden response with custom message', () => {
      const message = 'Access denied';

      ApiResponseHelper.forbidden(mockRes as Response, message);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: message,
      });
    });

    it('should send forbidden response with default message', () => {
      ApiResponseHelper.forbidden(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acesso negado',
      });
    });
  });

  describe('unauthorized', () => {
    it('should send unauthorized response with custom message', () => {
      const message = 'Token invalid';

      ApiResponseHelper.unauthorized(mockRes as Response, message);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: message,
      });
    });

    it('should send unauthorized response with default message', () => {
      ApiResponseHelper.unauthorized(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Não autorizado',
      });
    });
  });

  describe('badRequest', () => {
    it('should send bad request response with custom message', () => {
      const message = 'Invalid data';

      ApiResponseHelper.badRequest(mockRes as Response, message);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: message,
      });
    });

    it('should send bad request response with default message', () => {
      ApiResponseHelper.badRequest(mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Requisição inválida',
      });
    });
  });

  describe('paginated', () => {
    it('should send paginated response with data and pagination info', () => {
      const data = [{ id: '1', name: 'Test 1' }, { id: '2', name: 'Test 2' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
        totalPages: 3,
      };
      const message = 'Data retrieved successfully';

      ApiResponseHelper.paginated(mockRes as Response, data, pagination, message);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        pagination,
        message,
      });
    });

    it('should send paginated response with default message', () => {
      const data = [{ id: '1', name: 'Test 1' }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      };

      ApiResponseHelper.paginated(mockRes as Response, data, pagination);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data,
        pagination,
        message: 'Dados recuperados com sucesso',
      });
    });
  });
});