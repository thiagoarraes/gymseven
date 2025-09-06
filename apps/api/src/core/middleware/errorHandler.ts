import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { ApiResponseHelper } from '../utils/response';

// Error codes
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || ERROR_CODES.INTERNAL_ERROR;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  error: AppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      code: err.code,
    }));
    
    return ApiResponseHelper.badRequest(res, 'Validation failed', errors);
  }

  // Handle custom application errors
  if (error instanceof CustomError) {
    return ApiResponseHelper.error(res, error.message, error.statusCode);
  }

  // Handle other known errors
  if ('statusCode' in error && error.statusCode) {
    return ApiResponseHelper.error(res, error.message, error.statusCode);
  }

  // Log unexpected errors
  console.error('Unexpected error:', error);

  // Handle unexpected errors
  return ApiResponseHelper.error(res, 'Internal server error');
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};