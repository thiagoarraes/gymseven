import { supabase } from './supabase-client';
import { type Request, type Response, type NextFunction } from 'express';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    user_metadata?: any;
  };
}

// Middleware to verify Supabase Auth JWT
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Token de acesso necessário' });
    }

    // Verify JWT with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.log('❌ Token verification failed:', error?.message);
      return res.status(403).json({ message: 'Token inválido' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error);
    return res.status(500).json({ message: 'Erro interno do servidor' });
  }
}

// Register user with Supabase Auth
export async function registerUser(email: string, password: string, userData: {
  username: string;
  firstName?: string;
  lastName?: string;
}) {
  try {
    // Create user with Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: userData.username,
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user) {
      throw new Error('Falha ao criar usuário');
    }

    console.log('✅ User registered successfully:', email);
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('❌ Registration error:', error);
    throw error;
  }
}

// Login user with Supabase Auth
export async function loginUser(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.user || !data.session) {
      throw new Error('Credenciais inválidas');
    }

    console.log('✅ User logged in successfully:', email);
    return {
      user: data.user,
      session: data.session
    };
  } catch (error) {
    console.error('❌ Login error:', error);
    throw error;
  }
}

// Logout user
export async function logoutUser(token: string) {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ User logged out successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Logout error:', error);
    throw error;
  }
}

// Reset password
export async function resetPassword(email: string) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.BASE_URL || 'http://localhost:5000'}/reset-password`
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('✅ Password reset email sent to:', email);
    return { success: true };
  } catch (error) {
    console.error('❌ Password reset error:', error);
    throw error;
  }
}

// Get user profile
export async function getUserProfile(token: string) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      throw new Error('Usuário não encontrado');
    }

    return user;
  } catch (error) {
    console.error('❌ Get user profile error:', error);
    throw error;
  }
}