import type { DB } from "./db";

export const NEXT_STATUS: Record<string, string> = {
  placed: "preparing",
  preparing: "on_the_way",
  on_the_way: "delivered",
};

export function advanceStaleOrders(db: DB, thresholdSeconds = 30) {
  const stale = db.prepare(`
    SELECT id, status FROM orders
    WHERE status != 'delivered'
      AND status_updated_at <= datetime('now', ?)
  `).all(`-${thresholdSeconds} seconds`) as { id: number; status: string }[];
  const upd = db.prepare(
    "UPDATE orders SET status = ?, status_updated_at = datetime('now') WHERE id = ?"
  );
  for (const o of stale) upd.run(NEXT_STATUS[o.status], o.id);
}

export function startSimulator(db: DB, thresholdSeconds = 30, tickMs = 5000) {
  return setInterval(() => advanceStaleOrders(db, thresholdSeconds), tickMs);
}
