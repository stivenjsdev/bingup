import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handle);
  const io = new Server(httpServer);

  io.on("connection", (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);

    socket.on("message", (data) => {
      console.log(`📩 Mensaje recibido: ${data}`);
      // Reenviar el mensaje a todos los clientes conectados
      io.emit("message", data);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Servidor listo en http://${hostname}:${port}`);
  });
});
