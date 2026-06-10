import { describe, it, expect } from "vitest";
import { createDb } from "../src/db";
import { advanceStaleOrders, NEXT_STATUS } from "../src/simulator";

describe("simulator", () => {
  it("defines the status progression", () => {
    expect(NEXT_STATUS).toEqual({
      placed: "preparing",
      preparing: "on_the_way",
      on_the_way: "delivered",
    });
  });

  it("advances orders whose status is older than the threshold", () => {
    const db = createDb(":memory:");
    db.prepare("INSERT INTO users (name, email, password_hash) VALUES ('A','a@b.co','x')").run();
    db.prepare("INSERT INTO addresses (user_id, label, street, city) VALUES (1,'H','S','C')").run();
    db.prepare(`
      INSERT INTO orders (user_id, address_id, payment_method, subtotal, delivery_fee, total,
        status, status_updated_at)
      VALUES (1, 1, 'cash', 10, 2.99, 12.99, 'placed', datetime('now', '-60 seconds'))
    `).run();
    advanceStaleOrders(db, 30);
    const o = db.prepare("SELECT status FROM orders WHERE id = 1").get() as any;
    expect(o.status).toBe("preparing");
  });

  it("does not advance fresh or delivered orders", () => {
    const db = createDb(":memory:");
    db.prepare("INSERT INTO users (name, email, password_hash) VALUES ('A','a@b.co','x')").run();
    db.prepare("INSERT INTO addresses (user_id, label, street, city) VALUES (1,'H','S','C')").run();
    db.prepare(`
      INSERT INTO orders (user_id, address_id, payment_method, subtotal, delivery_fee, total, status)
      VALUES (1, 1, 'cash', 10, 2.99, 12.99, 'placed')
    `).run();
    db.prepare(`
      INSERT INTO orders (user_id, address_id, payment_method, subtotal, delivery_fee, total,
        status, status_updated_at)
      VALUES (1, 1, 'cash', 10, 2.99, 12.99, 'delivered', datetime('now', '-300 seconds'))
    `).run();
    advanceStaleOrders(db, 30);
    expect((db.prepare("SELECT status FROM orders WHERE id = 1").get() as any).status).toBe("placed");
    expect((db.prepare("SELECT status FROM orders WHERE id = 2").get() as any).status).toBe("delivered");
  });
});
