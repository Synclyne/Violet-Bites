import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createDb, type DB } from "../src/db";
import { createApp } from "../src/app";

let db: DB;
let app: ReturnType<typeof createApp>;
let token: string;
let orderId: number;

beforeEach(async () => {
  db = createDb(":memory:");
  app = createApp(db);
  token = (await request(app).post("/auth/register")
    .send({ name: "Ada", email: "a@b.co", password: "hunter22" })).body.token;
  const addressId = (await request(app).post("/me/addresses").set(auth())
    .send({ label: "Home", street: "1 Main St", city: "Springfield" })).body.id;
  orderId = (await request(app).post("/orders").set(auth()).send({
    addressId, paymentMethod: "cash",
    items: [{ menuItemId: 1, quantity: 1, optionIds: [] }],
  })).body.id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("reviews", () => {
  it("rejects reviewing a non-delivered order", async () => {
    const res = await request(app).post("/reviews").set(auth())
      .send({ orderId, rating: 5, comment: "great" });
    expect(res.status).toBe(409);
  });

  it("stores a review per order item once delivered and updates item rating", async () => {
    db.prepare("UPDATE orders SET status = 'delivered' WHERE id = ?").run(orderId);
    const res = await request(app).post("/reviews").set(auth())
      .send({ orderId, rating: 5, comment: "great" });
    expect(res.status).toBe(201);
    const rows = db.prepare("SELECT * FROM reviews WHERE order_id = ?").all(orderId);
    expect(rows).toHaveLength(1);
    const item = db.prepare("SELECT rating FROM menu_items WHERE id = 1").get() as any;
    expect(item.rating).toBe(5); // avg of the single review
    // second review for same order is rejected
    const again = await request(app).post("/reviews").set(auth())
      .send({ orderId, rating: 1, comment: "changed my mind" });
    expect(again.status).toBe(409);
  });

  it("rejects rating outside 1-5", async () => {
    db.prepare("UPDATE orders SET status = 'delivered' WHERE id = ?").run(orderId);
    const res = await request(app).post("/reviews").set(auth())
      .send({ orderId, rating: 6, comment: "" });
    expect(res.status).toBe(400);
  });
});
