'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import {
  Typography,
  CircularProgress,
  Button,
  Collapse,
  Tooltip,
  Fade,
  Grow,
  Zoom,
  Snackbar,
} from '@mui/material';
import CasinoIcon from '@mui/icons-material/Casino';
import HomeIcon from '@mui/icons-material/Home';
import CategoryIcon from '@mui/icons-material/Category';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import PersonIcon from '@mui/icons-material/Person';
import CelebrationIcon from '@mui/icons-material/Celebration';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonCheckedIcon from '@mui/icons-material/RadioButtonChecked';
import GridViewIcon from '@mui/icons-material/GridView';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import CampaignIcon from '@mui/icons-material/Campaign';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useGamePlay } from './hooks/useGamePlay';
import {
  BINGO_LETTERS,
  BINGO_COLUMN_COLORS,
  GAME_TYPE_LABELS,
  STATUS_MAP,
  WIN_PATTERNS,
  WIN_PATTERN_HINTS,
  getColumnColor,
  getColumnLetter,
} from './constants';
import * as S from './styles';

/** Mini-grilla 5x5 que ilustra el patrón de victoria */
function WinPatternPreview({ gameType }: { gameType: string }) {
  const pattern = WIN_PATTERNS[gameType];
  if (!pattern) return null;

  return (
    <S.PatternPreviewStack>
      <S.PatternPreviewLabel variant="caption" color="text.secondary">
        {WIN_PATTERN_HINTS[gameType]}
      </S.PatternPreviewLabel>
      <S.PatternPreviewGrid>
        {pattern.flat().map((active, i) => (
          <S.PatternPreviewCell key={i} active={active} />
        ))}
      </S.PatternPreviewGrid>
    </S.PatternPreviewStack>
  );
}

