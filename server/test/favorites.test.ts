import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createDb, type DB } from "../src/db";
import { createApp } from "../src/app";

let db: DB;
let app: ReturnType<typeof createApp>;
let token: string;

beforeEach(async () => {
  db = createDb(":memory:");
  app = createApp(db);
  token = (await request(app).post("/auth/register")
    .send({ name: "Ada", email: "a@b.co", password: "hunter22" })).body.token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("favorites", () => {
  it("adds, lists, and removes favorites", async () => {
    const add = await request(app).post("/favorites").set(auth()).send({ menuItemId: 1 });
    expect(add.status).toBe(201);
    // adding twice is fine (idempotent)
    expect((await request(app).post("/favorites").set(auth()).send({ menuItemId: 1 })).status).toBe(201);
    const list = await request(app).get("/favorites").set(auth());
    expect(list.body).toHaveLength(1);
    expect(list.body[0].id).toBe(1);
    const del = await request(app).delete("/favorites/1").set(auth());
    expect(del.status).toBe(204);
    expect((await request(app).get("/favorites").set(auth())).body).toHaveLength(0);
  });
});

describe("discounts", () => {
  it("lists active codes", async () => {
    const res = await request(app).get("/discounts").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body[0]).toHaveProperty("code");
    expect(res.body[0]).toHaveProperty("percent_off");
  });

  it("validates a known code", async () => {
    const res = await request(app).post("/discounts/validate").set(auth()).send({ code: "WELCOME10" });
    expect(res.status).toBe(200);
    expect(res.body.percentOff).toBe(10);
  });

  it("404s an unknown code", async () => {
    const res = await request(app).post("/discounts/validate").set(auth()).send({ code: "NOPE" });
    expect(res.status).toBe(404);
  });
});
