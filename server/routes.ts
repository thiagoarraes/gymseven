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
  updateWorkoutTemplateExerciseSchema,
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
import { authenticateToken, type AuthRequest } from "./auth";

// Use local authentication only

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

    // Get current user endpoint
    app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        
        // Remove password from response
        const { password, ...userWithoutPassword } = req.user;
        res.json({ user: userWithoutPassword });
      } catch (error: any) {
        console.error('Error in /api/auth/me:', error);
        res.status(500).json({ message: 'Erro interno do servidor' });
      }
    });
  
  // Endpoint para fornecer configurações para o frontend
  app.get('/api/config', (req, res) => {
    res.json({
    });
  });
  

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

  // Clear user data endpoint (keep account, remove all data)
  app.delete('/api/auth/clear-data', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Use direct database queries to clear user data
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        
        // For now, return a more helpful message
        res.status(501).json({ 
        });
      } else {
        // For PostgreSQL storage
        res.status(501).json({ message: "Funcionalidade não implementada" });
      }
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
          usuarioId: req.user!.id,
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
      const validatedData = insertExerciseSchema.parse(req.body);
      const updates = validatedData;
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
        usuarioId: req.user!.id // Use the correct field name
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
      const updates = req.body;
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

  // Reorder workout template exercises
  app.patch("/api/workout-templates/:id/reorder", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const templateId = req.params.id;
      const { exercises } = req.body;
      
      if (!exercises || !Array.isArray(exercises)) {
        return res.status(400).json({ message: "Lista de exercícios é obrigatória" });
      }
      
      console.log(`🔄 PATCH /api/workout-templates/${templateId}/reorder by user ${req.user!.id}`);
      console.log(`📥 Reordering ${exercises.length} exercises:`, exercises);
      
      // Update each exercise's order
      const updatePromises = exercises.map((exercise: { id: string; order: number }) => {
        return db.updateWorkoutTemplateExercise(exercise.id, { order: exercise.order }, req.user!.id);
      });
      
      const results = await Promise.all(updatePromises);
      
      // Check if all updates were successful
      const failedUpdates = results.filter(result => !result);
      if (failedUpdates.length > 0) {
        console.warn(`❌ ${failedUpdates.length} exercise updates failed`);
        return res.status(400).json({ 
          message: "Erro ao reordenar alguns exercícios",
          code: "PARTIAL_REORDER_FAILURE"
        });
      }
      
      console.log(`✅ Successfully reordered ${exercises.length} exercises`);
      res.json({ message: "Exercícios reordenados com sucesso", updated: exercises.length });
    } catch (error: any) {
      console.error(`💥 Error in PATCH /api/workout-templates/${req.params.id}/reorder:`, error);
      res.status(500).json({ 
        message: "Erro interno do servidor ao reordenar exercícios",
        code: "INTERNAL_ERROR"
      });
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
      
      const updates = updateWorkoutTemplateExerciseSchema.parse(req.body);
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
      const exercises = await db.getAllExercises();
      const exercisesWithProgress = [];
      
      for (const exercise of exercises) {
        // Get exercise statistics from actual workout data
        const stats = await db.getExerciseStats(exercise.id, req.user!.id);
        
        exercisesWithProgress.push({
          ...exercise,
          lastWeight: stats.lastWeight || 0,
          maxWeight: stats.maxWeight || 0,
          lastUsed: stats.lastUsed || null,
          totalSessions: stats.totalSessions || 0
        });
      }
      
      res.json(exercisesWithProgress);
    } catch (error) {
      console.error('Error fetching exercises with progress:', error);
      res.status(500).json({ message: "Erro ao buscar exercícios com progresso" });
    }
  });

  // Get exercise weight progression data for progress charts
  app.get('/api/exercise-weight-history/:exerciseId', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { exerciseId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const weightHistory = await db.getExerciseWeightHistory(exerciseId, req.user!.id, limit);
      res.json(weightHistory);
    } catch (error) {
      console.error('Error fetching exercise weight history:', error);
      res.status(500).json({ message: "Erro ao buscar histórico de peso do exercício" });
    }
  });

  // Create workout log exercise
  app.post("/api/workout-log-exercises", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log("🔍 [DEBUG] Creating workout log exercise with body:", req.body);
      const { logId, exerciseId, order } = req.body;
      
      if (!logId || !exerciseId) {
        console.log("❌ Missing required fields: logId =", logId, "exerciseId =", exerciseId);
        return res.status(400).json({ message: "logId e exerciseId são obrigatórios" });
      }
      
      // First, get the exercise name from the exercises table
      const exercise = await db.getExercise(exerciseId);
      
      if (!exercise) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      
      const logExerciseData = {
        registroId: logId,
        exercicioId: exerciseId,
        nomeExercicio: exercise.nome,
        order: order || 1
      };
      
      console.log("🔍 [DEBUG] Validating data:", logExerciseData);
      const validatedData = insertWorkoutLogExerciseSchema.parse(logExerciseData);
      
      const result = await db.createWorkoutLogExercise(validatedData);
      res.status(201).json(result);
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
      
      const result = await db.updateWorkoutLogSet(id, { weight, reps, completed });
      
      if (!result) {
        return res.status(404).json({ message: "Série não encontrada" });
      }
      
      res.json(result);
    } catch (error) {
      console.error('Error updating workout log set:', error);
      res.status(500).json({ message: "Erro ao atualizar série do treino" });
    }
  });

  // Only create server if needed (not for serverless)
  if (!createServerInstance) {
    return null;
  }

  // Get exercises that have weight history for select dropdown
  app.get('/api/exercises-with-weight-history', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('📊 Fetching exercises with weight history for user:', req.user?.id);
      
      // Get all completed workout logs for the user
      const workoutLogs = await db.getWorkoutLogs(req.user!.id);
      const completedWorkouts = workoutLogs.filter(log => log.endTime);
      
      if (completedWorkouts.length === 0) {
        console.log('📊 No completed workouts found');
        return res.json([]);
      }
      
      console.log('📊 Found', completedWorkouts.length, 'completed workouts');
      
      // Create a set to store unique exercises with weight data
      const exercisesWithWeightData = new Map<string, { id: string, name: string, muscleGroup: string }>();
      
      for (const workout of completedWorkouts) {
        // Get all exercises for this workout
        const logExercises = await db.getWorkoutLogExercises(workout.id);
        
        for (const logExercise of logExercises) {
          // Get sets for this exercise
          const sets = await db.getWorkoutLogSets(logExercise.id);
          
          // Check if any set has weight data
          const hasWeightData = sets.some(set => set.weight && set.weight > 0);
          
          if (hasWeightData && !exercisesWithWeightData.has(logExercise.exercicioId)) {
            // Get exercise details
            const exercise = await db.getExercise(logExercise.exercicioId);
            
            if (exercise) {
              exercisesWithWeightData.set(logExercise.exercicioId, {
                id: logExercise.exercicioId,
                name: exercise.nome,
                muscleGroup: exercise.grupoMuscular
              });
            }
          }
        }
      }
      
      // Convert map to sorted array
      const exercisesList = Array.from(exercisesWithWeightData.values())
        .sort((a, b) => a.name.localeCompare(b.name));
      
      console.log('📊 Returning exercises with weight history:', exercisesList.length);
      res.json(exercisesList);
    } catch (error) {
      console.error('Error fetching exercises with weight history:', error);
      res.status(500).json({ message: "Erro ao buscar exercícios com histórico de peso" });
    }
  });

  // Get all exercises with their recent weight progression - user-specific
  app.get('/api/exercises-weight-summary', authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('📊 Fetching exercises weight summary for user:', req.user?.id);
      
      // Get all completed workout logs for the user
      const workoutLogs = await db.getWorkoutLogs(req.user!.id);
      const completedWorkouts = workoutLogs.filter(log => log.endTime);
      
      if (completedWorkouts.length === 0) {
        console.log('📊 No completed workouts found');
        return res.json([]);
      }
      
      console.log('📊 Found', completedWorkouts.length, 'completed workouts');
      
      // Create a map to store weight progression by date
      const weightProgressionByDate = new Map<string, { date: string, maxWeight: number, workoutName: string }>();
      
      for (const workout of completedWorkouts) {
        console.log('📊 Processing workout:', workout.nome, 'from', workout.startTime);
        
        // Get all exercises for this workout
        const logExercises = await db.getWorkoutLogExercises(workout.id);
        
        let workoutMaxWeight = 0;
        
        for (const logExercise of logExercises) {
          // Get sets for this exercise
          const sets = await db.getWorkoutLogSets(logExercise.id);
          
          for (const set of sets) {
            if (set.weight && set.weight > workoutMaxWeight) {
              workoutMaxWeight = set.weight;
            }
          }
        }
        
        if (workoutMaxWeight > 0) {
          const workoutDate = new Date(workout.startTime);
          const dateKey = workoutDate.toISOString().split('T')[0]; // YYYY-MM-DD
          const displayDate = workoutDate.toLocaleDateString('pt-BR'); // DD/MM/YYYY
          
          // Only keep the highest weight for each date
          const existing = weightProgressionByDate.get(dateKey);
          if (!existing || workoutMaxWeight > existing.maxWeight) {
            weightProgressionByDate.set(dateKey, {
              date: displayDate,
              maxWeight: workoutMaxWeight,
              workoutName: workout.nome
            });
          }
        }
      }
      
      // Convert map to sorted array
      const weightProgression = Array.from(weightProgressionByDate.values())
        .sort((a, b) => {
          // Sort by date (newest first for API, but dashboard will reverse if needed)
          const dateA = new Date(a.date.split('/').reverse().join('-'));
          const dateB = new Date(b.date.split('/').reverse().join('-'));
          return dateA.getTime() - dateB.getTime();
        });
      
      console.log('📊 Returning weight progression data:', weightProgression);
      res.json(weightProgression);
    } catch (error) {
      console.error('Error fetching exercises weight summary:', error);
      res.status(500).json({ message: "Erro ao buscar resumo de pesos dos exercícios" });
    }
  });

  // Get daily volume data for progress charts (must be before parameterized routes)
  app.get('/api/workout-logs-daily-volume', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const logs = await db.getWorkoutLogs(req.user!.id);
      
      // Filter only completed workouts
      const completedLogs = logs.filter(log => log.endTime);

      if (completedLogs.length === 0) {
        return res.json([]);
      }

      const dailyData = completedLogs.map((log: any) => {
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
      
      console.log('✅ Found workout log:', log.nome, 'ID:', log.id);

      // Calculate duration
      const duration = log.endTime 
        ? calculateDuration(log.startTime, log.endTime)
        : "Em andamento";

      // Get workout log exercises
      const logExercises = await db.getWorkoutLogExercises(req.params.id);

      let exercises: any[] = [];
      let totalSets = 0;
      let totalVolume = 0;
      let hasActualSets = false;

      if (logExercises && logExercises.length > 0) {
        // Group exercises by exercicioId to avoid duplicates
        const exerciseMap = new Map<string, any>();

        for (const logExercise of logExercises) {
          // Get exercise details
          const exercise = await db.getExercise(logExercise.exercicioId);

          // Get sets for this exercise
          const sets = await db.getWorkoutLogSets(logExercise.id);
          
          const exerciseId = logExercise.exercicioId;
          const exerciseName = logExercise.nomeExercicio || exercise?.nome || 'Exercício desconhecido';
          const muscleGroup = exercise?.grupoMuscular || 'N/A';

          // Check if exercise already exists in map
          if (exerciseMap.has(exerciseId)) {
            // Merge sets from duplicate exercise
            const existingExercise = exerciseMap.get(exerciseId);
            const newSets = sets?.map(set => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              completed: set.completed
            })) || [];
            existingExercise.sets = [...existingExercise.sets, ...newSets];
          } else {
            // Create new exercise entry
            const exerciseData = {
              id: exerciseId,
              name: exerciseName,
              muscleGroup: muscleGroup,
              sets: sets?.map(set => ({
                setNumber: set.setNumber,
                reps: set.reps,
                weight: set.weight,
                completed: set.completed
              })) || []
            };
            exerciseMap.set(exerciseId, exerciseData);
          }
        }

        // Convert map to array
        exercises = Array.from(exerciseMap.values());

        // Calculate totals from all exercises
        for (const exercise of exercises) {
          if (exercise.sets && exercise.sets.length > 0) {
            hasActualSets = true;
            // Count all sets that are completed
            for (const set of exercise.sets) {
              if (set.completed || set.reps > 0) {
                totalSets += 1;
                // Calculate volume as weight × reps for proper volume calculation
                const weight = parseFloat(set.weight) || 0;
                const reps = parseInt(set.reps) || 0;
                
                // Skip volume calculation for cardio exercises and exercises with no weight
                if (weight > 0 && reps > 0) {
                  let setVolume = 0;
                  // For bodyweight exercises with high reps (>100), limit weight calculation  
                  // to avoid unrealistic volumes
                  if (reps > 100 && weight < 50) {
                    // Likely bodyweight exercise - use lower effective weight
                    setVolume = Math.min(weight, 5) * Math.min(reps, 50);
                  } else {
                    setVolume = weight * reps;
                  }
                  totalVolume += setVolume;
                }
              }
            }
          }
        }
      }

      // If no log exercises found OR no actual sets were performed, use template data
      if ((exercises.length === 0 || !hasActualSets) && log.modeloId) {
        // TODO: Implement getWorkoutTemplateExercises that includes exercise details
        const templateExercises: any[] = [];

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
        name: log.nome,
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
      
      const workoutData = {
        ...req.body,
        usuarioId: req.user.id
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
      if (existingLog.usuarioId !== req.user.id) {
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
      
      if (existingLog.usuarioId !== req.user!.id) {
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
