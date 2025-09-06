// Re-export all schemas and types from the original shared schema
export * from '../../../shared/schema';

// Additional types for the refactored architecture
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

export interface FilterOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}