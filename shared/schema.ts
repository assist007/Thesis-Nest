import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["student", "supervisor", "admin"]);
export const thesisStatusEnum = pgEnum("thesis_status", ["submitted", "approved", "rejected", "need_changes"]);

export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  description: text("description"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: roleEnum("role").notNull().default("student"),
  name: text("name").notNull(),
  departmentId: varchar("department_id").references(() => departments.id),
  contact: text("contact"),
  batchYear: integer("batch_year"),
  isApproved: boolean("is_approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const theses = pgTable("theses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => users.id),
  supervisorId: varchar("supervisor_id").references(() => users.id),
  title: text("title").notNull(),
  abstract: text("abstract").notNull(),
  status: thesisStatusEnum("status").notNull().default("submitted"),
  currentVersion: integer("current_version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

export const thesisVersions = pgTable("thesis_versions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id),
  version: integer("version").notNull(),
  fileName: text("file_name").notNull(),
  fileSize: text("file_size"),
  submittedAt: timestamp("submitted_at").notNull().default(sql`now()`),
});

export const feedbacks = pgTable("feedbacks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  thesisId: varchar("thesis_id").notNull().references(() => theses.id),
  supervisorId: varchar("supervisor_id").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
});

export const insertDepartmentSchema = createInsertSchema(departments).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertThesisSchema = createInsertSchema(theses).omit({ id: true, createdAt: true, updatedAt: true });
export const insertThesisVersionSchema = createInsertSchema(thesisVersions).omit({ id: true, submittedAt: true });
export const insertFeedbackSchema = createInsertSchema(feedbacks).omit({ id: true, createdAt: true });

export type Department = typeof departments.$inferSelect;
export type InsertDepartment = z.infer<typeof insertDepartmentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Thesis = typeof theses.$inferSelect;
export type InsertThesis = z.infer<typeof insertThesisSchema>;

export type ThesisVersion = typeof thesisVersions.$inferSelect;
export type InsertThesisVersion = z.infer<typeof insertThesisVersionSchema>;

export type Feedback = typeof feedbacks.$inferSelect;
export type InsertFeedback = z.infer<typeof insertFeedbackSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6),
  role: z.enum(["student", "supervisor"]),
  departmentId: z.string().optional(),
  batchYear: z.number().optional(),
  contact: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
