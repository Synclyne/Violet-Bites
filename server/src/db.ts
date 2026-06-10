import Database from "better-sqlite3";

export type DB = Database.Database;

export function createDb(path = process.env.DB_PATH ?? "violet-bites.db"): DB {
  const db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      label TEXT NOT NULL,
      street TEXT NOT NULL,
      city TEXT NOT NULL,
      is_default INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      icon TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price REAL NOT NULL,
      image_url TEXT NOT NULL,
      rating REAL NOT NULL DEFAULT 0,
      is_available INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      kind TEXT NOT NULL CHECK (kind IN ('size','extra')),
      name TEXT NOT NULL,
      price_delta REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      address_id INTEGER NOT NULL REFERENCES addresses(id),
      status TEXT NOT NULL DEFAULT 'placed'
        CHECK (status IN ('placed','preparing','on_the_way','delivered')),
      payment_method TEXT NOT NULL CHECK (payment_method IN ('cash','card')),
      subtotal REAL NOT NULL,
      discount REAL NOT NULL DEFAULT 0,
      delivery_fee REAL NOT NULL,
      total REAL NOT NULL,
      discount_code TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      status_updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL REFERENCES orders(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      selected_options TEXT NOT NULL DEFAULT '[]'
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      order_id INTEGER NOT NULL REFERENCES orders(id),
      rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
      comment TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id INTEGER NOT NULL REFERENCES users(id),
      menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
      PRIMARY KEY (user_id, menu_item_id)
    );
    CREATE TABLE IF NOT EXISTS discount_codes (
      code TEXT PRIMARY KEY,
      percent_off INTEGER NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );
  `);

  seed(db);
  return db;
}

function seed(db: DB) {
  const already = db.prepare("SELECT COUNT(*) AS n FROM categories").get() as { n: number };
  if (already.n > 0) return;

  const cat = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)");
  const ids: Record<string, number> = {};
  for (const [name, icon] of [
    ["Burgers", "🍔"], ["Pizza", "🍕"], ["Salads", "🥗"],
    ["Drinks", "🥤"], ["Desserts", "🍰"], ["Sides", "🍟"],
  ] as const) {
    ids[name] = Number(cat.run(name, icon).lastInsertRowid);
  }

  const img = (q: string) =>
    `https://images.unsplash.com/${q}?auto=format&fit=crop&w=800&q=60`;

  const item = db.prepare(
    "INSERT INTO menu_items (category_id, name, description, price, image_url, rating) VALUES (?, ?, ?, ?, ?, ?)"
  );
  const opt = db.prepare(
    "INSERT INTO item_options (menu_item_id, kind, name, price_delta) VALUES (?, ?, ?, ?)"
  );

  const rows: [string, string, string, number, string, number][] = [
    ["Burgers", "Classic Beef Burger", "Juicy beef patty, cheddar, lettuce, tomato, house sauce.", 8.99, "photo-1568901346375-23c9450c58cd", 4.7],
    ["Burgers", "Double Smash Burger", "Two smashed patties, double cheese, pickles, onions.", 11.49, "photo-1553979459-d2229ba7433b", 4.8],
    ["Burgers", "Crispy Chicken Burger", "Buttermilk fried chicken, slaw, spicy mayo.", 9.49, "photo-1606755962773-d324e0a13086", 4.5],
    ["Burgers", "Veggie Garden Burger", "Grilled veggie patty, avocado, sprouts.", 8.49, "photo-1520072959219-c595dc870360", 4.2],
    ["Pizza", "Margherita", "San Marzano tomato, fresh mozzarella, basil.", 10.99, "photo-1574071318508-1cdbab80d002", 4.6],
    ["Pizza", "Pepperoni Feast", "Loaded pepperoni, mozzarella, oregano.", 12.99, "photo-1628840042765-356cda07504e", 4.8],
    ["Pizza", "BBQ Chicken Pizza", "BBQ sauce, grilled chicken, red onion, cilantro.", 13.49, "photo-1565299624946-b28f40a0ae38", 4.4],
    ["Pizza", "Four Cheese", "Mozzarella, gorgonzola, parmesan, ricotta.", 12.49, "photo-1513104890138-7c749659a591", 4.5],
    ["Salads", "Caesar Salad", "Romaine, parmesan, croutons, caesar dressing.", 7.99, "photo-1546793665-c74683f339c1", 4.3],
    ["Salads", "Greek Salad", "Cucumber, tomato, olives, feta, oregano.", 8.49, "photo-1540420773420-3366772f4999", 4.4],
    ["Salads", "Avocado Quinoa Bowl", "Quinoa, avocado, cherry tomatoes, lemon dressing.", 9.99, "photo-1512621776951-a57141f2eefd", 4.6],
    ["Drinks", "Fresh Lemonade", "House-squeezed lemonade with mint.", 3.49, "photo-1523677011781-c91d1bbe2f9e", 4.5],
    ["Drinks", "Iced Latte", "Double espresso over milk and ice.", 4.29, "photo-1517701604599-bb29b565090c", 4.4],
    ["Drinks", "Berry Smoothie", "Strawberry, blueberry, banana, yogurt.", 5.49, "photo-1505252585461-04db1eb84625", 4.7],
    ["Desserts", "Chocolate Lava Cake", "Warm chocolate cake with molten center.", 6.49, "photo-1606313564200-e75d5e30476c", 4.9],
    ["Desserts", "NY Cheesecake", "Classic baked cheesecake, berry coulis.", 5.99, "photo-1533134242443-d4fd215305ad", 4.6],
    ["Desserts", "Tiramisu", "Espresso-soaked ladyfingers, mascarpone.", 6.29, "photo-1571877227200-a0d98ea607e9", 4.7],
    ["Sides", "Golden Fries", "Crispy fries with sea salt.", 3.99, "photo-1573080496219-bb080dd4f877", 4.5],
    ["Sides", "Onion Rings", "Beer-battered onion rings, ranch dip.", 4.49, "photo-1639024471283-03518883512d", 4.3],
    ["Sides", "Mozzarella Sticks", "Fried mozzarella, marinara dip.", 5.29, "photo-1531749668029-2db88e4276c7", 4.4],
  ];

  const insertAll = db.transaction(() => {
    for (const [c, name, desc, price, photo, rating] of rows) {
      const id = Number(item.run(ids[c], name, desc, price, img(photo), rating).lastInsertRowid);
      opt.run(id, "size", "Small", 0);
      opt.run(id, "size", "Medium", 1.5);
      opt.run(id, "size", "Large", 3);
      if (c === "Burgers" || c === "Pizza") {
        opt.run(id, "extra", "Extra Cheese", 1);
        opt.run(id, "extra", "Bacon", 1.5);
      }
    }
    const code = db.prepare("INSERT INTO discount_codes (code, percent_off, active) VALUES (?, ?, 1)");
    code.run("WELCOME10", 10);
    code.run("VIOLET20", 20);
  });
  insertAll();
}
