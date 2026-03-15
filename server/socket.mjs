import { Server } from "socket.io";
import { Message } from "./models/message.mjs";

export function setupSocket(httpServer) {
  const io = new Server(httpServer);

  io.on("connection", async (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);

    try {
      const recentMessages = await Message.find()
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();
      socket.emit("initial-messages", recentMessages.reverse());
    } catch (err) {
      console.error("Error loading messages:", err);
    }

    socket.on("message", async (data) => {
      console.log(`📩 Mensaje recibido: ${data}`);

      try {
        const saved = await Message.create({
          content: data,
          socketId: socket.id,
        });

        io.emit("message", {
          _id: saved._id,
          content: saved.content,
          socketId: saved.socketId,
          createdAt: saved.createdAt,
        });
      } catch (err) {
        console.error("Error saving message:", err);
        socket.emit("error-message", "No se pudo guardar el mensaje");
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}
