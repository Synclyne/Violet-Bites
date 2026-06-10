import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createDb, type DB } from "../src/db";
import { createApp } from "../src/app";

let db: DB;
let app: ReturnType<typeof createApp>;
let token: string;
let addressId: number;

beforeEach(async () => {
  db = createDb(":memory:");
  app = createApp(db);
  token = (await request(app).post("/auth/register")
    .send({ name: "Ada", email: "a@b.co", password: "hunter22" })).body.token;
  addressId = (await request(app).post("/me/addresses").set(auth())
    .send({ label: "Home", street: "1 Main St", city: "Springfield" })).body.id;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("orders", () => {
  it("creates an order with correct totals", async () => {
    // item 1 = Classic Beef Burger 8.99; size Large (+3) option id lookup:
    const detail = await request(app).get("/menu/1").set(auth());
    const large = detail.body.options.find((o: any) => o.name === "Large");
    const res = await request(app).post("/orders").set(auth()).send({
      addressId,
      paymentMethod: "cash",
      discountCode: "WELCOME10",
      items: [{ menuItemId: 1, quantity: 2, optionIds: [large.id] }],
    });
    expect(res.status).toBe(201);
    // unit 8.99 + 3 = 11.99; subtotal 23.98; discount 2.398 -> 2.4; fee 2.99; total 24.57
    expect(res.body.subtotal).toBeCloseTo(23.98, 2);
    expect(res.body.discount).toBeCloseTo(2.4, 2);
    expect(res.body.delivery_fee).toBeCloseTo(2.99, 2);
    expect(res.body.total).toBeCloseTo(24.57, 2);
    expect(res.body.status).toBe("placed");
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("rejects an invalid discount code", async () => {
    const res = await request(app).post("/orders").set(auth()).send({
      addressId, paymentMethod: "cash", discountCode: "FAKE",
      items: [{ menuItemId: 1, quantity: 1, optionIds: [] }],
    });
    expect(res.status).toBe(400);
  });

  it("rejects empty items and unknown menu items", async () => {
    expect((await request(app).post("/orders").set(auth())
      .send({ addressId, paymentMethod: "cash", items: [] })).status).toBe(400);
    expect((await request(app).post("/orders").set(auth())
      .send({ addressId, paymentMethod: "cash", items: [{ menuItemId: 9999, quantity: 1, optionIds: [] }] })).status).toBe(400);
  });

  it("lists own orders newest first and gets one by id", async () => {
    const make = () => request(app).post("/orders").set(auth()).send({
      addressId, paymentMethod: "card",
      items: [{ menuItemId: 2, quantity: 1, optionIds: [] }],
    });
    const first = await make();
    await make();
    const list = await request(app).get("/orders").set(auth());
    expect(list.body).toHaveLength(2);
    const one = await request(app).get(`/orders/${first.body.id}`).set(auth());
    expect(one.status).toBe(200);
    expect(one.body.items).toHaveLength(1);
    expect(one.body.address.street).toBe("1 Main St");
  });

  it("404s another user's order", async () => {
    const order = await request(app).post("/orders").set(auth()).send({
      addressId, paymentMethod: "cash",
      items: [{ menuItemId: 1, quantity: 1, optionIds: [] }],
    });
    const other = (await request(app).post("/auth/register")
      .send({ name: "Eve", email: "e@b.co", password: "hunter22" })).body.token;
    const res = await request(app).get(`/orders/${order.body.id}`)
      .set({ Authorization: `Bearer ${other}` });
    expect(res.status).toBe(404);
  });
});
