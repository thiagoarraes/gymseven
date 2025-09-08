import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const usuarios = pgTable("usuarios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("firstName"),
  lastName: text("lastName"),
  dateOfBirth: timestamp("dateOfBirth"),
  height: real("height"), // em cm
  weight: real("weight"), // em kg
  activityLevel: text("activityLevel").default("moderado"), // sedentário, leve, moderado, intenso, atleta
  fitnessGoals: text("fitnessGoals").array().default(sql`ARRAY[]::text[]`), // ganhar massa, perder peso, manter forma, etc.
  profileImageUrl: text("profileImageUrl"),
  experienceLevel: text("experienceLevel").default("iniciante"), // iniciante, intermediário, avançado
  preferredWorkoutDuration: integer("preferredWorkoutDuration").default(60), // em minutos
  isActive: boolean("isActive").default(true),
  emailVerified: boolean("emailVerified").default(false),
  lastLoginAt: timestamp("lastLoginAt"),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
});

// Tabela para histórico de peso
export const historicoPeso = pgTable("historicoPeso", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  peso: real("peso").notNull(),
  date: timestamp("date").defaultNow(),
  observacoes: text("observacoes"),
});

// Tabela para objetivos pessoais
export const objetivosUsuario = pgTable("objetivosUsuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // weight_loss, muscle_gain, strength, endurance
  targetValue: real("targetValue"),
  currentValue: real("currentValue"),
  unit: text("unit"), // kg, lbs, reps, etc.
  targetDate: timestamp("targetDate"),
  isCompleted: boolean("isCompleted").default(false),
  createdAt: timestamp("createdAt").defaultNow(),
});

// Tabela para preferências do usuário
export const preferenciasUsuario = pgTable("preferenciasUsuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  theme: text("theme").default("dark"), // dark, light, auto
  units: text("units").default("metric"), // metric, imperial
  language: text("language").default("pt-BR"),
  notifications: boolean("notifications").default(true),
  soundEffects: boolean("soundEffects").default(true),
  restTimerAutoStart: boolean("restTimerAutoStart").default(true),
  defaultRestTime: integer("defaultRestTime").default(90), // em segundos
  weekStartsOn: integer("weekStartsOn").default(1), // 0=domingo, 1=segunda
  trackingData: text("trackingData").default("all"), // all, weight_only, none
});

// Tabela para conquistas do usuário (sistema gamificado isolado por usuário)
export const conquistasUsuario = pgTable("conquistasUsuario", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  achievementId: text("achievementId").notNull(), // ID da conquista (exemplo: "first_workout", "strength_milestone_100kg")
  unlockedAt: timestamp("unlockedAt").defaultNow(),
  progress: integer("progress").default(0), // Progresso atual para conquistas progressivas
  isCompleted: boolean("isCompleted").default(true),
});

export const exercicios = pgTable("exercicios", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  grupoMuscular: text("grupoMuscular").notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const modelosTreino = pgTable("modelosTreino", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const exerciciosModeloTreino = pgTable("exerciciosModeloTreino", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modeloId: varchar("modeloId").notNull().references(() => modelosTreino.id, { onDelete: "cascade" }),
  exercicioId: varchar("exercicioId").notNull().references(() => exercicios.id, { onDelete: "cascade" }),
  series: integer("series").notNull(),
  repeticoes: text("repeticoes").notNull(),
  weight: real("weight"),
  restDurationSeconds: integer("restDurationSeconds").default(90),
  order: integer("order").notNull(),
});

export const registrosTreino = pgTable("registrosTreino", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  usuarioId: varchar("usuarioId").notNull().references(() => usuarios.id, { onDelete: "cascade" }),
  modeloId: varchar("modeloId").references(() => modelosTreino.id),
  nome: text("nome").notNull(),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime"),
});

export const exerciciosRegistroTreino = pgTable("exerciciosRegistroTreino", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  registroId: varchar("registroId").notNull().references(() => registrosTreino.id, { onDelete: "cascade" }),
  exercicioId: varchar("exercicioId").notNull().references(() => exercicios.id),
  nomeExercicio: text("nomeExercicio").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
});

export const seriesRegistroTreino = pgTable("seriesRegistroTreino", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  exercicioRegistroId: varchar("exercicioRegistroId").notNull().references(() => exerciciosRegistroTreino.id, { onDelete: "cascade" }),
  setNumber: integer("setNumber").notNull(),
  reps: integer("reps"),
  weight: real("weight"),
  completed: boolean("completed").default(false),
});

// Insert schemas
export const insertExerciseSchema = z.object({
  // Accept BOTH English and Portuguese field names
  name: z.string().min(1).optional(),
  nome: z.string().min(1).optional(),
  muscleGroup: z.string().min(1).optional(),
  grupoMuscular: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  descricao: z.string().optional().nullable(),
})
.transform((data) => {
  // Transform English to Portuguese
  const result: any = {};
  
  // Handle name/nome
  if (data.name) {
    result.nome = data.name;
  } else if (data.nome) {
    result.nome = data.nome;
  }
  
  // Handle muscleGroup/grupoMuscular
  if (data.muscleGroup) {
    result.grupoMuscular = data.muscleGroup;
  } else if (data.grupoMuscular) {
    result.grupoMuscular = data.grupoMuscular;
  }
  
  // Handle description/descricao
  if (data.description !== undefined) {
    result.descricao = data.description;
  } else if (data.descricao !== undefined) {
    result.descricao = data.descricao;
  }
  
  return result;
})
.refine((data) => data.nome, {
  message: "Nome é obrigatório",
  path: ["nome"]
})
.refine((data) => data.grupoMuscular, {
  message: "Grupo muscular é obrigatório", 
  path: ["grupoMuscular"]
});

