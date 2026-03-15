'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Divider,
  Alert,
  Collapse,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Zoom,
  Paper,
  Badge,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import CasinoIcon from '@mui/icons-material/Casino';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PersonIcon from '@mui/icons-material/Person';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import TagIcon from '@mui/icons-material/Tag';
import GroupIcon from '@mui/icons-material/Group';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TuneIcon from '@mui/icons-material/Tune';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GridViewIcon from '@mui/icons-material/GridView';
import { useSocket } from '@/app/hooks/useSocket';

// Animaciones
const dropIn = keyframes`
  0% { transform: scale(0) rotate(-180deg); opacity: 0; }
  60% { transform: scale(1.2) rotate(10deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 0 5px rgba(25, 118, 210, 0.3); }
  50% { box-shadow: 0 0 20px rgba(25, 118, 210, 0.6); }
`;

const slideUp = keyframes`
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
`;

const GAME_TYPES = [
  { value: 'linea_horizontal', label: 'Línea horizontal' },
  { value: 'linea_vertical', label: 'Línea vertical' },
  { value: 'diagonal', label: 'Diagonal' },
  { value: '4_esquinas', label: '4 Esquinas' },
  { value: 'marco_completo', label: 'Marco completo' },
  { value: 'carton_lleno', label: 'Cartón lleno' },
];

const GAME_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  GAME_TYPES.map((t) => [t.value, t.label]),
);

const STATUS_MAP: Record<
  string,
  { label: string; color: 'warning' | 'success' | 'info' }
> = {
  waiting: { label: 'En espera', color: 'warning' },
  playing: { label: 'En curso', color: 'success' },
  finished: { label: 'Finalizada', color: 'info' },
};

// Columnas del bingo y sus rangos
const BINGO_COLUMNS = [
  { letter: 'B', min: 1, max: 15, color: '#1565c0' },
  { letter: 'I', min: 16, max: 30, color: '#c62828' },
  { letter: 'N', min: 31, max: 45, color: '#2e7d32' },
  { letter: 'G', min: 46, max: 60, color: '#f57f17' },
  { letter: 'O', min: 61, max: 75, color: '#6a1b9a' },
];

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
  online: boolean;
}