export default function PlayPage() {
  const {
    goHome,
    isConnected,
    isReconnecting,
    reconnectFailed,
    manualReconnect,
    soundEnabled,
    toggleSound,
    game,
    player,
    error,
    loading,
    lastNumber,
    callingBingo,
    changingCard,
    bingoResult,
    winnerInfo,
    cardAnimating,
    cardsRefreshing,
    notifications,
    adminMessages,
    handleMark,
    handleBingo,
    handleChangeCard,
    handleCloseNotification,
    handleCloseAdminMessage,
  } = useGamePlay();

  // ─── Scroll horizontal de cartones ──────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const cardWidth = el.scrollWidth / (player?.cards.length || 1);
    setActiveCardIndex(Math.round(scrollLeft / cardWidth));
  }, [player?.cards.length]);

  const scrollToCard = useCallback((index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = el.scrollWidth / (player?.cards.length || 1);
    el.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
  }, [player?.cards.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  if (loading) {
    return (
      <S.PageWrapper maxWidth="sm">
        <S.CenteredFullHeight>
          <S.CenteredStack>
            <CircularProgress size={48} />
            <Typography color="text.secondary">Conectando a la partida...</Typography>
          </S.CenteredStack>
        </S.CenteredFullHeight>
      </S.PageWrapper>
    );
  }

  if (error) {
    return (
      <S.PageWrapper maxWidth="sm">
        <S.CenteredFullHeight>
          <S.CenteredStack>
            <S.FullWidthAlert severity="error">{error}</S.FullWidthAlert>
            <Button startIcon={<HomeIcon />} onClick={goHome}>
              Volver al inicio
            </Button>
          </S.CenteredStack>
        </S.CenteredFullHeight>
      </S.PageWrapper>
    );
  }

  if (!game || !player) return null;

  const statusInfo = STATUS_MAP[game.status] || { label: game.status, color: 'info' as const };
  const isPlaying = game.status === 'playing';
  const connectionStatus = isConnected
    ? 'connected'
    : isReconnecting
      ? 'reconnecting'
      : 'disconnected';

  return (
    <S.PageWrapper maxWidth="sm">
      <S.PageContainer>
        {/* Header */}
        <Fade in timeout={600}>
          <S.HeaderCard variant="outlined">
            <S.HeaderCardContent>
              <S.HeaderTopRow>
                <S.HeaderLeftGroup>
                  <S.HeaderGameIcon as={CasinoIcon} />
                  <S.HeaderTitle variant="h6">{game.name}</S.HeaderTitle>
                  <Tooltip title="Volver al inicio">
                    <S.HeaderHomeButton onClick={goHome} size="small">
                      <HomeIcon />
                    </S.HeaderHomeButton>
                  </Tooltip>
                </S.HeaderLeftGroup>
                <S.HeaderRightGroup>
                  <Tooltip title={soundEnabled ? 'Silenciar sonidos' : 'Activar sonidos'}>
                    <S.HeaderIconButton onClick={toggleSound} size="small" active={soundEnabled}>
                      {soundEnabled ? <VolumeUpIcon fontSize="small" /> : <VolumeOffIcon fontSize="small" />}
                    </S.HeaderIconButton>
                  </Tooltip>
                  <Tooltip title={isConnected ? 'Conectado' : isReconnecting ? 'Reconectando...' : 'Desconectado'}>
                    <S.ConnectionBadge status={connectionStatus}>
                      {isConnected ? (
                        <WifiIcon fontSize="small" />
                      ) : isReconnecting ? (
                        <S.SpinningIcon><RefreshIcon fontSize="small" /></S.SpinningIcon>
                      ) : (
                        <WifiOffIcon fontSize="small" />
                      )}
                    </S.ConnectionBadge>
                  </Tooltip>
                </S.HeaderRightGroup>
              </S.HeaderTopRow>
              <S.HeaderChipsRow>
                <S.StatusChip label={statusInfo.label} color={statusInfo.color} size="small" />
                <S.HeaderChip label={`Ronda ${game.round}`} size="small" variant="outlined" />
                {/* <S.HeaderChip
                  icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                  label={GAME_TYPE_LABELS[game.type] || game.type}
                  size="small"
                  variant="outlined"
                /> */}
                <S.HeaderChip
                  icon={<PersonIcon sx={{ fontSize: 14 }} />}
                  label={player.name}
                  size="small"
                  variant="outlined"
                />
              </S.HeaderChipsRow>
            </S.HeaderCardContent>
          </S.HeaderCard>
        </Fade>

        {/* Alerta de bingo falso */}
        <Collapse in={bingoResult === 'invalid'}>
          <S.BingoResultAlert severity="error" icon={<CancelIcon />}>
            ¡Bingo falso! No cumples la condición de victoria
          </S.BingoResultAlert>
        </Collapse>

        {/* Alerta de desconexión */}
        <Collapse in={!isConnected && !loading}>
          <S.DisconnectionAlert
            severity={isReconnecting ? 'warning' : 'error'}
            icon={
              isReconnecting ? (
                <S.SpinningIcon><RefreshIcon /></S.SpinningIcon>
              ) : (
                <WifiOffIcon />
              )
            }
            action={
              reconnectFailed && !isReconnecting ? (
                <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={manualReconnect}>
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
          </S.DisconnectionAlert>
        </Collapse>

        {/* Estado: Esperando que inicie */}
        {game.status === 'waiting' && (
          <Grow in timeout={500}>
            <S.WaitingCard variant="outlined">
              <S.WaitingCardContent>
                <S.WaitingStack>
                  <S.HourglassIcon as={HourglassEmptyIcon} />
                  <S.WaitingTitle variant="h6">
                    Esperando que el administrador inicie la partida...
                  </S.WaitingTitle>
                  <S.StatusChip
                    icon={<CategoryIcon sx={{ fontSize: 14 }} />}
                    label={GAME_TYPE_LABELS[game.type] || game.type}
                    color="warning"
                    size="small"
                  />
                  <WinPatternPreview gameType={game.type} />
                  <S.WaitingHint variant="body2" color="text.secondary">
                    {player.cards.length > 1
                      ? `Tienes ${player.cards.length} cartones. Puedes cambiar cada uno abajo`
                      : 'Mientras tanto, revisa tu cartón abajo'}
                  </S.WaitingHint>
                </S.WaitingStack>
              </S.WaitingCardContent>
            </S.WaitingCard>
          </Grow>
        )}

        {/* Última balota + Botón Bingo (solo en juego) */}
        {isPlaying && (
          <Fade in timeout={400}>
            <S.PlayingCard variant="outlined">
              <S.PlayingCardContent>
                <S.PlayingRow>
                  {/* Última balota */}
                  <S.LastBallGroup>
                    {lastNumber !== null ? (
                      <Zoom in key={lastNumber}>
                        <S.LastBallPaper elevation={4} ballColor={getColumnColor(lastNumber)}>
                          <S.BallLetter variant="caption">{getColumnLetter(lastNumber)}</S.BallLetter>
                          <S.BallNumber variant="h5">{lastNumber}</S.BallNumber>
                        </S.LastBallPaper>
                      </Zoom>
                    ) : (
                      <S.EmptyBallPaper elevation={1}>
                        <RadioButtonCheckedIcon color="disabled" />
                      </S.EmptyBallPaper>
                    )}
                    <S.LastBallInfoStack>
                      <S.LastBallLabel variant="body2">
                        {lastNumber !== null ? 'Última balota' : 'Sin balotas aún'}
                      </S.LastBallLabel>
                      <S.LastBallCount variant="caption" color="text.secondary">
                        {game.calledNumbers.length} de 75 cantadas
                      </S.LastBallCount>
                    </S.LastBallInfoStack>
                  </S.LastBallGroup>

                  {/* Botón Bingo */}
                  <S.BingoButton
                    variant="contained"
                    color="success"
                    size="large"
                    onClick={handleBingo}
                    disabled={callingBingo || player.markedNumbersPerCard.every(m => m.length === 0)}
                  >
                    {callingBingo ? <CircularProgress size={24} color="inherit" /> : '¡BINGO!'}
                  </S.BingoButton>
                </S.PlayingRow>
              </S.PlayingCardContent>
            </S.PlayingCard>
          </Fade>
        )}

        {/* Ganador */}
        {game.status === 'finished' && winnerInfo && (
          <Grow in timeout={500}>
            <S.WinnerCard variant="outlined">
              <S.WinnerCardContent>
                <S.WinnerStack>
                  <S.WinnerTrophyIcon as={EmojiEventsIcon} />
                  <S.WinnerTitle variant="h6">
                    {winnerInfo.playerName === player.name
                      ? '🎉 ¡Felicidades, GANASTE! 🎉'
                      : `${winnerInfo.playerName} ganó la ronda`}
                  </S.WinnerTitle>
                  <S.WinnerRound variant="body2" color="text.secondary">
                    Ronda {winnerInfo.round} finalizada
                  </S.WinnerRound>
                  {winnerInfo.playerName === player.name && (
                    <S.WinnerCelebrationIcon as={CelebrationIcon} />
                  )}
                </S.WinnerStack>
              </S.WinnerCardContent>
            </S.WinnerCard>
          </Grow>
        )}

        {/* Partida finalizada por el admin (sin ganador) */}
        {game.status === 'finished' && !winnerInfo && (
          <Grow in timeout={500}>
            <S.FinishedCard variant="outlined">
              <S.FinishedCardContent>
                <S.FinishedStack>
                  <S.FinishedStopIcon as={StopCircleIcon} />
                  <S.FinishedTitle variant="h6">
                    El administrador finalizó la partida
                  </S.FinishedTitle>
                  <S.FinishedRound variant="body2" color="text.secondary">
                    Ronda {game.round} terminada sin ganador
                  </S.FinishedRound>
                </S.FinishedStack>
              </S.FinishedCardContent>
            </S.FinishedCard>
          </Grow>
        )}

        {/* Cartones de bingo */}
        <S.CardsNavWrapper>
          {player.cards.length > 1 && activeCardIndex > 0 && (
            <S.CardsArrowButton
              size="small"
              onClick={() => scrollToCard(activeCardIndex - 1)}
              sx={{ left: -4 }}
            >
              <ChevronLeftIcon />
            </S.CardsArrowButton>
          )}
          <S.CardsScrollContainer ref={scrollRef} refreshing={cardsRefreshing}>
            {player.cards.map((card, cardIndex) => (
              <S.BingoCardOuter variant="outlined" key={cardIndex}>
                <S.BingoCardContent>
                  <S.BingoCardHeaderRow>
                    <S.BingoCardTitleGroup>
                      <GridViewIcon color="primary" />
                      <Typography variant="h6">
                        {player.cards.length > 1 ? `Cartón ${cardIndex + 1}` : 'Mi cartón'}
                      </Typography>
                    </S.BingoCardTitleGroup>
                    <WinPatternPreview gameType={game.type} />
                  </S.BingoCardHeaderRow>

                  {(game.status === 'waiting') && (
                    <S.ChangeCardButton
                      variant="outlined"
                      color="warning"
                      size="small"
                      fullWidth
                      startIcon={changingCard ? <CircularProgress size={14} color="inherit" /> : <AutorenewIcon />}
                      onClick={() => handleChangeCard(cardIndex)}
                      disabled={changingCard}
                      sx={{ mb: 2 }}
                    >
                      {changingCard ? 'Cambiando...' : 'Cambiar cartón'}
                    </S.ChangeCardButton>
                  )}

                  {/* Header B-I-N-G-O */}
                  <S.BingoLettersGrid>
                    {BINGO_LETTERS.map((letter, i) => (
                      <S.BingoLetterCell key={letter} bgColor={BINGO_COLUMN_COLORS[i]}>
                        {letter}
                      </S.BingoLetterCell>
                    ))}
                  </S.BingoLettersGrid>

                  {/* Celdas del cartón (5 filas x 5 columnas) */}
                  <S.BingoCellsGrid animating={cardAnimating}>
                    {card.map((row, rowIdx) =>
                      row.map((num, colIdx) => {
                        const isFree = num === 0;
                        const isCalled = isFree || game.calledNumbers.includes(num);
                        const isMarked = isFree || (player.markedNumbersPerCard[cardIndex] || []).includes(num);
                        const canMark = isPlaying && isCalled && !isMarked && !isFree;

                        return (
                          <S.BingoCell
                            key={`${rowIdx}-${colIdx}`}
                            onClick={() => canMark && handleMark(num, cardIndex)}
                            isFree={isFree}
                            isMarked={isMarked}
                            isCalled={isCalled}
                            canMark={canMark}
                            isPlaying={isPlaying}
                            colColor={BINGO_COLUMN_COLORS[colIdx]}
                          >
                            {isFree ? '★' : num}
                            {isMarked && !isFree && (
                              <S.CellCheckIcon as={CheckCircleIcon} />
                            )}
                          </S.BingoCell>
                        );
                      })
                    )}
                  </S.BingoCellsGrid>

                  {/* Leyenda */}
                  <S.LegendRow>
                    <S.LegendItem>
                      <S.LegendDotMarked />
                      <S.LegendLabel variant="caption" color="text.secondary">Marcado</S.LegendLabel>
                    </S.LegendItem>
                    <S.LegendItem>
                      <S.LegendDotCalled />
                      <S.LegendLabel variant="caption" color="text.secondary">Cantado</S.LegendLabel>
                    </S.LegendItem>
                    <S.LegendItem>
                      <S.LegendDotUncalled />
                      <S.LegendLabel variant="caption" color="text.secondary">Sin cantar</S.LegendLabel>
                    </S.LegendItem>
                  </S.LegendRow>
                </S.BingoCardContent>
              </S.BingoCardOuter>
            ))}
          </S.CardsScrollContainer>
          {player.cards.length > 1 && activeCardIndex < player.cards.length - 1 && (
            <S.CardsArrowButton
              size="small"
              onClick={() => scrollToCard(activeCardIndex + 1)}
              sx={{ right: -4 }}
            >
              <ChevronRightIcon />
            </S.CardsArrowButton>
          )}
        </S.CardsNavWrapper>
        {player.cards.length > 1 && (
          <S.CardsDots>
            {player.cards.map((_, i) => (
              <S.CardDot key={i} active={i === activeCardIndex} onClick={() => scrollToCard(i)} />
            ))}
          </S.CardsDots>
        )}

        {/* Footer */}
        <Fade in timeout={1000} style={{ transitionDelay: '400ms' }}>
          <S.Footer variant="caption" color="text.disabled">
            BingUp v0.2.0 — ¡Buena suerte! 🍀
          </S.Footer>
        </Fade>
      </S.PageContainer>

      {/* Notificaciones de jugadores (Snackbars apilados) */}
      {notifications.map((notif, index) => (
        <Snackbar
          key={notif.id}
          open
          autoHideDuration={3000}
          onClose={() => handleCloseNotification(notif.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          sx={{ bottom: { xs: 24 + index * 56, sm: 24 + index * 64 } }}
        >
          <S.NotificationAlert
            onClose={() => handleCloseNotification(notif.id)}
            severity={notif.type === 'leave' ? 'warning' : 'success'}
            icon={
              notif.type === 'join' ? (
                <PersonAddIcon fontSize="small" />
              ) : notif.type === 'leave' ? (
                <PersonOffIcon fontSize="small" />
              ) : (
                <PersonIcon fontSize="small" />
              )
            }
          >
            {notif.message}
          </S.NotificationAlert>
        </Snackbar>
      ))}

      {/* Mensajes globales del administrador */}
      {adminMessages.map((msg, index) => (
        <Snackbar
          key={msg.id}
          open
          autoHideDuration={6000}
          onClose={() => handleCloseAdminMessage(msg.id)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ top: { xs: 24 + index * 64, sm: 24 + index * 72 } }}
        >
          <S.AdminMessageAlert
            onClose={() => handleCloseAdminMessage(msg.id)}
            severity="info"
            icon={<CampaignIcon fontSize="small" />}
          >
            {msg.content}
          </S.AdminMessageAlert>
        </Snackbar>
      ))}
    </S.PageWrapper>
  );
}
