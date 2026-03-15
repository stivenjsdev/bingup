"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Stack,
  Button,
  Chip,
  Alert,
  Collapse,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Zoom,
  Paper,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import CasinoIcon from "@mui/icons-material/Casino";
import HomeIcon from "@mui/icons-material/Home";
import CategoryIcon from "@mui/icons-material/Category";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import CelebrationIcon from "@mui/icons-material/Celebration";
import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RadioButtonCheckedIcon from "@mui/icons-material/RadioButtonChecked";
import GridViewIcon from "@mui/icons-material/GridView";
import { useSocket } from "@/app/hooks/useSocket";

// Animaciones
const dropIn = keyframes`
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
`;

const popIn = keyframes`
  0% { transform: scale(0.5); opacity: 0; }
  70% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`;

const celebrate = keyframes`
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-10deg) scale(1.1); }
  75% { transform: rotate(10deg) scale(1.1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const hourglassFlip = keyframes`
  0% { transform: rotateZ(0deg); }
  25% { transform: rotateZ(180deg); }
  50% { transform: rotateZ(180deg); }
  75% { transform: rotateZ(360deg); }
  100% { transform: rotateZ(360deg); }
`;

const BINGO_LETTERS = ["B", "I", "N", "G", "O"];

const BINGO_COLUMN_COLORS = ["#1565c0", "#c62828", "#2e7d32", "#f57f17", "#6a1b9a"];

const GAME_TYPE_LABELS: Record<string, string> = {
  linea_horizontal: "Línea horizontal",
  linea_vertical: "Línea vertical",
  diagonal: "Diagonal",
  "4_esquinas": "4 Esquinas",
  marco_completo: "Marco completo",
  carton_lleno: "Cartón lleno",
};

const STATUS_MAP: Record<string, { label: string; color: "warning" | "success" | "info" }> = {
  waiting: { label: "En espera", color: "warning" },
  playing: { label: "En curso", color: "success" },
  finished: { label: "Finalizada", color: "info" },
};

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
  const router = useRouter();
  const gameId = params.id as string;
  const { socket } = useSocket();

  const [game, setGame] = useState<GameData | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [bingoResult, setBingoResult] = useState<"valid" | "invalid" | null>(null);
  const [callingBingo, setCallingBingo] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ playerName: string; round: number } | null>(null);

  const getToken = useCallback(() => localStorage.getItem(`player:${gameId}`) || "", [gameId]);

  // Obtener color de columna para un número
  const getColumnColor = (num: number) => {
    if (num >= 1 && num <= 15) return BINGO_COLUMN_COLORS[0];
    if (num >= 16 && num <= 30) return BINGO_COLUMN_COLORS[1];
    if (num >= 31 && num <= 45) return BINGO_COLUMN_COLORS[2];
    if (num >= 46 && num <= 60) return BINGO_COLUMN_COLORS[3];
    if (num >= 61 && num <= 75) return BINGO_COLUMN_COLORS[4];
    return "#666";
  };

  // Obtener letra de columna para un número
  const getColumnLetter = (num: number) => {
    if (num >= 1 && num <= 15) return "B";
    if (num >= 16 && num <= 30) return "I";
    if (num >= 31 && num <= 45) return "N";
    if (num >= 46 && num <= 60) return "G";
    if (num >= 61 && num <= 75) return "O";
    return "";
  };

  useEffect(() => {
    if (!socket || !gameId) return;

    const token = getToken();
    if (!token) {
      setError("No tienes sesión de jugador para esta partida");
      setLoading(false);
      return;
    }

    // Reconectar como jugador
    socket.emit("game:reconnect-player", { gameId, token });

    const onReconnected = (data: { role: string; game: GameData; player: PlayerData }) => {
      if (data.role === "player") {
        setGame(data.game);
        setPlayer(data.player);
        setLoading(false);
        if (data.game.calledNumbers.length > 0) {
          setLastNumber(data.game.calledNumbers[data.game.calledNumbers.length - 1]);
        }
      }
    };

    const onStarted = (gameData: GameData) => {
      setGame(gameData);
      setWinnerInfo(null);
      setBingoResult(null);
    };

    const onNumber = (data: { number: number; calledNumbers: number[] }) => {
      setLastNumber(data.number);
      setGame((prev) => (prev ? { ...prev, calledNumbers: data.calledNumbers } : prev));
    };

    const onWinner = (data: { playerName: string; round: number }) => {
      setGame((prev) => (prev ? { ...prev, status: "finished" } : prev));
      setWinnerInfo(data);
    };

    const onBingoInvalid = () => {
      setBingoResult("invalid");
      setCallingBingo(false);
      setTimeout(() => setBingoResult(null), 4000);
    };

    const onBingoAttempt = (data: { playerName: string; valid: boolean }) => {
      if (data.valid && data.playerName === player?.name) {
        setBingoResult("valid");
        setCallingBingo(false);
      }
    };

    const onRestarted = (data: { game: GameData; players: { _id: string; name: string; card: number[][]; markedNumbers: number[] }[] }) => {
      setGame(data.game);
      setLastNumber(null);
      setWinnerInfo(null);
      setBingoResult(null);
      // Buscar los datos actualizados de este jugador
      const me = data.players.find((p) => p._id === player?._id);
      if (me) {
        setPlayer(me);
      }
    };

    const onError = (msg: string) => {
      if (loading) {
        setError(msg);
        setLoading(false);
      }
      setCallingBingo(false);
    };

    socket.on("game:reconnected", onReconnected);
    socket.on("game:started", onStarted);
    socket.on("game:number", onNumber);
    socket.on("game:winner", onWinner);
    socket.on("game:bingo-invalid", onBingoInvalid);
    socket.on("game:bingo-attempt", onBingoAttempt);
    socket.on("game:restarted", onRestarted);
    socket.on("error", onError);

    return () => {
      socket.off("game:reconnected", onReconnected);
      socket.off("game:started", onStarted);
      socket.off("game:number", onNumber);
      socket.off("game:winner", onWinner);
      socket.off("game:bingo-invalid", onBingoInvalid);
      socket.off("game:bingo-attempt", onBingoAttempt);
      socket.off("game:restarted", onRestarted);
      socket.off("error", onError);
    };
  }, [socket, gameId, getToken, loading, player?._id, player?.name]);

  const handleMark = (num: number) => {
    if (!socket || !game || game.status !== "playing" || num === 0) return;
    if (!game.calledNumbers.includes(num)) return;
    if (player?.markedNumbers.includes(num)) return;

    socket.emit("game:mark", { gameId, number: num, token: getToken() });
    // Actualizar localmente para feedback inmediato
    setPlayer((prev) =>
      prev ? { ...prev, markedNumbers: [...prev.markedNumbers, num] } : prev
    );
  };

  const handleBingo = () => {
    if (!socket || callingBingo) return;
    setCallingBingo(true);
    socket.emit("game:bingo", { gameId, token: getToken() });
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Stack alignItems="center" spacing={2}>
            <CircularProgress size={48} />
            <Typography color="text.secondary">Conectando a la partida...</Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Stack alignItems="center" spacing={2}>
            <Alert severity="error" sx={{ width: "100%" }}>{error}</Alert>
            <Button startIcon={<HomeIcon />} onClick={() => router.push("/")}>
              Volver al inicio
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (!game || !player) return null;

  const statusInfo = STATUS_MAP[game.status] || { label: game.status, color: "info" as const };
  const isPlaying = game.status === "playing";

  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: "100vh", py: 2 }}>
        {/* Header */}
        <Fade in timeout={600}>
          <Card
            variant="outlined"
            sx={{
              mb: 2,
              borderColor: "secondary.main",
              bgcolor: "secondary.main",
              color: "secondary.contrastText",
            }}
          >
            <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.75 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                  <CasinoIcon sx={{ fontSize: { xs: 24, sm: 30 } }} />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      fontSize: { xs: "1rem", sm: "1.25rem" },
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {game.name}
                  </Typography>
                </Stack>
                <Tooltip title="Volver al inicio">
                  <IconButton onClick={() => router.push("/")} size="small" sx={{ color: "secondary.contrastText" }}>
                    <HomeIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap alignItems="center">
                <Chip label={statusInfo.label} color={statusInfo.color} size="small" sx={{ px: 0.75 }} />
                <Chip
                  label={`Ronda ${game.round}`}
                  size="small"
                  variant="outlined"
                  sx={{ px: 0.75, borderColor: "rgba(255,255,255,0.5)", color: "inherit" }}
                />
                <Chip
                  icon={<CategoryIcon sx={{ fontSize: 14, color: "inherit" }} />}
                  label={GAME_TYPE_LABELS[game.type] || game.type}
                  size="small"
                  variant="outlined"
                  sx={{ px: 0.75, borderColor: "rgba(255,255,255,0.5)", color: "inherit", "& .MuiChip-icon": { color: "inherit" } }}
                />
                <Chip
                  icon={<PersonIcon sx={{ fontSize: 14, color: "inherit" }} />}
                  label={player.name}
                  size="small"
                  variant="outlined"
                  sx={{ px: 0.75, borderColor: "rgba(255,255,255,0.5)", color: "inherit", "& .MuiChip-icon": { color: "inherit" } }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Alerta de bingo falso */}
        <Collapse in={bingoResult === "invalid"}>
          <Alert severity="error" icon={<CancelIcon />} sx={{ mb: 2 }} onClose={() => setBingoResult(null)}>
            ¡Bingo falso! No cumples la condición de victoria
          </Alert>
        </Collapse>

        {/* Estado: Esperando que inicie */}
        {game.status === "waiting" && (
          <Grow in timeout={500}>
            <Card variant="outlined" sx={{ mb: 2 }}>
              <CardContent>
                <Stack alignItems="center" spacing={2} sx={{ py: 3 }}>
                  <HourglassEmptyIcon
                    sx={{
                      fontSize: 48,
                      color: "warning.main",
                      animation: `${hourglassFlip} 2.5s ease-in-out infinite`,
                    }}
                  />
                  <Typography variant="h6" align="center">
                    Esperando que el administrador inicie la partida...
                  </Typography>
                  <Chip
                    icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                    label={GAME_TYPE_LABELS[game.type] || game.type}
                    color="warning"
                    size="small"
                    sx={{ px: 0.75 }}
                  />
                  <Typography variant="body2" color="text.secondary" align="center">
                    Mientras tanto, revisa tu cartón abajo
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          </Grow>
        )}

        {/* Última balota + Botón Bingo (solo en juego) */}
        {isPlaying && (
          <Fade in timeout={400}>
            <Card
              variant="outlined"
              sx={{
                mb: 2,
                // borderColor: "primary.main",
                transition: "box-shadow 0.3s",
                "&:hover": { boxShadow: 4 },
              }}
            >
              <CardContent>
                <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                  {/* Última balota */}
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ flex: 1 }}>
                    {lastNumber !== null ? (
                      <Zoom in key={lastNumber}>
                        <Paper
                          elevation={4}
                          sx={{
                            width: 64,
                            height: 64,
                            borderRadius: "50%",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: getColumnColor(lastNumber),
                            color: "white",
                            flexShrink: 0,
                            animation: `${dropIn} 0.5s ease-out`,
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: "bold", fontSize: "0.7rem", lineHeight: 1 }}>
                            {getColumnLetter(lastNumber)}
                          </Typography>
                          <Typography variant="h5" sx={{ fontWeight: "bold", lineHeight: 1 }}>
                            {lastNumber}
                          </Typography>
                        </Paper>
                      </Zoom>
                    ) : (
                      <Paper
                        elevation={1}
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: "action.hover",
                          flexShrink: 0,
                        }}
                      >
                        <RadioButtonCheckedIcon color="disabled" />
                      </Paper>
                    )}
                    <Stack>
                      <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                        {lastNumber !== null ? "Última balota" : "Sin balotas aún"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {game.calledNumbers.length} de 75 cantadas
                      </Typography>
                    </Stack>
                  </Stack>

                  {/* Botón Bingo */}
                  <Button
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={handleBingo}
                    disabled={callingBingo || player.markedNumbers.length === 0}
                    sx={{
                      minWidth: 100,
                      py: 1.5,
                      fontWeight: "bold",
                      fontSize: "1.1rem",
                      borderRadius: 3,
                      transition: "transform 0.2s",
                      "&:hover:not(:disabled)": { transform: "scale(1.05)" },
                    }}
                  >
                    {callingBingo ? <CircularProgress size={24} color="inherit" /> : "¡BINGO!"}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Ganador */}
        {game.status === "finished" && winnerInfo && (
          <Grow in timeout={500}>
            <Card
              variant="outlined"
              sx={{
                mb: 2,
                borderColor: "warning.main",
                overflow: "visible",
              }}
            >
              <CardContent>
                <Stack alignItems="center" spacing={1} sx={{ py: 1 }}>
                  <EmojiEventsIcon
                    sx={{
                      fontSize: 48,
                      color: "warning.main",
                      animation: `${celebrate} 1s ease-in-out infinite`,
                    }}
                  />
                  <Typography variant="h6" align="center">
                    {winnerInfo.playerName === player.name
                      ? "🎉 ¡Felicidades, GANASTE! 🎉"
                      : `${winnerInfo.playerName} ganó la ronda`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ronda {winnerInfo.round} finalizada
                  </Typography>
                  {winnerInfo.playerName === player.name && (
                    <CelebrationIcon
                      sx={{
                        fontSize: 32,
                        color: "success.main",
                        animation: `${celebrate} 0.8s ease-in-out infinite`,
                        animationDelay: "0.2s",
                      }}
                    />
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grow>
        )}

        {/* Cartón de bingo */}
        <Grow in timeout={600} style={{ transitionDelay: "150ms" }}>
          <Card
            variant="outlined"
            sx={{
              transition: "box-shadow 0.3s",
              "&:hover": { boxShadow: 4 },
            }}
          >
            <CardContent sx={{ px: { xs: 1.5, sm: 3 }, py: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <GridViewIcon color="primary" />
                <Typography variant="h6">Mi cartón</Typography>
              </Stack>

              {/* Header B-I-N-G-O */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: { xs: 0.5, sm: 1 },
                  mb: { xs: 0.5, sm: 1 },
                }}
              >
                {BINGO_LETTERS.map((letter, i) => (
                  <Box
                    key={letter}
                    sx={{
                      textAlign: "center",
                      py: 0.75,
                      borderRadius: 1,
                      bgcolor: BINGO_COLUMN_COLORS[i],
                      color: "white",
                      fontWeight: "bold",
                      fontSize: { xs: "1rem", sm: "1.2rem" },
                    }}
                  >
                    {letter}
                  </Box>
                ))}
              </Box>

              {/* Celdas del cartón (5 filas x 5 columnas) */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: { xs: 0.5, sm: 1 },
                }}
              >
                {player.card.map((row, rowIdx) =>
                  row.map((num, colIdx) => {
                    const isFree = num === 0;
                    const isCalled = isFree || game.calledNumbers.includes(num);
                    const isMarked = isFree || player.markedNumbers.includes(num);
                    const canMark = isPlaying && isCalled && !isMarked && !isFree;

                    return (
                      <Box
                        key={`${rowIdx}-${colIdx}`}
                        onClick={() => canMark && handleMark(num)}
                        sx={{
                          aspectRatio: "1",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: 1.5,
                          fontSize: { xs: "0.95rem", sm: "1.15rem" },
                          fontWeight: "bold",
                          cursor: canMark ? "pointer" : "default",
                          userSelect: "none",
                          position: "relative",
                          transition: "all 0.2s ease",
                          // Celda libre (centro)
                          ...(isFree && {
                            bgcolor: "warning.main",
                            color: "warning.contrastText",
                          }),
                          // Marcado por el jugador
                          ...(!isFree && isMarked && {
                            bgcolor: BINGO_COLUMN_COLORS[colIdx],
                            color: "white",
                            animation: `${popIn} 0.3s ease-out`,
                          }),
                          // Cantado pero no marcado
                          ...(!isFree && !isMarked && isCalled && {
                            bgcolor: "action.selected",
                            color: "text.primary",
                            border: "2px solid",
                            borderColor: BINGO_COLUMN_COLORS[colIdx],
                            "&:hover": isPlaying
                              ? { transform: "scale(1.08)", boxShadow: 3 }
                              : {},
                          }),
                          // No cantado aún
                          ...(!isFree && !isCalled && {
                            bgcolor: "action.hover",
                            color: "text.secondary",
                          }),
                        }}
                      >
                        {isFree ? "★" : num}
                        {/* Indicador de marcado */}
                        {isMarked && !isFree && (
                          <CheckCircleIcon
                            sx={{
                              position: "absolute",
                              bottom: 1,
                              right: 1,
                              fontSize: { xs: 10, sm: 12 },
                              color: "rgba(255,255,255,0.7)",
                            }}
                          />
                        )}
                      </Box>
                    );
                  })
                )}
              </Box>

              {/* Leyenda */}
              <Stack
                direction="row"
                spacing={{ xs: 1, sm: 2 }}
                justifyContent="center"
                sx={{ mt: 2 }}
                flexWrap="wrap"
                useFlexGap
              >
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "primary.main" }} />
                  <Typography variant="caption" color="text.secondary">Marcado</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid", borderColor: "primary.main", bgcolor: "action.selected" }} />
                  <Typography variant="caption" color="text.secondary">Cantado</Typography>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: "50%", bgcolor: "action.hover" }} />
                  <Typography variant="caption" color="text.secondary">Sin cantar</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grow>

        {/* Footer */}
        <Fade in timeout={1000} style={{ transitionDelay: "400ms" }}>
          <Typography variant="caption" align="center" color="text.disabled" sx={{ mt: 3, display: "block" }}>
            BingUp v0.1.0 — ¡Buena suerte! 🍀
          </Typography>
        </Fade>
      </Box>
    </Container>
  );
}
