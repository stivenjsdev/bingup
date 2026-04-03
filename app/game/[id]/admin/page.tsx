'use client';

import {
  Container,
  Box,
  Typography,
  CircularProgress,
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
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Zoom,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import TagIcon from '@mui/icons-material/Tag';
import GroupIcon from '@mui/icons-material/Group';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import TuneIcon from '@mui/icons-material/Tune';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import GridViewIcon from '@mui/icons-material/GridView';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import TimerIcon from '@mui/icons-material/Timer';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import { useGameAdmin } from './hooks/useGameAdmin';
import {
  GAME_TYPES,
  GAME_TYPE_LABELS,
  STATUS_MAP,
  BINGO_COLUMNS,
  getColumnForNumber,
} from './constants';
import * as S from './styles';

export default function AdminPage() {
  const {
    gameId,
    goHome,
    isConnected,
    isReconnecting,
    reconnectFailed,
    manualReconnect,
    soundEnabled,
    toggleSound,
    game,
    players,
    error,
    loading,
    lastNumber,
    drawing,
    starting,
    restarting,
    finishing,
    sendingMessage,
    copied,
    restartType,
    setRestartType,
    showRestart,
    setShowRestart,
    showFinish,
    setShowFinish,
    actionError,
    setActionError,
    bingoAttempt,
    messageText,
    setMessageText,
    messageSent,
    autoDraw,
    autoDrawInterval,
    handleAutoDrawIntervalChange,
    handleStart,
    handleDraw,
    handleRestart,
    handleFinish,
    handleSendMessage,
    toggleAutoDraw,
    handleCopyCode,
  } = useGameAdmin();

  if (loading) {
    return (
      <Container maxWidth="md">
        <S.CenteredFullHeight>
          <Stack
            alignItems="center"
            spacing={2}
          >
            <CircularProgress size={48} />
            <Typography color="text.secondary">
              Conectando a la partida...
            </Typography>
          </Stack>
        </S.CenteredFullHeight>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <S.CenteredFullHeight>
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
              onClick={goHome}
            >
              Volver al inicio
            </Button>
          </Stack>
        </S.CenteredFullHeight>
      </Container>
    );
  }

  if (!game) return null;

  const statusInfo = STATUS_MAP[game.status] || {
    label: game.status,
    color: 'info' as const,
  };
  const onlinePlayers = players.filter((p) => p.online);
  const connectionStatus = isConnected
    ? 'connected'
    : isReconnecting
      ? 'reconnecting'
      : 'disconnected';

  return (
    <Container maxWidth="md">
      <S.PageContainer>
        {/* Header */}
        <Fade
          in
          timeout={600}
        >
          <S.HeaderCard variant="outlined">
            <S.HeaderCardContent>
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
                  <S.HeaderTitle variant="h5">{game.name}</S.HeaderTitle>
                  <Tooltip title="Volver al inicio">
                    <IconButton
                      onClick={goHome}
                      size="small"
                      sx={{ color: 'primary.contrastText' }}
                    >
                      <HomeIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
                <Stack
                  direction="row"
                  spacing={0.5}
                  alignItems="center"
                >
                  <Tooltip
                    title={
                      soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'
                    }
                  >
                    <S.HeaderIconButton
                      onClick={toggleSound}
                      size="small"
                      active={soundEnabled}
                    >
                      {soundEnabled ? (
                        <VolumeUpIcon fontSize="small" />
                      ) : (
                        <VolumeOffIcon fontSize="small" />
                      )}
                    </S.HeaderIconButton>
                  </Tooltip>
                  <Tooltip
                    title={
                      isConnected
                        ? 'Conectado'
                        : isReconnecting
                          ? 'Reconectando...'
                          : 'Desconectado'
                    }
                  >
                    <S.ConnectionBadge status={connectionStatus}>
                      {isConnected ? (
                        <WifiIcon fontSize="small" />
                      ) : isReconnecting ? (
                        <S.SpinningIcon>
                          <RefreshIcon fontSize="small" />
                        </S.SpinningIcon>
                      ) : (
                        <WifiOffIcon fontSize="small" />
                      )}
                    </S.ConnectionBadge>
                  </Tooltip>
                </Stack>
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
                <S.HeaderChip
                  label={`Ronda ${game.round}`}
                  size="small"
                  variant="outlined"
                />
                <S.HeaderChip
                  icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                  label={GAME_TYPE_LABELS[game.type] || game.type}
                  size="small"
                  variant="outlined"
                />
              </Stack>
            </S.HeaderCardContent>
          </S.HeaderCard>
        </Fade>

        {/* Código de sala */}
        <Fade
          in
          timeout={600}
          style={{ transitionDelay: '100ms' }}
        >
          <S.RoomCodeCard variant="outlined">
            <S.RoomCodeCardContent>
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
                  <S.RoomCodeText variant="body2">{gameId}</S.RoomCodeText>
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
            </S.RoomCodeCardContent>
          </S.RoomCodeCard>
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

        {/* Alerta de desconexión */}
        <Collapse in={!isConnected && !loading}>
          <Alert
            severity={isReconnecting ? 'warning' : 'error'}
            icon={
              isReconnecting ? (
                <S.SpinningIcon>
                  <RefreshIcon />
                </S.SpinningIcon>
              ) : (
                <WifiOffIcon />
              )
            }
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
              ? 'Reconectando al servidor...'
              : reconnectFailed
                ? 'No se pudo reconectar. Haz clic en Reintentar.'
                : 'Conexión perdida con el servidor'}
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
              <S.ControlsCard variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 2 }}
                  >
                    <TuneIcon color="primary" />
                    <Typography variant="h6">Controles</Typography>
                  </Stack>

                  {/* Estado: Esperando */}
                  {game.status === 'waiting' && (
                    <Stack spacing={2}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {onlinePlayers.length === 0
                          ? 'Esperando jugadores para iniciar...'
                          : `${onlinePlayers.length} jugador${onlinePlayers.length > 1 ? 'es' : ''} listo${onlinePlayers.length > 1 ? 's' : ''}`}
                      </Typography>
                      <S.ActionButton
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
                      >
                        Iniciar partida
                      </S.ActionButton>
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
                          <S.BallPaper
                            elevation={4}
                            ballColor={
                              getColumnForNumber(lastNumber)?.color || '#1976d2'
                            }
                          >
                            <S.BallLetter variant="caption">
                              {getColumnForNumber(lastNumber)?.letter}
                            </S.BallLetter>
                            <S.BallNumber variant="h3">
                              {lastNumber}
                            </S.BallNumber>
                          </S.BallPaper>
                        </Zoom>
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {game.calledNumbers.length} de 75 balotas cantadas
                      </Typography>

                      <S.ActionButton
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
                      >
                        {drawing ? 'Sacando...' : 'Sacar balota'}
                      </S.ActionButton>

                      {/* Auto-draw */}
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        sx={{ width: '100%' }}
                      >
                        <TextField
                          type="number"
                          size="small"
                          label="Segundos"
                          value={autoDrawInterval}
                          onChange={(e) =>
                            handleAutoDrawIntervalChange(e.target.value)
                          }
                          disabled={autoDraw}
                          slotProps={{ htmlInput: { min: 1, max: 60 } }}
                          sx={{ width: 100 }}
                        />
                        <Button
                          variant={autoDraw ? 'contained' : 'outlined'}
                          color={autoDraw ? 'warning' : 'primary'}
                          fullWidth
                          startIcon={
                            autoDraw ? <PauseCircleIcon /> : <TimerIcon />
                          }
                          onClick={toggleAutoDraw}
                        >
                          {autoDraw ? 'Detener auto' : 'Auto balota'}
                        </Button>
                      </Stack>

                      <Divider />

                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<StopCircleIcon />}
                        onClick={() => setShowFinish((prev) => !prev)}
                        fullWidth
                      >
                        {showFinish ? 'Cancelar' : 'Finalizar partida'}
                      </Button>

                      <Collapse in={showFinish}>
                        <Stack
                          spacing={1.5}
                          sx={{ mt: 1 }}
                        >
                          <Alert
                            severity="warning"
                            variant="outlined"
                          >
                            Esto finalizará la ronda sin ganador. ¿Estás seguro?
                          </Alert>
                          <Button
                            variant="contained"
                            color="error"
                            startIcon={
                              finishing ? (
                                <CircularProgress
                                  size={20}
                                  color="inherit"
                                />
                              ) : (
                                <StopCircleIcon />
                              )
                            }
                            onClick={handleFinish}
                            disabled={finishing}
                            fullWidth
                          >
                            {finishing
                              ? 'Finalizando...'
                              : 'Confirmar finalización'}
                          </Button>
                        </Stack>
                      </Collapse>
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
                            {restarting
                              ? 'Iniciando...'
                              : `Iniciar ronda ${game.round + 1}`}
                          </Button>
                        </Stack>
                      </Collapse>
                    </Stack>
                  )}
                </CardContent>
              </S.ControlsCard>
            </Grow>

            {/* Jugadores */}
            <Grow
              in
              timeout={500}
              style={{ transitionDelay: '100ms' }}
            >
              <S.HoverCard variant="outlined">
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
                    <Stack
                      direction="row"
                      spacing={0.5}
                      alignItems="center"
                    >
                      <Chip
                        icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                        label={onlinePlayers.length}
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
                    <S.EmptyPlayersText
                      variant="body2"
                      color="text.disabled"
                    >
                      Aún no hay jugadores
                    </S.EmptyPlayersText>
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
                              <S.PlayerBadge
                                overlap="circular"
                                anchorOrigin={{
                                  vertical: 'bottom',
                                  horizontal: 'right',
                                }}
                                variant="dot"
                                online={p.online}
                              >
                                <S.PlayerAvatar
                                  index={i}
                                  online={p.online}
                                >
                                  {p.name.charAt(0).toUpperCase()}
                                </S.PlayerAvatar>
                              </S.PlayerBadge>
                            </ListItemIcon>
                            <ListItemText
                              primary={p.name}
                              secondary={
                                p.online ? 'Conectado' : 'Desconectado'
                              }
                              slotProps={{
                                secondary: {
                                  sx: {
                                    color: p.online
                                      ? 'success.main'
                                      : 'error.main',
                                    fontSize: '0.75rem',
                                  },
                                },
                              }}
                            />
                          </ListItem>
                        </Fade>
                      ))}
                    </List>
                  )}
                </CardContent>
              </S.HoverCard>
            </Grow>

            {/* Mensaje global */}
            <Grow
              in
              timeout={500}
              style={{ transitionDelay: '150ms' }}
            >
              <S.HoverCard variant="outlined">
                <CardContent>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1.5 }}
                  >
                    <ChatIcon color="primary" />
                    <Typography variant="h6">Mensaje global</Typography>
                  </Stack>
                  <Stack
                    direction="row"
                    spacing={1}
                  >
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Escribe un mensaje para todos..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      disabled={sendingMessage}
                      slotProps={{ htmlInput: { maxLength: 500 } }}
                    />
                    <Tooltip
                      title={messageSent ? '¡Enviado!' : 'Enviar mensaje'}
                    >
                      <span>
                        <IconButton
                          color={messageSent ? 'success' : 'primary'}
                          onClick={handleSendMessage}
                          disabled={sendingMessage || !messageText.trim()}
                        >
                          {sendingMessage ? (
                            <CircularProgress
                              size={20}
                              color="inherit"
                            />
                          ) : messageSent ? (
                            <CheckCircleIcon />
                          ) : (
                            <SendIcon />
                          )}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </S.HoverCard>
            </Grow>

            {/* Ganadores */}
            {game.winners.length > 0 && (
              <Grow
                in
                timeout={500}
                style={{ transitionDelay: '200ms' }}
              >
                <S.WinnersCard variant="outlined">
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
                            <S.WinnerAvatar>{i + 1}</S.WinnerAvatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={w.playerName}
                            secondary={`Ronda ${w.round}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </S.WinnersCard>
              </Grow>
            )}
          </Stack>

          {/* Columna derecha: Tablero de números */}
          <Grow
            in
            timeout={500}
            style={{ transitionDelay: '150ms' }}
          >
            <S.BoardCard variant="outlined">
              <CardContent>
                <Stack
                  direction="row"
                  spacing={1}
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <GridViewIcon color="primary" />
                  <Typography variant="h6">Tablero de balotas</Typography>
                </Stack>

                <Stack spacing={1.5}>
                  {BINGO_COLUMNS.map((col) => (
                    <Box key={col.letter}>
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        sx={{ mb: 1 }}
                      >
                        <S.ColumnLabel
                          variant="subtitle2"
                          labelColor={col.color}
                        >
                          {col.letter}
                        </S.ColumnLabel>
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
                            <S.BoardBall
                              key={num}
                              called={isCalled}
                              last={isLast}
                              ballColor={col.color}
                            >
                              {num}
                            </S.BoardBall>
                          );
                        })}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </S.BoardCard>
          </Grow>
        </Stack>
      </S.PageContainer>
    </Container>
  );
}
