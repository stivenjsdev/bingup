import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/app/hooks/useSocket';
import { useSoundEffects } from '@/app/hooks/useSoundEffects';
import { useSoundContext } from '@/app/contexts/SoundContext';
import { GameData, PlayerData } from '../types';
import { ACTION_TIMEOUT } from '../constants';

// ─── Hook principal del panel de administración ───────────────
// Centraliza TODA la lógica del admin: conexión socket, estado
// del juego, acciones (sacar balota, iniciar, reiniciar, etc.)
// y efectos de sonido.
// ───────────────────────────────────────────────────────────────
export function useGameAdmin() {
  // ─── Routing y navegación ─────────────────────────────────
  const params = useParams(); // Obtiene los parámetros dinámicos de la URL ([id])
  const router = useRouter(); // Para navegación programática (ej: volver al inicio)
  const gameId = params.id as string; // ID de la partida extraído de la URL /game/[id]/admin

  // ─── Conexión en tiempo real (Socket.IO) ──────────────────
  // socket: instancia del socket para emitir/escuchar eventos
  // isConnected: si hay conexión activa con el servidor
  // isReconnecting: si está intentando reconectar automáticamente
  // reconnectFailed: si todos los intentos de reconexión fallaron
  // manualReconnect: función para reintentar conexión manualmente
  const { socket, isConnected, isReconnecting, reconnectFailed, manualReconnect } = useSocket();

  // ─── Sonidos ──────────────────────────────────────────────
  const { soundEnabled, toggleSound } = useSoundContext(); // Controla si los sonidos están activados/desactivados globalmente
  const sounds = useSoundEffects(); // Funciones para reproducir cada efecto de sonido (click, balota, bingo, etc.)

  // ═══════════════════════════════════════════════════════════
  // ESTADO DEL JUEGO — Datos que vienen del servidor
  // ═══════════════════════════════════════════════════════════
  const [game, setGame] = useState<GameData | null>(null); // Datos completos de la partida (status, calledNumbers, winners, round, type, name)
  const [players, setPlayers] = useState<PlayerData[]>([]); // Lista de jugadores con su estado online/offline
  const [error, setError] = useState(''); // Error fatal (ej: sin permisos). Muestra pantalla de error
  const [loading, setLoading] = useState(true); // true mientras se establece la primera conexión. Muestra spinner
  const [lastNumber, setLastNumber] = useState<number | null>(null); // Última balota sacada, para mostrarla animada en la UI

  // ═══════════════════════════════════════════════════════════
  // ESTADO DE ACCIONES — Flags de "cargando" para cada acción
  // Mientras son true, el botón muestra spinner y se deshabilita
  // ═══════════════════════════════════════════════════════════
  const [drawing, setDrawing] = useState(false); // Sacando balota
  const [starting, setStarting] = useState(false); // Iniciando partida
  const [restarting, setRestarting] = useState(false); // Reiniciando nueva ronda
  const [finishing, setFinishing] = useState(false); // Finalizando ronda manualmente
  const [sendingMessage, setSendingMessage] = useState(false); // Enviando mensaje global

  // ═══════════════════════════════════════════════════════════
  // ESTADO DE UI — Controla visibilidad y comportamiento de la interfaz
  // ═══════════════════════════════════════════════════════════
  const [copied, setCopied] = useState(false); // Feedback visual "¡Copiado!" al copiar código de sala
  const [restartType, setRestartType] = useState(''); // Tipo de juego seleccionado para la siguiente ronda (fullCard, fourCorners, etc.)
  const [showRestart, setShowRestart] = useState(false); // Muestra/oculta el panel de opciones de reinicio
  const [showFinish, setShowFinish] = useState(false); // Muestra/oculta la confirmación para finalizar partida
  const [actionError, setActionError] = useState(''); // Error temporal de una acción (ej: "No hay jugadores"). Se puede cerrar
  const [bingoAttempt, setBingoAttempt] = useState<{ // Alerta cuando un jugador intenta cantar bingo
    playerName: string; // Nombre del jugador que cantó
    valid: boolean; // Si el bingo fue válido o falso
  } | null>(null);
  const [messageText, setMessageText] = useState(''); // Texto del input de mensaje global
  const [messageSent, setMessageSent] = useState(false); // Feedback "¡Enviado!" temporal (2 segundos)
  const [autoDraw, setAutoDraw] = useState(false); // Si el auto-draw está activo (saca balotas automáticamente)
  const [cardsPerPlayer, setCardsPerPlayer] = useState(1); // Cantidad de cartones por jugador
  const [applyingCards, setApplyingCards] = useState(false); // Loading al aplicar cambio de cartones
  const [autoDrawInterval, setAutoDrawInterval] = useState(5); // Intervalo en segundos entre cada balota automática

  // ═══════════════════════════════════════════════════════════
  // REF DE SONIDOS — Permite acceder a sounds dentro de useEffect
  // sin agregarlo como dependencia (evita re-suscripciones innecesarias)
  // ═══════════════════════════════════════════════════════════
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds; // Se actualiza en cada render para tener siempre la referencia más reciente

  // ═══════════════════════════════════════════════════════════
  // LOCKS SÍNCRONOS — Previenen doble-clic / doble-emisión
  //
  // ¿Por qué useRef y no useState?
  // - useState es asíncrono (el valor no cambia inmediatamente)
  // - Si el usuario hace doble-clic rápido, ambos clics verían
  //   el estado anterior como false y emitirían el evento 2 veces
  // - useRef.current cambia INMEDIATAMENTE de forma síncrona,
  //   así el segundo clic ya ve el lock en true y se descarta
  // ═══════════════════════════════════════════════════════════
  const drawingLockRef = useRef(false); // Lock para "sacar balota"
  const startingLockRef = useRef(false); // Lock para "iniciar partida"
  const restartingLockRef = useRef(false); // Lock para "reiniciar ronda"
  const finishingLockRef = useRef(false); // Lock para "finalizar partida"
  const messageLockRef = useRef(false); // Lock para "enviar mensaje"

  // ═══════════════════════════════════════════════════════════
  // TIMEOUTS DE SEGURIDAD — Desbloquean la acción si el servidor
  // no responde dentro de ACTION_TIMEOUT (3 segundos).
  // Sin estos, un error de red dejaría el botón bloqueado para siempre.
  // ═══════════════════════════════════════════════════════════
  const drawingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const startingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const restartingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const finishingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoDrawRef = useRef<NodeJS.Timeout | null>(null); // Ref del setInterval del auto-draw

  // Obtiene el token de admin desde localStorage (se guarda al crear la partida)
  const getToken = useCallback(
    () => localStorage.getItem(`admin:${gameId}`) || '',
    [gameId],
  );

  // ═══════════════════════════════════════════════════════════
  // EFECTO: Re-autenticarse al reconectar
  // Cuando el socket se desconecta y vuelve a conectar (ej: WiFi
  // inestable), necesitamos volver a identificarnos como admin
  // ante el servidor para seguir recibiendo eventos de la partida.
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isConnected && socket && gameId && !loading) {
      const token = getToken();
      if (token) {
        socket.emit('game:reconnect-admin', { gameId, token });
      }
    }
  }, [isConnected, socket, gameId, loading, getToken]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO PRINCIPAL: Suscripción a todos los eventos del socket
  //
  // Este useEffect es el corazón del hook. Se encarga de:
  // 1. Emitir 'game:reconnect-admin' para autenticarse
  // 2. Escuchar TODOS los eventos del servidor y actualizar el estado
  // 3. Limpiar los listeners al desmontarse (cleanup)
  //
  // Cada handler sigue el patrón:
  //   → Actualizar estado del juego
  //   → Desbloquear lock + limpiar timeout de seguridad
  //   → Reproducir sonido correspondiente
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!socket || !gameId) return; // Sin socket o sin ID no hacemos nada

    // Verificar que tengamos token de admin en localStorage
    const token = getToken();
    if (!token) {
      setError('No tienes permisos de administrador para esta partida');
      setLoading(false);
      return;
    }

    // Autenticarse como admin ante el servidor
    socket.emit('game:reconnect-admin', { gameId, token });

    // ─── Evento: Reconexión exitosa ─────────────────────────
    // El servidor confirma que somos admin y nos envía el estado
    // actual completo del juego (útil al recargar la página)
    const onReconnected = (data: {
      role: string;
      game: GameData;
      players: PlayerData[];
    }) => {
      if (data.role === 'admin') {
        setGame(data.game); // Sincronizar estado del juego
        setPlayers(data.players); // Sincronizar lista de jugadores
        setCardsPerPlayer(data.game.cardsPerPlayer || 1); // Sincronizar cartones por jugador
        setLoading(false); // Ocultar spinner de carga
        // Si ya había balotas cantadas, mostrar la última
        if (data.game.calledNumbers.length > 0) {
          setLastNumber(
            data.game.calledNumbers[data.game.calledNumbers.length - 1],
          );
        }
      }
    };

    // ─── Evento: Actualización de jugadores ─────────────────
    // Se dispara cuando un jugador se conecta, desconecta o se une
    const onPlayers = (data: PlayerData[]) => setPlayers(data);

    // ─── Evento: Partida iniciada ───────────────────────────
    // El servidor confirma que la partida pasó a estado "playing"
    const onStarted = (gameData: GameData) => {
      setGame(gameData); // Actualizar datos del juego (status: 'playing')
      setStarting(false); // Quitar spinner del botón "Iniciar"
      startingLockRef.current = false; // Desbloquear lock
      if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current); // Cancelar timeout de seguridad
      soundsRef.current.playGameStart(); // Sonido de inicio de partida
    };

    // ─── Evento: Nueva balota sacada ────────────────────────
    // El servidor envía el número sacado y la lista actualizada
    const onNumber = (data: { number: number; calledNumbers: number[] }) => {
      setLastNumber(data.number); // Mostrar la balota animada
      setDrawing(false); // Quitar spinner del botón
      drawingLockRef.current = false; // Desbloquear para poder sacar otra
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
      setGame((prev) => // Actualizar la lista de números cantados sin reemplazar todo el objeto
        prev ? { ...prev, calledNumbers: data.calledNumbers } : prev,
      );
      soundsRef.current.playBallDraw(); // Sonido de balota
    };

    // ─── Evento: Hay un ganador ─────────────────────────────
    // Un jugador cantó bingo válido. La partida pasa a "finished"
    const onWinner = (data: {
      playerName: string;
      round: number;
      winners: GameData['winners'];
    }) => {
      setAutoDraw(false); // Detener auto-draw si estaba activo
      setGame((prev) =>
        prev ? { ...prev, status: 'finished', winners: data.winners } : prev,
      );
      soundsRef.current.playBingoWin(); // Sonido de victoria
    };

    // ─── Evento: Intento de bingo ───────────────────────────
    // Un jugador presionó "¡Bingo!". Puede ser válido o falso.
    // Se muestra una alerta temporal de 4 segundos
    const onBingoAttempt = (data: { playerName: string; valid: boolean }) => {
      setBingoAttempt(data); // Mostrar alerta con el resultado
      if (data.valid) {
        soundsRef.current.playBingoCalled(); // Sonido de bingo correcto
      } else {
        soundsRef.current.playBingoFalse(); // Sonido de bingo falso
      }
      setTimeout(() => setBingoAttempt(null), 4000); // Ocultar alerta después de 4s
    };

    // ─── Evento: Ronda reiniciada ───────────────────────────
    // El admin inició una nueva ronda. Se resetea todo el estado
    const onRestarted = (data: { game: GameData; players: PlayerData[] }) => {
      setAutoDraw(false); // Detener auto-draw
      setGame(data.game); // Nuevo estado del juego (ronda +1, status: 'waiting')
      setPlayers(data.players); // Jugadores actualizados (nuevos cartones)
      setLastNumber(null); // Limpiar última balota mostrada
      setShowRestart(false); // Cerrar panel de reinicio
      setRestartType(''); // Limpiar tipo seleccionado
      setRestarting(false); // Quitar spinner
      restartingLockRef.current = false; // Desbloquear lock de reinicio
      drawingLockRef.current = false; // Desbloquear lock de sacar balota (por si quedó)
      if (restartingTimeoutRef.current) clearTimeout(restartingTimeoutRef.current);
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
      soundsRef.current.playSuccess(); // Sonido de éxito
    };

    // ─── Evento: Partida finalizada manualmente ─────────────
    // El admin forzó la finalización (sin ganador)
    const onFinished = (data: { game: GameData }) => {
      setAutoDraw(false); // Detener auto-draw
      setGame(data.game); // Actualizar estado (status: 'finished')
      setFinishing(false); // Quitar spinner
      finishingLockRef.current = false; // Desbloquear
      if (finishingTimeoutRef.current) clearTimeout(finishingTimeoutRef.current);
      setShowFinish(false); // Cerrar diálogo de confirmación
      soundsRef.current.playGameEnd(); // Sonido de fin de partida
    };

    // ─── Evento: Mensaje global enviado exitosamente ────────
    const onMessage = () => {
      setSendingMessage(false); // Quitar spinner
      messageLockRef.current = false; // Desbloquear
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      setMessageText(''); // Limpiar el input
      setMessageSent(true); // Mostrar check verde "¡Enviado!"
      setTimeout(() => setMessageSent(false), 2000); // Ocultar feedback después de 2s
    };

    // ─── Evento: Cartones por jugador actualizados ──────────
    const onCardsPerPlayerUpdated = (data: { game: GameData; players: PlayerData[] }) => {
      setGame(data.game);
      setPlayers(data.players);
      setCardsPerPlayer(data.game.cardsPerPlayer || 1);
      setApplyingCards(false);
    };

    // ─── Evento: Sesión tomada por otra pestaña ───────────────
    // El servidor detectó que el mismo admin se conectó desde
    // otra pestaña/ventana. Esta pestaña queda inactiva.
    const onSessionTaken = () => {
      setError('Tu sesión de admin fue abierta en otra pestaña. Usa esa pestaña para continuar.');
      setLoading(false);
    };

    // ─── Evento: Error del servidor ─────────────────────────
    // Cualquier error emitido por el servidor (validación, permisos, etc.)
    // Resetea TODOS los locks y spinners para que la UI no quede bloqueada
    const onError = (msg: string) => {
      setActionError(msg); // Mostrar alerta con el mensaje de error
      // Resetear todos los estados de carga
      setDrawing(false);
      setStarting(false);
      setRestarting(false);
      setFinishing(false);
      setSendingMessage(false);
      // Desbloquear todos los locks
      drawingLockRef.current = false;
      startingLockRef.current = false;
      restartingLockRef.current = false;
      finishingLockRef.current = false;
      messageLockRef.current = false;
      // Cancelar todos los timeouts de seguridad
      if (drawingTimeoutRef.current) clearTimeout(drawingTimeoutRef.current);
      if (startingTimeoutRef.current) clearTimeout(startingTimeoutRef.current);
      if (restartingTimeoutRef.current) clearTimeout(restartingTimeoutRef.current);
      if (finishingTimeoutRef.current) clearTimeout(finishingTimeoutRef.current);
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      // Si el error ocurrió durante la carga inicial, mostrar pantalla de error
      if (loading) {
        setError(msg);
        setLoading(false);
      }
    };

    // ─── Registrar todos los listeners del socket ───────────
    socket.on('game:reconnected', onReconnected);
    socket.on('game:players', onPlayers);
    socket.on('game:started', onStarted);
    socket.on('game:number', onNumber);
    socket.on('game:winner', onWinner);
    socket.on('game:bingo-attempt', onBingoAttempt);
    socket.on('game:restarted', onRestarted);
    socket.on('game:finished', onFinished);
    socket.on('game:message', onMessage);
    socket.on('game:cards-per-player-updated', onCardsPerPlayerUpdated);
    socket.on('game:session-taken', onSessionTaken);
    socket.on('error', onError);

    // ─── Cleanup: Desregistrar listeners al desmontarse ─────
    // Evita memory leaks y que eventos de una partida anterior
    // actualicen el estado de una partida nueva
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
      socket.off('game:cards-per-player-updated', onCardsPerPlayerUpdated);
      socket.off('game:session-taken', onSessionTaken);
      socket.off('error', onError);
    };
  }, [socket, gameId, getToken, loading]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS — Funciones que ejecuta la vista al interactuar
  //
  // Todos siguen el mismo patrón de protección:
  // 1. Verificar que haya socket y que no esté bloqueado (lock)
  // 2. Activar lock inmediatamente (prevenir doble-clic)
  // 3. Limpiar errores previos y activar spinner
  // 4. Reproducir sonido de clic
  // 5. Emitir evento al servidor con gameId + token
  // 6. Programar timeout de seguridad para desbloquear si no hay respuesta
  // ═══════════════════════════════════════════════════════════

  // Iniciar la partida (pasa de "waiting" a "playing")
  const handleStart = useCallback(() => {
    if (!socket || startingLockRef.current || starting) return; // Protección: sin socket, ya bloqueado, o ya en proceso
    startingLockRef.current = true; // Bloquear inmediatamente (síncrono)
    setActionError(''); // Limpiar error previo
    setStarting(true); // Activar spinner en el botón
    sounds.playClick(); // Feedback auditivo
    socket.emit('game:start', { gameId, token: getToken() }); // Pedir al servidor que inicie
    startingTimeoutRef.current = setTimeout(() => { // Timeout de seguridad: si el servidor no responde en 3s...
      startingLockRef.current = false; // ...desbloquear
      setStarting(false); // ...quitar spinner
    }, ACTION_TIMEOUT);
  }, [socket, starting, gameId, getToken, sounds]);

  // Sacar una balota aleatoria
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

  // Reiniciar con nueva ronda (envía el tipo de juego seleccionado)
  const handleRestart = useCallback(() => {
    if (!socket || !restartType || restartingLockRef.current || restarting) return; // También valida que haya tipo seleccionado
    restartingLockRef.current = true;
    setActionError('');
    setRestarting(true);
    sounds.playClick();
    socket.emit('game:restart', { gameId, token: getToken(), type: restartType }); // Incluye el tipo de bingo para la nueva ronda
    restartingTimeoutRef.current = setTimeout(() => {
      restartingLockRef.current = false;
      setRestarting(false);
    }, ACTION_TIMEOUT);
  }, [socket, restartType, restarting, gameId, getToken, sounds]);

  // Finalizar la ronda manualmente (sin ganador)
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

  // Enviar un mensaje global a todos los jugadores
  const handleSendMessage = useCallback(() => {
    const trimmed = messageText.trim(); // Eliminar espacios en blanco
    if (!socket || messageLockRef.current || sendingMessage || !trimmed) return; // No enviar mensajes vacíos
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

  // Detener el auto-draw: desactiva el flag y limpia el intervalo
  const stopAutoDraw = useCallback(() => {
    setAutoDraw(false);
    if (autoDrawRef.current) {
      clearInterval(autoDrawRef.current); // Cancelar el setInterval activo
      autoDrawRef.current = null;
    }
  }, []);

  // Alternar auto-draw: si está activo lo detiene, si no lo activa
  const toggleAutoDraw = useCallback(() => {
    if (autoDraw) {
      stopAutoDraw();
    } else {
      setAutoDraw(true); // El useEffect de abajo se encarga de crear el setInterval
    }
  }, [autoDraw, stopAutoDraw]);

  // Copiar el código de sala al portapapeles con feedback temporal
  const handleCopyCode = useCallback(() => {
    navigator.clipboard.writeText(gameId);
    setCopied(true); // Mostrar check verde
    setTimeout(() => setCopied(false), 2000); // Volver al icono normal después de 2s
  }, [gameId]);

  // Cambiar el intervalo del auto-draw (clampeado entre 1 y 60 segundos)
  const handleAutoDrawIntervalChange = useCallback(
    (value: string) => {
      const v = Math.max(1, Math.min(60, Number(value) || 1)); // Clamp: mínimo 1s, máximo 60s
      setAutoDrawInterval(v);
    },
    [],
  );

  // Navegar a la página principal
  const goHome = useCallback(() => router.push('/'), [router]);

  // Actualizar cantidad de cartones por jugador (solo local)
  const handleCardsPerPlayerChange = useCallback(
    (value: number) => {
      const numCards = Math.max(1, Math.min(10, Math.floor(value || 1)));
      setCardsPerPlayer(numCards);
    },
    [],
  );

  // Aplicar la cantidad de cartones por jugador al servidor
  const applyCardsPerPlayer = useCallback(() => {
    if (!socket || game?.status !== 'waiting' || applyingCards) return;
    setApplyingCards(true);
    socket.emit('game:update-cards-per-player', {
      gameId,
      token: getToken(),
      cardsPerPlayer,
    });
  }, [socket, game?.status, gameId, getToken, cardsPerPlayer, applyingCards]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO: Auto-draw (sacar balotas automáticamente)
  //
  // Crea un setInterval que emite 'game:draw' cada X segundos.
  // Se activa cuando autoDraw=true y la partida está en "playing".
  // Se detiene automáticamente si:
  //   - El admin desactiva el auto-draw
  //   - La partida cambia de estado (ej: alguien gana)
  //   - El socket se desconecta
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    // Si el auto-draw no está activo o la partida no está en curso, limpiar intervalo
    if (!autoDraw || !socket || game?.status !== 'playing') {
      if (autoDrawRef.current) {
        clearInterval(autoDrawRef.current);
        autoDrawRef.current = null;
      }
      return;
    }

    // Crear intervalo que saca balota cada autoDrawInterval segundos
    autoDrawRef.current = setInterval(() => {
      if (!drawingLockRef.current) { // Solo si no hay otra balota en curso
        drawingLockRef.current = true;
        setDrawing(true);
        socket.emit('game:draw', { gameId, token: getToken() });
        drawingTimeoutRef.current = setTimeout(() => { // Timeout de seguridad por si no responde
          drawingLockRef.current = false;
          setDrawing(false);
        }, ACTION_TIMEOUT);
      }
    }, autoDrawInterval * 1000); // Convertir segundos a milisegundos

    // Cleanup: limpiar intervalo al desmontarse o cambiar dependencias
    return () => {
      if (autoDrawRef.current) {
        clearInterval(autoDrawRef.current);
        autoDrawRef.current = null;
      }
    };
  }, [autoDraw, autoDrawInterval, socket, gameId, getToken, game?.status]);

  // ═══════════════════════════════════════════════════════════
  // RETORNO — Todo lo que la vista (page.tsx) necesita
  // Organizado por categoría para fácil localización
  // ═══════════════════════════════════════════════════════════
  return {
    // ─── Routing ────────────────────────────────────────────
    gameId, // ID de la partida (para mostrar código de sala)
    goHome, // Navegar al inicio

    // ─── Conexión ───────────────────────────────────────────
    isConnected, // Badge verde/rojo en el header
    isReconnecting, // Icono de spinner en el badge
    reconnectFailed, // Mostrar botón "Reintentar"
    manualReconnect, // Handler del botón "Reintentar"

    // ─── Sonido ─────────────────────────────────────────────
    soundEnabled, // Icono de volumen on/off
    toggleSound, // Handler del botón de volumen

    // ─── Estado del juego ───────────────────────────────────
    game, // Datos completos (status, calledNumbers, winners, round, type, name)
    players, // Lista de jugadores con online/offline
    error, // Error fatal para pantalla de error
    loading, // Spinner de carga inicial
    lastNumber, // Última balota para animación

    // ─── Estado de acciones (spinners de botones) ───────────
    drawing, // Spinner en "Sacar balota"
    starting, // Spinner en "Iniciar partida"
    restarting, // Spinner en "Iniciar ronda X"
    finishing, // Spinner en "Confirmar finalización"
    sendingMessage, // Spinner en botón de enviar mensaje

    // ─── Estado de UI (visibilidad y feedback) ──────────────
    copied, // Check verde "¡Copiado!"
    restartType, // Tipo de juego seleccionado
    setRestartType, // Setter para el select de tipo de juego
    showRestart, // Visibilidad del panel de reinicio
    setShowRestart, // Toggle del panel de reinicio
    showFinish, // Visibilidad de la confirmación de finalizar
    setShowFinish, // Toggle de la confirmación
    actionError, // Mensaje de error temporal (alerta dismissable)
    setActionError, // Para poder cerrar la alerta desde la vista
    bingoAttempt, // Info del intento de bingo (nombre + válido/falso)
    messageText, // Valor del input de mensaje
    setMessageText, // Setter para el input
    messageSent, // Feedback "¡Enviado!"
    autoDraw, // Si el auto-draw está activo
    autoDrawInterval, // Intervalo actual en segundos
    cardsPerPlayer, // Cantidad de cartones por jugador
    applyingCards, // Loading al aplicar cambio de cartones
    handleCardsPerPlayerChange, // Cambiar cantidad de cartones (local)
    applyCardsPerPlayer, // Aplicar cantidad al servidor
    handleAutoDrawIntervalChange, // Cambiar intervalo con validación

    // ─── Handlers (acciones de la vista) ────────────────────
    handleStart, // Iniciar partida
    handleDraw, // Sacar balota manualmente
    handleRestart, // Reiniciar con nueva ronda
    handleFinish, // Finalizar ronda sin ganador
    handleSendMessage, // Enviar mensaje global
    toggleAutoDraw, // Activar/desactivar auto-draw
    handleCopyCode, // Copiar código de sala
  };
}
