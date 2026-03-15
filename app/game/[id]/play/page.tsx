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
}

interface PlayerData {
  _id: string;
  name: string;
  card: number[][];
  markedNumbers: number[];
}

export default function PlayPage() {
  const params = useParams();
  const gameId = params.id as string;
  const { socket } = useSocket();

  const [game, setGame] = useState<GameData | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket || !gameId) return;

    const token = localStorage.getItem(`player:${gameId}`);
    if (!token) {
      setError("No tienes sesión de jugador para esta partida");
      setLoading(false);
      return;
    }

    // Reconectar como jugador
    socket.emit("game:reconnect-player", { gameId, token });

    socket.on("game:reconnected", (data: { role: string; game: GameData; player: PlayerData }) => {
      if (data.role === "player") {
        setGame(data.game);
        setPlayer(data.player);
        setLoading(false);
      }
    });

    socket.on("error", (msg: string) => {
      setError(msg);
      setLoading(false);
    });

    return () => {
      socket.off("game:reconnected");
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
          Jugador
        </Typography>

        {game && player && (
          <Box sx={{ mt: 2 }}>
            <Typography>Partida: {game.name}</Typography>
            <Typography>Tipo: {game.type}</Typography>
            <Typography>Estado: {game.status}</Typography>
            <Typography>Ronda: {game.round}</Typography>
            <Typography>Jugador: {player.name}</Typography>
            <Typography>Números cantados: {game.calledNumbers.length > 0 ? game.calledNumbers.join(", ") : "Ninguno"}</Typography>
            <Typography sx={{ mt: 2 }}>Mi cartón:</Typography>
            {player.card.map((row, i) => (
              <Typography key={i} sx={{ fontFamily: "monospace" }}>
                {row.map((n) => (n === 0 ? " ★" : String(n).padStart(2, " "))).join("  ")}
              </Typography>
            ))}
            <Typography sx={{ mt: 1 }}>Números marcados: {player.markedNumbers.length > 0 ? player.markedNumbers.join(", ") : "Ninguno"}</Typography>
          </Box>
        )}
      </Box>
    </Container>
  );
}
