import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { getStorage } from '../../../../../../server/storage';
import { UserContextData } from '../../../core/types';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto, AuthResponseDto } from '../dto';

export class AuthService {
  private storage = getStorage();
  // Import the EXACT same JWT_SECRET that v1 uses to ensure compatibility
  private jwtSecret = (() => {
    // Force use of environment variable for consistency between v1 and v2
    const envSecret = process.env.JWT_SECRET;
    if (envSecret) {
      console.log('🔍 [AUTH SERVICE V2] Using JWT_SECRET from env:', envSecret.substring(0, 10) + '...');
      return envSecret;
    }
    
    // Fallback to the same secret as set in .env
    const fallbackSecret = 'stable-development-secret-for-replit-migration';
    console.log('🔍 [AUTH SERVICE V2] Using fallback secret:', fallbackSecret.substring(0, 10) + '...');
    return fallbackSecret;
  })();

  async login(loginData: LoginDto): Promise<AuthResponseDto> {
    const storage = await this.storage;
    
    // Find user by email
    const user = await storage.getUserByEmail(loginData.email);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(loginData.password, user.password);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    // Update last login
    await storage.updateLastLogin(user.id);

    // Generate token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      },
      token,
    };
  }

  async register(registerData: RegisterDto): Promise<AuthResponseDto> {
    const storage = await this.storage;
    
    // Check if email already exists
    const existingUserByEmail = await storage.getUserByEmail(registerData.email);
    if (existingUserByEmail) {
      throw new Error('Email já está em uso');
    }

    // Check if username already exists
    const existingUserByUsername = await storage.getUserByUsername(registerData.username);
    if (existingUserByUsername) {
      throw new Error('Nome de usuário já está em uso');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(registerData.password, 12);

    // Create user
    const newUser = await storage.createUser({
      email: registerData.email,
      username: registerData.username,
      password: hashedPassword,
      firstName: registerData.firstName,
      lastName: registerData.lastName,
    });

    // Generate token
    const token = this.generateToken(newUser.id);

    return {
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        firstName: newUser.firstName || undefined,
        lastName: newUser.lastName || undefined,
        profileImageUrl: newUser.profileImageUrl || undefined,
      },
      token,
    };
  }

  async updateProfile(userId: string, updateData: UpdateProfileDto): Promise<UserContextData> {
    const storage = await this.storage;
    
    // Check if email is being changed and if it's already in use
    if (updateData.email) {
      const existingUser = await storage.getUserByEmail(updateData.email);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Email já está em uso');
      }
    }
    
    // Check if username is being changed and if it's already in use
    if (updateData.username) {
      const existingUser = await storage.getUserByUsername(updateData.username);
      if (existingUser && existingUser.id !== userId) {
        throw new Error('Nome de usuário já está em uso');
      }
    }

    // Convert null values to undefined for storage interface compatibility
    const storageData = {
      ...updateData,
      height: updateData.height === null ? undefined : updateData.height,
      weight: updateData.weight === null ? undefined : updateData.weight,
    };
    
    // Update user
    const updatedUser = await storage.updateUser(userId, storageData);
    if (!updatedUser) {
      throw new Error('Usuário não encontrado');
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      firstName: updatedUser.firstName || undefined,
      lastName: updatedUser.lastName || undefined,
      profileImageUrl: updatedUser.profileImageUrl || undefined,
    };
  }

  async changePassword(userId: string, passwordData: ChangePasswordDto): Promise<void> {
    const storage = await this.storage;
    
    // Get current user
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('Usuário não encontrado');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(passwordData.currentPassword, user.password);
    if (!isValidPassword) {
      throw new Error('Senha atual incorreta');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(passwordData.newPassword, 12);

    // Update password
    await storage.updateUser(userId, { password: hashedPassword });
  }

  async deleteAccount(userId: string): Promise<void> {
    const storage = await this.storage;
    
    const deleted = await storage.deleteUser(userId);
    if (!deleted) {
      throw new Error('Usuário não encontrado');
    }
  }

  async verifyToken(token: string): Promise<UserContextData> {
    console.log('🔍 [AUTH SERVICE V2] Starting token verification');
    console.log('🔍 [AUTH SERVICE V2] Token:', token.substring(0, 20) + '...');
    console.log('🔍 [AUTH SERVICE V2] V2 Secret:', this.jwtSecret.substring(0, 10) + '...');
    
    try {
      // First, try with v2 secret (local JWT tokens)
      let decoded: any;
      let tokenSource = '';
      let user: any;
      
      try {
        console.log('🔍 [AUTH SERVICE V2] Trying v2 verification...');
        decoded = jwt.verify(token, this.jwtSecret) as any;
        tokenSource = 'v2';
        console.log('✅ [AUTH SERVICE V2] V2 verification successful');
      } catch (v2Error: any) {
        console.log('❌ [AUTH SERVICE V2] V2 verification failed:', v2Error.message);
        
        // If v2 fails, try with v1 secret (for backwards compatibility)
        try {
          // Use the same fallback secret that we defined for v2
          const v1Secret = process.env.JWT_SECRET || 'stable-development-secret-for-replit-migration';
          console.log('🔍 [AUTH SERVICE V2] Trying v1 verification with secret:', v1Secret.substring(0, 10) + '...');
          decoded = jwt.verify(token, v1Secret) as any;
          tokenSource = 'v1';
          console.log('✅ [AUTH SERVICE V2] V1 verification successful');
        } catch (v1Error: any) {
          console.log('❌ [AUTH SERVICE V2] V1 verification failed:', v1Error.message);
          
          // If both local JWT attempts fail, try Supabase verification
          try {
            console.log('🔍 [AUTH SERVICE V2] Trying Supabase token verification...');
            const { createClient } = await import('@supabase/supabase-js');
            const supabaseUrl = process.env.VITE_SUPABASE_URL!;
            const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
            
            const supabase = createClient(supabaseUrl, supabaseAnonKey, {
              auth: {
                persistSession: false,
                autoRefreshToken: false,
              }
            });

            // Verify token with Supabase
            const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
            
            if (error || !supabaseUser) {
              console.log('❌ [AUTH SERVICE V2] Supabase token verification failed:', error?.message || 'No user');
              throw new Error('Token inválido');
            }

            console.log('✅ [AUTH SERVICE V2] Supabase token verification successful:', supabaseUser.email);
            tokenSource = 'supabase';

            // Get user from our database by email (since Supabase user ID != our user ID)
            const storage = await this.storage;
            user = await storage.getUserByEmail(supabaseUser.email!);
            
            if (!user) {
              console.log('❌ [AUTH SERVICE V2] Supabase user not found in local DB:', supabaseUser.email);
              throw new Error('Usuário não encontrado no banco local');
            }

            console.log('✅ [AUTH SERVICE V2] Found user in local DB:', user.email);
            
            return {
              id: user.id,
              email: user.email,
              username: user.username,
              firstName: user.firstName || undefined,
              lastName: user.lastName || undefined,
              profileImageUrl: user.profileImageUrl || undefined,
            };
            
          } catch (supabaseError: any) {
            console.log('❌ [AUTH SERVICE V2] Supabase verification failed:', supabaseError.message);
            throw new Error('Token inválido');
          }
        }
      }
      
      // Handle local JWT tokens (v1 and v2)
      console.log('🔍 [AUTH SERVICE V2] Decoded token:', JSON.stringify(decoded));
      console.log('🔍 [AUTH SERVICE V2] Token source:', tokenSource);
      
      // Let's also decode the token manually to see what's inside
      try {
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          console.log('🔍 [AUTH SERVICE V2] Manual token decode:', JSON.stringify(payload));
        }
      } catch (e) {
        console.log('❌ [AUTH SERVICE V2] Failed to manually decode token');
      }
      
      // Get user data from database using the userId from token
      // Handle both v1 format { userId, type } and v2 format { userId }
      const userId = decoded.userId;
      if (!userId) {
        console.log('❌ [AUTH SERVICE V2] No userId in token');
        throw new Error('Token inválido - userId não encontrado');
      }
      
      console.log('🔍 [AUTH SERVICE V2] Looking up user:', userId);
      const storage = await this.storage;
      user = await storage.getUser(userId);
      if (!user) {
        console.log('❌ [AUTH SERVICE V2] User not found in database');
        throw new Error('Usuário não encontrado');
      }
      
      console.log('✅ [AUTH SERVICE V2] User found:', user.email);
      
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };
    } catch (error: any) {
      console.error('❌ [AUTH SERVICE V2] Token verification failed:', error.message);
      throw new Error('Token inválido');
    }
  }

  private generateToken(userId: string): string {
    return jwt.sign(
      { userId },
      this.jwtSecret,
      { expiresIn: '7d' }
    );
  }
}