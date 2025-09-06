import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { type Request, type Response, type NextFunction } from 'express';
import { getStorage } from './storage';
import { 
  registerSchema, 
  loginSchema, 
  changePasswordSchema,
  type RegisterUser, 
  type LoginUser,
  type User
} from '@shared/schema';

import { randomBytes } from 'crypto';

// JWT Configuration - Secure generation for production
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be provided in production environment');
  }
  // Generate secure random string for development
  return randomBytes(64).toString('hex');
})();
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface AuthRequest extends Request {
  user?: User;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'access' }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; type: string } | null {
  try {
    // Try to decode the token first to check if it's a Supabase token
    const parts = token.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]));
      if (payload.iss && payload.iss.includes('supabase')) {
        // This is a Supabase token - map the subject to userId
        return { userId: payload.sub, type: 'supabase' };
      }
    }
    
    // Try local JWT verification for internal tokens
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

// Register user
export async function registerUser(userData: RegisterUser): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const validatedData = registerSchema.parse(userData);
  
  // Check if user already exists
  const db = await getStorage();
  const existingUserByEmail = await db.getUserByEmail(validatedData.email);
  if (existingUserByEmail) {
    throw new Error('Email já está em uso');
  }
  
  const existingUserByUsername = await db.getUserByUsername(validatedData.username);
  if (existingUserByUsername) {
    throw new Error('Nome de usuário já está em uso');
  }
  
  // Hash password
  const hashedPassword = await hashPassword(validatedData.password);
  
  // Create user
  const newUser = await db.createUser({
    ...validatedData,
    password: hashedPassword,
  });
  
  // Skip user preferences creation for now (table doesn't exist in current Supabase setup)
  console.log('Skipping user preferences creation - using basic user registration');
  
  // Generate token
  const token = generateToken(newUser.id);
  
  // Remove password from response
  const { password, ...userWithoutPassword } = newUser;
  
  return { user: userWithoutPassword, token };
}

// Login user
export async function loginUser(credentials: LoginUser): Promise<{ user: Omit<User, 'password'>; token: string }> {
  const validatedCredentials = loginSchema.parse(credentials);
  
  // Find user by email
  const db = await getStorage();
  const user = await db.getUserByEmail(validatedCredentials.email);
  if (!user) {
    throw new Error('Este email não está cadastrado. Verifique o email ou crie uma nova conta.');
  }
  
  // Verify password
  const isValidPassword = await verifyPassword(validatedCredentials.password, user.password);
  if (!isValidPassword) {
    throw new Error('Email ou senha incorretos');
  }
  
  // Update last login
  await db.updateLastLogin(user.id);
  
  // Generate token
  const token = generateToken(user.id);
  
  // Remove password from response
  const { password, ...userWithoutPassword } = user;
  
  return { user: userWithoutPassword, token };
}

// Change password
export async function changeUserPassword(userId: string, passwordData: any): Promise<void> {
  const validatedData = changePasswordSchema.parse(passwordData);
  
  // Get current user
  const db = await getStorage();
  const user = await db.getUser(userId);
  if (!user) {
    throw new Error('Usuário não encontrado');
  }
  
  // Verify current password
  const isValidPassword = await verifyPassword(validatedData.currentPassword, user.password);
  if (!isValidPassword) {
    throw new Error('Senha atual incorreta');
  }
  
  // Hash new password
  const hashedNewPassword = await hashPassword(validatedData.newPassword);
  
  // Update password
  await db.updateUser(userId, { password: hashedNewPassword });
}

// Middleware to authenticate requests
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ message: 'Token de acesso necessário' });
  }
  
  const decoded = verifyToken(token);
  if (!decoded) {
    console.error('Token verification failed:', { token: token.substring(0, 20) + '...' });
    return res.status(403).json({ message: 'Token inválido ou expirado - faça login novamente' });
  }
  
  try {
    console.log('Looking for user with ID:', decoded.userId);
    const db = await getStorage();
    const user = await db.getUser(decoded.userId);
    if (!user) {
      console.error('User not found in database:', decoded.userId);
      return res.status(403).json({ message: 'Sessão expirada - faça login novamente' });
    }
    
    console.log('Authentication successful for user:', user.id);
    req.user = user;
    next();
  } catch (error) {
    console.error('Error in authenticateToken:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// Optional authentication (doesn't fail if no token)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const decoded = verifyToken(token);
    if (decoded) {
      try {
        const db = await getStorage();
        const user = await db.getUser(decoded.userId);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Silently fail for optional auth
      }
    }
  }
  
  next();
}