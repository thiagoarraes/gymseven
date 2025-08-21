import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  dateOfBirth: timestamp("date_of_birth"),
  height: real("height"), // em cm
  weight: real("weight"), // em kg
  activityLevel: text("activity_level").default("moderado"), // sedentário, leve, moderado, intenso, atleta
  fitnessGoals: text("fitness_goals").array().default(sql`ARRAY[]::text[]`), // ganhar massa, perder peso, manter forma, etc.
  profileImageUrl: text("profile_image_url"),
  experienceLevel: text("experience_level").default("iniciante"), // iniciante, intermediário, avançado
  preferredWorkoutDuration: integer("preferred_workout_duration").default(60), // em minutos
  isActive: boolean("is_active").default(true),
  emailVerified: boolean("email_verified").default(false),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Tabela para histórico de peso
export const weightHistory = pgTable("weight_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weight: real("weight").notNull(),
  date: timestamp("date").defaultNow(),
  notes: text("notes"),
});

// Tabela para objetivos pessoais
export const userGoals = pgTable("user_goals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // weight_loss, muscle_gain, strength, endurance
  targetValue: real("target_value"),
  currentValue: real("current_value"),
  unit: text("unit"), // kg, lbs, reps, etc.
  targetDate: timestamp("target_date"),
  isCompleted: boolean("is_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tabela para preferências do usuário
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("dark"), // dark, light, auto
  units: text("units").default("metric"), // metric, imperial
  language: text("language").default("pt-BR"),
  notifications: boolean("notifications").default(true),
  soundEffects: boolean("sound_effects").default(true),
  restTimerAutoStart: boolean("rest_timer_auto_start").default(true),
  defaultRestTime: integer("default_rest_time").default(90), // em segundos
  weekStartsOn: integer("week_starts_on").default(1), // 0=domingo, 1=segunda
  trackingData: text("tracking_data").default("all"), // all, weight_only, none
});

// Tabela para conquistas do usuário (sistema gamificado isolado por usuário)
export const userAchievements = pgTable("user_achievements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  achievementId: text("achievement_id").notNull(), // ID da conquista (exemplo: "first_workout", "strength_milestone_100kg")
  unlockedAt: timestamp("unlocked_at").defaultNow(),
  progress: integer("progress").default(0), // Progresso atual para conquistas progressivas
  isCompleted: boolean("is_completed").default(true),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutTemplates = pgTable("workout_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutTemplateExercises = pgTable("workout_template_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => workoutTemplates.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id, { onDelete: "cascade" }),
  sets: integer("sets").notNull(),
  reps: text("reps").notNull(),
  weight: real("weight"),
  restDurationSeconds: integer("rest_duration_seconds").default(90),
  order: integer("order").notNull(),
});

export const workoutLogs = pgTable("workout_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  user_id: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  templateId: varchar("template_id").references(() => workoutTemplates.id),
  name: text("name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
});

export const workoutLogExercises = pgTable("workout_log_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logId: varchar("log_id").notNull().references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  exerciseName: text("exercise_name").notNull(),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutLogSets = pgTable("workout_log_sets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logExerciseId: varchar("log_exercise_id").notNull().references(() => workoutLogExercises.id, { onDelete: "cascade" }),
  setNumber: integer("set_number").notNull(),
  reps: integer("reps"),
  weight: real("weight"),
  completed: boolean("completed").default(false),
});

// Insert schemas
export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
}).extend({
  // Make optional fields truly optional
  description: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  videoUrl: z.string().optional().nullable(),
});

export const insertWorkoutTemplateSchema = createInsertSchema(workoutTemplates).omit({
  id: true,
  createdAt: true,
}).extend({
  description: z.string().optional().nullable(),
});

export const insertWorkoutTemplateExerciseSchema = createInsertSchema(workoutTemplateExercises).omit({
  id: true,
}).extend({
  // Allow numbers for reps, but convert to string for storage
  reps: z.union([z.string(), z.number()]).transform((val) => String(val)),
});

export const insertWorkoutLogSchema = createInsertSchema(workoutLogs).omit({
  id: true,
}).extend({
  startTime: z.union([z.date(), z.string()]).transform((val) => new Date(val)),
  endTime: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

export const insertWorkoutLogExerciseSchema = createInsertSchema(workoutLogExercises).omit({
  id: true,
  createdAt: true,
});

export const insertWorkoutLogSetSchema = createInsertSchema(workoutLogSets).omit({
  id: true,
});

// Types
export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

export type InsertWorkoutTemplate = z.infer<typeof insertWorkoutTemplateSchema>;
export type WorkoutTemplate = typeof workoutTemplates.$inferSelect;

export type InsertWorkoutTemplateExercise = z.infer<typeof insertWorkoutTemplateExerciseSchema>;
export type WorkoutTemplateExercise = typeof workoutTemplateExercises.$inferSelect;

export type InsertWorkoutLog = z.infer<typeof insertWorkoutLogSchema>;
export type WorkoutLog = typeof workoutLogs.$inferSelect;

export type InsertWorkoutLogExercise = z.infer<typeof insertWorkoutLogExerciseSchema>;
export type WorkoutLogExercise = typeof workoutLogExercises.$inferSelect;

export type InsertWorkoutLogSet = z.infer<typeof insertWorkoutLogSetSchema>;
export type WorkoutLogSet = typeof workoutLogSets.$inferSelect;

// User schemas
export const insertUserSchema = createInsertSchema(users).omit({
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
export const insertWeightHistorySchema = createInsertSchema(weightHistory).omit({
  id: true,
}).extend({
  weight: z.number().min(30).max(300),
  date: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

// User Goals schemas  
export const insertUserGoalSchema = createInsertSchema(userGoals).omit({
  id: true,
  createdAt: true,
}).extend({
  targetValue: z.number().optional(),
  currentValue: z.number().optional(),
  targetDate: z.union([z.date(), z.string()]).transform((val) => new Date(val)).optional(),
});

// User Preferences schemas
export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export const updateUserPreferencesSchema = insertUserPreferencesSchema.partial().omit({ user_id: true });

// User Achievements schemas
export const insertUserAchievementSchema = createInsertSchema(userAchievements).omit({
  id: true,
  unlockedAt: true,
});

export const updateUserAchievementSchema = insertUserAchievementSchema.partial().omit({ user_id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type LoginUser = z.infer<typeof loginSchema>;
export type RegisterUser = z.infer<typeof registerSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;

export type WeightHistory = typeof weightHistory.$inferSelect;
export type InsertWeightHistory = z.infer<typeof insertWeightHistorySchema>;

export type UserGoal = typeof userGoals.$inferSelect;
export type InsertUserGoal = z.infer<typeof insertUserGoalSchema>;

export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UpdateUserPreferences = z.infer<typeof updateUserPreferencesSchema>;

export type UserAchievement = typeof userAchievements.$inferSelect;
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
  "Abdômen",
  "Cardio"
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
