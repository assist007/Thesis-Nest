import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { eq, and, desc, count } from "drizzle-orm";
import * as schema from "@shared/schema";
import type {
  User, InsertUser,
  Department, InsertDepartment,
  Thesis, InsertThesis,
  ThesisVersion, InsertThesisVersion,
  Feedback, InsertFeedback,
} from "@shared/schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  getUsersByRole(role: string): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Departments
  getDepartment(id: string): Promise<Department | undefined>;
  getAllDepartments(): Promise<Department[]>;
  createDepartment(dept: InsertDepartment): Promise<Department>;
  updateDepartment(id: string, data: Partial<InsertDepartment>): Promise<Department | undefined>;
  deleteDepartment(id: string): Promise<void>;

  // Theses
  getThesis(id: string): Promise<Thesis | undefined>;
  getAllTheses(): Promise<Thesis[]>;
  getThesesByStudent(studentId: string): Promise<Thesis[]>;
  getThesesBySupervisor(supervisorId: string): Promise<Thesis[]>;
  getThesesByDepartment(departmentId: string): Promise<Thesis[]>;
  createThesis(thesis: InsertThesis): Promise<Thesis>;
  updateThesis(id: string, data: Partial<InsertThesis>): Promise<Thesis | undefined>;

  // Thesis Versions
  getThesisVersions(thesisId: string): Promise<ThesisVersion[]>;
  createThesisVersion(version: InsertThesisVersion): Promise<ThesisVersion>;

  // Feedbacks
  getFeedbacksByThesis(thesisId: string): Promise<Feedback[]>;
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;

  // Stats
  getThesisCountByDepartment(): Promise<{ departmentId: string | null; count: number }[]>;
  getReviewCountBySupervisor(): Promise<{ supervisorId: string | null; count: number }[]>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const rows = await db.select().from(schema.users).where(eq(schema.users.id, id));
    return rows[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const rows = await db.select().from(schema.users).where(eq(schema.users.email, email));
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const rows = await db.select().from(schema.users).where(eq(schema.users.username, username));
    return rows[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const rows = await db.insert(schema.users).values(user).returning();
    return rows[0];
  }

  async updateUser(id: string, data: Partial<InsertUser>): Promise<User | undefined> {
    const rows = await db.update(schema.users).set(data).where(eq(schema.users.id, id)).returning();
    return rows[0];
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(schema.users).orderBy(desc(schema.users.createdAt));
  }

  async getUsersByRole(role: string): Promise<User[]> {
    return db.select().from(schema.users).where(eq(schema.users.role, role as any));
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(schema.users).where(eq(schema.users.id, id));
  }

  async getDepartment(id: string): Promise<Department | undefined> {
    const rows = await db.select().from(schema.departments).where(eq(schema.departments.id, id));
    return rows[0];
  }

  async getAllDepartments(): Promise<Department[]> {
    return db.select().from(schema.departments);
  }

  async createDepartment(dept: InsertDepartment): Promise<Department> {
    const rows = await db.insert(schema.departments).values(dept).returning();
    return rows[0];
  }

  async updateDepartment(id: string, data: Partial<InsertDepartment>): Promise<Department | undefined> {
    const rows = await db.update(schema.departments).set(data).where(eq(schema.departments.id, id)).returning();
    return rows[0];
  }

  async deleteDepartment(id: string): Promise<void> {
    await db.delete(schema.departments).where(eq(schema.departments.id, id));
  }

  async getThesis(id: string): Promise<Thesis | undefined> {
    const rows = await db.select().from(schema.theses).where(eq(schema.theses.id, id));
    return rows[0];
  }

  async getAllTheses(): Promise<Thesis[]> {
    return db.select().from(schema.theses).orderBy(desc(schema.theses.createdAt));
  }

  async getThesesByStudent(studentId: string): Promise<Thesis[]> {
    return db.select().from(schema.theses).where(eq(schema.theses.studentId, studentId)).orderBy(desc(schema.theses.createdAt));
  }

  async getThesesBySupervisor(supervisorId: string): Promise<Thesis[]> {
    return db.select().from(schema.theses).orderBy(desc(schema.theses.updatedAt));
  }

  async getThesesByDepartment(departmentId: string): Promise<Thesis[]> {
    const students = await db.select().from(schema.users).where(
      and(eq(schema.users.departmentId, departmentId), eq(schema.users.role, "student"))
    );
    const studentIds = students.map(s => s.id);
    if (studentIds.length === 0) return [];
    return db.select().from(schema.theses).orderBy(desc(schema.theses.createdAt));
  }

  async createThesis(thesis: InsertThesis): Promise<Thesis> {
    const rows = await db.insert(schema.theses).values(thesis).returning();
    return rows[0];
  }

  async updateThesis(id: string, data: Partial<InsertThesis>): Promise<Thesis | undefined> {
    const rows = await db.update(schema.theses).set({ ...data, updatedAt: new Date() }).where(eq(schema.theses.id, id)).returning();
    return rows[0];
  }

  async getThesisVersions(thesisId: string): Promise<ThesisVersion[]> {
    return db.select().from(schema.thesisVersions).where(eq(schema.thesisVersions.thesisId, thesisId)).orderBy(desc(schema.thesisVersions.version));
  }

  async createThesisVersion(version: InsertThesisVersion): Promise<ThesisVersion> {
    const rows = await db.insert(schema.thesisVersions).values(version).returning();
    return rows[0];
  }

  async getFeedbacksByThesis(thesisId: string): Promise<Feedback[]> {
    return db.select().from(schema.feedbacks).where(eq(schema.feedbacks.thesisId, thesisId)).orderBy(desc(schema.feedbacks.createdAt));
  }

  async createFeedback(feedback: InsertFeedback): Promise<Feedback> {
    const rows = await db.insert(schema.feedbacks).values(feedback).returning();
    return rows[0];
  }

  async getThesisCountByDepartment(): Promise<{ departmentId: string | null; count: number }[]> {
    const students = await db.select().from(schema.users).where(eq(schema.users.role, "student"));
    const allTheses = await db.select().from(schema.theses);
    const deptMap = new Map<string | null, number>();
    for (const thesis of allTheses) {
      const student = students.find(s => s.id === thesis.studentId);
      const deptId = student?.departmentId ?? null;
      deptMap.set(deptId, (deptMap.get(deptId) ?? 0) + 1);
    }
    return Array.from(deptMap.entries()).map(([departmentId, count]) => ({ departmentId, count }));
  }

  async getReviewCountBySupervisor(): Promise<{ supervisorId: string | null; count: number }[]> {
    const allTheses = await db.select().from(schema.theses);
    const supMap = new Map<string | null, number>();
    for (const thesis of allTheses) {
      if (thesis.status !== "submitted") {
        const supId = thesis.supervisorId ?? null;
        supMap.set(supId, (supMap.get(supId) ?? 0) + 1);
      }
    }
    return Array.from(supMap.entries()).map(([supervisorId, count]) => ({ supervisorId, count }));
  }
}

export const storage = new DbStorage();
