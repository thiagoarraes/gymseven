import { Response } from 'express';

// Response types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status: 'success' | 'error';
  errors?: any[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// HTTP Status constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export class ApiResponseHelper {
  static success<T>(res: Response, data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      data,
      status: 'success',
      message,
    };
    return res.status(HTTP_STATUS.OK).json(response);
  }

  static created<T>(res: Response, data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      data,
      status: 'success',
      message: message || 'Resource created successfully',
    };
    return res.status(HTTP_STATUS.CREATED).json(response);
  }

  static error(res: Response, message: string, status: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, errors?: any[]): Response {
    const response: ApiResponse = {
      status: 'error',
      message,
      errors,
    };
    return res.status(status).json(response);
  }

  static badRequest(res: Response, message: string = 'Bad request', errors?: any[]): Response {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res: Response, message: string = 'Resource not found'): Response {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res: Response, message: string = 'Resource conflict'): Response {
    return this.error(res, message, HTTP_STATUS.CONFLICT);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): Response {
    const response: PaginatedResponse<T> = {
      data,
      status: 'success',
      message,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
    return res.status(HTTP_STATUS.OK).json(response);
  }
}