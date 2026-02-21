import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { Pool } from "pg";
import { storage } from "../server/storage";
import {
  loginSchema,
  registerSchema,
  insertDepartmentSchema,
} from "../shared/schema";
import crypto from "crypto";
import { seedDatabase } from "../server/seed";

const PgSession = connectPgSimple(session);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "thesisnest_salt").digest("hex");
}

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    store: new PgSession({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET || "thesisnest-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production", maxAge: 7 * 24 * 60 * 60 * 1000 },
  })
);

// Auth
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
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await storage.getUserByEmail(data.email);
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (user.password !== hashPassword(data.password)) return res.status(401).json({ error: "Invalid credentials" });
    if (user.role === "supervisor" && !user.isApproved) return res.status(403).json({ error: "Your account is pending approval by Admin." });
    req.session!.userId = user.id;
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
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
app.patch("/api/users/me", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { name, contact, departmentId, batchYear } = req.body;
    const updated = await storage.updateUser(req.session.userId, { name, contact, departmentId, batchYear });
    if (!updated) return res.status(404).json({ error: "User not found" });
    const { password: _, ...safeUser } = updated;
    res.json(safeUser);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Admin: Users
app.get("/api/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const users = await storage.getAllUsers();
  res.json(users.map(({ password: _, ...u }) => u));
});

app.post("/api/users", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  try {
    const data = registerSchema.parse(req.body);
    const existing = await storage.getUserByEmail(data.email);
    if (existing) return res.status(400).json({ error: "Email already in use" });
    const user = await storage.createUser({ ...data, password: hashPassword(data.password), isApproved: true, batchYear: data.batchYear ?? null, departmentId: data.departmentId ?? null, contact: data.contact ?? null });
    const { password: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.patch("/api/users/:id/approve", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  const updated = await storage.updateUser(req.params.id, { isApproved: true });
  if (!updated) return res.status(404).json({ error: "Not found" });
  const { password: _, ...safeUser } = updated;
  res.json(safeUser);
});

app.delete("/api/users/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  await storage.deleteUser(req.params.id);
  res.json({ ok: true });
});

// Departments
app.get("/api/departments", async (_req, res) => {
  res.json(await storage.getAllDepartments());
});

app.post("/api/departments", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  try {
    const data = insertDepartmentSchema.parse(req.body);
    res.json(await storage.createDepartment(data));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.patch("/api/departments/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  try {
    const dept = await storage.updateDepartment(req.params.id, req.body);
    if (!dept) return res.status(404).json({ error: "Not found" });
    res.json(dept);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.delete("/api/departments/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  await storage.deleteDepartment(req.params.id);
  res.json({ ok: true });
});

// Theses
app.get("/api/theses", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await storage.getUser(req.session.userId);
  if (!user) return res.status(401).json({ error: "Not found" });
  if (user.role === "student") return res.json(await storage.getThesesByStudent(user.id));
  res.json(await storage.getAllTheses());
});

app.get("/api/theses/:id", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const thesis = await storage.getThesis(req.params.id);
  if (!thesis) return res.status(404).json({ error: "Not found" });
  res.json(thesis);
});

app.post("/api/theses", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "student") return res.status(403).json({ error: "Forbidden" });
  try {
    const thesis = await storage.createThesis({ studentId: user.id, title: req.body.title, abstract: req.body.abstract, status: "submitted", currentVersion: 1, supervisorId: null });
    await storage.createThesisVersion({ thesisId: thesis.id, version: 1, fileName: req.body.fileName || "thesis_v1.pdf", fileSize: req.body.fileSize || null });
    res.json(thesis);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.post("/api/theses/:id/resubmit", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "student") return res.status(403).json({ error: "Forbidden" });
  try {
    const thesis = await storage.getThesis(req.params.id);
    if (!thesis) return res.status(404).json({ error: "Not found" });
    const newVersion = thesis.currentVersion + 1;
    const updated = await storage.updateThesis(req.params.id, { status: "submitted", currentVersion: newVersion, title: req.body.title || thesis.title, abstract: req.body.abstract || thesis.abstract });
    await storage.createThesisVersion({ thesisId: thesis.id, version: newVersion, fileName: req.body.fileName || `thesis_v${newVersion}.pdf`, fileSize: req.body.fileSize || null });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.patch("/api/theses/:id/review", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "supervisor") return res.status(403).json({ error: "Forbidden" });
  try {
    const updated = await storage.updateThesis(req.params.id, { status: req.body.status, supervisorId: user.id });
    res.json(updated);
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.get("/api/theses/:id/versions", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  res.json(await storage.getThesisVersions(req.params.id));
});

app.get("/api/theses/:id/feedback", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  res.json(await storage.getFeedbacksByThesis(req.params.id));
});

app.post("/api/theses/:id/feedback", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "supervisor") return res.status(403).json({ error: "Forbidden" });
  try {
    res.json(await storage.createFeedback({ thesisId: req.params.id, supervisorId: user.id, comment: req.body.comment }));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

// Reports
app.get("/api/reports/department-stats", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(await storage.getThesisCountByDepartment());
});

app.get("/api/reports/supervisor-stats", async (req, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Unauthorized" });
  const me = await storage.getUser(req.session.userId);
  if (!me || me.role !== "admin") return res.status(403).json({ error: "Forbidden" });
  res.json(await storage.getReviewCountBySupervisor());
});

// Seed on first run
seedDatabase().catch(console.error);

export default app;
