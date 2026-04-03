'use client';

import {
  Box,
  Typography,
  CircularProgress,
  CardContent,
  Button,
  Divider,
  Collapse,
  List,
  ListItemText,
  TextField,
  MenuItem,
  InputAdornment,
  IconButton,
  Tooltip,
  Fade,
  Grow,
  Zoom,
  Stack,
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
    cardsPerPlayer,
    applyingCards,
    handleCardsPerPlayerChange,
    applyCardsPerPlayer,
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
      <S.PageWrapper maxWidth="md">
        <S.CenteredFullHeight>
          <S.CenteredStack>
            <CircularProgress size={48} />
            <Typography color="text.secondary">
              Conectando a la partida...
            </Typography>
          </S.CenteredStack>
        </S.CenteredFullHeight>
      </S.PageWrapper>
    );
  }

  if (error) {
    return (
      <S.ErrorWrapper maxWidth="sm">
        <S.CenteredFullHeight>
          <S.CenteredStack>
            <S.FullWidthAlert severity="error">{error}</S.FullWidthAlert>
            <Button
              startIcon={<HomeIcon />}
              onClick={goHome}
            >
              Volver al inicio
            </Button>
          </S.CenteredStack>
        </S.CenteredFullHeight>
      </S.ErrorWrapper>
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
    <S.PageWrapper maxWidth="md">
      <S.PageContainer>
        {/* Header */}
        <Fade
          in
          timeout={600}
        >
          <S.HeaderCard variant="outlined">
            <S.HeaderCardContent>
              <S.HeaderTopRow>
                <S.HeaderLeftGroup>
                  <S.HeaderGameIcon as={CasinoIcon} />
                  <S.HeaderTitle variant="h5">{game.name}</S.HeaderTitle>
                  <Tooltip title="Volver al inicio">
                    <S.HeaderHomeButton
                      onClick={goHome}
                      size="small"
                    >
                      <HomeIcon />
                    </S.HeaderHomeButton>
                  </Tooltip>
                </S.HeaderLeftGroup>
                <S.HeaderRightGroup>
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
                </S.HeaderRightGroup>
              </S.HeaderTopRow>
              <S.HeaderChipsRow>
                <S.StatusChip
                  label={statusInfo.label}
                  color={statusInfo.color}
                  size="small"
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
                <S.HeaderChip
                  label={`${game.cardsPerPlayer || 1} cartón${(game.cardsPerPlayer || 1) > 1 ? 'es' : ''}`}
                  size="small"
                  variant="outlined"
                />
              </S.HeaderChipsRow>
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
              <S.RoomCodeRow>
                <S.RoomCodeLeft>
                  <TagIcon
                    fontSize="small"
                    color="action"
                    sx={{ flexShrink: 0 }}
                  />
                  <S.RoomCodeText variant="body2">{gameId}</S.RoomCodeText>
                </S.RoomCodeLeft>
                <Tooltip title={copied ? '¡Copiado!' : 'Copiar código'}>
                  <S.CopyButton
                    size="small"
                    onClick={handleCopyCode}
                    color={copied ? 'success' : 'default'}
                  >
                    {copied ? (
                      <CheckCircleIcon fontSize="small" />
                    ) : (
                      <ContentCopyIcon fontSize="small" />
                    )}
                  </S.CopyButton>
                </Tooltip>
              </S.RoomCodeRow>
            </S.RoomCodeCardContent>
          </S.RoomCodeCard>
        </Fade>

        {/* Alerta de error de acción */}
        <Collapse in={!!actionError}>
          <S.SpacedAlert
            severity="warning"
            onClose={() => setActionError('')}
          >
            {actionError}
          </S.SpacedAlert>
        </Collapse>

        {/* Alerta de intento de bingo */}
        <Collapse in={!!bingoAttempt}>
          <S.SpacedAlert
            severity={bingoAttempt?.valid ? 'success' : 'error'}
            icon={bingoAttempt?.valid ? <CheckCircleIcon /> : <CancelIcon />}
          >
            {bingoAttempt?.valid
              ? `¡${bingoAttempt.playerName} cantó BINGO correctamente!`
              : `${bingoAttempt?.playerName} cantó BINGO falso`}
          </S.SpacedAlert>
        </Collapse>

        {/* Alerta de desconexión */}
        <Collapse in={!isConnected && !loading}>
          <S.SpacedAlert
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
          >
            {isReconnecting
              ? 'Reconectando al servidor...'
              : reconnectFailed
                ? 'No se pudo reconectar. Haz clic en Reintentar.'
                : 'Conexión perdida con el servidor'}
          </S.SpacedAlert>
        </Collapse>

        <S.MainLayout>
          {/* Columna izquierda: Controles + Jugadores */}
          <S.LeftColumn>
            {/* Controles del juego */}
            <Grow
              in
              timeout={500}
            >
              <S.ControlsCard variant="outlined">
                <CardContent>
                  <S.SectionHeader>
                    <TuneIcon color="primary" />
                    <Typography variant="h6">Controles</Typography>
                  </S.SectionHeader>

                  {/* Estado: Esperando */}
                  {game.status === 'waiting' && (
                    <S.ControlsStack>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {onlinePlayers.length === 0
                          ? 'Esperando jugadores para iniciar...'
                          : `${onlinePlayers.length} jugador${onlinePlayers.length > 1 ? 'es' : ''} listo${onlinePlayers.length > 1 ? 's' : ''}`}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>
                          Cartones por jugador:
                        </Typography>
                        <TextField
                          type="number"
                          size="small"
                          value={cardsPerPlayer}
                          onChange={(e) => handleCardsPerPlayerChange(Number(e.target.value))}
                          onFocus={(e) => e.target.select()}
                          slotProps={{ htmlInput: { min: 1, max: 10 } }}
                          sx={{ width: 80 }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          onClick={applyCardsPerPlayer}
                          disabled={applyingCards || cardsPerPlayer === (game.cardsPerPlayer || 1)}
                          startIcon={applyingCards ? <CircularProgress size={14} color="inherit" /> : undefined}
                        >
                          {applyingCards ? 'Aplicando...' : 'Aplicar'}
                        </Button>
                      </Stack>
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
                    </S.ControlsStack>
                  )}

                  {/* Estado: En curso */}
                  {game.status === 'playing' && (
                    <S.PlayingStack>
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
                      <S.AutoDrawRow>
                        <S.SecondsInput
                          type="number"
                          size="small"
                          label="Segundos"
                          value={autoDrawInterval}
                          onChange={(e) =>
                            handleAutoDrawIntervalChange(e.target.value)
                          }
                          onFocus={(e) => e.target.select()}
                          disabled={autoDraw}
                          slotProps={{ htmlInput: { min: 1, max: 60 } }}
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
                      </S.AutoDrawRow>

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
                        <S.ConfirmStack>
                          <S.SpacedAlert
                            severity="warning"
                            variant="outlined"
                          >
                            Esto finalizará la ronda sin ganador. ¿Estás seguro?
                          </S.SpacedAlert>
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
                        </S.ConfirmStack>
                      </Collapse>
                    </S.PlayingStack>
                  )}

                  {/* Estado: Finalizada */}
                  {game.status === 'finished' && (
                    <S.ControlsStack>
                      <S.SpacedAlert
                        severity="success"
                        icon={<EmojiEventsIcon />}
                      >
                        ¡Ronda {game.round} finalizada!
                      </S.SpacedAlert>

                      <Button
                        variant="outlined"
                        startIcon={<RestartAltIcon />}
                        onClick={() => setShowRestart((prev) => !prev)}
                        fullWidth
                      >
                        {showRestart ? 'Cancelar' : 'Nueva ronda'}
                      </Button>

                      <Collapse in={showRestart}>
                        <S.RestartOptionsStack>
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
                        </S.RestartOptionsStack>
                      </Collapse>
                    </S.ControlsStack>
                  )}
                </CardContent>
              </S.ControlsCard>
            </Grow>

            {/* Mensaje global */}
            <Grow
              in
              timeout={500}
              style={{ transitionDelay: '150ms' }}
            >
              <S.HoverCard variant="outlined">
                <CardContent>
                  <S.SectionHeaderMedium>
                    <ChatIcon color="primary" />
                    <Typography variant="h6">Mensaje global</Typography>
                  </S.SectionHeaderMedium>
                  <S.MessageRow>
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
                  </S.MessageRow>
                </CardContent>
              </S.HoverCard>
            </Grow>

            {/* Jugadores */}
            <Grow
              in
              timeout={500}
              style={{ transitionDelay: '100ms' }}
            >
              <S.HoverCard variant="outlined">
                <CardContent>
                  <S.PlayersHeaderRow>
                    <S.PlayersLeftGroup>
                      <GroupIcon color="primary" />
                      <Typography variant="h6">Jugadores</Typography>
                    </S.PlayersLeftGroup>
                    <S.PlayersBadgesGroup>
                      <S.OnlineChip
                        icon={<FiberManualRecordIcon sx={{ fontSize: 10 }} />}
                        label={onlinePlayers.length}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                      <S.StatusChip
                        label={players.length}
                        size="small"
                        color="primary"
                      />
                    </S.PlayersBadgesGroup>
                  </S.PlayersHeaderRow>

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
                          <S.PlayerListItem disablePadding>
                            <S.PlayerIconCell>
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
                            </S.PlayerIconCell>
                            <S.PlayerStatusText
                              primary={p.name}
                              secondary={
                                p.online ? 'Conectado' : 'Desconectado'
                              }
                              online={p.online}
                            />
                          </S.PlayerListItem>
                        </Fade>
                      ))}
                    </List>
                  )}
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
                    <S.SectionHeaderCompact>
                      <EmojiEventsIcon sx={{ color: 'warning.main' }} />
                      <Typography variant="h6">Ganadores</Typography>
                    </S.SectionHeaderCompact>
                    <List disablePadding>
                      {game.winners.map((w, i) => (
                        <S.WinnerListItem
                          key={i}
                          disablePadding
                        >
                          <S.WinnerIconCell>
                            <S.WinnerAvatar>{i + 1}</S.WinnerAvatar>
                          </S.WinnerIconCell>
                          <ListItemText
                            primary={w.playerName}
                            secondary={`Ronda ${w.round}`}
                          />
                        </S.WinnerListItem>
                      ))}
                    </List>
                  </CardContent>
                </S.WinnersCard>
              </Grow>
            )}
          </S.LeftColumn>

          {/* Columna derecha: Tablero de números */}
          <Grow
            in
            timeout={500}
            style={{ transitionDelay: '150ms' }}
          >
            <S.BoardCard variant="outlined">
              <CardContent>
                <S.SectionHeader>
                  <GridViewIcon color="primary" />
                  <Typography variant="h6">Tablero de balotas</Typography>
                </S.SectionHeader>

                <S.BoardColumnsStack>
                  {BINGO_COLUMNS.map((col) => (
                    <Box key={col.letter}>
                      <S.ColumnHeaderRow>
                        <S.ColumnLabel
                          variant="subtitle2"
                          labelColor={col.color}
                        >
                          {col.letter}
                        </S.ColumnLabel>
                        <S.ColumnDivider />
                      </S.ColumnHeaderRow>
                      <S.BallsGrid>
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
                      </S.BallsGrid>
                    </Box>
                  ))}
                </S.BoardColumnsStack>
              </CardContent>
            </S.BoardCard>
          </Grow>
        </S.MainLayout>
      </S.PageContainer>
    </S.PageWrapper>
  );
}
