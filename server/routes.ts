import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertExerciseSchema, 
  insertWorkoutTemplateSchema,
  insertWorkoutTemplateExerciseSchema,
  insertWorkoutLogSchema,
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
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para criação do exercício" });
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
      const validatedData = insertWorkoutTemplateExerciseSchema.parse({
        ...req.body,
        templateId
      });
      const templateExercise = await storage.addExerciseToTemplate(validatedData);
      res.status(201).json(templateExercise);
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos para adição do exercício ao treino" });
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

  const httpServer = createServer(app);
  return httpServer;
}
