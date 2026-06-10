import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createDb, type DB } from "../src/db";
import { createApp } from "../src/app";

let db: DB;
let app: ReturnType<typeof createApp>;

beforeEach(() => {
  db = createDb(":memory:");
  app = createApp(db);
});

const creds = { name: "Ada", email: "ada@example.com", password: "hunter22" };

describe("auth", () => {
  it("registers a user and returns a token", async () => {
    const res = await request(app).post("/auth/register").send(creds);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user).toMatchObject({ name: "Ada", email: "ada@example.com" });
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("rejects duplicate email", async () => {
    await request(app).post("/auth/register").send(creds);
    const res = await request(app).post("/auth/register").send(creds);
    expect(res.status).toBe(409);
  });

  it("rejects invalid register body", async () => {
    const res = await request(app).post("/auth/register").send({ email: "x" });
    expect(res.status).toBe(400);
  });

  it("logs in with correct password", async () => {
    await request(app).post("/auth/register").send(creds);
    const res = await request(app).post("/auth/login")
      .send({ email: creds.email, password: creds.password });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("rejects wrong password", async () => {
    await request(app).post("/auth/register").send(creds);
    const res = await request(app).post("/auth/login")
      .send({ email: creds.email, password: "nope" });
    expect(res.status).toBe(401);
  });
});
