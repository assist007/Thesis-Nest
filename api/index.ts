import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "../server/routes";
import { seedDatabase } from "../server/seed";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const httpServer = createServer(app);

const ready = (async () => {
  try {
    await seedDatabase();
  } catch (e) {
    console.error("Seed error (non-fatal):", e);
  }
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
})();

export default async (req: Request, res: Response) => {
  await ready;
  app(req, res);
};
