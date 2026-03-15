"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  TextField,
  Button,
  MenuItem,
  Stack,
  Divider,
  Alert,
  Collapse,
  InputAdornment,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  Grow,
  Fade,
  Zoom,
} from "@mui/material";
import { keyframes } from "@mui/material/styles";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import LoginIcon from "@mui/icons-material/Login";
import CasinoIcon from "@mui/icons-material/Casino";
import SportsEsportsIcon from "@mui/icons-material/SportsEsports";
import TagIcon from "@mui/icons-material/Tag";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutline";
import CategoryIcon from "@mui/icons-material/Category";
import GroupIcon from "@mui/icons-material/Group";
import RefreshIcon from "@mui/icons-material/Refresh";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import PlayCircleIcon from "@mui/icons-material/PlayCircle";
import { useSocket } from "./hooks/useSocket";

// Animaciones
const bounce = keyframes`
  0%, 100% { transform: translateY(0); }
  25% { transform: translateY(-8px) rotate(-5deg); }
  50% { transform: translateY(0) rotate(0deg); }
  75% { transform: translateY(-4px) rotate(5deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(0.95); }
  50% { transform: scale(1); }
`;

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`;

const GAME_TYPES = [
  { value: "linea_horizontal", label: "Línea horizontal" },
  { value: "linea_vertical", label: "Línea vertical" },
  { value: "diagonal", label: "Diagonal" },
  { value: "4_esquinas", label: "4 Esquinas" },
  { value: "marco_completo", label: "Marco completo" },
  { value: "carton_lleno", label: "Cartón lleno" },
];

const GAME_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  GAME_TYPES.map((t) => [t.value, t.label])
);

interface AvailableGame {
  _id: string;
  name: string;
  type: string;
  status: string;
  playerCount: number;
  isAdmin?: boolean;
  isPlayer?: boolean;
}

export default function Home() {
  const router = useRouter();
  const { socket } = useSocket();

  // Estado para crear partida
  const [gameName, setGameName] = useState("");
  const [gameType, setGameType] = useState("");
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Estado para unirse a partida
  const [gameCode, setGameCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);

  // Recuperar nombre del jugador guardado en localStorage
  useEffect(() => {
    const saved = localStorage.getItem("playerName");
    if (saved) setPlayerName(saved);
  }, []);

  // Lista de partidas disponibles
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([]);
  const [loadingGames, setLoadingGames] = useState(false);

  // Recolectar tokens de localStorage para identificar partidas del usuario
  const getStoredTokens = useCallback(() => {
    const tokens: { admin: Record<string, string>; player: Record<string, string> } = {
      admin: {},
      player: {},
    };
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key.startsWith("admin:")) {
        const gameId = key.replace("admin:", "");
        tokens.admin[gameId] = localStorage.getItem(key) || "";
      } else if (key.startsWith("player:")) {
        const gameId = key.replace("player:", "");
        tokens.player[gameId] = localStorage.getItem(key) || "";
      }
    }
    return tokens;
  }, []);

  const fetchGames = useCallback(() => {
    if (!socket) return;
    setLoadingGames(true);
    const tokens = getStoredTokens();
    socket.emit("game:list-waiting", { tokens });
    socket.once("game:list-waiting", (games: AvailableGame[]) => {
      setAvailableGames(games);
      setLoadingGames(false);
    });
  }, [socket, getStoredTokens]);

  // Cargar partidas al montar y cuando el socket se conecta
  useEffect(() => {
    if (!socket) return;

    fetchGames();

    // Actualizar lista cuando se crea una nueva partida
    socket.on("game:new", () => fetchGames());

    return () => {
      socket.off("game:new");
    };
  }, [socket, fetchGames]);

  const selectGame = (game: AvailableGame) => {
    // Si es admin, ir directo al panel de admin
    if (game.isAdmin) {
      router.push(`/game/${game._id}/admin`);
      return;
    }
    // Si es jugador de una partida en curso, ir directo a jugar
    if (game.isPlayer && game.status === "playing") {
      router.push(`/game/${game._id}/play`);
      return;
    }
    // Si no, solo seleccionar el código para unirse
    setGameCode(game._id);
  };

  const handleCreate = () => {
    setCreateError("");
    if (!gameName.trim()) {
      setCreateError("Ingresa un nombre para la partida");
      return;
    }
    if (!gameType) {
      setCreateError("Selecciona un tipo de juego");
      return;
    }
    if (!socket) {
      setCreateError("Sin conexión al servidor");
      return;
    }

    setCreating(true);

    socket.emit("game:create", { name: gameName.trim(), type: gameType });

    socket.once("game:created", (data: { _id: string; adminToken: string }) => {
      // Guardar token del admin en localStorage
      localStorage.setItem(`admin:${data._id}`, data.adminToken);
      router.push(`/game/${data._id}/admin`);
    });

    socket.once("error", (msg: string) => {
      setCreateError(msg);
      setCreating(false);
    });
  };

  const handleJoin = () => {
    setJoinError("");
    if (!gameCode.trim()) {
      setJoinError("Ingresa el código de la partida");
      return;
    }
    if (!playerName.trim()) {
      setJoinError("Ingresa tu nombre");
      return;
    }
    if (!socket) {
      setJoinError("Sin conexión al servidor");
      return;
    }

    const gameId = gameCode.trim();

    // Guardar nombre del jugador en localStorage
    localStorage.setItem("playerName", playerName.trim());

    // Si ya tiene token de admin para esta partida, ir al panel de admin
    const adminToken = localStorage.getItem(`admin:${gameId}`);
    if (adminToken) {
      router.push(`/game/${gameId}/admin`);
      return;
    }

    // Si ya tiene token de jugador para esta partida, reconectar en vez de crear nuevo
    const existingToken = localStorage.getItem(`player:${gameId}`);
    if (existingToken) {
      router.push(`/game/${gameId}/play`);
      return;
    }

    setJoining(true);

    socket.emit("game:join", { gameId, playerName: playerName.trim() });

    socket.once("game:joined", (data: { game: { _id: string }; token: string }) => {
      // Guardar token del jugador en localStorage
      localStorage.setItem(`player:${data.game._id}`, data.token);
      router.push(`/game/${data.game._id}/play`);
    });

    socket.once("error", (msg: string) => {
      setJoinError(msg);
      setJoining(false);
    });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          py: 4,
        }}
      >
        {/* Header */}
        <Fade in timeout={800}>
          <Stack spacing={1} alignItems="center" sx={{ mb: 5 }}>
            <CasinoIcon
              sx={{
                fontSize: 56,
                color: "primary.main",
                animation: `${bounce} 2s ease-in-out infinite`,
              }}
            />
            <Typography
              variant="h3"
              component="h1"
              align="center"
              color="primary.main"
              sx={{ fontWeight: "bold" }}
            >
              BingUp
            </Typography>
            <Typography variant="body1" align="center" color="text.secondary">
              Crea o únete a una partida de Bingo en tiempo real
            </Typography>
          </Stack>
        </Fade>

        <Stack spacing={3}>
          {/* Card: Crear partida */}
          <Grow in timeout={600} style={{ transformOrigin: "center top" }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: "primary.dark",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <SportsEsportsIcon color="primary" />
                <Typography variant="h6">Crear nueva partida</Typography>
              </Stack>

              <Stack spacing={2}>
                <TextField
                  label="Nombre de la partida"
                  placeholder="Ej: Bingo del viernes"
                  fullWidth
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <DriveFileRenameOutlineIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { maxLength: 100 },
                  }}
                />

                <TextField
                  select
                  label="Tipo de juego"
                  fullWidth
                  value={gameType}
                  onChange={(e) => setGameType(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CategoryIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                >
                  {GAME_TYPES.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>

                <Collapse in={!!createError}>
                  <Alert severity="warning" onClose={() => setCreateError("")}>
                    {createError}
                  </Alert>
                </Collapse>
              </Stack>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={creating ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
                onClick={handleCreate}
                disabled={creating}
                sx={{
                  // animation: !creating ? `${pulse} 3s ease-in-out infinite` : "none",
                  // "&:hover": { animation: "none" },
                }}
              >
                {creating ? "Creando..." : "Crear partida"}
              </Button>
            </CardActions>
          </Card>
          </Grow>

          {/* Separador */}
          <Zoom in timeout={800} style={{ transitionDelay: "300ms" }}>
            <Divider>
            <Typography variant="body2" color="text.secondary">
              o
            </Typography>
          </Divider>
          </Zoom>

          {/* Card: Unirse a partida */}
          <Grow in timeout={600} style={{ transformOrigin: "center top", transitionDelay: "200ms" }}>
            <Card
              variant="outlined"
              sx={{
                borderColor: "secondary.dark",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: 6,
                },
              }}
            >
            <CardContent>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                <LoginIcon color="secondary" />
                <Typography variant="h6">Unirse a una partida</Typography>
              </Stack>

              <Stack spacing={2}>
                {/* Lista de partidas disponibles */}
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Partidas disponibles
                    </Typography>
                    <Button
                      size="small"
                      startIcon={loadingGames ? <CircularProgress size={14} /> : <RefreshIcon />}
                      onClick={fetchGames}
                      disabled={loadingGames}
                    >
                      Actualizar
                    </Button>
                  </Stack>

                  {availableGames.length === 0 ? (
                    <Typography variant="body2" color="text.disabled" sx={{ py: 1 }}>
                      {loadingGames ? "Cargando..." : "No hay partidas disponibles"}
                    </Typography>
                  ) : (
                    <List disablePadding sx={{ maxHeight: 200, overflow: "auto" }}>
                      {availableGames.map((g) => (
                        <ListItem
                          key={g._id}
                          disablePadding
                          secondaryAction={
                            <Stack direction="row" spacing={0.5} alignItems="center">
                              {g.status === "playing" && (
                                <Chip
                                  label="En curso"
                                  size="small"
                                  color="success"
                                  sx={{ fontSize: "0.7rem", height: 20, px: 0.5 }}
                                />
                              )}
                              {g.isAdmin && (
                                <Chip
                                  icon={<AdminPanelSettingsIcon sx={{ fontSize: 14 }} />}
                                  label="Admin"
                                  size="small"
                                  color="primary"
                                  sx={{ fontSize: "0.7rem", height: 20, px: 0.5, "& .MuiChip-icon": { ml: 0.5 } }}
                                />
                              )}
                              {g.isPlayer && (
                                <Chip
                                  icon={<PersonOutlineIcon sx={{ fontSize: 14 }} />}
                                  label="Jugador"
                                  size="small"
                                  color="secondary"
                                  sx={{ fontSize: "0.7rem", height: 20, px: 0.5, "& .MuiChip-icon": { ml: 0.5 } }}
                                />
                              )}
                              {!g.isAdmin && !g.isPlayer && (
                                <Chip
                                  icon={<GroupIcon sx={{ fontSize: 16 }} />}
                                  label={g.playerCount}
                                  size="small"
                                  variant="outlined"
                                  sx={{ px: 0.5, "& .MuiChip-icon": { ml: 0.5 } }}
                                />
                              )}
                            </Stack>
                          }
                        >
                          <ListItemButton
                            selected={gameCode === g._id}
                            onClick={() => selectGame(g)}
                            sx={{
                              borderRadius: 1,
                              transition: "transform 0.15s, background-color 0.2s",
                              "&:hover": { transform: "scale(0.99)" },
                            }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {g.status === "playing" ? (
                                <PlayCircleIcon fontSize="small" color="success" />
                              ) : (
                                <CasinoIcon fontSize="small" color="primary" />
                              )}
                            </ListItemIcon>
                            <ListItemText
                              primary={g.name}
                              secondary={GAME_TYPE_LABELS[g.type] || g.type}
                            />
                          </ListItemButton>
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>

                <Divider />

                <TextField
                  label="Código de partida"
                  placeholder="Ingresa el código de la sala"
                  fullWidth
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <TagIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <TextField
                  label="Tu nombre"
                  placeholder="¿Cómo te llamas?"
                  fullWidth
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonOutlineIcon fontSize="small" color="action" />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: { maxLength: 50 },
                  }}
                />

                <Collapse in={!!joinError}>
                  <Alert severity="warning" onClose={() => setJoinError("")}>
                    {joinError}
                  </Alert>
                </Collapse>
              </Stack>
            </CardContent>

            <CardActions sx={{ px: 2, pb: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                fullWidth
                startIcon={joining ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                onClick={handleJoin}
                disabled={joining}
                sx={{
                  // animation: !joining ? `${pulse} 3s ease-in-out 1.5s infinite` : "none",
                  // "&:hover": { animation: "none" },
                }}
              >
                {joining ? "Uniéndose..." : "Unirse"}
              </Button>
            </CardActions>
          </Card>
          </Grow>
        </Stack>

        {/* Footer */}
        <Fade in timeout={1000} style={{ transitionDelay: "500ms" }}>
          <Typography variant="caption" align="center" color="text.disabled" sx={{ mt: 4 }}>
            BingUp v0.1.0 — Juego de Bingo en tiempo real
          </Typography>
        </Fade>
      </Box>
    </Container>
  );
}
