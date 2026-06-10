import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { DB } from "./db";
import { requireAuth, publicUser, signToken, type AuthedRequest } from "./auth";

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

  const authed = requireAuth(db);
  const uid = (req: express.Request) => (req as AuthedRequest).userId;

  app.get("/me", authed, (req, res) => {
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(uid(req));
    res.json(publicUser(user));
  });

  app.patch("/me", authed, (req, res) => {
    const parsed = z.object({ name: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    db.prepare("UPDATE users SET name = ? WHERE id = ?").run(parsed.data.name, uid(req));
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(uid(req));
    res.json(publicUser(user));
  });

  app.get("/me/addresses", authed, (req, res) => {
    res.json(db.prepare("SELECT * FROM addresses WHERE user_id = ?").all(uid(req)));
  });

  app.post("/me/addresses", authed, (req, res) => {
    const parsed = z.object({
      label: z.string().min(1),
      street: z.string().min(1),
      city: z.string().min(1),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const count = (db.prepare("SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?").get(uid(req)) as any).n;
    const info = db.prepare(
      "INSERT INTO addresses (user_id, label, street, city, is_default) VALUES (?, ?, ?, ?, ?)"
    ).run(uid(req), parsed.data.label, parsed.data.street, parsed.data.city, count === 0 ? 1 : 0);
    res.status(201).json(db.prepare("SELECT * FROM addresses WHERE id = ?").get(Number(info.lastInsertRowid)));
  });

  app.delete("/me/addresses/:id", authed, (req, res) => {
    const info = db.prepare("DELETE FROM addresses WHERE id = ? AND user_id = ?")
      .run(Number(req.params.id), uid(req));
    if (info.changes === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  });

  app.get("/menu", authed, (req, res) => {
    const categories = db.prepare("SELECT * FROM categories ORDER BY id").all();
    let sql = "SELECT * FROM menu_items WHERE is_available = 1";
    const params: unknown[] = [];
    if (req.query.category) {
      sql += " AND category_id = ?";
      params.push(Number(req.query.category));
    }
    if (req.query.search) {
      sql += " AND name LIKE ?";
      params.push(`%${String(req.query.search)}%`);
    }
    res.json({ categories, items: db.prepare(sql).all(...params) });
  });

  app.get("/menu/:id", authed, (req, res) => {
    const item = db.prepare("SELECT * FROM menu_items WHERE id = ?").get(Number(req.params.id));
    if (!item) return res.status(404).json({ error: "Not found" });
    const options = db.prepare("SELECT * FROM item_options WHERE menu_item_id = ?").all(Number(req.params.id));
    const reviews = db.prepare(`
      SELECT r.rating, r.comment, r.created_at, u.name AS user_name
      FROM reviews r JOIN users u ON u.id = r.user_id
      WHERE r.menu_item_id = ? ORDER BY r.created_at DESC LIMIT 20
    `).all(Number(req.params.id));
    res.json({ ...item, options, reviews });
  });

  app.get("/favorites", authed, (req, res) => {
    res.json(db.prepare(`
      SELECT m.* FROM favorites f JOIN menu_items m ON m.id = f.menu_item_id
      WHERE f.user_id = ?
    `).all(uid(req)));
  });

  app.post("/favorites", authed, (req, res) => {
    const parsed = z.object({ menuItemId: z.number().int() }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    db.prepare("INSERT OR IGNORE INTO favorites (user_id, menu_item_id) VALUES (?, ?)")
      .run(uid(req), parsed.data.menuItemId);
    res.status(201).json({ ok: true });
  });

  app.delete("/favorites/:menuItemId", authed, (req, res) => {
    db.prepare("DELETE FROM favorites WHERE user_id = ? AND menu_item_id = ?")
      .run(uid(req), Number(req.params.menuItemId));
    res.status(204).end();
  });

  app.post("/discounts/validate", authed, (req, res) => {
    const parsed = z.object({ code: z.string().min(1) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const row = db.prepare("SELECT * FROM discount_codes WHERE code = ? AND active = 1")
      .get(parsed.data.code.toUpperCase()) as any;
    if (!row) return res.status(404).json({ error: "Invalid code" });
    res.json({ percentOff: row.percent_off });
  });

  // global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });

  return app;
}