export const insertWorkoutTemplateSchema = createInsertSchema(modelosTreino).omit({
  id: true,
  createdAt: true,
}).extend({
  description: z.string().optional().nullable(),
});

export const insertWorkoutTemplateExerciseSchema = createInsertSchema(exerciciosModeloTreino).omit({
  id: true,
}).extend({
  // Allow numbers for reps, but convert to string for storage
  reps: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertWorkoutLogSchema = createInsertSchema(registrosTreino).omit({
  id: true,
}).extend({
  startTime: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
  endTime: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

export const insertWorkoutLogExerciseSchema = createInsertSchema(exerciciosRegistroTreino).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutLogSetSchema = createInsertSchema(seriesRegistroTreino).omit({
  id: true,
});

// Types
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercicios.$inferSelect;

export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type WorkoutTemplate = typeof modelosTreino.$inferSelect;

export type InsertWorkoutTemplateExercise = z.infer<typeof insertWorkoutTemplateExerciseSchema>;
export type WorkoutTemplateExercise = typeof exerciciosModeloTreino.$inferSelect;

export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof registrosTreino.$inferSelect;

export type InsertWorkoutLogExercise = z.infer<typeof insertWorkoutLogExerciseSchema>;
export type WorkoutLogExercise = typeof exerciciosRegistroTreino.$inferSelect;

export type InsertWorkoutLogSet = z.infer<typeof insertWorkoutLogSetSchema>;
export type WorkoutLogSet = typeof seriesRegistroTreino.$inferSelect;

// User schemas
export const insertUserSchema = createInsertSchema(usuarios).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário deve conter apenas letras, números e underscore. Sem acentos, espaços ou caracteres especiais"),
  height: z.number().min(100).max(250).optional(),
  weight: z.number().min(30).max(300).optional(),
  dateOfBirth: z.string().optional(),
});

export const updateUserSchema = insertUserSchema.partial().omit({ 
  password: true
}).extend({
  email: z.string().email("Email inválido").optional(),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário deve conter apenas letras, números e underscore. Sem acentos, espaços ou caracteres especiais")
    .optional(),
  height: z.union([
    z.number().min(100, "Altura deve ser entre 100 e 250cm").max(250, "Altura deve ser entre 100 e 250cm"),
    z.null()
  ]).optional(),
  weight: z.union([
    z.number().min(30, "Peso deve ser entre 30 e 300kg").max(300, "Peso deve ser entre 30 e 300kg"),
    z.null()
  ]).optional(),
  profileImageUrl: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  username: z.string()
    .min(3, "Nome de usuário deve ter pelo menos 3 caracteres")
    .max(20, "Nome de usuário deve ter no máximo 20 caracteres")
    .regex(/^[a-zA-Z0-9_]+$/, "Nome de usuário deve conter apenas letras, números e underscore. Sem acentos, espaços ou caracteres especiais"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Senha atual é obrigatória"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(1, "Confirmação de senha é obrigatória"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"],
});

// Weight History schemas
export const insertWeightHistorySchema = createInsertSchema(historicoPeso).omit({
  id: true,
}).extend({
  weight: z.number().min(30).max(300),
  date: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

// User Goals schemas  
export const insertUserGoalSchema = createInsertSchema(objetivosUsuario).omit({
  id: true,
  createdAt: true,
}).extend({
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetDate: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

// User Preferences schemas
export const insertUserPreferencesSchema = createInsertSchema(preferenciasUsuario).omit({
  id: true,
});

export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial().omit({ usuarioId: true });

// User Achievements schemas
export const insertUserAchievementSchema = createInsertSchema(conquistasUsuario).omit({
  id: true,
  unlockedAt: true,
});

export const updateUserAchievementSchema = insertUserAchievementSchema.partial().omit({ usuarioId: true });

// Types
export type User = typeof usuarios.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type WeightHistory = typeof historicoPeso.$inferSelect;
export type InsertWeightHistory = z.infer<typeof insertWeightHistorySchema>;

export type UserGoal = typeof objetivosUsuario.$inferSelect;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;

export type UserPreferences = typeof preferenciasUsuario.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;

export type UserAchievement = typeof conquistasUsuario.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type UpdateUserAchievement = z.infer<typeof updateUserAchievementSchema>;

// Constants
export const MUSCLE_GROUPS = [
  "Peito",
  "Costas", 
  "Ombros",
  "Bíceps",
  "Tríceps",
  "Pernas",
  "Abdômen"
] as const;

export const ACTIVITY_LEVELS = [
  "sedentário",
  "leve", 
  "moderado",
  "intenso",
  "atleta"
] as const;

export const EXPERIENCE_LEVELS = [
  "iniciante",
  "intermediário",
  "avançado"
] as const;

export const FITNESS_GOALS = [
  "Ganhar massa muscular",
  "Perder peso",
  "Manter forma física",
  "Aumentar força",
  "Melhorar resistência",
  "Reabilitação",
  "Bem-estar geral"
] as const;

export const GOAL_TYPES = [
  "weight_loss",
  "muscle_gain", 
  "strength",
  "endurance",
  "body_fat",
  "measurement"
] as const;

export const THEMES = ["dark", "light", "auto"] as const;
export const UNITS = ["metric", "imperial"] as const;
export const LANGUAGES = ["pt-BR", "en-US", "es-ES"] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];
export type ActivityLevel = typeof ACTIVITY_LEVELS[number];
export type ExperienceLevel = typeof EXPERIENCE_LEVELS[number];
export type FitnessGoal = typeof FITNESS_GOALS[number];
export type GoalType = typeof GOAL_TYPES[number];
export type Theme = typeof THEMES[number];
export type Units = typeof UNITS[number];
export type Language = typeof LANGUAGES[number];
