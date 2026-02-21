import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage, db } from "./storage";
import { loginSchema, registerSchema, insertDepartmentSchema, insertFeedbackSchema } from "@shared/schema";
import { z } from "zod";
import crypto from "crypto";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";

const PgSession = connectPgSimple(session);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon.tech") || process.env.DATABASE_URL?.includes("sslmode=require")
    ? { rejectUnauthorized: false }
    : undefined,
});

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "thesisnest_salt").digest("hex");
}

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.session?.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: Function) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
    const user = await storage.getUser(req.session.userId);
    if (!user || !roles.includes(user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  app.use(session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "thesisnest-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 },
  }));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      const existingUser = await storage.getUserByUsername(data.username);
      if (existingUser) return res.status(400).json({ error: "Username already in use" });

      const user = await storage.createUser({
        ...data,
        password: hashPassword(data.password),
        role: data.role,
        isApproved: data.role === "student",
        batchYear: data.batchYear ?? null,
        departmentId: data.departmentId ?? null,
        contact: data.contact ?? null,
      });

      res.json({ ok: true, message: data.role === "supervisor" ? "Account created. Awaiting admin approval." : "Account created successfully." });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(data.email);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      if (user.password !== hashPassword(data.password)) return res.status(401).json({ error: "Invalid credentials" });
      if (user.role === "supervisor" && !user.isApproved) {
        return res.status(403).json({ error: "Your account is pending approval by Admin." });
      }
      req.session!.userId = user.id;
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session!.destroy(() => res.json({ ok: true }));
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
    const user = await storage.getUser(req.session.userId);
    if (!user) return res.status(401).json({ error: "User not found" });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  });

  // Profile
  app.patch("/api/users/me", requireAuth, async (req, res) => {
    try {
      const { name, contact, departmentId, batchYear } = req.body;
      const updated = await storage.updateUser(req.session!.userId, { name, contact, departmentId, batchYear });
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { password: _, ...safeUser } = updated;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Users (admin)
  app.get("/api/users", requireRole("admin"), async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users.map(({ password: _, ...u }) => u));
  });

  app.patch("/api/users/:id/approve", requireRole("admin"), async (req, res) => {
    const updated = await storage.updateUser(req.params.id, { isApproved: true });
    if (!updated) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  });

  app.patch("/api/users/:id/reject", requireRole("admin"), async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ ok: true });
  });

  app.delete("/api/users/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteUser(req.params.id);
    res.json({ ok: true });
  });

  app.post("/api/users", requireRole("admin"), async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);
      const existing = await storage.getUserByEmail(data.email);
      if (existing) return res.status(400).json({ error: "Email already in use" });
      const user = await storage.createUser({
        ...data,
        password: hashPassword(data.password),
        isApproved: true,
        batchYear: data.batchYear ?? null,
        departmentId: data.departmentId ?? null,
        contact: data.contact ?? null,
      });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Departments
  app.get("/api/departments", async (req, res) => {
    const depts = await storage.getAllDepartments();
    res.json(depts);
  });

  app.post("/api/departments", requireRole("admin"), async (req, res) => {
    try {
      const data = insertDepartmentSchema.parse(req.body);
      const dept = await storage.createDepartment(data);
      res.json(dept);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/departments/:id", requireRole("admin"), async (req, res) => {
    try {
      const dept = await storage.updateDepartment(req.params.id, req.body);
      if (!dept) return res.status(404).json({ error: "Department not found" });
      res.json(dept);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/api/departments/:id", requireRole("admin"), async (req, res) => {
    await storage.deleteDepartment(req.params.id);
    res.json({ ok: true });
  });

  // Theses
  app.get("/api/theses", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session!.userId);
    if (!user) return res.status(401).json({ error: "Not found" });
    if (user.role === "student") {
      const theses = await storage.getThesesByStudent(user.id);
      return res.json(theses);
    }
    if (user.role === "supervisor") {
      const theses = await storage.getAllTheses();
      return res.json(theses);
    }
    // admin
    const theses = await storage.getAllTheses();
    res.json(theses);
  });

  app.get("/api/theses/:id", requireAuth, async (req, res) => {
    const thesis = await storage.getThesis(req.params.id);
    if (!thesis) return res.status(404).json({ error: "Not found" });
    res.json(thesis);
  });

  app.post("/api/theses", requireRole("student"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId);
      const thesis = await storage.createThesis({
        studentId: user!.id,
        title: req.body.title,
        abstract: req.body.abstract,
        status: "submitted",
        currentVersion: 1,
        supervisorId: null,
      });
      await storage.createThesisVersion({
        thesisId: thesis.id,
        version: 1,
        fileName: req.body.fileName || "thesis_v1.pdf",
        fileSize: req.body.fileSize || null,
      });
      res.json(thesis);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/theses/:id/resubmit", requireRole("student"), async (req, res) => {
    try {
      const thesis = await storage.getThesis(req.params.id);
      if (!thesis) return res.status(404).json({ error: "Not found" });
      const newVersion = thesis.currentVersion + 1;
      const updated = await storage.updateThesis(req.params.id, {
        status: "submitted",
        currentVersion: newVersion,
        title: req.body.title || thesis.title,
        abstract: req.body.abstract || thesis.abstract,
      });
      await storage.createThesisVersion({
        thesisId: thesis.id,
        version: newVersion,
        fileName: req.body.fileName || `thesis_v${newVersion}.pdf`,
        fileSize: req.body.fileSize || null,
      });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.patch("/api/theses/:id/review", requireRole("supervisor"), async (req, res) => {
    try {
      const { status } = req.body;
      const user = await storage.getUser(req.session!.userId);
      const updated = await storage.updateThesis(req.params.id, { status, supervisorId: user!.id });
      res.json(updated);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Thesis versions
  app.get("/api/theses/:id/versions", requireAuth, async (req, res) => {
    const versions = await storage.getThesisVersions(req.params.id);
    res.json(versions);
  });

  // Feedback
  app.get("/api/theses/:id/feedback", requireAuth, async (req, res) => {
    const feedback = await storage.getFeedbacksByThesis(req.params.id);
    res.json(feedback);
  });

  app.post("/api/theses/:id/feedback", requireRole("supervisor"), async (req, res) => {
    try {
      const user = await storage.getUser(req.session!.userId);
      const feedback = await storage.createFeedback({
        thesisId: req.params.id,
        supervisorId: user!.id,
        comment: req.body.comment,
      });
      res.json(feedback);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  // Reports (admin)
  app.get("/api/reports/department-stats", requireRole("admin"), async (req, res) => {
    const stats = await storage.getThesisCountByDepartment();
    res.json(stats);
  });

  app.get("/api/reports/supervisor-stats", requireRole("admin"), async (req, res) => {
    const stats = await storage.getReviewCountBySupervisor();
    res.json(stats);
  });

  return httpServer;
}
