import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
import { registerUser, loginUser, changeUserPassword, authenticateToken, optionalAuth, type AuthRequest } from "./auth";

export async function registerRoutes(app: Express, createServerInstance = true): Promise<Server | null> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const result = await registerUser(req.body);
      res.status(201).json(result);
    } catch (error: any) {
      if (error.message.includes('já está em uso')) {
        res.status(409).json({ message: error.message });
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

  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = await loginUser(req.body);
      res.json(result);
    } catch (error: any) {
      if (error.message.includes('incorretos')) {
        res.status(401).json({ message: error.message });
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

  app.get("/api/auth/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { password, ...userWithoutPassword } = req.user!;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update user profile
  app.put('/api/auth/profile', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const updateData = updateUserSchema.parse(req.body);
      
      const updatedUser = await storage.updateUser(req.user!.id, updateData);
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

  app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const validatedData = updateUserSchema.parse(req.body);
      const updatedUser = await storage.updateUser(req.user!.id, validatedData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ user: userWithoutPassword });
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

  // Weight History routes
  app.get("/api/weight-history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const history = await storage.getWeightHistory(req.user!.id, limit);
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
      const entry = await storage.addWeightEntry(validatedData);
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
      const entry = await storage.updateWeightEntry(req.params.id, validatedData);
      
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
      const success = await storage.deleteWeightEntry(req.params.id);
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
      const goals = await storage.getUserGoals(req.user!.id);
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
      const goal = await storage.createUserGoal(validatedData);
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
      const goal = await storage.updateUserGoal(req.params.id, validatedData);
      
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
      const success = await storage.deleteUserGoal(req.params.id);
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
      const preferences = await storage.getUserPreferences(req.user!.id);
      if (!preferences) {
        // Create default preferences if they don't exist
        const defaultPrefs = await storage.createUserPreferences({
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
      const preferences = await storage.updateUserPreferences(req.user!.id, validatedData);
      
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

  // Exercise routes
  app.get("/api/exercicios", async (req, res) => {
    try {
      const { muscleGroup } = req.query;
      let exercises;
      
      if (muscleGroup && typeof muscleGroup === 'string') {
        exercises = await storage.getExercisesByMuscleGroup(muscleGroup);
      } else {
        exercises = await storage.getAllExercises();
      }
      
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exercícios" });
    }
  });

  app.get("/api/exercicios/:id", async (req, res) => {
    try {
      const exercise = await storage.getExercise(req.params.id);
      if (!exercise) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exercício" });
    }
  });

  app.post("/api/exercicios", async (req, res) => {
    try {
      const validatedData = insertExerciseSchema.parse(req.body);
      const exercise = await storage.createExercise(validatedData);
      res.status(201).json(exercise);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        const validationErrors = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));
        
        res.status(400).json({ 
          message: "Dados inválidos para criação do exercício",
          errors: validationErrors
        });
      } else {
        res.status(500).json({ 
          message: "Erro interno do servidor",
          error: error.message
        });
      }
    }
  });

  app.put("/api/exercicios/:id", async (req, res) => {
    try {
      const updates = insertExerciseSchema.partial().parse(req.body);
      const exercise = await storage.updateExercise(req.params.id, updates);
      if (!exercise) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      res.json(exercise);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do exercício" });
    }
  });

  app.delete("/api/exercicios/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteExercise(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Exercício não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar exercício" });
    }
  });

  // Workout Template routes
  app.get("/api/workout-templates", async (req, res) => {
    try {
      const templates = await storage.getAllWorkoutTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar modelos de treino" });
    }
  });

  app.get("/api/workout-templates/:id", async (req, res) => {
    try {
      const template = await storage.getWorkoutTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ message: "Modelo de treino não encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar modelo de treino" });
    }
  });

  app.get("/api/workout-templates/:id/exercises", async (req, res) => {
    try {
      const exercises = await storage.getWorkoutTemplateExercises(req.params.id);
      res.json(exercises);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar exercícios do treino" });
    }
  });

  app.post("/api/workout-templates", async (req, res) => {
    try {
      const validatedData = insertWorkoutTemplateSchema.parse(req.body);
      const template = await storage.createWorkoutTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação do modelo de treino" });
    }
  });

  app.put("/api/workout-templates/:id", async (req, res) => {
    try {
      const updates = insertWorkoutTemplateSchema.partial().parse(req.body);
      const template = await storage.updateWorkoutTemplate(req.params.id, updates);
      if (!template) {
        return res.status(404).json({ message: "Modelo de treino não encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do modelo de treino" });
    }
  });

  app.delete("/api/workout-templates/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkoutTemplate(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Modelo de treino não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar modelo de treino" });
    }
  });

  app.post("/api/workout-templates/:id/exercises", async (req, res) => {
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
      
      const templateExercise = await storage.addExerciseToTemplate(validatedData);
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

  app.put("/api/workout-template-exercises/:id", async (req, res) => {
    try {
      const updates = insertWorkoutTemplateExerciseSchema.partial().parse(req.body);
      const templateExercise = await storage.updateWorkoutTemplateExercise(req.params.id, updates);
      if (!templateExercise) {
        return res.status(404).json({ message: "Exercício do treino não encontrado" });
      }
      res.json(templateExercise);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do exercício" });
    }
  });

  app.delete("/api/workout-template-exercises/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkoutTemplateExercise(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: "Exercício do treino não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar exercício do treino" });
    }
  });

  // Get exercises that have been used in completed workouts with weight data
  app.get('/api/exercises-with-progress', async (req, res) => {
    try {
      // Check if we have Supabase storage
      if ('supabase' in storage) {
        const supabaseStorage = storage as any;
        
        // Get exercises with actual weight data in completed workouts
        const { data: exercisesWithWeights, error } = await supabaseStorage.supabase
          .from('workoutLogSets')
          .select(`
            weight,
            workoutLogExercise:workoutLogExercises!inner(
              exerciseId,
              exercise:exercises(*),
              workoutLog:workoutLogs!inner(startTime, endTime, name)
            )
          `)
          .gt('weight', 0)
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
        
        // Calculate latest weight for each exercise
        const exercisesWithProgress = Array.from(exerciseMap.values())
          .map((exercise: any) => {
            // Sort weights by date and get the latest
            const sortedWeights = exercise.weights.sort((a: any, b: any) => 
              new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            
            return {
              id: exercise.id,
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              description: exercise.description,
              imageUrl: exercise.imageUrl,
              videoUrl: exercise.videoUrl,
              createdAt: exercise.createdAt,
              lastWeight: sortedWeights[0].weight,
              lastUsed: exercise.lastUsed
            };
          })
          .filter((exercise: any) => exercise.lastWeight > 0) // Only exercises with actual weight data
          .sort((a: any, b: any) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime())
          .slice(0, 12); // Limit to the 12 most recent exercises
        
        res.json(exercisesWithProgress);
      } else {
        // Fallback for non-Supabase storage: return all exercises without weight data
        const exercises = await storage.getAllExercises();
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
  app.get('/api/exercise-weight-history/:exerciseId', async (req, res) => {
    try {
      const { exerciseId } = req.params;
      const { limit = 10 } = req.query;
      
      // Check if we have Supabase storage
      if ('supabase' in storage) {
        const supabaseStorage = storage as any;
        
        // Get workout log exercises for this specific exercise
        const { data: logExercises, error: logExercisesError } = await supabaseStorage.supabase
          .from('workoutLogExercises')
          .select(`
            *,
            workoutLog:workoutLogs(*)
          `)
          .eq('exerciseId', exerciseId)
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
              const dataPoint = {
                date: new Date(logExercise.workoutLog.startTime).toLocaleDateString('pt-BR'),
                weight: maxWeight,
                workoutName: logExercise.workoutLog.name,
                totalSets: sets.length,
                allWeights: sets.map((set: any) => set.weight).filter((w: any) => w > 0)
              };
              
              weightHistory.push(dataPoint);
            }
          }
        }
        
        // Sort by date (oldest first) for chronological chart display
        weightHistory.sort((a, b) => {
          const dateA = a.date.split('/').reverse().join('-'); // Convert DD/MM/YYYY to YYYY-MM-DD
          const dateB = b.date.split('/').reverse().join('-');
          return new Date(dateA).getTime() - new Date(dateB).getTime();
        });
        const limitedHistory = weightHistory.slice(-parseInt(limit as string)); // Take the most recent N entries
        
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
  app.post("/api/workout-log-exercises", async (req, res) => {
    try {
      const { logId, exerciseId, order } = req.body;
      
      // First, get the exercise name from the exercises table
      const supabaseStorage = storage as any;
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
  app.post("/api/workout-log-sets", async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSetSchema.parse(req.body);
      const result = await storage.createWorkoutLogSet(validatedData);
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
  app.put("/api/workout-log-sets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { weight, reps, completed } = req.body;
      
      const supabaseStorage = storage as any;
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

  // Get all exercises with their recent weight progression - VERSÃO SIMPLIFICADA
  app.get('/api/exercises-weight-summary', async (req, res) => {
    try {
      const supabaseStorage = storage as any;
      
      console.log('🔍 [API] Buscando exercises-weight-summary (versão simplificada)...');
      
      // Buscar exercícios que sabemos que têm dados
      const knownExercisesWithData = [
        'Supino reto',
        'Rosca direta com barra W',
        'Cadeira extensora'
      ];
      
      const exerciseSummaries = [];
      
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
        const { data: workoutLogs } = await supabaseStorage.supabase
          .from('workoutLogs')
          .select('*')
          .not('endTime', 'is', null)
          .order('startTime', { ascending: false })
          .limit(5);
        
        if (!workoutLogs || workoutLogs.length === 0) {
          console.log(`❌ [SIMPLES] Nenhum workout completo encontrado`);
          continue;
        }
        
        console.log(`✅ [SIMPLES] ${workoutLogs.length} workouts completos encontrados`);
        
        let lastWeight = null;
        let sessionCount = 0;
        
        // Para cada workout, verificar se tem este exercício
        for (const workoutLog of workoutLogs) {
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
  app.get('/api/workout-logs-daily-volume', async (req, res) => {
    try {
      // Use supabase directly like in other endpoints
      const supabaseStorage = storage as any;
      const { data: logs, error } = await supabaseStorage.supabase
        .from('workoutLogs')
        .select('*')
        .not('endTime', 'is', null) // Only completed workouts
        .order('startTime');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!logs || logs.length === 0) {
        // Return sample data for testing if no real data exists
        const sampleData = [
          {
            date: new Date().toDateString(),
            dayName: new Date().toLocaleDateString('pt-BR', { weekday: 'short' }),
            volume: 480,
            workoutName: 'Segunda S1'
          }
        ];
        return res.json(sampleData);
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

  // Workout Log routes
  app.get("/api/workout-logs", async (req, res) => {
    try {
      const { recent } = req.query;
      let logs;
      
      if (recent === 'true') {
        logs = await storage.getRecentWorkoutLogs(5);
      } else {
        logs = await storage.getAllWorkoutLogs();
      }
      
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar histórico de treinos" });
    }
  });

  app.get("/api/workout-logs/:id", async (req, res) => {
    try {
      const log = await storage.getWorkoutLog(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      res.json(log);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar treino" });
    }
  });

  app.get("/api/workout-logs/:id/summary", async (req, res) => {
    try {
      const log = await storage.getWorkoutLog(req.params.id);
      if (!log) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }

      // Calculate duration
      const duration = log.endTime 
        ? calculateDuration(log.startTime, log.endTime)
        : "Em andamento";

      // Get workout log exercises using Supabase directly to get correct structure
      const supabaseStorage = storage as any; // Cast to access supabase property
      const { data: logExercises, error: exercisesError } = await supabaseStorage.supabase
        .from('workoutLogExercises')
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
          const { data: sets } = await supabaseStorage.supabase
            .from('workoutLogSets')
            .select('*')
            .eq('logExerciseId', logExercise.id)
            .order('setNumber');

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
            // Count all sets that have been started (have reps or weight)
            for (const set of sets as any[]) {
              if (set.reps || set.weight) {
                totalSets += 1;
              }
              // Count volume as sum of all weights used (not weight × reps)
              if ((set as any).weight) {
                const weight = parseFloat(set.weight) || 0;
                if (weight > 0) {
                  totalVolume += weight;
                }
              }
            }
          }
        }
      }

      // If no log exercises found OR no actual sets were performed, use template data
      if ((exercises.length === 0 || !hasActualSets) && log.templateId) {
        const { data: templateExercises } = await supabaseStorage.supabase
          .from('workoutTemplateExercises')
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
              // Calculate estimated volume: sets × weight (sum of weights)
              if (te.sets && te.weight) {
                totalVolume += (te.sets * te.weight);
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

      res.json(summary);
    } catch (error) {
      console.error('Error getting workout summary:', error);
      res.status(500).json({ message: "Erro ao buscar resumo do treino" });
    }
  });

  app.post("/api/workout-logs", async (req, res) => {
    try {
      console.log("Creating workout log with data:", req.body);
      const validatedData = insertWorkoutLogSchema.parse(req.body);
      const log = await storage.createWorkoutLog(validatedData);
      res.status(201).json(log);
    } catch (error) {
      console.error("Workout log creation error:", error);
      res.status(400).json({ message: "Dados inválidos para criação do treino" });
    }
  });

  app.put("/api/workout-logs/:id", async (req, res) => {
    try {
      const updates = insertWorkoutLogSchema.partial().parse(req.body);
      const log = await storage.updateWorkoutLog(req.params.id, updates);
      if (!log) {
        return res.status(404).json({ message: "Treino não encontrado" });
      }
      res.json(log);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para atualização do treino" });
    }
  });

  app.delete("/api/workout-logs/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWorkoutLog(req.params.id);
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
      const sets = await storage.getWorkoutLogSets(req.params.id);
      res.json(sets);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar séries do treino" });
    }
  });

  app.post("/api/workout-log-sets", async (req, res) => {
    try {
      const validatedData = insertWorkoutLogSetSchema.parse(req.body);
      const set = await storage.createWorkoutLogSet(validatedData);
      res.status(201).json(set);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação da série" });
    }
  });

  app.put("/api/workout-log-sets/:id", async (req, res) => {
    try {
      const updates = insertWorkoutLogSetSchema.partial().parse(req.body);
      const set = await storage.updateWorkoutLogSet(req.params.id, updates);
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

  const httpServer = createServer(app);
  return httpServer;
}
