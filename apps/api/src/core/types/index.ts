import { Request } from 'express';

// User context data for authenticated requests
export interface UserContextData {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Extend Express Request with user data
export interface AuthenticatedRequest extends Request {
  user: UserContextData;
}

export interface Controller {
  [key: string]: (req: AuthenticatedRequest, res: any, next?: any) => Promise<any>;
}

export interface Service {
  [key: string]: (...args: any[]) => Promise<any>;
}

export interface Repository {
  [key: string]: (...args: any[]) => Promise<any>;
}