export default function AdminPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { socket } = useSocket();

  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [restartType, setRestartType] = useState('');
  const [showRestart, setShowRestart] = useState(false);
  const [actionError, setActionError] = useState('');
  const [bingoAttempt, setBingoAttempt] = useState<{
    playerName: string;
    valid: boolean;
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [restarting, setRestarting] = useState(false);

  const getToken = useCallback(
    () => localStorage.getItem(`admin:${gameId}`) || '',
    [gameId],
  );

  useEffect(() => {
    if (!socket || !gameId) return;

    const token = getToken();
    if (!token) {
      setError('No tienes permisos de administrador para esta partida');
      setLoading(false);
      return;
    }

    // Reconectar como admin
    socket.emit('game:reconnect-admin', { gameId, token });

    const onReconnected = (data: {
      role: string;
      game: GameData;
      players: PlayerData[];
    }) => {
      if (data.role === 'admin') {
        setGame(data.game);
        setPlayers(data.players);
        setLoading(false);
        // Restaurar último número cantado
        if (data.game.calledNumbers.length > 0) {
          setLastNumber(
            data.game.calledNumbers[data.game.calledNumbers.length - 1],
          );
        }
      }
    };

    const onPlayers = (data: PlayerData[]) => setPlayers(data);

    const onStarted = (gameData: GameData) => {
      setGame(gameData);
      setStarting(false);
    };

    const onNumber = (data: { number: number; calledNumbers: number[] }) => {
      setLastNumber(data.number);
      setDrawing(false);
      setGame((prev) =>
        prev ? { ...prev, calledNumbers: data.calledNumbers } : prev,
      );
    };

    const onWinner = (data: {
      playerName: string;
      round: number;
      winners: GameData['winners'];
    }) => {
      setGame((prev) =>
        prev ? { ...prev, status: 'finished', winners: data.winners } : prev,
      );
    };

    const onBingoAttempt = (data: { playerName: string; valid: boolean }) => {
      setBingoAttempt(data);
      setTimeout(() => setBingoAttempt(null), 4000);
    };

    const onRestarted = (data: { game: GameData; players: PlayerData[] }) => {
      setGame(data.game);
      setPlayers(data.players);
      setLastNumber(null);
      setShowRestart(false);
      setRestartType('');
      setRestarting(false);
    };

    const onError = (msg: string) => {
      setActionError(msg);
      setDrawing(false);
      setStarting(false);
      setRestarting(false);
      if (loading) {
        setError(msg);
        setLoading(false);
      }
    };

    socket.on('game:reconnected', onReconnected);
    socket.on('game:players', onPlayers);
    socket.on('game:started', onStarted);
    socket.on('game:number', onNumber);
    socket.on('game:winner', onWinner);
    socket.on('game:bingo-attempt', onBingoAttempt);
    socket.on('game:restarted', onRestarted);
    socket.on('error', onError);

    return () => {
      socket.off('game:reconnected', onReconnected);
      socket.off('game:players', onPlayers);
      socket.off('game:started', onStarted);
      socket.off('game:number', onNumber);
      socket.off('game:winner', onWinner);
      socket.off('game:bingo-attempt', onBingoAttempt);
      socket.off('game:restarted', onRestarted);
      socket.off('error', onError);
    };
  }, [socket, gameId, getToken, loading]);

  const handleStart = () => {
    if (!socket || starting) return;
    setActionError('');
    setStarting(true);
    socket.emit('game:start', { gameId, token: getToken() });
  };

  const handleDraw = () => {
    if (!socket || drawing) return;
    setActionError('');
    setDrawing(true);
    socket.emit('game:draw', { gameId, token: getToken() });
  };

  const handleRestart = () => {
    if (!socket || !restartType || restarting) return;
    setActionError('');
    setRestarting(true);
    socket.emit('game:restart', {
      gameId,
      token: getToken(),
      type: restartType,
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Obtener la letra de columna para un número
  const getColumnForNumber = (num: number) => {
    return BINGO_COLUMNS.find((c) => num >= c.min && num <= c.max);
  };

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack
            alignItems="center"
            spacing={2}
          >
            <CircularProgress size={48} />
            <Typography color="text.secondary">
              Conectando a la partida...
            </Typography>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Stack
            alignItems="center"
            spacing={2}
          >
            <Alert
              severity="error"
              sx={{ width: '100%' }}
            >
              {error}
            </Alert>
            <Button
              startIcon={<HomeIcon />}
              onClick={() => router.push('/')}
            >
              Volver al inicio
            </Button>
          </Stack>
        </Box>
      </Container>
    );
  }

  if (!game) return null;

  const statusInfo = STATUS_MAP[game.status] || {
    label: game.status,
    color: 'info' as const,
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ minHeight: '100vh', py: 3 }}>
        {/* Header */}
        <Fade
          in
          timeout={600}
        >
          <Card
            variant="outlined"
            sx={{
              mb: 3,
              borderColor: 'primary.main',
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
            }}
          >
            <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 1 }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <CasinoIcon sx={{ fontSize: { xs: 28, sm: 36 } }} />
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 'bold',
                      fontSize: { xs: '1.2rem', sm: '1.5rem' },
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {game.name}
                  </Typography>
                </Stack>
                <Tooltip title="Volver al inicio">
                  <IconButton
                    onClick={() => router.push('/')}
                    size="small"
                    sx={{ color: 'primary.contrastText' }}
                  >
                    <HomeIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
              <Stack
                direction="row"
                spacing={0.75}
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  label={statusInfo.label}
                  color={statusInfo.color}
                  size="small"
                  sx={{ px: 0.75 }}
                />
                <Chip
                  label={`Ronda ${game.round}`}
                  size="small"
                  variant="outlined"
                  sx={{
                    px: 0.75,
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'inherit',
                  }}
                />
                <Chip
                  icon={
                    <CategoryIcon sx={{ fontSize: 14, color: 'inherit' }} />
                  }
                  label={GAME_TYPE_LABELS[game.type] || game.type}
                  size="small"
                  variant="outlined"
                  sx={{
                    px: 0.75,
                    borderColor: 'rgba(255,255,255,0.5)',
                    color: 'inherit',
                    '& .MuiChip-icon': { color: 'inherit' },
                  }}
                />
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Código de sala */}
        <Fade
          in
          timeout={600}
          style={{ transitionDelay: '100ms' }}
        >
          <Card
            variant="outlined"
            sx={{ mb: 3 }}
          >
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                spacing={1}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ minWidth: 0, flex: 1 }}
                >
                  <TagIcon
                    fontSize="small"
                    color="action"
                    sx={{ flexShrink: 0 }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      letterSpacing: 0.5,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {gameId}
                  </Typography>
                </Stack>
                <Tooltip title={copied ? '¡Copiado!' : 'Copiar código'}>
                  <IconButton
                    size="small"
                    onClick={handleCopyCode}
                    color={copied ? 'success' : 'default'}
                    sx={{ flexShrink: 0 }}
                  >
                    {copied ? (
                      <CheckCircleIcon fontSize="small" />
                    ) : (
                      <ContentCopyIcon fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardContent>
          </Card>
        </Fade>

        {/* Alerta de error de acción */}
        <Collapse in={!!actionError}>
          <Alert
            severity="warning"
            onClose={() => setActionError('')}
            sx={{ mb: 2 }}
          >
            {actionError}
          </Alert>
        </Collapse>

        {/* Alerta de intento de bingo */}
        <Collapse in={!!bingoAttempt}>
          <Alert
            severity={bingoAttempt?.valid ? 'success' : 'error'}
            icon={bingoAttempt?.valid ? <CheckCircleIcon /> : <CancelIcon />}
            sx={{ mb: 2 }}
          >
            {bingoAttempt?.valid
              ? `¡${bingoAttempt.playerName} cantó BINGO correctamente!`
              : `${bingoAttempt?.playerName} cantó BINGO falso`}
          </Alert>
        </Collapse>

        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={3}
        >
          {/* Columna izquierda: Controles + Jugadores */}
          <Stack
            spacing={3}
            sx={{ flex: 1, minWidth: 0 }}
          >
            {/* Controles del juego */}
            <Grow
              in
              timeout={500}
            >
              <Card
                variant="outlined"
                sx={{
                  borderColor: 'primary.main',
                  transition: 'box-shadow 0.3s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <TuneIcon color="primary" />
                    <Typography variant="h6">
                      Controles
                    </Typography>
                  </Stack>

                  {/* Estado: Esperando */}
                  {game.status === 'waiting' && (
                    <Stack spacing={2}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {players.length === 0
                          ? 'Esperando jugadores para iniciar...'
                          : `${players.length} jugador${players.length > 1 ? 'es' : ''} listo${players.length > 1 ? 's' : ''}`}
                      </Typography>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={
                          starting ? (
                            <CircularProgress
                              size={20}
                              color="inherit"
                            />
                          ) : (
                            <PlayArrowIcon />
                          )
                        }
                        onClick={handleStart}
                        disabled={players.length === 0 || starting}
                        sx={{
                          py: 1.5,
                          fontSize: '1.1rem',
                          transition: 'transform 0.2s',
                          '&:hover:not(:disabled)': {
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        Iniciar partida
                      </Button>
                    </Stack>
                  )}

                  {/* Estado: En curso */}
                  {game.status === 'playing' && (
                    <Stack
                      spacing={2}
                      alignItems="center"
                    >
                      {/* Última balota */}
                      {lastNumber !== null && (
                        <Zoom
                          in
                          key={lastNumber}
                        >
                          <Paper
                            elevation={4}
                            sx={{
                              width: 100,
                              height: 100,
                              borderRadius: '50%',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor:
                                getColumnForNumber(lastNumber)?.color ||
                                'primary.main',
                              color: 'white',
                              animation: `${dropIn} 0.5s ease-out`,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                lineHeight: 1,
                              }}
                            >
                              {getColumnForNumber(lastNumber)?.letter}
                            </Typography>
                            <Typography
                              variant="h3"
                              sx={{ fontWeight: 'bold', lineHeight: 1 }}
                            >
                              {lastNumber}
                            </Typography>
                          </Paper>
                        </Zoom>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {game.calledNumbers.length} de 75 balotas cantadas
                      </Typography>

                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={
                          drawing ? (
                            <CircularProgress
                              size={20}
                              color="inherit"
                            />
                          ) : (
                            <RadioButtonCheckedIcon />
                          )
                        }
                        onClick={handleDraw}
                        disabled={drawing}
                        sx={{
                          py: 1.5,
                          fontSize: '1.1rem',
                          transition: 'transform 0.2s',
                          '&:hover:not(:disabled)': {
                            transform: 'scale(1.02)',
                          },
                        }}
                      >
                        {drawing ? 'Sacando...' : 'Sacar balota'}
                      </Button>
                    </Stack>
                  )}

                  {/* Estado: Finalizada */}
                  {game.status === 'finished' && (
                    <Stack spacing={2}>
                      <Alert
                        severity="success"
                        icon={<EmojiEventsIcon />}
                      >
                        ¡Ronda {game.round} finalizada!
                      </Alert>

                      <Button
                        variant="outlined"
                        startIcon={<RestartAltIcon />}
                        onClick={() => setShowRestart((prev) => !prev)}
                        fullWidth
                      >
                        {showRestart ? 'Cancelar' : 'Nueva ronda'}
                      </Button>

                      <Collapse in={showRestart}>
                        <Stack
                          spacing={2}
                          sx={{ mt: 1 }}
                        >
                          <TextField
                            select
                            label="Tipo de juego para la siguiente ronda"
                            fullWidth
                            value={restartType}
                            onChange={(e) => setRestartType(e.target.value)}
                            slotProps={{
                              input: {
                                startAdornment: (
                                  <InputAdornment position="start">
                                    <CategoryIcon
                                      fontSize="small"
                                      color="action"
                                    />
                                  </InputAdornment>
                                ),
                              },
                            }}
                          >
                            {GAME_TYPES.map((opt) => (
                              <MenuItem
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </MenuItem>
                            ))}
                          </TextField>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={
                              restarting ? (
                                <CircularProgress
                                  size={20}
                                  color="inherit"
                                />
                              ) : (
                                <RestartAltIcon />
                              )
                            }
                            onClick={handleRestart}
                            disabled={!restartType || restarting}
                            fullWidth
                          >
                            {restarting ? 'Iniciando...' : `Iniciar ronda ${game.round + 1}`}
                          </Button>
                        </Stack>
                      </Collapse>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grow>

            {/* Jugadores */}
            <Grow
              in
              timeout={500}
              style={{ transitionDelay: '100ms' }}
            >
              <Card
                variant="outlined"
                sx={{
                  transition: 'box-shadow 0.3s',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardContent>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ mb: 1 }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <GroupIcon color="primary" />
                      <Typography variant="h6">Jugadores</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Chip
                        icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                        label={players.filter((p) => p.online).length}
                        size="small"
                        color="success"
                        variant="outlined"
                        sx={{ '& .MuiChip-icon': { color: 'success.main' } }}
                      />
                      <Chip
                        label={players.length}
                        size="small"
                        color="primary"
                      />
                    </Stack>
                  </Stack>

                  {players.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.disabled"
                      sx={{ py: 2, textAlign: 'center' }}
                    >
                      Aún no hay jugadores
                    </Typography>
                  ) : (
                    <List disablePadding>
                      {players.map((p, i) => (
                        <Fade
                          in
                          timeout={300}
                          style={{ transitionDelay: `${i * 50}ms` }}
                          key={p._id}
                        >
                          <ListItem
                            disablePadding
                            sx={{ py: 0.5 }}
                          >
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                variant="dot"
                                sx={{
                                  '& .MuiBadge-badge': {
                                    bgcolor: p.online ? 'success.main' : 'error.main',
                                    width: 10,
                                    height: 10,
                                    borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: 'background.paper',
                                  },
                                }}
                              >
                                <Avatar
                                  sx={{
                                    width: 30,
                                    height: 30,
                                    fontSize: '0.85rem',
                                    bgcolor: `hsl(${(i * 47) % 360}, 60%, 45%)`,
                                    opacity: p.online ? 1 : 0.5,
                                  }}
                                >
                                  {p.name.charAt(0).toUpperCase()}
                                </Avatar>
                              </Badge>
                            </ListItemIcon>
                            <ListItemText
                              primary={p.name}
                              secondary={p.online ? 'Conectado' : 'Desconectado'}
                              slotProps={{
                                secondary: {
                                  sx: { color: p.online ? 'success.main' : 'error.main', fontSize: '0.75rem' },
                                },
                              }}
                            />
                          </ListItem>
                        </Fade>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Grow>

            {/* Ganadores */}
            {game.winners.length > 0 && (
              <Grow
                in
                timeout={500}
                style={{ transitionDelay: '200ms' }}
              >
                <Card
                  variant="outlined"
                  sx={{
                    borderColor: 'warning.main',
                    transition: 'box-shadow 0.3s',
                    '&:hover': { boxShadow: 4 },
                  }}
                >
                  <CardContent>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 1 }}
                    >
                      <EmojiEventsIcon sx={{ color: 'warning.main' }} />
                      <Typography variant="h6">Ganadores</Typography>
                    </Stack>
                    <List disablePadding>
                      {game.winners.map((w, i) => (
                        <ListItem
                          key={i}
                          disablePadding
                          sx={{ py: 0.5 }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            <Avatar
                              sx={{
                                width: 30,
                                height: 30,
                                fontSize: '0.85rem',
                                bgcolor: 'warning.main',
                                color: 'warning.contrastText',
                              }}
                            >
                              {i + 1}
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={w.playerName}
                            secondary={`Ronda ${w.round}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grow>
            )}
          </Stack>

          {/* Columna derecha: Tablero de números */}
          <Grow
            in
            timeout={500}
            style={{ transitionDelay: '150ms' }}
          >
            <Card
              variant="outlined"
              sx={{
                flex: 1,
                minWidth: 0,
                transition: 'box-shadow 0.3s',
                '&:hover': { boxShadow: 4 },
              }}
            >
              <CardContent>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <GridViewIcon color="primary" />
                  <Typography variant="h6">
                    Tablero de balotas
                  </Typography>
                </Stack>

                {/* Columnas B-I-N-G-O */}
                <Stack spacing={1.5}>
                  {BINGO_COLUMNS.map((col) => (
                    <Box key={col.letter}>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 'bold',
                            color: col.color,
                            width: 20,
                            textAlign: 'center',
                          }}
                        >
                          {col.letter}
                        </Typography>
                        <Divider sx={{ flex: 1 }} />
                      </Stack>
                      <Box
                        sx={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 0.5,
                          pl: 0.5,
                        }}
                      >
                        {Array.from(
                          { length: col.max - col.min + 1 },
                          (_, i) => col.min + i,
                        ).map((num) => {
                          const isCalled = game.calledNumbers.includes(num);
                          const isLast = num === lastNumber;
                          return (
                            <Box
                              key={num}
                              sx={{
                                width: 34,
                                height: 34,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.8rem',
                                fontWeight: isCalled ? 'bold' : 'normal',
                                bgcolor: isCalled ? col.color : 'action.hover',
                                color: isCalled ? 'white' : 'text.disabled',
                                transition: 'all 0.3s ease',
                                ...(isLast && {
                                  animation: `${glow} 1.5s ease-in-out infinite`,
                                  transform: 'scale(1.15)',
                                }),
                              }}
                            >
                              {num}
                            </Box>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grow>
        </Stack>
      </Box>
    </Container>
  );
}
