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
} from "@mui/material";
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
import { useSocket } from "./hooks/useSocket";

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

  const fetchGames = useCallback(() => {
    if (!socket) return;
    setLoadingGames(true);
    socket.emit("game:list-waiting");
    socket.once("game:list-waiting", (games: AvailableGame[]) => {
      setAvailableGames(games);
      setLoadingGames(false);
    });
  }, [socket]);

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

  const selectGame = (gameId: string) => {
    setGameCode(gameId);
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
        <Stack spacing={1} alignItems="center" sx={{ mb: 5 }}>
          <CasinoIcon sx={{ fontSize: 56, color: "primary.main" }} />
          <Typography variant="h3" component="h1" align="center" color="primary.main">
            BingUp
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary">
            Crea o únete a una partida de Bingo en tiempo real
          </Typography>
        </Stack>

        <Stack spacing={3}>
          {/* Card: Crear partida */}
          <Card variant="outlined" sx={{ borderColor: "primary.dark" }}>
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
                  }}
                  inputProps={{ maxLength: 100 }}
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
              >
                {creating ? "Creando..." : "Crear partida"}
              </Button>
            </CardActions>
          </Card>

          {/* Separador */}
          <Divider>
            <Typography variant="body2" color="text.secondary">
              o
            </Typography>
          </Divider>

          {/* Card: Unirse a partida */}
          <Card variant="outlined" sx={{ borderColor: "secondary.dark" }}>
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
                      {loadingGames ? "Cargando..." : "No hay partidas en espera"}
                    </Typography>
                  ) : (
                    <List disablePadding sx={{ maxHeight: 200, overflow: "auto" }}>
                      {availableGames.map((g) => (
                        <ListItem
                          key={g._id}
                          disablePadding
                          secondaryAction={
                            <Chip
                              icon={<GroupIcon sx={{ fontSize: 16 }} />}
                              label={g.playerCount}
                              size="small"
                              variant="outlined"
                              sx={{ pl: 0.5, "& .MuiChip-icon": { ml: 0.5 } }}
                            />
                          }
                        >
                          <ListItemButton
                            selected={gameCode === g._id}
                            onClick={() => selectGame(g._id)}
                            sx={{ borderRadius: 1 }}
                          >
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              <CasinoIcon fontSize="small" color="primary" />
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
                  }}
                  inputProps={{ maxLength: 50 }}
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
              >
                {joining ? "Uniéndose..." : "Unirse"}
              </Button>
            </CardActions>
          </Card>
        </Stack>

        {/* Footer */}
        <Typography variant="caption" align="center" color="text.disabled" sx={{ mt: 4 }}>
          BingUp v0.1.0 — Juego de Bingo en tiempo real
        </Typography>
      </Box>
    </Container>
  );
}
