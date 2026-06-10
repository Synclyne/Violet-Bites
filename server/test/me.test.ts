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
  const res = await request(app).post("/auth/register")
    .send({ name: "Ada", email: "ada@example.com", password: "hunter22" });
  token = res.body.token;
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("/me", () => {
  it("requires auth", async () => {
    expect((await request(app).get("/me")).status).toBe(401);
  });

  it("returns the current user", async () => {
    const res = await request(app).get("/me").set(auth());
    expect(res.status).toBe(200);
    expect(res.body.email).toBe("ada@example.com");
  });

  it("updates name", async () => {
    const res = await request(app).patch("/me").set(auth()).send({ name: "Ada L." });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Ada L.");
  });

  it("creates, lists, and deletes addresses", async () => {
    const created = await request(app).post("/me/addresses").set(auth())
      .send({ label: "Home", street: "1 Main St", city: "Springfield" });
    expect(created.status).toBe(201);
    const list = await request(app).get("/me/addresses").set(auth());
    expect(list.body).toHaveLength(1);
    expect(list.body[0].is_default).toBe(1); // first address becomes default
    const del = await request(app).delete(`/me/addresses/${created.body.id}`).set(auth());
    expect(del.status).toBe(204);
    expect((await request(app).get("/me/addresses").set(auth())).body).toHaveLength(0);
  });
});
