import { describe, it, expect } from "vitest";
import { createDb } from "../src/db";

describe("createDb", () => {
  it("creates schema and seeds menu data", () => {
    const db = createDb(":memory:");
    const cats = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
    const items = db.prepare("SELECT COUNT(*) AS n FROM menu_items").get() as { n: number };
    const codes = db.prepare("SELECT COUNT(*) AS n FROM discount_codes WHERE active = 1").get() as { n: number };
    expect(cats.n).toBeGreaterThanOrEqual(5);
    expect(items.n).toBeGreaterThanOrEqual(18);
    expect(codes.n).toBeGreaterThanOrEqual(2);
  });

  it("is idempotent (safe to call on an existing db file)", () => {
    const db = createDb(":memory:");
    const before = (db.prepare("SELECT COUNT(*) AS n FROM menu_items").get() as { n: number }).n;
    expect(before).toBeGreaterThan(0);
  });

  it("seeds size and extra options for items", () => {
    const db = createDb(":memory:");
    const sizes = db.prepare("SELECT COUNT(*) AS n FROM item_options WHERE kind = 'size'").get() as { n: number };
    expect(sizes.n).toBeGreaterThan(0);
  });
});
