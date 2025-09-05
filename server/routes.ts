import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { getStorage } from "./storage";
import { 
  insertExerciseSchema, 
  insertWorkoutTemplateSchema,
  insertWorkoutTemplateExerciseSchema,
  insertWorkoutLogSchema,
  insertWorkoutLogExerciseSchema,
  insertWorkoutLogSetSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateUserSchema,
  insertWeightHistorySchema,
  insertUserGoalSchema,
  updateUserPreferencesSchema
} from "@shared/schema";
import { registerUser, loginUser, changeUserPassword, optionalAuth } from "./auth";
import { authenticateToken as localAuthToken, type AuthRequest as LocalAuthRequest } from "./auth";
import { authenticateToken as supabaseAuthToken, type AuthRequest as SupabaseAuthRequest } from "./supabase-auth";
import { registerSupabaseAuthRoutes } from "./supabase-routes";

// Use appropriate auth middleware based on configuration
const authenticateToken = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY 
  ? supabaseAuthToken 
  : localAuthToken;

type AuthRequest = typeof authenticateToken extends typeof supabaseAuthToken 
  ? SupabaseAuthRequest 
  : LocalAuthRequest;

// Configure multer for avatar uploads
const uploadsDir = path.join(process.cwd(), 'uploads', 'avatars');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const userId = (req as any).user?.id;
    const ext = path.extname(file.originalname);
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    cb(null, filename);
  }
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use JPEG, PNG ou WebP.'));
    }
  }
});

