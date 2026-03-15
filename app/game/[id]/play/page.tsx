"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  Snackbar,
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
import StopCircleIcon from "@mui/icons-material/StopCircle";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import RefreshIcon from "@mui/icons-material/Refresh";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import AutorenewIcon from "@mui/icons-material/Autorenew";
import VolumeUpIcon from "@mui/icons-material/VolumeUp";
import VolumeOffIcon from "@mui/icons-material/VolumeOff";
import { useSocket } from "@/app/hooks/useSocket";
import { useSoundEffects } from "@/app/hooks/useSoundEffects";
import { useSoundContext } from "@/app/contexts/SoundContext";

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

const shuffleCard = keyframes`
  0% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
  50% { transform: perspective(600px) rotateY(90deg); opacity: 0.5; }
  100% { transform: perspective(600px) rotateY(0deg); opacity: 1; }
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

// Notificación de jugador (unión/desconexión)
interface PlayerNotification {
  id: string;
  message: string;
  type: "join" | "leave" | "reconnect";
}

export default function PlayPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { socket, isConnected, isReconnecting, reconnectFailed, manualReconnect } = useSocket();
  const { soundEnabled, toggleSound } = useSoundContext();
  const sounds = useSoundEffects();

  // Ref para los sonidos (para usar dentro de useEffect sin dependencias)
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  const [game, setGame] = useState<GameData | null>(null);
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [bingoResult, setBingoResult] = useState<"valid" | "invalid" | null>(null);
  const [callingBingo, setCallingBingo] = useState(false);
  const [winnerInfo, setWinnerInfo] = useState<{ playerName: string; round: number } | null>(null);
  const [changingCard, setChangingCard] = useState(false);
  const [cardAnimating, setCardAnimating] = useState(false);

  // Notificaciones de jugadores
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]);
  const playersRef = useRef<{ _id: string; name: string; online: boolean }[]>([]);
  const isInitialLoadRef = useRef(true); // Ignorar primera carga de jugadores
  const playerIdRef = useRef<string | null>(null); // Para saber qué notificaciones ignorar
  const playerNameRef = useRef<string | null>(null); // Para comparar en onWinner

  const getToken = useCallback(() => localStorage.getItem(`player:${gameId}`) || "", [gameId]);

  // Notificar al servidor cuando el jugador sale de la página
  useEffect(() => {
    const token = getToken();
    return () => {
      if (socket && gameId && token) {
        socket.emit("game:leave", { gameId, token });
      }
    };
  }, [socket, gameId, getToken]);

  // Re-emitir reconexión cuando el socket se reconecta
  useEffect(() => {
    if (isConnected && socket && gameId && !loading) {
      const token = getToken();
      if (token) {
        socket.emit("game:reconnect-player", { gameId, token });
      }
    }
  }, [isConnected, socket, gameId, loading, getToken]);

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

    // Manejar cambios en la lista de jugadores (notificaciones)
    const onPlayers = (players: { _id: string; name: string; online: boolean }[]) => {
      const prevPlayers = playersRef.current;

      // Ignorar la primera carga (estado inicial)
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        playersRef.current = players;
        return;
      }

      const newNotifications: PlayerNotification[] = [];

      // Detectar nuevos jugadores o cambios de estado
      for (const p of players) {
        // Ignorar notificaciones sobre uno mismo
        if (p._id === playerIdRef.current) continue;

        const prev = prevPlayers.find((pp) => pp._id === p._id);
        if (!prev) {
          // Jugador nuevo
          newNotifications.push({
            id: `${p._id}-join-${Date.now()}`,
            message: `${p.name} se unió a la partida`,
            type: "join",
          });
        } else if (!prev.online && p.online) {
          // Jugador reconectado
          newNotifications.push({
            id: `${p._id}-reconnect-${Date.now()}`,
            message: `${p.name} se reconectó`,
            type: "reconnect",
          });
        } else if (prev.online && !p.online) {
          // Jugador desconectado
          newNotifications.push({
            id: `${p._id}-leave-${Date.now()}`,
            message: `${p.name} se desconectó`,
            type: "leave",
          });
        }
      }

      // Actualizar referencia
      playersRef.current = players;

      // Agregar notificaciones (máximo 3 visibles a la vez)
      if (newNotifications.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifications].slice(-3));
        // Reproducir sonido según el tipo de la primera notificación
        const firstType = newNotifications[0].type;
        if (firstType === "join" || firstType === "reconnect") {
          soundsRef.current.playPlayerJoin();
        } else if (firstType === "leave") {
          soundsRef.current.playPlayerLeave();
        }
      }
    };

    const onReconnected = (data: { role: string; game: GameData; player: PlayerData }) => {
      if (data.role === "player") {
        setGame(data.game);
        setPlayer(data.player);
        playerIdRef.current = data.player._id; // Guardar ID para filtrar notificaciones
        playerNameRef.current = data.player.name; // Guardar nombre para comparar en onWinner
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
      setCallingBingo(false);
      soundsRef.current.playGameStart();
    };

    const onNumber = (data: { number: number; calledNumbers: number[] }) => {
      setLastNumber(data.number);
      setGame((prev) => (prev ? { ...prev, calledNumbers: data.calledNumbers } : prev));
      soundsRef.current.playBallCalled();
    };

    const onWinner = (data: { playerName: string; round: number }) => {
      setGame((prev) => (prev ? { ...prev, status: "finished" } : prev));
      setWinnerInfo(data);
      setCallingBingo(false);
      // Reproducir sonido según si el jugador actual ganó o no
      if (data.playerName === playerNameRef.current) {
        soundsRef.current.playBingoWin();
      } else {
        soundsRef.current.playBingoCalled();
      }
    };

    const onBingoInvalid = () => {
      setBingoResult("invalid");
      setCallingBingo(false);
      soundsRef.current.playBingoFalse();
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
      setCallingBingo(false);
      // Buscar los datos actualizados de este jugador
      const me = data.players.find((p) => p._id === player?._id);
      if (me) {
        setPlayer(me);
      }
    };

    const onFinished = (data: { game: GameData }) => {
      setGame(data.game);
      setCallingBingo(false);
      soundsRef.current.playGameEnd();
    };

    const onCardChanged = (data: { card: number[][] }) => {
      // Activar animación
      setCardAnimating(true);
      soundsRef.current.playCardShuffle();
      // Actualizar cartón después de que inicie la animación
      setTimeout(() => {
        setPlayer((prev) => prev ? { ...prev, card: data.card, markedNumbers: [] } : prev);
        setChangingCard(false);
        // Desactivar animación al terminar
        setTimeout(() => setCardAnimating(false), 300);
      }, 250);
    };

    const onError = (msg: string) => {
      if (loading) {
        setError(msg);
        setLoading(false);
      }
      setCallingBingo(false);
      setChangingCard(false);
    };

    socket.on("game:reconnected", onReconnected);
    socket.on("game:started", onStarted);
    socket.on("game:number", onNumber);
    socket.on("game:winner", onWinner);
    socket.on("game:bingo-invalid", onBingoInvalid);
    socket.on("game:bingo-attempt", onBingoAttempt);
    socket.on("game:restarted", onRestarted);
    socket.on("game:finished", onFinished);
    socket.on("game:card-changed", onCardChanged);
    socket.on("game:players", onPlayers);
    socket.on("error", onError);

    return () => {
      socket.off("game:reconnected", onReconnected);
      socket.off("game:started", onStarted);
      socket.off("game:number", onNumber);
      socket.off("game:winner", onWinner);
      socket.off("game:bingo-invalid", onBingoInvalid);
      socket.off("game:bingo-attempt", onBingoAttempt);
      socket.off("game:restarted", onRestarted);
      socket.off("game:finished", onFinished);
      socket.off("game:card-changed", onCardChanged);
      socket.off("game:players", onPlayers);
      socket.off("error", onError);
    };
  }, [socket, gameId, getToken, loading, player?._id, player?.name]);

  const handleMark = (num: number) => {
    if (!socket || !game || game.status !== "playing" || num === 0) return;
    if (!game.calledNumbers.includes(num)) return;
    if (player?.markedNumbers.includes(num)) return;

    socket.emit("game:mark", { gameId, number: num, token: getToken() });
    sounds.playMark();
    // Actualizar localmente para feedback inmediato
    setPlayer((prev) =>
      prev ? { ...prev, markedNumbers: [...prev.markedNumbers, num] } : prev
    );
  };

  const handleBingo = () => {
    if (!socket || callingBingo) return;
    setCallingBingo(true);
    sounds.playClick();
    socket.emit("game:bingo", { gameId, token: getToken() });
  };

  const handleChangeCard = () => {
    if (!socket || changingCard || game?.status !== "waiting") return;
    setChangingCard(true);
    socket.emit("game:change-card", { gameId, token: getToken() });
  };

  // Cerrar notificación de jugador
  const handleCloseNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
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
                  <Tooltip title="Volver al inicio">
                    <IconButton onClick={() => router.push("/")} size="small" sx={{ color: "secondary.contrastText" }}>
                      <HomeIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Tooltip title={soundEnabled ? "Silenciar sonidos" : "Activar sonidos"}>
                    <IconButton
                      onClick={toggleSound}
                      size="small"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: "white",
                        color: soundEnabled ? "primary.main" : "text.disabled",
                        "&:hover": { bgcolor: "grey.100" },
                      }}
                    >
                      {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={isConnected ? "Conectado" : isReconnecting ? "Reconectando..." : "Desconectado"}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        bgcolor: "white",
                        color: isConnected ? "success.main" : isReconnecting ? "warning.main" : "error.main",
                      }}
                    >
                      {isConnected ? (
                        <WifiIcon fontSize="small" />
                      ) : isReconnecting ? (
                        <RefreshIcon fontSize="small" sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} />
                      ) : (
                        <WifiOffIcon fontSize="small" />
                      )}
                    </Box>
                  </Tooltip>
                </Stack>
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

        {/* Alerta de desconexión */}
        <Collapse in={!isConnected && !loading}>
          <Alert
            severity={isReconnecting ? "warning" : "error"}
            icon={isReconnecting ? <RefreshIcon sx={{ animation: "spin 1s linear infinite", "@keyframes spin": { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } } }} /> : <WifiOffIcon />}
            action={
              reconnectFailed && !isReconnecting ? (
                <Button
                  color="inherit"
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={manualReconnect}
                >
                  Reintentar
                </Button>
              ) : null
            }
            sx={{ mb: 2 }}
          >
            {isReconnecting
              ? "Reconectando al servidor..."
              : reconnectFailed
                ? "No se pudo reconectar. Haz clic en Reintentar."
                : "Conexión perdida con el servidor"}
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
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={changingCard ? <CircularProgress size={18} color="inherit" /> : <AutorenewIcon />}
                    onClick={handleChangeCard}
                    disabled={changingCard}
                    sx={{ mt: 1 }}
                  >
                    {changingCard ? "Cambiando..." : "Cambiar cartón"}
                  </Button>
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

        {/* Partida finalizada por el admin (sin ganador) */}
        {game.status === "finished" && !winnerInfo && (
          <Grow in timeout={500}>
            <Card
              variant="outlined"
              sx={{ mb: 2, borderColor: "error.main" }}
            >
              <CardContent>
                <Stack alignItems="center" spacing={1} sx={{ py: 1 }}>
                  <StopCircleIcon sx={{ fontSize: 48, color: "error.main" }} />
                  <Typography variant="h6" align="center">
                    El administrador finalizó la partida
                  </Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Ronda {game.round} terminada sin ganador
                  </Typography>
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
                  animation: cardAnimating ? `${shuffleCard} 0.5s ease-in-out` : "none",
                  transformStyle: "preserve-3d",
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

      {/* Notificaciones de jugadores (Snackbars apilados) */}
      {notifications.map((notif, index) => (
        <Snackbar
          key={notif.id}
          open
          autoHideDuration={3000}
          onClose={() => handleCloseNotification(notif.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          sx={{ bottom: { xs: 24 + index * 56, sm: 24 + index * 64 } }}
        >
          <Alert
            onClose={() => handleCloseNotification(notif.id)}
            severity={notif.type === "leave" ? "warning" : "success"}
            icon={
              notif.type === "join" ? (
                <PersonAddIcon fontSize="small" />
              ) : notif.type === "leave" ? (
                <PersonOffIcon fontSize="small" />
              ) : (
                <PersonIcon fontSize="small" />
              )
            }
            sx={{ width: "100%", boxShadow: 3 }}
          >
            {notif.message}
          </Alert>
        </Snackbar>
      ))}
    </Container>
  );
}
