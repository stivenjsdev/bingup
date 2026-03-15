"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Container, Box, Typography, CircularProgress } from "@mui/material";
import { useSocket } from "@/app/hooks/useSocket";

interface GameData {
  _id: string;
  name: string;
  type: string;
  status: string;
  round: number;
  calledNumbers: number[];
  winners: { playerName: string; round: number; wonAt: string }[];
  createdAt: string;
}

interface PlayerData {
  _id: string;
  name: string;
}

export default function AdminPage() {
  const params = useParams();
  const gameId = params.id as string;
  const { socket } = useSocket();

  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !gameId) return;

    const token = localStorage.getItem(`admin:${gameId}`);
    if (!token) {
      setError("No tienes permisos de administrador para esta partida");
      setLoading(false);
      return;
    }

    // Reconectar como admin
    socket.emit("game:reconnect-admin", { gameId, token });

    socket.on("game:reconnected", (data: { role: string; game: GameData; players: PlayerData[] }) => {
      if (data.role === "admin") {
        setGame(data.game);
        setPlayers(data.players);
        setLoading(false);
      }
    });

    // Actualizar lista de jugadores en tiempo real
    socket.on("game:players", (data: PlayerData[]) => {
      setPlayers(data);
    });

    socket.on("error", (msg: string) => {
      setError(msg);
      setLoading(false);
    });

    return () => {
      socket.off("game:reconnected");
      socket.off("game:players");
      socket.off("error");
    };
  }, [socket, gameId]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Typography color="error">{error}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Panel de Administrador
        </Typography>

        {game && (
          <Box sx={{ mt: 2 }}>
            <Typography>Partida: {game.name}</Typography>
            <Typography>Tipo: {game.type}</Typography>
            <Typography>Estado: {game.status}</Typography>
            <Typography>Ronda: {game.round}</Typography>
            <Typography>Números cantados: {game.calledNumbers.length > 0 ? game.calledNumbers.join(", ") : "Ninguno"}</Typography>
            <Typography>Código de sala: {game._id}</Typography>
            <Typography sx={{ mt: 2 }}>Jugadores ({players.length}):</Typography>
            {players.length === 0 ? (
              <Typography color="text.secondary">Sin jugadores aún</Typography>
            ) : (
              players.map((p) => (
                <Typography key={p._id}>• {p.name}</Typography>
              ))
            )}
            {game.winners.length > 0 && (
              <>
                <Typography sx={{ mt: 2 }}>Ganadores:</Typography>
                {game.winners.map((w, i) => (
                  <Typography key={i}>🏆 Ronda {w.round}: {w.playerName}</Typography>
                ))}
              </>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
