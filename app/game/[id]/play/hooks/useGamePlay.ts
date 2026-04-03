import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSocket } from '@/app/hooks/useSocket';
import { useSoundEffects } from '@/app/hooks/useSoundEffects';
import { useSoundContext } from '@/app/contexts/SoundContext';
import { GameData, PlayerData, PlayerNotification, AdminMessage } from '../types';
import { ACTION_TIMEOUT } from '../constants';

// Normaliza datos del jugador para compatibilidad con documentos antiguos
// que podrían tener `card`/`markedNumbers` en lugar de `cards`/`markedNumbersPerCard`
function normalizePlayer(p: any): PlayerData {
  return {
    ...p,
    cards: p.cards ?? (p.card ? [p.card] : []),
    markedNumbersPerCard: p.markedNumbersPerCard ?? (p.markedNumbers ? [p.markedNumbers] : []),
  };
}

// ─── Hook principal de la vista de jugador ────────────────────
// Centraliza TODA la lógica del jugador: conexión socket, estado
// del juego, cartón de bingo, marcado de números, acciones
// (cantar bingo, cambiar cartón), notificaciones y sonidos.
// ───────────────────────────────────────────────────────────────
export function useGamePlay() {
  // ─── Routing y navegación ─────────────────────────────────
  const params = useParams(); // Obtiene los parámetros dinámicos de la URL ([id])
  const router = useRouter(); // Para navegación programática (ej: volver al inicio)
  const gameId = params.id as string; // ID de la partida extraído de la URL /game/[id]/play

  // ─── Conexión en tiempo real (Socket.IO) ──────────────────
  // socket: instancia del socket para emitir/escuchar eventos
  // isConnected: si hay conexión activa con el servidor
  // isReconnecting: si está intentando reconectar automáticamente
  // reconnectFailed: si todos los intentos de reconexión fallaron
  // manualReconnect: función para reintentar conexión manualmente
  const { socket, isConnected, isReconnecting, reconnectFailed, manualReconnect } = useSocket();

  // ─── Sonidos ──────────────────────────────────────────────
  const { soundEnabled, toggleSound } = useSoundContext(); // Controla si los sonidos están activados/desactivados globalmente
  const sounds = useSoundEffects(); // Funciones para reproducir cada efecto de sonido

  // ═══════════════════════════════════════════════════════════
  // REF DE SONIDOS — Permite acceder a sounds dentro de useEffect
  // sin agregarlo como dependencia (evita re-suscripciones innecesarias)
  // ═══════════════════════════════════════════════════════════
  const soundsRef = useRef(sounds);
  soundsRef.current = sounds; // Se actualiza en cada render para tener siempre la referencia más reciente

  // ═══════════════════════════════════════════════════════════
  // ESTADO DEL JUEGO — Datos que vienen del servidor
  // ═══════════════════════════════════════════════════════════
  const [game, setGame] = useState<GameData | null>(null); // Datos completos de la partida (status, calledNumbers, round, type, name)
  const [player, setPlayer] = useState<PlayerData | null>(null); // Datos del jugador actual (cartón, números marcados, nombre)
  const [error, setError] = useState(''); // Error fatal (ej: sin sesión). Muestra pantalla de error
  const [loading, setLoading] = useState(true); // true mientras se establece la primera conexión. Muestra spinner
  const [lastNumber, setLastNumber] = useState<number | null>(null); // Última balota sacada, para mostrarla animada en la UI

  // ═══════════════════════════════════════════════════════════
  // ESTADO DE ACCIONES — Flags de "cargando" para cada acción
  // Mientras son true, el botón muestra spinner y se deshabilita
  // ═══════════════════════════════════════════════════════════
  const [callingBingo, setCallingBingo] = useState(false); // Cantando bingo (esperando respuesta del servidor)
  const [changingCard, setChangingCard] = useState(false); // Cambiando cartón (esperando nuevo cartón del servidor)

  // ═══════════════════════════════════════════════════════════
  // ESTADO DE UI — Controla visibilidad y comportamiento de la interfaz
  // ═══════════════════════════════════════════════════════════
  const [bingoResult, setBingoResult] = useState<'valid' | 'invalid' | null>(null); // Resultado del intento de bingo (alerta temporal)
  const [winnerInfo, setWinnerInfo] = useState<{ playerName: string; round: number } | null>(null); // Información del ganador cuando la partida finaliza
  const [cardAnimating, setCardAnimating] = useState(false); // Animación de cambio de cartón (flip 3D)
  const [cardsRefreshing, setCardsRefreshing] = useState(false); // Animación de actualización de cantidad de cartones

  // ═══════════════════════════════════════════════════════════
  // NOTIFICACIONES — Eventos de otros jugadores y mensajes del admin
  // ═══════════════════════════════════════════════════════════
  const [notifications, setNotifications] = useState<PlayerNotification[]>([]); // Cola de notificaciones de jugadores (unión/desconexión/reconexión)
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]); // Cola de mensajes globales del administrador

  // ═══════════════════════════════════════════════════════════
  // REFS PARA TRACKING DE JUGADORES — Detectar cambios en la lista
  // de jugadores para generar notificaciones.
  // Se usan refs porque no necesitan provocar re-renders.
  // ═══════════════════════════════════════════════════════════
  const playersRef = useRef<{ _id: string; name: string; online: boolean }[]>([]); // Lista previa de jugadores para comparar
  const isInitialLoadRef = useRef(true); // Ignorar la primera carga de jugadores (estado inicial, no es un cambio)
  const playerIdRef = useRef<string | null>(null); // ID del jugador actual para filtrar notificaciones propias
  const playerNameRef = useRef<string | null>(null); // Nombre del jugador actual para comparar en onWinner

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
  const bingoLockRef = useRef(false); // Lock para "cantar bingo"
  const changingCardLockRef = useRef(false); // Lock para "cambiar cartón"

  // ═══════════════════════════════════════════════════════════
  // TIMEOUTS DE SEGURIDAD — Desbloquean la acción si el servidor
  // no responde dentro de ACTION_TIMEOUT (3 segundos).
  // Sin estos, un error de red dejaría el botón bloqueado para siempre.
  // ═══════════════════════════════════════════════════════════
  const bingoTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout para cantar bingo
  const changingCardTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout para cambiar cartón

  // ─── Helper: Obtener token del jugador desde localStorage ─
  // Se guarda al unirse a la partida. Se usa en cada emisión de evento.
  const getToken = useCallback(
    () => localStorage.getItem(`player:${gameId}`) || '',
    [gameId],
  );

  // ─── Navegar a la página principal ────────────────────────
  const goHome = useCallback(() => router.push('/'), [router]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO: Notificar al servidor cuando el jugador sale de la página
  // Al desmontar el componente (cambio de ruta, cierre de tab),
  // emitimos "game:leave" para que el servidor marque al jugador
  // como offline inmediatamente (sin esperar el timeout de Socket.IO).
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    const token = getToken();
    return () => {
      if (socket && gameId && token) {
        socket.emit('game:leave', { gameId, token });
      }
    };
  }, [socket, gameId, getToken]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO: Re-autenticarse al reconectar
  // Cuando el socket se desconecta y vuelve a conectar (ej: WiFi
  // inestable), necesitamos volver a identificarnos como jugador
  // ante el servidor para seguir recibiendo eventos de la partida.
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (isConnected && socket && gameId && !loading) {
      const token = getToken();
      if (token) {
        socket.emit('game:reconnect-player', { gameId, token });
      }
    }
  }, [isConnected, socket, gameId, loading, getToken]);

  // ═══════════════════════════════════════════════════════════
  // EFECTO PRINCIPAL: Suscripción a todos los eventos del socket
  //
  // Este useEffect es el corazón del hook. Se encarga de:
  // 1. Emitir 'game:reconnect-player' para autenticarse
  // 2. Escuchar TODOS los eventos del servidor y actualizar el estado
  // 3. Limpiar los listeners al desmontarse (cleanup)
  //
  // Cada handler sigue el patrón:
  //   → Actualizar estado del juego/jugador
  //   → Desbloquear lock + limpiar timeout de seguridad
  //   → Reproducir sonido correspondiente
  // ═══════════════════════════════════════════════════════════
  useEffect(() => {
    if (!socket || !gameId) return; // Sin socket o sin ID no hacemos nada

    // Verificar que tengamos token de jugador en localStorage
    const token = getToken();
    if (!token) {
      setError('No tienes sesión de jugador para esta partida');
      setLoading(false);
      return;
    }

    // Autenticarse como jugador ante el servidor
    socket.emit('game:reconnect-player', { gameId, token });

    // ─── Evento: Cambios en la lista de jugadores ───────────
    // Se dispara cuando un jugador se une, desconecta o reconecta.
    // Compara la lista actual con la anterior para generar
    // notificaciones (Snackbars) de tipo join/leave/reconnect.
    const onPlayers = (players: { _id: string; name: string; online: boolean }[]) => {
      const prevPlayers = playersRef.current;

      // Ignorar la primera carga (estado inicial, no son cambios reales)
      if (isInitialLoadRef.current) {
        isInitialLoadRef.current = false;
        playersRef.current = players;
        return;
      }

      const newNotifications: PlayerNotification[] = [];

      // Detectar nuevos jugadores o cambios de estado online/offline
      for (const p of players) {
        // Ignorar notificaciones sobre uno mismo
        if (p._id === playerIdRef.current) continue;

        const prev = prevPlayers.find((pp) => pp._id === p._id);
        if (!prev) {
          // Jugador nuevo que se unió a la partida
          newNotifications.push({
            id: `${p._id}-join-${Date.now()}`,
            message: `${p.name} se unió a la partida`,
            type: 'join',
          });
        } else if (!prev.online && p.online) {
          // Jugador que se reconectó (estaba offline, ahora online)
          newNotifications.push({
            id: `${p._id}-reconnect-${Date.now()}`,
            message: `${p.name} se reconectó`,
            type: 'reconnect',
          });
        } else if (prev.online && !p.online) {
          // Jugador que se desconectó
          newNotifications.push({
            id: `${p._id}-leave-${Date.now()}`,
            message: `${p.name} se desconectó`,
            type: 'leave',
          });
        }
      }

      // Actualizar referencia para la próxima comparación
      playersRef.current = players;

      // Agregar notificaciones (máximo 3 visibles a la vez para no saturar)
      if (newNotifications.length > 0) {
        setNotifications((prev) => [...prev, ...newNotifications].slice(-3));
        // Reproducir sonido según el tipo de la primera notificación
        const firstType = newNotifications[0].type;
        if (firstType === 'join' || firstType === 'reconnect') {
          soundsRef.current.playPlayerJoin();
        } else if (firstType === 'leave') {
          soundsRef.current.playPlayerLeave();
        }
      }
    };

    // ─── Evento: Reconexión exitosa ─────────────────────────
    // El servidor confirma que somos jugador y nos envía el estado
    // actual completo (juego + datos del jugador). Útil al recargar la página.
    const onReconnected = (data: { role: string; game: GameData; player: PlayerData }) => {
      if (data.role === 'player') {
        setGame(data.game); // Sincronizar estado del juego
        setPlayer(normalizePlayer(data.player)); // Sincronizar datos del jugador (cartón, marcados)
        playerIdRef.current = data.player._id; // Guardar ID para filtrar notificaciones propias
        playerNameRef.current = data.player.name; // Guardar nombre para comparar en onWinner
        setLoading(false); // Ocultar spinner de carga
        // Si ya había balotas cantadas, mostrar la última
        if (data.game.calledNumbers.length > 0) {
          setLastNumber(data.game.calledNumbers[data.game.calledNumbers.length - 1]);
        }
      }
    };

    // ─── Evento: Partida iniciada ───────────────────────────
    // El admin inició la partida. Se resetean estados de ronda anterior.
    const onStarted = (gameData: GameData) => {
      setGame(gameData); // Actualizar datos del juego (status: 'playing')
      setWinnerInfo(null); // Limpiar ganador de ronda anterior
      setBingoResult(null); // Limpiar resultado de bingo anterior
      setCallingBingo(false); // Quitar spinner si quedó activo
      bingoLockRef.current = false; // Liberar lock al iniciar nueva partida
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current); // Cancelar timeout pendiente
      soundsRef.current.playGameStart(); // Sonido de inicio de partida
    };

    // ─── Evento: Nueva balota sacada ────────────────────────
    // El servidor envía el número sacado y la lista actualizada de números cantados
    const onNumber = (data: { number: number; calledNumbers: number[] }) => {
      setLastNumber(data.number); // Mostrar la balota animada
      setGame((prev) => (prev ? { ...prev, calledNumbers: data.calledNumbers } : prev)); // Actualizar lista de números cantados
      soundsRef.current.playBallCalled(); // Sonido de nueva balota
    };

    // ─── Evento: Hay un ganador ─────────────────────────────
    // Un jugador cantó bingo válido. La partida pasa a "finished".
    // Se reproduce sonido diferente según si el jugador actual ganó o no.
    const onWinner = (data: { playerName: string; round: number }) => {
      setGame((prev) => (prev ? { ...prev, status: 'finished' } : prev)); // Marcar partida como finalizada
      setWinnerInfo(data); // Guardar info del ganador para mostrar en la UI
      setCallingBingo(false); // Quitar spinner del botón bingo
      bingoLockRef.current = false; // Liberar lock
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current); // Cancelar timeout
      // Reproducir sonido según si ganamos nosotros o no
      if (data.playerName === playerNameRef.current) {
        soundsRef.current.playBingoWin(); // ¡Ganaste!
      } else {
        soundsRef.current.playBingoCalled(); // Otro jugador ganó
      }
    };

    // ─── Evento: Bingo inválido ─────────────────────────────
    // El servidor rechazó nuestro intento de bingo (no cumple condición)
    const onBingoInvalid = () => {
      setBingoResult('invalid'); // Mostrar alerta de bingo falso
      setCallingBingo(false); // Quitar spinner
      bingoLockRef.current = false; // Liberar lock
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current); // Cancelar timeout
      soundsRef.current.playBingoFalse(); // Sonido de bingo falso
      setTimeout(() => setBingoResult(null), 4000); // Ocultar alerta después de 4 segundos
    };

    // ─── Evento: Intento de bingo (broadcast) ───────────────
    // Recibido cuando CUALQUIER jugador intenta cantar bingo.
    // Si es nuestro intento y fue válido, actualizamos el estado.
    const onBingoAttempt = (data: { playerName: string; valid: boolean }) => {
      if (data.valid && data.playerName === player?.name) {
        setBingoResult('valid'); // Nuestro bingo fue correcto
        setCallingBingo(false); // Quitar spinner
        bingoLockRef.current = false; // Liberar lock
        if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current); // Cancelar timeout
      }
    };

    // ─── Evento: Ronda reiniciada ───────────────────────────
    // El admin inició una nueva ronda. Se resetea todo: cartones nuevos,
    // números marcados vacíos, sin ganador, sin resultados de bingo.
    const onRestarted = (data: {
      game: GameData;
      players: { _id: string; name: string; cards: number[][][]; markedNumbersPerCard: number[][] }[];
    }) => {
      setGame(data.game); // Nuevo estado del juego (ronda +1, status: 'waiting')
      setLastNumber(null); // Limpiar última balota
      setWinnerInfo(null); // Limpiar ganador
      setBingoResult(null); // Limpiar resultado de bingo
      setCallingBingo(false); // Quitar spinner
      bingoLockRef.current = false; // Liberar lock de bingo
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current); // Cancelar timeout
      // Buscar nuestros datos actualizados en la nueva ronda (nuevos cartones)
      const me = data.players.find((p) => p._id === player?._id);
      if (me) {
        setPlayer(normalizePlayer(me)); // Actualizar cartones y marcados
      }
    };

    // ─── Evento: Partida finalizada manualmente ─────────────
    // El admin forzó la finalización (sin ganador)
    const onFinished = (data: { game: GameData }) => {
      setGame(data.game); // Actualizar estado (status: 'finished')
      setCallingBingo(false); // Quitar spinner
      bingoLockRef.current = false; // Liberar lock
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current); // Cancelar timeout
      soundsRef.current.playGameEnd(); // Sonido de fin de partida
    };

    // ─── Evento: Cartón cambiado ────────────────────────────
    // El servidor envió un nuevo cartón aleatorio para un índice específico.
    // Se anima el cambio con un efecto de flip 3D (shuffleCard keyframe).
    const onCardChanged = (data: { card: number[][]; cardIndex: number }) => {
      // Cancelar timeout de seguridad porque recibimos respuesta
      if (changingCardTimeoutRef.current) clearTimeout(changingCardTimeoutRef.current);
      // Activar animación de flip
      setCardAnimating(true);
      soundsRef.current.playCardShuffle(); // Sonido de barajar
      // Actualizar cartón específico después de que inicie la animación (250ms delay)
      setTimeout(() => {
        setPlayer((prev) => {
          if (!prev) return prev;
          const newCards = [...prev.cards];
          const newMarked = [...prev.markedNumbersPerCard];
          newCards[data.cardIndex] = data.card;
          newMarked[data.cardIndex] = [];
          return { ...prev, cards: newCards, markedNumbersPerCard: newMarked };
        });
        setChangingCard(false); // Quitar spinner del botón
        changingCardLockRef.current = false; // Liberar lock
        // Desactivar animación al terminar (300ms más)
        setTimeout(() => setCardAnimating(false), 300);
      }, 250);
    };

    // ─── Evento: Cartones por jugador actualizados ──────────
    // El admin cambió la cantidad de cartones por jugador
    const onCardsPerPlayerUpdated = (data: {
      game: GameData;
      players: { _id: string; name: string; cards: number[][][]; markedNumbersPerCard: number[][] }[];
    }) => {
      setGame(data.game);
      const me = data.players.find((p) => p._id === playerIdRef.current);
      if (me) {
        const newCount = data.game.cardsPerPlayer || 1;
        // Notificar al jugador del cambio
        const msg: AdminMessage = {
          id: `cards-${Date.now()}`,
          content: newCount === 1
            ? 'El administrador cambió a 1 cartón por jugador'
            : `El administrador cambió a ${newCount} cartones por jugador`,
        };
        setAdminMessages((prev) => [...prev, msg].slice(-3));
        soundsRef.current.playAdminMessage();
        // Animación de refresh en el contenedor de cartones
        setCardsRefreshing(true);
        setTimeout(() => {
          setPlayer(normalizePlayer(me));
          setTimeout(() => setCardsRefreshing(false), 400);
        }, 200);
      }
    };

    // ─── Evento: Mensaje global del administrador ───────────
    // El admin envió un mensaje a todos los jugadores (Snackbar superior)
    const onGameMessage = (data: { content: string }) => {
      const msg: AdminMessage = {
        id: `msg-${Date.now()}`,
        content: data.content,
      };
      setAdminMessages((prev) => [...prev, msg].slice(-3)); // Máximo 3 visibles
      soundsRef.current.playAdminMessage(); // Sonido de mensaje
    };

    // ─── Evento: Sesión tomada por otra pestaña ───────────────
    // El servidor detectó que el mismo jugador se conectó desde
    // otra pestaña/ventana. Esta pestaña queda inactiva.
    const onSessionTaken = () => {
      setError('Tu sesión fue abierta en otra pestaña. Usa esa pestaña para continuar.');
      setLoading(false);
      // Resetear estado para deshabilitar toda interacción
      setCallingBingo(false);
      setChangingCard(false);
      bingoLockRef.current = false;
      changingCardLockRef.current = false;
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current);
      if (changingCardTimeoutRef.current) clearTimeout(changingCardTimeoutRef.current);
    };

    // ─── Evento: Error del servidor ─────────────────────────
    // Cualquier error emitido por el servidor. Resetea todos los
    // locks y spinners para que la UI no quede bloqueada.
    const onError = (msg: string) => {
      if (loading) {
        setError(msg); // Si estábamos cargando, mostrar pantalla de error
        setLoading(false);
      }
      // Resetear todos los estados de carga
      setCallingBingo(false);
      setChangingCard(false);
      // Liberar todos los locks
      bingoLockRef.current = false;
      changingCardLockRef.current = false;
      // Cancelar todos los timeouts de seguridad
      if (bingoTimeoutRef.current) clearTimeout(bingoTimeoutRef.current);
      if (changingCardTimeoutRef.current) clearTimeout(changingCardTimeoutRef.current);
    };

    // ─── Registrar todos los listeners del socket ───────────
    socket.on('game:reconnected', onReconnected);
    socket.on('game:started', onStarted);
    socket.on('game:number', onNumber);
    socket.on('game:winner', onWinner);
    socket.on('game:bingo-invalid', onBingoInvalid);
    socket.on('game:bingo-attempt', onBingoAttempt);
    socket.on('game:restarted', onRestarted);
    socket.on('game:finished', onFinished);
    socket.on('game:card-changed', onCardChanged);
    socket.on('game:cards-per-player-updated', onCardsPerPlayerUpdated);
    socket.on('game:players', onPlayers);
    socket.on('game:message', onGameMessage);
    socket.on('game:session-taken', onSessionTaken);
    socket.on('error', onError);

    // ─── Cleanup: Desregistrar listeners al desmontarse ─────
    // Evita memory leaks y que eventos de una partida anterior
    // actualicen el estado de una partida nueva
    return () => {
      socket.off('game:reconnected', onReconnected);
      socket.off('game:started', onStarted);
      socket.off('game:number', onNumber);
      socket.off('game:winner', onWinner);
      socket.off('game:bingo-invalid', onBingoInvalid);
      socket.off('game:bingo-attempt', onBingoAttempt);
      socket.off('game:restarted', onRestarted);
      socket.off('game:finished', onFinished);
      socket.off('game:card-changed', onCardChanged);
      socket.off('game:cards-per-player-updated', onCardsPerPlayerUpdated);
      socket.off('game:players', onPlayers);
      socket.off('game:message', onGameMessage);
      socket.off('game:session-taken', onSessionTaken);
      socket.off('error', onError);
    };
  }, [socket, gameId, getToken, loading, player?._id, player?.name]);

  // ═══════════════════════════════════════════════════════════
  // HANDLERS — Funciones que ejecuta la vista al interactuar
  //
  // handleMark: Marca un número en el cartón. No usa lock porque
  //   se actualiza localmente de forma inmediata (optimistic update)
  //   y no es una acción "pesada" que requiera esperar al servidor.
  //
  // handleBingo y handleChangeCard siguen el patrón de protección:
  // 1. Verificar que haya socket y que no esté bloqueado (lock)
  // 2. Activar lock inmediatamente (prevenir doble-clic)
  // 3. Activar spinner
  // 4. Reproducir sonido de clic
  // 5. Emitir evento al servidor con gameId + token
  // 6. Programar timeout de seguridad para desbloquear
  // ═══════════════════════════════════════════════════════════

  // Marcar un número en un cartón específico del jugador.
  // Solo permite marcar si: el juego está en curso, el número fue cantado,
  // no es la celda libre (0), y aún no está marcado en ese cartón.
  const handleMark = useCallback(
    (num: number, cardIndex: number) => {
      if (!socket || !game || game.status !== 'playing' || num === 0) return;
      if (!game.calledNumbers.includes(num)) return;
      const markedNums = player?.markedNumbersPerCard[cardIndex] || [];
      if (markedNums.includes(num)) return;

      socket.emit('game:mark', { gameId, number: num, token: getToken(), cardIndex });
      sounds.playMark();
      // Optimistic update: actualizar localmente sin esperar respuesta
      setPlayer((prev) => {
        if (!prev) return prev;
        const newMarked = [...prev.markedNumbersPerCard];
        newMarked[cardIndex] = [...(newMarked[cardIndex] || []), num];
        return { ...prev, markedNumbersPerCard: newMarked };
      });
    },
    [socket, game, player?.markedNumbersPerCard, gameId, getToken, sounds],
  );

  // Cantar ¡BINGO! — Envía el intento al servidor para validación.
  // Usa lock síncrono (useRef) porque useState es asíncrono y no previene
  // doble-clic rápido. El timeout de seguridad desbloquea si el servidor
  // no responde en ACTION_TIMEOUT milisegundos.
  const handleBingo = useCallback(() => {
    if (!socket || bingoLockRef.current || callingBingo) return; // Protección: sin socket, ya bloqueado, o ya en proceso
    bingoLockRef.current = true; // Bloquear inmediatamente (síncrono)
    setCallingBingo(true); // Activar spinner en el botón
    sounds.playClick(); // Feedback auditivo
    socket.emit('game:bingo', { gameId, token: getToken() }); // Pedir al servidor que valide

    // Timeout de seguridad: si el servidor no responde en 3s...
    bingoTimeoutRef.current = setTimeout(() => {
      bingoLockRef.current = false; // ...desbloquear
      setCallingBingo(false); // ...quitar spinner
    }, ACTION_TIMEOUT);
  }, [socket, callingBingo, gameId, getToken, sounds]);

  // Cambiar un cartón específico — Solo disponible en estado "waiting".
  // Pide al servidor un nuevo cartón aleatorio para el índice dado.
  const handleChangeCard = useCallback(
    (cardIndex: number) => {
      if (!socket || changingCardLockRef.current || changingCard || game?.status !== 'waiting') return;
      changingCardLockRef.current = true;
      setChangingCard(true);
      socket.emit('game:change-card', { gameId, token: getToken(), cardIndex });

      changingCardTimeoutRef.current = setTimeout(() => {
        changingCardLockRef.current = false;
        setChangingCard(false);
      }, ACTION_TIMEOUT);
    },
    [socket, changingCard, game?.status, gameId, getToken],
  );

  // Cerrar una notificación de jugador (join/leave/reconnect)
  // Filtra la notificación por su ID único de la cola
  const handleCloseNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Cerrar un mensaje global del administrador
  // Filtra el mensaje por su ID único de la cola
  const handleCloseAdminMessage = useCallback((id: string) => {
    setAdminMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // ═══════════════════════════════════════════════════════════
  // RETORNO — Todo lo que la vista (page.tsx) necesita
  // Organizado por categoría para fácil localización
  // ═══════════════════════════════════════════════════════════
  return {
    // ─── Routing ────────────────────────────────────────────
    gameId, // ID de la partida (para mostrar o compartir)
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
    game, // Datos completos (status, calledNumbers, round, type, name)
    player, // Datos del jugador (card, markedNumbers, name)
    error, // Error fatal para pantalla de error
    loading, // Spinner de carga inicial
    lastNumber, // Última balota para animación

    // ─── Estado de acciones (spinners de botones) ───────────
    callingBingo, // Spinner en "¡BINGO!"
    changingCard, // Spinner en "Cambiar cartón"

    // ─── Estado de UI (visibilidad y feedback) ──────────────
    bingoResult, // Resultado del intento de bingo ('valid' | 'invalid' | null)
    winnerInfo, // Info del ganador ({ playerName, round } | null)
    cardAnimating, // Animación de cambio de cartón
    cardsRefreshing, // Animación de actualización de cantidad de cartones
    notifications, // Cola de notificaciones de jugadores
    adminMessages, // Cola de mensajes del administrador

    // ─── Handlers (acciones de la vista) ────────────────────
    handleMark, // Marcar número en el cartón
    handleBingo, // Cantar ¡BINGO!
    handleChangeCard, // Pedir nuevo cartón aleatorio
    handleCloseNotification, // Cerrar notificación de jugador
    handleCloseAdminMessage, // Cerrar mensaje del admin
  };
}
