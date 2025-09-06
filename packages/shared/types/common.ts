// Common types used across the application

export type ID = string;

export interface BaseEntity {
  id: ID;
  createdAt: Date;
  updatedAt?: Date;
}

export interface UserContextData {
  id: ID;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

export interface AuthenticatedRequest {
  user: UserContextData;
}

// API Response patterns
export type ApiError = {
  message: string;
  code?: string;
  details?: any;
};

export type ApiSuccess<T = any> = {
  data: T;
  message?: string;
};

export type ApiResult<T = any> = ApiSuccess<T> | { error: ApiError };

// Feature flags
export interface FeatureFlags {
  useNewArchitecture: boolean;
  enableProgressTracking: boolean;
  enableAdvancedWorkouts: boolean;
}