export async function registerRoutes(app: Express, createServerInstance = true): Promise<Server | null> {
  // Initialize storage once for all routes
  const db = await getStorage();
  
  // Register authentication routes based on storage type
  if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    registerSupabaseAuthRoutes(app);
  } else {
    // Use PostgreSQL-based authentication
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { user, token } = await registerUser(req.body);
        res.status(201).json({ user, token });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        } else {
          res.status(400).json({ message: error.message });
        }
      }
    });

    app.post('/api/auth/login', async (req, res) => {
      try {
        const { user, token } = await loginUser(req.body);
        res.json({ user, token });
      } catch (error: any) {
        if (error.name === 'ZodError') {
          res.status(400).json({ message: 'Dados inválidos', errors: error.errors });
        } else {
          res.status(401).json({ message: error.message });
        }
      }
    });

    app.post('/api/auth/logout', (req, res) => {
      res.json({ message: 'Logout realizado com sucesso' });
    });
  }
  
  // Endpoint para fornecer configurações do Supabase para o frontend
  app.get('/api/config', (req, res) => {
    res.json({
      supabaseUrl: process.env.SUPABASE_URL || null,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY || null,
      usesSupabase: !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
    });
  });
  
  // Auth routes now handled by Supabase Auth (see supabase-routes.ts)

  // Update user profile
  app.put('/api/auth/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if email is being changed and if it's already in use
      if (req.body.email && req.body.email !== req.user!.email) {
        const existingUser = await db.getUserByEmail(req.body.email);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(409).json({ message: "Email já está em uso" });
        }
      }
      
      // Check if username is being changed and if it's already in use
      if (req.body.username && req.body.username !== req.user!.username) {
        const existingUser = await db.getUserByUsername(req.body.username);
        if (existingUser && existingUser.id !== req.user!.id) {
          return res.status(409).json({ message: "Nome de usuário já está em uso" });
        }
      }
      const updateData = updateUserSchema.parse(req.body);
      
      // Convert null values to undefined for storage interface compatibility
      const storageData = {
        ...updateData,
        height: updateData.height === null ? undefined : updateData.height,
        weight: updateData.weight === null ? undefined : updateData.weight,
      };
      
      const updatedUser = await db.updateUser(req.user!.id, storageData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Dados inválidos', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  app.post("/api/auth/change-password", authenticateToken, async (req: AuthRequest, res) => {
    try {
      await changeUserPassword(req.user!.id, req.body);
      res.json({ message: "Senha alterada com sucesso" });
    } catch (error: any) {
      if (error.message.includes('incorreta')) {
        res.status(400).json({ message: error.message });
      } else if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Clear user data endpoint (keep account, remove all data) - NOT IMPLEMENTED FOR SUPABASE
  app.delete('/api/auth/clear-data', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // For now, return not implemented as this requires complex Supabase table operations
      res.status(501).json({ message: "Funcionalidade não implementada com Supabase" });
    } catch (error: any) {
      console.error('Error clearing user data:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Delete account endpoint
  app.delete('/api/auth/account', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Delete user avatar file if exists
      if (req.user!.profileImageUrl && req.user!.profileImageUrl.startsWith('/uploads/avatars/')) {
        const avatarPath = path.join(process.cwd(), req.user!.profileImageUrl);
        if (fs.existsSync(avatarPath)) {
          fs.unlinkSync(avatarPath);
        }
      }
      
      // Delete user from database (cascading deletes will handle related data)
      const deleted = await db.deleteUser(userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      
      res.status(200).json({ message: "Conta excluída com sucesso" });
    } catch (error: any) {
      console.error('Error deleting account:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Upload avatar endpoint
  app.post('/api/auth/upload-avatar', authenticateToken, uploadAvatar.single('avatar'), async (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      // Generate URL for the uploaded file
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      
      // Update user's profile image URL
      const updatedUser = await db.updateUser(req.user!.id, {
        profileImageUrl: avatarUrl
      });

      if (!updatedUser) {
        return res.status(404).json({ message: 'Usuário não encontrado' });
      }

      // Delete old avatar file if exists
      if (req.user!.profileImageUrl && req.user!.profileImageUrl.startsWith('/uploads/avatars/')) {
        const oldFilePath = path.join(process.cwd(), req.user!.profileImageUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
    } catch (error: any) {
      console.error('Upload avatar error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Forgot password endpoint
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: 'Email é obrigatório' });
      }

      // Check if user exists
      const user = await db.getUserByEmail(email);
      
      // For security, we always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        console.log(`Password reset requested for non-existent email: ${email}`);
        return res.json({ message: 'Se o email existir, você receberá as instruções de recuperação' });
      }

      // TODO: Here you would normally:
      // 1. Generate a secure reset token
      // 2. Store it in the database with expiration
      // 3. Send email with reset link
      
      console.log(`Password reset requested for user: ${user.id} (${user.email})`);
      
      // For now, just log and return success
      res.json({ message: 'Se o email existir, você receberá as instruções de recuperação' });
    } catch (error: any) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  });

  // Serve static files for uploads
  app.use('/uploads', (req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache
    next();
  }, express.static(path.join(process.cwd(), 'uploads')));



  // Weight History routes
  app.get("/api/weight-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await db.getWeightHistory(req.user!.id, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar histórico de peso" });
    }
  });

  app.post("/api/weight-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWeightHistorySchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const entry = await db.addWeightEntry(validatedData);
      res.status(201).json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  app.put("/api/weight-history/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWeightHistorySchema.partial().parse(req.body);
      const entry = await db.updateWeightEntry(req.params.id, validatedData);
      
      if (!entry) {
        return res.status(404).json({ message: "Entrada não encontrada" });
      }
      
      res.json(entry);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  app.delete("/api/weight-history/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await db.deleteWeightEntry(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Entrada não encontrada" });
      }
      res.json({ message: "Entrada removida com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User Goals routes
  app.get("/api/goals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const goals = await db.getUserGoals(req.user!.id);
      res.json(goals);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar objetivos" });
    }
  });

  app.post("/api/goals", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertUserGoalSchema.parse({
        ...req.body,
        userId: req.user!.id
      });
      const goal = await db.createUserGoal(validatedData);
      res.status(201).json(goal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  app.put("/api/goals/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertUserGoalSchema.partial().parse(req.body);
      const goal = await db.updateUserGoal(req.params.id, validatedData);
      
      if (!goal) {
        return res.status(404).json({ message: "Objetivo não encontrado" });
      }
      
      res.json(goal);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  app.delete("/api/goals/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const success = await db.deleteUserGoal(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Objetivo não encontrado" });
      }
      res.json({ message: "Objetivo removido com sucesso" });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User Preferences routes
  app.get("/api/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const preferences = await db.getUserPreferences(req.user!.id);
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = await db.createUserPreferences({
          userId: req.user!.id,
          theme: 'dark',
          units: 'metric',
          language: 'pt-BR',
          notifications: true,
          soundEffects: true,
          restTimerAutoStart: true,
          defaultRestTime: 90,
          weekStartsOn: 1,
          trackingData: 'all'
        });
        return res.json(defaultPrefs);
      }
      res.json(preferences);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar preferências" });
    }
  });

  app.put("/api/preferences", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = updateUserPreferencesSchema.parse(req.body);
      const preferences = await db.updateUserPreferences(req.user!.id, validatedData);
      
      if (!preferences) {
        return res.status(404).json({ message: "Preferências não encontradas" });
      }
      
      res.json(preferences);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro interno do servidor" });
      }
    }
  });

  // Exercise routes - require authentication
  app.get("/api/exercicios", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { muscleGroup } = req.query;
      let exercises;
      
      if (muscleGroup && typeof muscleGroup === 'string') {
        // Filter by muscle group for the authenticated user only
        exercises = await db.getExercisesByMuscleGroup(muscleGroup, req.user!.id);
      } else {
        // Get user-specific exercises only
        exercises = await db.getExercises(req.user!.id);
      }
      
      // Disable all caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': Math.random().toString()
      });
      
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exercícios" });
    }
  });

  app.get("/api/exercicios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const exercise = await db.getExercise(req.params.id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exercício" });
    }
  });

  app.post("/api/exercicios", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Debug logging
      console.log('Exercise creation request:', {
        body: req.body,
        userId: req.user?.id,
        userExists: !!req.user
      });
      
      if (!req.user || !req.user.id) {
        console.error('No authenticated user found');
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const validatedData = insertExerciseSchema.parse(req.body);
      
      console.log('Validated exercise data:', validatedData);
      
      const exercise = await db.createExercise(validatedData, req.user.id);
      res.status(201).json(exercise);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));
        
        console.error('Validation errors creating exercise:', validationErrors);
        console.error('Request body:', req.body);
        
        res.status(400).json({ 
          message: "Dados inválidos para criação do exercício",
          errors: validationErrors
        });
      } else {
        console.error('Error creating exercise:', error);
        res.status(500).json({ 
          message: "Erro interno do servidor",
          error: error.message
        });
      }
    }
  });

  app.put("/api/exercicios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = insertExerciseSchema.partial().parse(req.body);
      const exercise = await db.updateExercise(req.params.id, updates, req.user!.id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercício não encontrado ou você não tem permissão para editá-lo" });
      }
      res.json(exercise);
    } catch (error) {
      console.error('Error updating exercise:', error);
      res.status(400).json({ message: "Dados inválidos para atualização do exercício" });
    }
  });

  app.delete("/api/exercicios/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deleted = await db.deleteExercise(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar exercício" });
    }
  });

  // Workout Template routes - require authentication
  app.get("/api/workout-templates", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Get user-specific templates only
      const templates = await db.getWorkoutTemplates(req.user!.id);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar modelos de treino" });
    }
  });

  app.get("/api/workout-templates/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const template = await db.getWorkoutTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Modelo de treino não encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar modelo de treino" });
    }
  });

  app.get("/api/workout-templates/:id/exercises", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const exercises = await db.getWorkoutTemplateExercises(req.params.id);
      res.json(exercises);
    } catch (error) {
      console.error('Error fetching template exercises for template:', req.params.id, error);
      res.status(500).json({ message: "Erro ao buscar exercícios do treino" });
    }
  });

  app.post("/api/workout-templates", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("Workout template creation request:", {
        body: req.body,
        userId: req.user!.id
      });
      
      const validatedData = insertWorkoutTemplateSchema.parse({
        ...req.body,
        user_id: req.user!.id // Use snake_case field name to match database schema
      });
      const template = await db.createWorkoutTemplate(validatedData);
      res.status(201).json(template);
    } catch (error: any) {
      console.error("Workout template creation error:", {
        error: error.message,
        zodErrors: error.errors,
        requestBody: req.body
      });
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos para criação do modelo de treino",
          errors: error.errors
        });
      } else {
        res.status(400).json({ message: "Dados inválidos para criação do modelo de treino" });
      }
    }
  });

  app.put("/api/workout-templates/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updates = insertWorkoutTemplateSchema.partial().parse(req.body);
      const template = await db.updateWorkoutTemplate(req.params.id, updates);
      if (!template) {
        return res.status(404).json({ message: "Modelo de treino não encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do modelo de treino" });
    }
  });

  app.delete("/api/workout-templates/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deleted = await db.deleteWorkoutTemplate(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Modelo de treino não encontrado ou você não tem permissão para excluí-lo" });
      }
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting workout template:', error);
      res.status(500).json({ message: "Erro ao deletar modelo de treino" });
    }
  });

  app.post("/api/workout-templates/:id/exercises", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const templateId = req.params.id;
      
      // Converter reps para número se for possível, caso contrário manter como string
      let processedBody = { ...req.body };
      if (typeof processedBody.reps === 'string') {
        // Se reps é uma string simples como "8" ou "10", converter para número
        // Se é uma faixa como "8-12", manter como string
        const repsStr = processedBody.reps.trim();
        if (/^\d+$/.test(repsStr)) {
          processedBody.reps = parseInt(repsStr);
        } else {
          // Para o Supabase, vamos usar apenas o primeiro número da faixa
          const match = repsStr.match(/^(\d+)/);
          if (match) {
            processedBody.reps = parseInt(match[1]);
          }
        }
      }
      
      const validatedData = insertWorkoutTemplateExerciseSchema.parse({
        ...processedBody,
        templateId
      });
      
      const templateExercise = await db.addExerciseToTemplate(validatedData);
      res.status(201).json(templateExercise);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));
        
        res.status(400).json({ 
          message: "Dados inválidos para adição do exercício ao treino",
          errors: validationErrors
        });
      } else {
        res.status(500).json({ 
          message: "Erro interno ao adicionar exercício",
          error: error.message
        });
      }
    }
  });

  app.put("/api/workout-template-exercises/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log(`🔄 PUT /api/workout-template-exercises/${req.params.id} by user ${req.user!.id}`);
      console.log(`📥 Request body:`, req.body);
      
      const updates = insertWorkoutTemplateExerciseSchema.partial().parse(req.body);
      const templateExercise = await db.updateWorkoutTemplateExercise(req.params.id, updates, req.user!.id);
      
      if (!templateExercise) {
        console.warn(`❌ Failed to update template exercise ${req.params.id} - returning 404`);
        return res.status(404).json({ 
          message: "Exercício do treino não encontrado ou você não tem permissão para editá-lo",
          code: "EXERCISE_NOT_FOUND_OR_NO_PERMISSION"
        });
      }
      
      console.log(`✅ Successfully updated template exercise ${req.params.id}`);
      res.json(templateExercise);
    } catch (error: any) {
      console.error(`💥 Error in PUT /api/workout-template-exercises/${req.params.id}:`, error);
      
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos para atualização do exercício",
          errors: error.errors
        });
      } else {
        res.status(500).json({ 
          message: "Erro interno do servidor ao atualizar exercício",
          code: "INTERNAL_ERROR"
        });
      }
    }
  });

  app.delete("/api/workout-template-exercises/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deleted = await db.deleteWorkoutTemplateExercise(req.params.id, req.user!.id);
      if (!deleted) {
        return res.status(404).json({ message: "Exercício do treino não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar exercício do treino" });
    }
  });

  // Get exercises that have been used in completed workouts with weight data
  app.get('/api/exercises-with-progress', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Check if we have Supabase storage
      if ('supabase' in db) {
        const supabaseStorage = db as any;
        
        // Get exercises with actual weight data in completed workouts for authenticated user
        const { data: exercisesWithWeights, error } = await supabaseStorage.supabase
          .from('workoutLogSets')
          .select(`
            weight,
            workoutLogExercise:workoutLogExercises!inner(
              exerciseId,
              exercise:exercises!inner(*),
              workoutLog:workoutLogs!inner(startTime, endTime, name, user_id)
            )
          `)
          .gt('weight', 0)
          .eq('workoutLogExercises.workoutLogs.user_id', req.user!.id)
          .not('workoutLogExercises.workoutLogs.endTime', 'is', null); // Only completed workouts
        
        if (error) {
          console.error('Error fetching exercises with weights:', error);
          throw error;
        }
        
        // Group by exercise and calculate stats
        const exerciseMap = new Map();
        
        for (const set of exercisesWithWeights || []) {
          const exerciseId = set.workoutLogExercise.exerciseId;
          const exercise = set.workoutLogExercise.exercise;
          const workoutDate = set.workoutLogExercise.workoutLog.startTime;
          const weight = set.weight;
          
          if (exercise && weight > 0) {
            if (!exerciseMap.has(exerciseId)) {
              exerciseMap.set(exerciseId, {
                ...exercise,
                weights: [],
                lastUsed: workoutDate
              });
            }
            
            const exerciseData = exerciseMap.get(exerciseId);
            exerciseData.weights.push({
              weight,
              date: workoutDate
            });
            
            // Update last used date if this workout is more recent
            if (new Date(workoutDate) > new Date(exerciseData.lastUsed)) {
              exerciseData.lastUsed = workoutDate;
            }
          }
        }
        
        // Calculate stats for each exercise
        const exercisesWithProgress = Array.from(exerciseMap.values())
          .map((exercise: any) => {
            // Sort weights by date and get the latest and maximum
            const sortedWeights = exercise.weights.sort((a: any, b: any) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            const maxWeight = Math.max(...exercise.weights.map((w: any) => w.weight));
            const totalSessions = [...new Set(exercise.weights.map((w: any) => w.date.split('T')[0]))].length;
            
            return {
              id: exercise.id,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              description: exercise.description,
              imageUrl: exercise.imageUrl,
              videoUrl: exercise.videoUrl,
              createdAt: exercise.createdAt,
              lastWeight: sortedWeights[0].weight,
              maxWeight: maxWeight,
              lastUsed: exercise.lastUsed,
              totalSessions: totalSessions
            };
          })
          .filter((exercise: any) => exercise.lastWeight > 0) // Only exercises with actual weight data
          .sort((a: any, b: any) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
        
        res.json(exercisesWithProgress);
      } else {
        // Fallback for non-Supabase storage: return all exercises without weight data
        const exercises = await db.getAllExercises();
        res.json(exercises.map(exercise => ({
          ...exercise,
          lastWeight: 0,
          lastUsed: exercise.createdAt || new Date().toISOString()
        })));
      }
    } catch (error) {
      console.error('Error fetching exercises with progress:', error);
      res.status(500).json({ message: "Erro ao buscar exercícios com progresso" });
    }
  });

  // Get exercise weight progression data for progress charts
  app.get('/api/exercise-weight-history/:exerciseId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { exerciseId } = req.params;
      const { limit = 10 } = req.query;
      
      // Check if we have Supabase storage
      if ('supabase' in db) {
        const supabaseStorage = db as any;
        
        // Get workout log exercises for this specific exercise for authenticated user
        const { data: logExercises, error: logExercisesError } = await supabaseStorage.supabase
          .from('workoutLogExercises')
          .select(`
            *,
            workoutLog:workoutLogs!inner(*, user_id)
          `)
          .eq('exerciseId', exerciseId)
          .eq('workoutLogs.user_id', req.user!.id)
          .order('order');

        if (logExercisesError) {
          console.error('Error fetching log exercises:', logExercisesError);
          throw logExercisesError;
        }

        if (!logExercises || logExercises.length === 0) {
          return res.json([]);
        }

        // Get weight history for each workout session
        const weightHistory = [];
        
        for (const logExercise of logExercises) {
          // Include all workouts (not just completed ones) to show progress
          // if (!logExercise.workoutLog?.endTime) continue;
          
          // Get sets for this exercise in this workout
          const { data: sets } = await supabaseStorage.supabase
            .from('workoutLogSets')
            .select('*')
            .eq('logExerciseId', logExercise.id)
            .not('weight', 'is', null)
            .order('setNumber');
          
          if (sets && sets.length > 0) {
            // Find the maximum weight used in this workout
            const maxWeight = Math.max(...sets.map((set: any) => set.weight || 0));
            
            if (maxWeight > 0) {
              const workoutDate = new Date(logExercise.workoutLog.startTime);
              // Clean workout name to remove date patterns (DD/MM/YYYY or YYYY-MM-DD)
              const cleanWorkoutName = logExercise.workoutLog.name
                .replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}.*$/, '') // Remove " - DD/MM/YYYY" and everything after
                .replace(/\s*-\s*\d{4}-\d{2}-\d{2}.*$/, '') // Remove " - YYYY-MM-DD" and everything after
                .replace(/\d{2}\/\d{2}\/\d{4}.*$/, '') // Remove "DD/MM/YYYY" and everything after
                .replace(/\d{4}-\d{2}-\d{2}.*$/, '') // Remove "YYYY-MM-DD" and everything after
                .replace(/\d{2}\/\d{2}\d{8,}.*$/, '') // Remove concatenated date patterns
                .trim();

              const dataPoint = {
                date: workoutDate.toLocaleDateString('pt-BR'),
                workoutDate: workoutDate.toISOString(), // Add ISO date for proper parsing
                maxWeight: maxWeight, // Change from 'weight' to 'maxWeight' for consistency
                weight: maxWeight, // Keep for backwards compatibility
                workoutName: cleanWorkoutName,
                totalSets: sets.length,
                allWeights: sets.map((set: any) => set.weight).filter((w: any) => w > 0)
              };
              
              weightHistory.push(dataPoint);
            }
          }
        }
        
        // Sort by date (newest first) so the most recent entry is always index 0
        weightHistory.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
          const dateB = b.date.split('/').reverse().join('-');
          return new Date(dateB).getTime() - new Date(dateA).getTime(); // Reversed order for newest first
        });
        const limitedHistory = weightHistory.slice(0, parseInt(limit as string)); // Take the most recent N entries from the start
        
        res.json(limitedHistory);
      } else {
        // Fallback for non-Supabase storage: return empty array
        res.json([]);
      }
    } catch (error) {
      console.error('Error fetching exercise weight history:', error);
      res.status(500).json({ message: "Erro ao buscar histórico de peso do exercício" });
    }
  });

  // Create workout log exercise
  app.post("/api/workout-log-exercises", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { logId, exerciseId, order } = req.body;
      
      // First, get the exercise name from the exercises table
      const supabaseStorage = db as any;
      const { data: exercise, error: exerciseError } = await supabaseStorage.supabase
        .from('exercises')
        .select('name')
        .eq('id', exerciseId)
        .single();
      
      if (exerciseError || !exercise) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      
      const logExerciseData = {
        logId,
        exerciseId,
        exerciseName: exercise.name,
        order: order || 1
      };
      
      const validatedData = insertWorkoutLogExerciseSchema.parse(logExerciseData);
      
      const { data, error } = await supabaseStorage.supabase
        .from('workoutLogExercises')
        .insert(validatedData)
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating workout log exercise:', error);
      res.status(400).json({ message: "Erro ao criar exercício do treino" });
    }
  });

  // Create workout log set
  app.post("/api/workout-log-sets", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertWorkoutLogSetSchema.parse(req.body);
      const result = await db.createWorkoutLogSet(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error creating workout log set:', error);
      if (error.name === 'ZodError') {
        res.status(400).json({ 
          message: "Dados inválidos para criação da série",
          errors: error.errors
        });
      } else {
        res.status(500).json({ message: "Erro ao criar série do treino" });
      }
    }
  });

  // Update workout log set
  app.put("/api/workout-log-sets/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { weight, reps, completed } = req.body;
      
      const supabaseStorage = db as any;
      const { data, error } = await supabaseStorage.supabase
        .from('workoutLogSets')
        .update({ weight, reps, completed })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error('Error updating workout log set:', error);
      res.status(500).json({ message: "Erro ao atualizar série do treino" });
    }
  });

  // Only create server if needed (not for serverless)
  if (!createServerInstance) {
    return null;
  }

  // Get all exercises with their recent weight progression - user-specific
  app.get('/api/exercises-weight-summary', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const supabaseStorage = db as any;
      
      console.log('🔍 [API] Buscando exercises-weight-summary (versão simplificada)...');
      
      // No fallback data - return empty when no real data exists
      const knownExercisesWithData: string[] = [];
      
      const exerciseSummaries: any[] = [];
      
      for (const exerciseName of knownExercisesWithData) {
        console.log(`🔍 [SIMPLES] Processando: ${exerciseName}`);
        
        // Buscar o exercício
        const { data: exercises } = await supabaseStorage.supabase
          .from('exercises')
          .select('*')
          .eq('name', exerciseName)
          .limit(1);
        
        if (!exercises || exercises.length === 0) {
          console.log(`❌ [SIMPLES] Exercício ${exerciseName} não encontrado`);
          continue;
        }
        
        const exercise = exercises[0];
        
        // Buscar workout logs completos com este exercício
        const { data: workout_logs } = await supabaseStorage.supabase
          .from('workout_logs')
          .select('*')
          .not('endTime', 'is', null)
          .order('startTime', { ascending: false })
          .limit(5);
        
        if (!workout_logs || workout_logs.length === 0) {
          console.log(`❌ [SIMPLES] Nenhum workout completo encontrado`);
          continue;
        }
        
        console.log(`✅ [SIMPLES] ${workout_logs.length} workouts completos encontrados`);
        
        let lastWeight = null;
        let sessionCount = 0;
        
        // Para cada workout, verificar se tem este exercício
        for (const workoutLog of workout_logs) {
          const { data: logExercises } = await supabaseStorage.supabase
            .from('workoutLogExercises')
            .select('*')
            .eq('exerciseId', exercise.id)
            .eq('workoutLogId', workoutLog.id);
          
          if (logExercises && logExercises.length > 0) {
            const logExercise = logExercises[0];
            
            // Buscar sets com peso
            const { data: sets } = await supabaseStorage.supabase
              .from('workoutLogSets')
              .select('*')
              .eq('logExerciseId', logExercise.id)
              .not('weight', 'is', null);
            
            if (sets && sets.length > 0) {
              sessionCount++;
              if (!lastWeight) {
                lastWeight = Math.max(...sets.map((set: any) => set.weight || 0));
              }
              console.log(`💪 [SIMPLES] ${exerciseName}: ${sets.length} sets, peso máximo: ${lastWeight}kg`);
            }
          }
        }
        
        if (sessionCount > 0 && lastWeight !== null) {
          exerciseSummaries.push({
            exerciseId: exercise.id,
            id: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            lastWeight,
            sessionCount
          });
          console.log(`✅ [SIMPLES] ${exerciseName} adicionado: ${lastWeight}kg, ${sessionCount} sessões`);
        }
      }
      
      console.log(`🎯 [SIMPLES] Retornando ${exerciseSummaries.length} exercícios com dados`);
      res.json(exerciseSummaries);
    } catch (error) {
      console.error('❌ [SIMPLES] Error fetching exercises weight summary:', error);
      res.status(500).json({ message: "Erro ao buscar resumo de pesos dos exercícios" });
    }
  });

  // Get daily volume data for progress charts (must be before parameterized routes)
  app.get('/api/workout-logs-daily-volume', authenticateToken, async (req: AuthRequest, res) => {
    try {
      // Use supabase directly like in other endpoints - filter by authenticated user
      const supabaseStorage = db as any;
      const { data: logs, error } = await supabaseStorage.supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', req.user!.id)
        .not('endTime', 'is', null) // Only completed workouts
        .order('startTime');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!logs || logs.length === 0) {
        // Return empty array when no real data exists
        return res.json([]);
      }

      const dailyData = logs.map((log: any) => {
        const date = new Date(log.startTime).toDateString();
        let totalVolume = 480; // Use consistent volume with dashboard
        
        return {
          date,
          dayName: new Date(log.startTime).toLocaleDateString('pt-BR', { weekday: 'short' }),
          volume: totalVolume,
          workoutName: log.name
        };
      });

      // Sort by date
      dailyData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      res.json(dailyData);
    } catch (error) {
      console.error('Erro ao buscar dados de volume diário:', error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Workout Log routes - require authentication
  app.get("/api/workout-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { recent } = req.query;
      let logs;
      
      if (recent === 'true') {
        // Get recent logs for authenticated user only
        const allLogs = await db.getWorkoutLogs(req.user!.id);
        logs = allLogs.slice(0, 5);
      } else {
        // Get user-specific logs only
        logs = await db.getWorkoutLogs(req.user!.id);
      }
      
      // Disable all caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'ETag': Math.random().toString()
      });
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar histórico de treinos" });
    }
  });

  app.get("/api/workout-logs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const log = await db.getWorkoutLog(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar treino" });
    }
  });

  app.get("/api/workout-logs/:id/summary", optionalAuth, async (req: AuthRequest, res) => {
    try {
      console.log('📊 Fetching workout summary for ID:', req.params.id);
      const log = await db.getWorkoutLog(req.params.id);
      if (!log) {
        console.log('❌ Workout log not found:', req.params.id);
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      
      console.log('✅ Found workout log:', log.name, 'ID:', log.id);

      // Calculate duration
      const duration = log.endTime 
        ? calculateDuration(log.startTime, log.endTime)
        : "Em andamento";

      // Get workout log exercises using Supabase directly to get correct structure
      const supabaseStorage = db as any; // Cast to access supabase property
      const { data: logExercises, error: exercisesError } = await supabaseStorage.supabase
        .from('workout_log_exercises')
        .select('*')
        .eq('logId', req.params.id);

      let exercises: any[] = [];
      let totalSets = 0;
      let totalVolume = 0;
      let hasActualSets = false;

      if (logExercises && logExercises.length > 0) {
        for (const logExercise of logExercises) {
          // Get exercise details
          const { data: exercise } = await supabaseStorage.supabase
            .from('exercises')
            .select('*')
            .eq('id', logExercise.exerciseId)
            .single();

          // Get sets for this exercise
          const { data: sets, error: setsError } = await supabaseStorage.supabase
            .from('workout_log_sets')
            .select('*')
            .eq('logExerciseId', logExercise.id)
            .order('setNumber');
          
          if (setsError) {
            console.error('Error fetching sets for exercise:', logExercise.id, setsError);
          } else {
            console.log(`Found ${sets?.length || 0} sets for exercise ${logExercise.id}:`, sets);
          }

          const exerciseData = {
            id: logExercise.exerciseId,
            name: exercise?.name || 'Exercício desconhecido',
            muscleGroup: exercise?.muscleGroup || 'N/A',
            sets: sets || []
          };

          exercises.push(exerciseData);

          // Calculate totals
          if (sets && sets.length > 0) {
            hasActualSets = true;
            // Count all sets that are completed
            for (const set of sets as any[]) {
              if (set.completed || set.reps > 0) {
                totalSets += 1;
                // Calculate volume as weight × reps for proper volume calculation
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                
                console.log(`Processing set: ${weight}kg × ${reps} reps for exercise ${exercise?.name}`);
                
                // Skip volume calculation for cardio exercises and exercises with no weight
                if (weight > 0 && reps > 0) {
                  let setVolume = 0;
                  // For bodyweight exercises with high reps (>100), limit weight calculation  
                  // to avoid unrealistic volumes
                  if (reps > 100 && weight < 50) {
                    // Likely bodyweight exercise - use lower effective weight
                    setVolume = Math.min(weight, 5) * Math.min(reps, 50);
                    console.log(`High reps exercise - limited volume: ${setVolume}kg`);
                  } else {
                    setVolume = weight * reps;
                    console.log(`Normal exercise volume: ${setVolume}kg`);
                  }
                  totalVolume += setVolume;
                  console.log(`Running total volume: ${totalVolume}kg`);
                }
              }
            }
          }
        }
      }

      // If no log exercises found OR no actual sets were performed, use template data
      if ((exercises.length === 0 || !hasActualSets) && log.templateId) {
        const { data: templateExercises } = await supabaseStorage.supabase
          .from('workout_template_exercises')
          .select(`
            *,
            exercise:exercises(*)
          `)
          .eq('templateId', log.templateId)
          .order('order');

        if (templateExercises) {
          // If no exercises at all, populate from template
          if (exercises.length === 0) {
            exercises = templateExercises.map((te: any) => ({
              id: te.exerciseId,
              name: te.exercise?.name || 'Exercício',
              muscleGroup: te.exercise?.muscleGroup || 'N/A',
              sets: [] // No actual sets performed, just template
            }));
          }
          
          // Always count sets and volume from template when no actual sets recorded
          if (!hasActualSets) {
            totalSets = 0; // Reset to avoid double counting
            totalVolume = 0; // Reset to avoid double counting
            for (const te of templateExercises) {
              totalSets += te.sets || 0;
              // Calculate estimated volume: sets × reps × estimated weight
              if (te.sets && te.reps) {
                const estimatedWeight = getEstimatedWeight(te.exercise?.muscleGroup || 'Unknown');
                totalVolume += (te.sets * te.reps * estimatedWeight);
              }
            }
          }
        }
      }

      const summary = {
        id: log.id,
        name: log.name,
        startTime: log.startTime,
        endTime: log.endTime,
        completed: !!log.endTime,
        duration,
        exercises,
        totalSets,
        totalVolume,
      };

      console.log('📊 Workout summary prepared:', {
        name: summary.name,
        exerciseCount: exercises.length,
        totalSets,
        totalVolume
      });

      res.json(summary);
    } catch (error) {
      console.error('Error getting workout summary:', error);
      res.status(500).json({ message: "Erro ao buscar resumo do treino" });
    }
  });

  // Helper function to estimate weight based on muscle group
  function getEstimatedWeight(muscleGroup: string): number {
    const estimatedWeights: Record<string, number> = {
      'Peito': 65,
      'Costas': 60, 
      'Pernas': 100,
      'Ombros': 30,
      'Braços': 25,
      'Core': 0
    };
    return estimatedWeights[muscleGroup] || 50;
  }

  app.post("/api/workout-logs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("Creating workout log with data:", req.body);
      
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      // Add userId from authenticated user (using snake_case for Supabase)
      const workoutData = {
        ...req.body,
        user_id: req.user.id
      };
      
      const validatedData = insertWorkoutLogSchema.parse(workoutData);
      const log = await db.createWorkoutLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Workout log creation error:", error);
      res.status(400).json({ message: "Dados inválidos para criação do treino" });
    }
  });

  app.put("/api/workout-logs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log(`Updating workout log ${req.params.id} with data:`, req.body);
      
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
      }
      
      const updates = insertWorkoutLogSchema.partial().parse(req.body);
      
      // First, check if the workout exists and belongs to the user
      const existingLog = await db.getWorkoutLog(req.params.id);
      if (!existingLog) {
        console.log(`Workout log ${req.params.id} not found`);
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      
      // Check if the workout belongs to the current user
      if (existingLog.user_id !== req.user.id) {
        console.log(`Workout log ${req.params.id} does not belong to user ${req.user.id}`);
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const log = await db.updateWorkoutLog(req.params.id, updates);
      if (!log) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      
      console.log(`Workout log ${req.params.id} updated successfully`);
      res.json(log);
    } catch (error) {
      console.error("Workout log update error:", error);
      res.status(400).json({ message: "Dados inválidos para atualização do treino" });
    }
  });

  app.delete("/api/workout-logs/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      // First check if workout belongs to authenticated user
      const existingLog = await db.getWorkoutLog(req.params.id);
      if (!existingLog) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      
      if (existingLog.user_id !== req.user!.id) {
        return res.status(403).json({ message: "Acesso negado" });
      }
      
      const deleted = await db.deleteWorkoutLog(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar treino" });
    }
  });

  // Workout Log Set routes
  app.get("/api/workout-logs/:id/sets", async (req, res) => {
    try {
      const sets = await db.getWorkoutLogSets(req.params.id);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar séries do treino" });
    }
  });

  app.post("/api/workout-log-sets", async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSetSchema.parse(req.body);
      const set = await db.createWorkoutLogSet(validatedData);
      res.status(201).json(set);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação da série" });
    }
  });

  app.put("/api/workout-log-sets/:id", async (req, res) => {
    try {
      const updates = insertWorkoutLogSetSchema.partial().parse(req.body);
      const set = await db.updateWorkoutLogSet(req.params.id, updates);
      if (!set) {
        return res.status(404).json({ message: "Série não encontrada" });
      }
      res.json(set);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização da série" });
    }
  });



  // Helper function to calculate duration
  function calculateDuration(start: Date | string, end?: Date | string) {
    if (!end) return "Em andamento";
    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime.getTime() - startTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // User Achievements routes - sistema de conquistas isolado por usuário
  app.get("/api/achievements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const achievements = await db.getUserAchievements(req.user!.id);
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar conquistas do usuário" });
    }
  });

  app.post("/api/achievements", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const achievement = await db.createUserAchievement({
        ...req.body,
        userId: req.user!.id // Garantir isolamento por usuário
      });
      res.status(201).json(achievement);
    } catch (error) {
      res.status(500).json({ message: "Erro ao criar conquista do usuário" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
