import { createDb } from "./db";
import { createApp } from "./app";
import { startSimulator } from "./simulator";

const db = createDb();
const app = createApp(db);
startSimulator(db);

const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Violet Bites server on http://0.0.0.0:${PORT}`);
});
