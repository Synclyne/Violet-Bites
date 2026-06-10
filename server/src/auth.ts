import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import type { DB } from "./db";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

export function signToken(userId: number): string {
  return jwt.sign({ sub: String(userId) }, SECRET, { expiresIn: "30d" });
}

export interface AuthedRequest extends Request {
  userId: number;
}

export function requireAuth(db: DB) {
  return (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization ?? "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });
    try {
      const payload = jwt.verify(token, SECRET) as { sub: string };
      const user = db.prepare("SELECT id FROM users WHERE id = ?").get(Number(payload.sub));
      if (!user) return res.status(401).json({ error: "Unknown user" });
      (req as AuthedRequest).userId = Number(payload.sub);
      next();
    } catch {
      return res.status(401).json({ error: "Invalid token" });
    }
  };
}

export function publicUser(row: any) {
  const { password_hash, ...rest } = row;
  return rest;
}
