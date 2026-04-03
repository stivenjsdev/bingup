import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/app/hooks/useSocket';
import { useSoundEffects } from '@/app/hooks/useSoundEffects';
import { useSoundContext } from '@/app/contexts/SoundContext';
import { GameData, PlayerData } from '../types';
import { ACTION_TIMEOUT } from '../constants';

// ─── Hook ─────────────────────────────────────────────────────
export function useGameAdmin() {
  const params = useParams();
  const router = useRouter();
  const gameId = params.id as string;
  const { socket, isConnected, isReconnecting, reconnectFailed, manualReconnect } = useSocket();
  const { soundEnabled, toggleSound } = useSoundContext();
  const sounds = useSoundEffects();

  // Estado del juego
  const [game, setGame] = useState<GameData | null>(null);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastNumber, setLastNumber] = useState<number | null>(null);

  // Estado de acciones
  const [drawing, setDrawing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // Estado de UI
  const [copied, setCopied] = useState(false);
  const [restartType, setRestartType] = useState('');
  const [showRestart, setShowRestart] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [actionError, setActionError] = useState('');
  const [bingoAttempt, setBingoAttempt] = useState<{
    playerName: string;
    valid: boolean;
  } | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messageSent, setMessageSent] = useState(false);
  const [autoDraw, setAutoDraw] = useState(false);
  const [autoDrawInterval, setAutoDrawInterval] = useState(5);

  // Ref para los sonidos (para usar dentro de useEffect)
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds;

  // Refs para lock síncrono de acciones (prevenir doble-clic)
  const drawingLockRef = useRef(false);
  const startingLockRef = useRef(false);
  const restartingLockRef = useRef(false);
  const finishingLockRef = useRef(false);
  const messageLockRef = useRef(false);

  // Refs para timeouts de seguridad
  const drawingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoDrawRef = useRef<NodeJS.Timeout | null>(null);

  const getToken = useCallback(
    () => localStorage.getItem(`admin:${gameId}`) || '',
    [gameId],
  );

  // Re-emitir reconexión cuando el socket se reconecta
  useEffect(() => {
    if (isConnected && socket && gameId && !loading) {
      const token = getToken();
      if (token) {
        socket.emit('game:reconnect-admin', { gameId, token });
      }
    }
  }, [isConnected, socket, gameId, loading, getToken]);

  // Socket events
  useEffect(() => {
    if (!socket || !gameId) return;

    const token = getToken();
    if (!token) {
      setError('No tienes permisos de administrador para esta partida');
      setLoading(false);
      return;
    }

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
      startingLockRef.current = false;
      if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current);
      soundsRef.current.playGameStart();
    };

    const onNumber = (data: { number: number; calledNumbers: number[] }) => {
      setLastNumber(data.number);
      setDrawing(false);
      drawingLockRef.current = false;
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
      setGame((prev) =>
        prev ? { ...prev, calledNumbers: data.calledNumbers } : prev,
      );
      soundsRef.current.playBallDraw();
    };

    const onWinner = (data: {
      playerName: string;
      round: number;
      winners: GameData['winners'];
    }) => {
      setAutoDraw(false);
      setGame((prev) =>
        prev ? { ...prev, status: 'finished', winners: data.winners } : prev,
      );
      soundsRef.current.playBingoWin();
    };

    const onBingoAttempt = (data: { playerName: string; valid: boolean }) => {
      setBingoAttempt(data);
      if (data.valid) {
        soundsRef.current.playBingoCalled();
      } else {
        soundsRef.current.playBingoFalse();
      }
      setTimeout(() => setBingoAttempt(null), 4000);
    };

    const onRestarted = (data: { game: GameData; players: PlayerData[] }) => {
      setAutoDraw(false);
      setGame(data.game);
      setPlayers(data.players);
      setLastNumber(null);
      setShowRestart(false);
      setRestartType('');
      setRestarting(false);
      restartingLockRef.current = false;
      drawingLockRef.current = false;
      if (restartingTimeoutRef.current) clearTimeout(restartingTimeoutRef.current);
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
      soundsRef.current.playSuccess();
    };

    const onFinished = (data: { game: GameData }) => {
      setAutoDraw(false);
      setGame(data.game);
      setFinishing(false);
      finishingLockRef.current = false;
      if (finishingTimeoutRef.current) clearTimeout(finishingTimeoutRef.current);
      setShowFinish(false);
      soundsRef.current.playGameEnd();
    };

    const onMessage = () => {
      setSendingMessage(false);
      messageLockRef.current = false;
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      setMessageText('');
      setMessageSent(true);
      setTimeout(() => setMessageSent(false), 2000);
    };

    const onError = (msg: string) => {
      setActionError(msg);
      setDrawing(false);
      setStarting(false);
      setRestarting(false);
      setFinishing(false);
      setSendingMessage(false);
      drawingLockRef.current = false;
      startingLockRef.current = false;
      restartingLockRef.current = false;
      finishingLockRef.current = false;
      messageLockRef.current = false;
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
      if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current);
      if (restartingTimeoutRef.current) clearTimeout(restartingTimeoutRef.current);
      if (finishingTimeoutRef.current) clearTimeout(finishingTimeoutRef.current);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
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
    socket.on('game:finished', onFinished);
    socket.on('game:message', onMessage);
    socket.on('error', onError);

    return () => {
      socket.off('game:reconnected', onReconnected);
      socket.off('game:players', onPlayers);
      socket.off('game:started', onStarted);
      socket.off('game:number', onNumber);
      socket.off('game:winner', onWinner);
      socket.off('game:bingo-attempt', onBingoAttempt);
      socket.off('game:restarted', onRestarted);
      socket.off('game:finished', onFinished);
      socket.off('game:message', onMessage);
      socket.off('error', onError);
    };
  }, [socket, gameId, getToken, loading]);

  // ─── Handlers ─────────────────────────────────────────────────
  const handleStart = useCallback(() => {
    if (!socket || startingLockRef.current || starting) return;
    startingLockRef.current = true;
    setActionError('');
    setStarting(true);
    sounds.playClick();
    socket.emit('game:start', { gameId, token: getToken() });
    startingTimeoutRef.current = setTimeout(() => {
      startingLockRef.current = false;
      setStarting(false);
    }, ACTION_TIMEOUT);
  }, [socket, starting, gameId, getToken, sounds]);

  const handleDraw = useCallback(() => {
    if (!socket || drawingLockRef.current || drawing) return;
    drawingLockRef.current = true;
    setActionError('');
    setDrawing(true);
    sounds.playClick();
    socket.emit('game:draw', { gameId, token: getToken() });
    drawingTimeoutRef.current = setTimeout(() => {
      drawingLockRef.current = false;
      setDrawing(false);
    }, ACTION_TIMEOUT);
  }, [socket, drawing, gameId, getToken, sounds]);

  const handleRestart = useCallback(() => {
    if (!socket || !restartType || restartingLockRef.current || restarting) return;
    restartingLockRef.current = true;
    setActionError('');
    setRestarting(true);
    sounds.playClick();
    socket.emit('game:restart', { gameId, token: getToken(), type: restartType });
    restartingTimeoutRef.current = setTimeout(() => {
      restartingLockRef.current = false;
      setRestarting(false);
    }, ACTION_TIMEOUT);
  }, [socket, restartType, restarting, gameId, getToken, sounds]);

  const handleFinish = useCallback(() => {
    if (!socket || finishingLockRef.current || finishing) return;
    finishingLockRef.current = true;
    setActionError('');
    setFinishing(true);
    sounds.playClick();
    socket.emit('game:finish', { gameId, token: getToken() });
    finishingTimeoutRef.current = setTimeout(() => {
      finishingLockRef.current = false;
      setFinishing(false);
    }, ACTION_TIMEOUT);
  }, [socket, finishing, gameId, getToken, sounds]);

  const handleSendMessage = useCallback(() => {
    const trimmed = messageText.trim();
    if (!socket || messageLockRef.current || sendingMessage || !trimmed) return;
    messageLockRef.current = true;
    setActionError('');
    setSendingMessage(true);
    sounds.playClick();
    socket.emit('game:send-message', { gameId, token: getToken(), message: trimmed });
    messageTimeoutRef.current = setTimeout(() => {
      messageLockRef.current = false;
      setSendingMessage(false);
    }, ACTION_TIMEOUT);
  }, [socket, messageText, sendingMessage, gameId, getToken, sounds]);

  const stopAutoDraw = useCallback(() => {
    setAutoDraw(false);
    if (autoDrawRef.current) {
      clearInterval(autoDrawRef.current);
      autoDrawRef.current = null;
    }
  }, []);

  const toggleAutoDraw = useCallback(() => {
    if (autoDraw) {
      stopAutoDraw();
    } else {
      setAutoDraw(true);
    }
  }, [autoDraw, stopAutoDraw]);

  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [gameId]);

  const handleAutoDrawIntervalChange = useCallback(
    (value: string) => {
      const v = Math.max(1, Math.min(60, Number(value) || 1));
      setAutoDrawInterval(v);
    },
    [],
  );

  const goHome = useCallback(() => router.push('/'), [router]);

  // Efecto para el auto-draw
  useEffect(() => {
    if (!autoDraw || !socket || game?.status !== 'playing') {
      if (autoDrawRef.current) {
        clearInterval(autoDrawRef.current);
        autoDrawRef.current = null;
      }
      return;
    }

    autoDrawRef.current = setInterval(() => {
      if (!drawingLockRef.current) {
        drawingLockRef.current = true;
        setDrawing(true);
        socket.emit('game:draw', { gameId, token: getToken() });
        drawingTimeoutRef.current = setTimeout(() => {
          drawingLockRef.current = false;
          setDrawing(false);
        }, ACTION_TIMEOUT);
      }
    }, autoDrawInterval * 1000);

    return () => {
      if (autoDrawRef.current) {
        clearInterval(autoDrawRef.current);
        autoDrawRef.current = null;
      }
    };
  }, [autoDraw, autoDrawInterval, socket, gameId, getToken, game?.status]);

  return {
    // Routing
    gameId,
    goHome,

    // Conexión
    isConnected,
    isReconnecting,
    reconnectFailed,
    manualReconnect,

    // Sonido
    soundEnabled,
    toggleSound,

    // Estado del juego
    game,
    players,
    error,
    loading,
    lastNumber,

    // Estado de acciones
    drawing,
    starting,
    restarting,
    finishing,
    sendingMessage,

    // Estado de UI
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

    // Handlers
    handleStart,
    handleDraw,
    handleRestart,
    handleFinish,
    handleSendMessage,
    toggleAutoDraw,
    handleCopyCode,
  };
}
