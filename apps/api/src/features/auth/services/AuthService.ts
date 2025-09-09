import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getStorage } from '../../../../../../server/storage';
import { UserContextData } from '../../../core/types';
import { LoginDto, RegisterDto, ChangePasswordDto, UpdateProfileDto, AuthResponseDto } from '../dto';

export class AuthService {
  private storage = getStorage();
  private jwtSecret = process.env.JWT_SECRET || 'fallback-secret';

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

    // Update user
    const updatedUser = await storage.updateUser(userId, updateData);
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
    try {
      // First, try with v2 secret
      let decoded: any;
      try {
        decoded = jwt.verify(token, this.jwtSecret) as any;
      } catch (v2Error) {
        // If v2 fails, try with v1 secret (for backwards compatibility)
        try {
          const v1Secret = process.env.JWT_SECRET || this.jwtSecret;
          decoded = jwt.verify(token, v1Secret) as any;
        } catch (v1Error) {
          throw new Error('Token inválido');
        }
      }
      
      // Get user data from database using the userId from token
      // Handle both v1 format { userId, type } and v2 format { userId }
      const userId = decoded.userId;
      if (!userId) {
        throw new Error('Token inválido - userId não encontrado');
      }
      
      const storage = await this.storage;
      const user = await storage.getUser(userId);
      if (!user) {
        throw new Error('Usuário não encontrado');
      }
      
      return {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        profileImageUrl: user.profileImageUrl || undefined,
      };
    } catch (error: any) {
      console.error('Token verification failed:', error.message);
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