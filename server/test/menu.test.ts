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

describe("menu", () => {
  it("lists categories and items", async () => {
    const res = await request(app).get("/menu").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.categories.length).toBeGreaterThanOrEqual(5);
    expect(res.body.items.length).toBeGreaterThanOrEqual(18);
    expect(res.body.items[0]).toHaveProperty("image_url");
  });

  it("filters by category and search", async () => {
    const all = await request(app).get("/menu").set(auth());
    const catId = all.body.categories.find((c: any) => c.name === "Pizza").id;
    const byCat = await request(app).get(`/menu?category=${catId}`).set(auth());
    expect(byCat.body.items.every((i: any) => i.category_id === catId)).toBe(true);
    const search = await request(app).get("/menu?search=burger").set(auth());
    expect(search.body.items.length).toBeGreaterThan(0);
    expect(search.body.items.every((i: any) => /burger/i.test(i.name))).toBe(true);
  });

  it("returns item detail with options and reviews", async () => {
    const all = await request(app).get("/menu").set(auth());
    const id = all.body.items[0].id;
    const res = await request(app).get(`/menu/${id}`).set(auth());
    expect(res.status).toBe(200);
    expect(res.body.options.some((o: any) => o.kind === "size")).toBe(true);
    expect(Array.isArray(res.body.reviews)).toBe(true);
  });

  it("404s for unknown item", async () => {
    expect((await request(app).get("/menu/99999").set(auth())).status).toBe(404);
  });
});
