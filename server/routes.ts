import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExerciseSchema, 
  insertWorkoutTemplateSchema,
  insertWorkoutTemplateExerciseSchema,
  insertWorkoutLogSchema,
  insertWorkoutLogExerciseSchema,
  insertWorkoutLogSetSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Exercise routes
  app.get("/api/exercises", async (req, res) => {
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

  app.get("/api/exercises/:id", async (req, res) => {
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

  app.post("/api/exercises", async (req, res) => {
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

  app.put("/api/exercises/:id", async (req, res) => {
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

  app.delete("/api/exercises/:id", async (req, res) => {
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

  // Get exercise weight progression data for progress charts
  app.get('/api/exercise-weight-history/:exerciseId', async (req, res) => {
    try {
      const { exerciseId } = req.params;
      const { limit = 10 } = req.query;
      
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
        // Only include completed workouts
        if (!logExercise.workoutLog?.endTime) continue;
        
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
            weightHistory.push({
              date: logExercise.workoutLog.startTime,
              workoutName: logExercise.workoutLog.name,
              maxWeight,
              totalSets: sets.length,
              allWeights: sets.map((set: any) => set.weight).filter((w: any) => w > 0)
            });
          }
        }
      }
      
      // Sort by date (most recent first) and limit results
      weightHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const limitedHistory = weightHistory.slice(0, parseInt(limit as string));
      
      res.json(limitedHistory);
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

  // Create workout log set
  app.post("/api/workout-log-sets", async (req, res) => {
    try {
      const { logExerciseId, setNumber, weight, reps } = req.body;
      
      const supabaseStorage = storage as any;
      const { data, error } = await supabaseStorage.supabase
        .from('workoutLogSets')
        .insert({
          logExerciseId,
          setNumber: setNumber || 1,
          weight: weight || null,
          reps: reps || null
        })
        .select()
        .single();
      
      if (error) throw error;
      res.status(201).json(data);
    } catch (error) {
      console.error('Error creating workout log set:', error);
      res.status(400).json({ message: "Erro ao criar série do treino" });
    }
  });

  // Get all exercises with their recent weight progression
  app.get('/api/exercises-weight-summary', async (req, res) => {
    try {
      const supabaseStorage = storage as any;
      
      // Get all exercises
      const { data: exercises, error: exercisesError } = await supabaseStorage.supabase
        .from('exercises')
        .select('*')
        .order('name');

      if (exercisesError) {
        throw exercisesError;
      }

      if (!exercises) {
        return res.json([]);
      }

      // For each exercise, get recent weight data
      const exerciseSummaries = [];
      
      for (const exercise of exercises) {
        // Get recent workout log exercises for this exercise
        const { data: logExercises } = await supabaseStorage.supabase
          .from('workoutLogExercises')
          .select(`
            *,
            workoutLog:workoutLogs(*)
          `)
          .eq('exerciseId', exercise.id)
          .not('workoutLog.endTime', 'is', null) // Only completed workouts
          .order('workoutLog.startTime', { ascending: false })
          .limit(3); // Get last 3 sessions for summary

        let hasData = false;
        let lastWeight = null;
        let sessionCount = 0;
        
        if (logExercises && logExercises.length > 0) {
          for (const logExercise of logExercises) {
            // Get sets for this exercise in this workout
            const { data: sets } = await supabaseStorage.supabase
              .from('workoutLogSets')
              .select('*')
              .eq('logExerciseId', logExercise.id)
              .not('weight', 'is', null);
            
            if (sets && sets.length > 0) {
              hasData = true;
              sessionCount++;
              if (!lastWeight) {
                lastWeight = Math.max(...sets.map((set: any) => set.weight || 0));
              }
            }
          }
        }
        
        if (hasData) {
          exerciseSummaries.push({
            id: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            lastWeight,
            sessionCount
          });
        }
      }
      
      res.json(exerciseSummaries);
    } catch (error) {
      console.error('Error fetching exercises weight summary:', error);
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
              // Only count volume for completed sets
              if ((set as any).weight && (set as any).reps && (set as any).completed) {
                totalVolume += set.weight * set.reps;
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
              // Calculate estimated volume: sets × reps × weight
              if (te.sets && te.reps && te.weight) {
                totalVolume += (te.sets * te.reps * te.weight);
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
