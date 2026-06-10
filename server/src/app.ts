import express from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import type { DB } from "./db";
import { requireAuth, publicUser, signToken, type AuthedRequest } from "./auth";

export function createApp(db: DB) {
  const app = express();
  app.use(express.json());

  // CORS: native apps ignore this, but the Expo web build (and browser-based
  // testing) needs it since the API lives on a different origin.
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
    if (req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

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

  const round2 = (x: number) => Math.round(x * 100) / 100;

  const orderSchema = z.object({
    addressId: z.number().int(),
    paymentMethod: z.enum(["cash", "card"]),
    discountCode: z.string().optional(),
    items: z.array(z.object({
      menuItemId: z.number().int(),
      quantity: z.number().int().min(1).max(20),
      optionIds: z.array(z.number().int()).default([]),
    })).min(1),
  });

  const DELIVERY_FEE = 2.99;

  function loadOrder(orderId: number) {
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as any;
    if (!order) return null;
    order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(orderId)
      .map((i: any) => ({ ...i, selected_options: JSON.parse(i.selected_options) }));
    order.address = db.prepare("SELECT * FROM addresses WHERE id = ?").get(order.address_id) ?? null;
    return order;
  }

  app.post("/orders", authed, (req, res) => {
    const parsed = orderSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const { addressId, paymentMethod, discountCode, items } = parsed.data;

    const address = db.prepare("SELECT * FROM addresses WHERE id = ? AND user_id = ?")
      .get(addressId, uid(req));
    if (!address) return res.status(400).json({ error: "Unknown address" });

    let percentOff = 0;
    if (discountCode) {
      const code = db.prepare("SELECT * FROM discount_codes WHERE code = ? AND active = 1")
        .get(discountCode.toUpperCase()) as any;
      if (!code) return res.status(400).json({ error: "Invalid discount code" });
      percentOff = code.percent_off;
    }

    type Line = { menuItemId: number; name: string; unitPrice: number; quantity: number; options: any[] };
    const lines: Line[] = [];
    for (const line of items) {
      const item = db.prepare("SELECT * FROM menu_items WHERE id = ? AND is_available = 1")
        .get(line.menuItemId) as any;
      if (!item) return res.status(400).json({ error: `Unknown menu item ${line.menuItemId}` });
      const options = line.optionIds.map((oid) =>
        db.prepare("SELECT * FROM item_options WHERE id = ? AND menu_item_id = ?").get(oid, line.menuItemId) as any
      );
      if (options.some((o) => !o)) return res.status(400).json({ error: "Invalid option for item" });
      const unitPrice = round2(item.price + options.reduce((s, o) => s + o.price_delta, 0));
      lines.push({ menuItemId: item.id, name: item.name, unitPrice, quantity: line.quantity, options });
    }

    const subtotal = round2(lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0));
    const discount = round2(subtotal * (percentOff / 100));
    const total = round2(subtotal - discount + DELIVERY_FEE);

    const orderId = db.transaction(() => {
      const info = db.prepare(`
        INSERT INTO orders (user_id, address_id, payment_method, subtotal, discount, delivery_fee, total, discount_code)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(uid(req), addressId, paymentMethod, subtotal, discount, DELIVERY_FEE, total, discountCode?.toUpperCase() ?? null);
      const id = Number(info.lastInsertRowid);
      const ins = db.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, name, unit_price, quantity, selected_options)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      for (const l of lines) {
        ins.run(id, l.menuItemId, l.name, l.unitPrice, l.quantity,
          JSON.stringify(l.options.map((o) => ({ id: o.id, name: o.name, price_delta: o.price_delta }))));
      }
      return id;
    })();

    res.status(201).json(loadOrder(orderId));
  });

  app.get("/orders", authed, (req, res) => {
    const ids = db.prepare("SELECT id FROM orders WHERE user_id = ? ORDER BY id DESC").all(uid(req)) as any[];
    res.json(ids.map((r) => loadOrder(r.id)));
  });

  app.get("/orders/:id", authed, (req, res) => {
    const order = db.prepare("SELECT id FROM orders WHERE id = ? AND user_id = ?")
      .get(Number(req.params.id), uid(req)) as any;
    if (!order) return res.status(404).json({ error: "Not found" });
    res.json(loadOrder(order.id));
  });

  app.post("/reviews", authed, (req, res) => {
    const parsed = z.object({
      orderId: z.number().int(),
      rating: z.number().int().min(1).max(5),
      comment: z.string().max(1000).default(""),
    }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid input" });
    const { orderId, rating, comment } = parsed.data;

    const order = db.prepare("SELECT * FROM orders WHERE id = ? AND user_id = ?")
      .get(orderId, uid(req)) as any;
    if (!order) return res.status(404).json({ error: "Order not found" });
    if (order.status !== "delivered") return res.status(409).json({ error: "Order not delivered yet" });
    const existing = db.prepare("SELECT id FROM reviews WHERE order_id = ?").get(orderId);
    if (existing) return res.status(409).json({ error: "Order already reviewed" });

    const itemIds = db.prepare("SELECT DISTINCT menu_item_id FROM order_items WHERE order_id = ?")
      .all(orderId) as any[];
    db.transaction(() => {
      const ins = db.prepare(
        "INSERT INTO reviews (user_id, menu_item_id, order_id, rating, comment) VALUES (?, ?, ?, ?, ?)"
      );
      const upd = db.prepare(`
        UPDATE menu_items SET rating =
          (SELECT ROUND(AVG(rating), 1) FROM reviews WHERE menu_item_id = ?)
        WHERE id = ?
      `);
      for (const r of itemIds) {
        ins.run(uid(req), r.menu_item_id, orderId, rating, comment);
        upd.run(r.menu_item_id, r.menu_item_id);
      }
    })();
    res.status(201).json({ ok: true });
  });

  // global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  });

  return app;
}
