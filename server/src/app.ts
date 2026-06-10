import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { DB } from "./db";
import { signToken, publicUser } from "./auth";

export function createApp(db: DB) {
  const app = express();
  app.use(express.json());

  const registerSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6),
  });

  app.post("/auth/register", (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten().fieldErrors });
    }
    const { name, email, password } = parsed.data;
    const exists = db.prepare("SELECT id FROM users WHERE email = ?").get(email.toLowerCase());
    if (exists) return res.status(409).json({ error: "Email already registered" });
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare("INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)")
      .run(name, email.toLowerCase(), hash);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(Number(info.lastInsertRowid));
    res.status(201).json({ token: signToken(Number(info.lastInsertRowid)), user: publicUser(user) });
  });

  const loginSchema = z.object({ email: z.string().email(), password: z.string() });

  app.post("/auth/login", (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const user = db.prepare("SELECT * FROM users WHERE email = ?")
      .get(parsed.data.email.toLowerCase()) as any;
    if (!user || !bcrypt.compareSync(parsed.data.password, user.password_hash)) {
      return res.status(401).json({ error: "Wrong email or password" });
    }
    res.json({ token: signToken(user.id), user: publicUser(user) });
  });

  // global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });

  return app;
}
