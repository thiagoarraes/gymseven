import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const exercises = pgTable("exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  muscleGroup: text("muscle_group").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  videoUrl: text("video_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workoutTemplates = pgTable("workout_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
  templateId: varchar("template_id").references(() => workoutTemplates.id),
  name: text("name").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  completed: boolean("completed").default(false),
});

export const workoutLogExercises = pgTable("workout_log_exercises", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  logId: varchar("log_id").notNull().references(() => workoutLogs.id, { onDelete: "cascade" }),
  exerciseId: varchar("exercise_id").notNull().references(() => exercises.id),
  order: integer("order").notNull(),
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

export type InsertWorkoutLogSet = z.infer<typeof insertWorkoutLogSetSchema>;
export type WorkoutLogSet = typeof workoutLogSets.$inferSelect;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Muscle groups enum
export const MUSCLE_GROUPS = [
  "Peito",
  "Costas", 
  "Ombros",
  "Braços",
  "Pernas",
  "Core",
  "Cardio"
] as const;

export type MuscleGroup = typeof MUSCLE_GROUPS[number];
