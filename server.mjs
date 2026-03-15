import { createServer } from "node:http";
import next from "next";
import dotenv from "dotenv";
import { connectDB } from "./server/db.mjs";
import { setupSocket } from "./server/socket.mjs";

dotenv.config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function start() {
  await connectDB();
  await app.prepare();

  const httpServer = createServer(handle);
  setupSocket(httpServer);

  httpServer.listen(port, () => {
    console.log(`🚀 Servidor listo en http://${hostname}:${port}`);
  });
}

start().catch((err) => {
  console.error("❌ Fatal error starting server:", err);
  process.exit(1);
});
