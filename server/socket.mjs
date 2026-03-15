import { Server } from "socket.io";
import { Game, GAME_TYPES } from "./models/game.mjs";
import { Player } from "./models/player.mjs";
import { generateCard, checkWin } from "./utils/bingo.mjs";
import { generateToken } from "./utils/token.mjs";

// Números posibles del bingo (1-75)
const ALL_BINGO_NUMBERS = Array.from({ length: 75 }, (_, i) => i + 1);

/**
 * Verifica si un token corresponde al administrador de la partida.
 */
async function isAdmin(gameId, token) {
  const game = await Game.findById(gameId).lean();
  return game && game.adminToken === token;
}

export function setupSocket(httpServer) {
  const io = new Server(httpServer);

  io.on("connection", async (socket) => {
    console.log(`✅ Cliente conectado: ${socket.id}`);

    // Listar partidas disponibles (en espera o jugando)
    socket.on("game:list", async () => {
      try {
        const games = await Game.find({ status: { $in: ["waiting", "playing"] } })
          .sort({ createdAt: -1 })
          .lean();

        // Adjuntar cantidad de jugadores a cada partida
        const gamesWithCount = await Promise.all(
          games.map(async (g) => ({
            ...g,
            playerCount: await Player.countDocuments({ game: g._id }),
          }))
        );

        socket.emit("game:list", gamesWithCount);
      } catch (err) {
        console.error("Error al listar partidas:", err);
        socket.emit("error", "No se pudieron listar las partidas");
      }
    });

    // Crear una nueva partida (el creador es el administrador)
    socket.on("game:create", async (data) => {
      try {
        const { name, type } = data;

        if (!name || !type) {
          return socket.emit("error", "Nombre y tipo de juego son obligatorios");
        }
        if (!GAME_TYPES.includes(type)) {
          return socket.emit("error", "Tipo de juego no válido");
        }

        const adminToken = generateToken();

        const game = await Game.create({
          name: name.trim(),
          type,
          adminToken,
          adminSocketId: socket.id,
        });

        // El admin se une a la sala del juego
        socket.join(`game:${game._id}`);

        // Enviar token al admin para que lo persista en el cliente
        socket.emit("game:created", {
          ...game.toObject(),
          isAdmin: true,
          adminToken,
        });
        io.emit("game:new", game.toObject());
        console.log(`🎮 Partida creada por admin: ${game.name} (${game.type})`);
      } catch (err) {
        console.error("Error al crear partida:", err);
        socket.emit("error", "No se pudo crear la partida");
      }
    });

    // Unirse a una partida como jugador
    socket.on("game:join", async (data) => {
      try {
        const { gameId, playerName } = data;

        if (!gameId || !playerName) {
          return socket.emit("error", "ID de partida y nombre son obligatorios");
        }

        const game = await Game.findById(gameId);
        if (!game) {
          return socket.emit("error", "Partida no encontrada");
        }
        if (game.status !== "waiting") {
          return socket.emit("error", "La partida ya comenzó o finalizó");
        }

        const card = generateCard();
        const token = generateToken();

        const player = await Player.create({
          name: playerName.trim(),
          game: game._id,
          token,
          socketId: socket.id,
          card,
        });

        socket.join(`game:${gameId}`);

        // Enviar token al jugador para que lo persista en el cliente
        socket.emit("game:joined", {
          game: game.toObject(),
          player: player.toObject(),
          token,
        });

        // Notificar a todos en la sala (incluido admin)
        const players = await Player.find({ game: gameId }).lean();
        io.to(`game:${gameId}`).emit("game:players", players);

        console.log(`👤 ${playerName} se unió a "${game.name}"`);
      } catch (err) {
        console.error("Error al unirse a partida:", err);
        socket.emit("error", "No se pudo unir a la partida");
      }
    });

    // Obtener detalles de la partida
    socket.on("game:details", async ({ gameId, token }) => {
      try {
        const game = await Game.findById(gameId).lean();
        if (!game) {
          return socket.emit("error", "Partida no encontrada");
        }

        const players = await Player.find({ game: gameId }).lean();
        socket.emit("game:details", {
          game,
          players,
          isAdmin: game.adminToken === token,
        });
      } catch (err) {
        console.error("Error al obtener detalles:", err);
        socket.emit("error", "No se pudieron obtener los detalles");
      }
    });

    // =============================================
    // Eventos exclusivos del administrador
    // =============================================

    // Iniciar la partida (solo admin)
    socket.on("game:start", async ({ gameId, token }) => {
      try {
        if (!(await isAdmin(gameId, token))) {
          return socket.emit("error", "Solo el administrador puede iniciar la partida");
        }

        const game = await Game.findById(gameId);
        if (!game) return socket.emit("error", "Partida no encontrada");
        if (game.status !== "waiting") {
          return socket.emit("error", "La partida no está en espera");
        }

        const playerCount = await Player.countDocuments({ game: gameId });
        if (playerCount === 0) {
          return socket.emit("error", "No hay jugadores en la partida");
        }

        game.status = "playing";
        await game.save();

        io.to(`game:${gameId}`).emit("game:started", game.toObject());
        console.log(`▶️ Partida "${game.name}" iniciada (ronda ${game.round})`);
      } catch (err) {
        console.error("Error al iniciar partida:", err);
        socket.emit("error", "No se pudo iniciar la partida");
      }
    });

    // Sacar una balota (solo admin)
    socket.on("game:draw", async ({ gameId, token }) => {
      try {
        if (!(await isAdmin(gameId, token))) {
          return socket.emit("error", "Solo el administrador puede sacar balotas");
        }

        const game = await Game.findById(gameId);
        if (!game) return socket.emit("error", "Partida no encontrada");
        if (game.status !== "playing") {
          return socket.emit("error", "La partida no está en curso");
        }

        // Calcular números disponibles
        const available = ALL_BINGO_NUMBERS.filter(
          (n) => !game.calledNumbers.includes(n)
        );

        if (available.length === 0) {
          return socket.emit("error", "Ya se sacaron todas las balotas");
        }

        // Seleccionar número aleatorio
        const number = available[Math.floor(Math.random() * available.length)];
        game.calledNumbers.push(number);
        await game.save();

        io.to(`game:${gameId}`).emit("game:number", {
          number,
          calledNumbers: game.calledNumbers,
        });

        console.log(`🔵 Balota #${number} en "${game.name}" (${game.calledNumbers.length}/75)`);
      } catch (err) {
        console.error("Error al sacar balota:", err);
        socket.emit("error", "No se pudo sacar la balota");
      }
    });

    // Jugador canta BINGO
    socket.on("game:bingo", async ({ gameId, token }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return socket.emit("error", "Partida no encontrada");
        if (game.status !== "playing") {
          return socket.emit("error", "La partida no está en curso");
        }

        const player = await Player.findOne({ game: gameId, token });
        if (!player) {
          return socket.emit("error", "No eres jugador de esta partida");
        }

        // Verificar si realmente ganó
        const won = checkWin(player.card, player.markedNumbers, game.type);
        if (!won) {
          socket.emit("game:bingo-invalid", "¡Bingo falso! No cumples la condición de victoria");
          io.to(`game:${gameId}`).emit("game:bingo-attempt", {
            playerName: player.name,
            valid: false,
          });
          return;
        }

        // Registrar ganador
        game.winners.push({
          player: player._id,
          playerName: player.name,
          round: game.round,
        });
        game.status = "finished";
        await game.save();

        io.to(`game:${gameId}`).emit("game:winner", {
          playerName: player.name,
          round: game.round,
          winners: game.winners,
        });

        console.log(`🏆 ¡${player.name} ganó la ronda ${game.round} en "${game.name}"!`);
      } catch (err) {
        console.error("Error al cantar bingo:", err);
        socket.emit("error", "No se pudo verificar el bingo");
      }
    });

    // Jugador marca un número en su cartón
    socket.on("game:mark", async ({ gameId, number, token }) => {
      try {
        const game = await Game.findById(gameId).lean();
        if (!game || game.status !== "playing") return;

        // Solo se puede marcar si el número fue cantado
        if (!game.calledNumbers.includes(number)) {
          return socket.emit("error", "Ese número no ha sido cantado");
        }

        await Player.updateOne(
          { game: gameId, token },
          { $addToSet: { markedNumbers: number } }
        );
      } catch (err) {
        console.error("Error al marcar número:", err);
      }
    });

    // Reiniciar partida para nueva ronda (solo admin)
    socket.on("game:restart", async ({ gameId, token, type }) => {
      try {
        if (!(await isAdmin(gameId, token))) {
          return socket.emit("error", "Solo el administrador puede reiniciar la partida");
        }

        if (!type || !GAME_TYPES.includes(type)) {
          return socket.emit("error", "Tipo de juego no válido");
        }

        const game = await Game.findById(gameId);
        if (!game) return socket.emit("error", "Partida no encontrada");
        if (game.status !== "finished") {
          return socket.emit("error", "La partida debe haber finalizado para reiniciar");
        }

        // Incrementar ronda, nuevo tipo de juego, limpiar números cantados, volver a espera
        game.round += 1;
        game.type = type;
        game.calledNumbers = [];
        game.status = "waiting";
        await game.save();

        // Generar nuevos cartones y limpiar marcas de todos los jugadores
        const players = await Player.find({ game: gameId });
        await Promise.all(
          players.map((p) => {
            p.card = generateCard();
            p.markedNumbers = [];
            return p.save();
          })
        );

        const updatedPlayers = await Player.find({ game: gameId }).lean();

        io.to(`game:${gameId}`).emit("game:restarted", {
          game: game.toObject(),
          players: updatedPlayers,
        });

        console.log(`🔄 Partida "${game.name}" reiniciada → ronda ${game.round}`);
      } catch (err) {
        console.error("Error al reiniciar partida:", err);
        socket.emit("error", "No se pudo reiniciar la partida");
      }
    });

    // =============================================
    // Reconexión (admin o jugador)
    // =============================================

    // Reconectar como admin
    socket.on("game:reconnect-admin", async ({ gameId, token }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return socket.emit("error", "Partida no encontrada");
        if (game.adminToken !== token) {
          return socket.emit("error", "Token de administrador inválido");
        }

        // Actualizar socketId del admin
        game.adminSocketId = socket.id;
        await game.save();

        socket.join(`game:${gameId}`);

        const players = await Player.find({ game: gameId }).lean();
        socket.emit("game:reconnected", {
          role: "admin",
          game: game.toObject(),
          players,
          isAdmin: true,
        });

        console.log(`🔄 Admin reconectado a "${game.name}"`);
      } catch (err) {
        console.error("Error al reconectar admin:", err);
        socket.emit("error", "No se pudo reconectar como administrador");
      }
    });

    // Reconectar como jugador
    socket.on("game:reconnect-player", async ({ gameId, token }) => {
      try {
        const game = await Game.findById(gameId);
        if (!game) return socket.emit("error", "Partida no encontrada");

        const player = await Player.findOne({ game: gameId, token });
        if (!player) {
          return socket.emit("error", "Token de jugador inválido");
        }

        // Actualizar socketId del jugador
        player.socketId = socket.id;
        await player.save();

        socket.join(`game:${gameId}`);

        socket.emit("game:reconnected", {
          role: "player",
          game: game.toObject(),
          player: player.toObject(),
        });

        console.log(`🔄 Jugador "${player.name}" reconectado a "${game.name}"`);
      } catch (err) {
        console.error("Error al reconectar jugador:", err);
        socket.emit("error", "No se pudo reconectar como jugador");
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Cliente desconectado: ${socket.id}`);
    });
  });

  return io;
}
