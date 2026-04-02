"use client";

import { useCallback, useRef, useEffect } from "react";
import useSound from "use-sound";
import { useSoundContext } from "@/app/contexts/SoundContext";

// Rutas de los archivos de sonido (deben estar en /public/sounds/)
const SOUNDS = {
  // Eventos de balota
  ballCalled: "/sounds/ball-called.mp3", // Cuando se canta una balota
  ballDraw: "/sounds/ball-draw.mp3", // Cuando el admin saca una balota (efecto de máquina)

  // Marcado de números
  mark: "/sounds/mark.mp3", // Click al marcar un número

  // Bingo
  bingoCalled: "/sounds/bingo-called.mp3", // Cuando alguien canta bingo
  bingoWin: "/sounds/bingo-win.mp3", // ¡Ganaste! Fanfarria
  bingoFalse: "/sounds/bingo-false.mp3", // Bingo falso (buzzer)

  // Partida
  gameStart: "/sounds/game-start.mp3", // Iniciar partida
  gameEnd: "/sounds/game-end.mp3", // Finalizar partida

  // Cartón
  cardShuffle: "/sounds/card-shuffle.mp3", // Cambiar cartón

  // Notificaciones
  playerJoin: "/sounds/player-join.mp3", // Jugador se une
  playerLeave: "/sounds/player-leave.mp3", // Jugador se va
  adminMessage: "/sounds/admin-message.mp3", // Mensaje del administrador

  // UI
  click: "/sounds/click.mp3", // Click genérico
  success: "/sounds/success.mp3", // Acción exitosa
  error: "/sounds/error.mp3", // Error genérico
} as const;

type SoundName = keyof typeof SOUNDS;

/**
 * Hook para reproducir efectos de sonido en el juego de Bingo.
 * Los sonidos se pueden activar/desactivar globalmente con useSoundContext.
 */
export function useSoundEffects() {
  const { soundEnabled } = useSoundContext();
  
  // Refs para almacenar las funciones de play
  const soundsRef = useRef<Map<SoundName, () => void>>(new Map());
  const loadedRef = useRef<Set<SoundName>>(new Set());

  // Pre-cargar sonidos principales
  const [playBallCalled] = useSound(SOUNDS.ballCalled, { volume: 0.6 });
  const [playBallDraw] = useSound(SOUNDS.ballDraw, { volume: 0.3 });
  const [playMark] = useSound(SOUNDS.mark, { volume: 0.4 });
  const [playBingoCalled] = useSound(SOUNDS.bingoCalled, { volume: 0.7 });
  const [playBingoWin] = useSound(SOUNDS.bingoWin, { volume: 0.5 });
  const [playBingoFalse] = useSound(SOUNDS.bingoFalse, { volume: 0.1 });
  const [playGameStart] = useSound(SOUNDS.gameStart, { volume: 0.2 });
  const [playGameEnd] = useSound(SOUNDS.gameEnd, { volume: 0.5 });
  const [playCardShuffle] = useSound(SOUNDS.cardShuffle, { volume: 0.5 });
  const [playPlayerJoin] = useSound(SOUNDS.playerJoin, { volume: 0.4 });
  const [playPlayerLeave] = useSound(SOUNDS.playerLeave, { volume: 0.4 });
  const [playAdminMessage] = useSound(SOUNDS.adminMessage, { volume: 0.6 });
  const [playClick] = useSound(SOUNDS.click, { volume: 0.3 });
  const [playSuccess] = useSound(SOUNDS.success, { volume: 0.5 });
  const [playError] = useSound(SOUNDS.error, { volume: 0.5 });

  // Mapear nombres a funciones de play
  useEffect(() => {
    soundsRef.current.set("ballCalled", playBallCalled);
    soundsRef.current.set("ballDraw", playBallDraw);
    soundsRef.current.set("mark", playMark);
    soundsRef.current.set("bingoCalled", playBingoCalled);
    soundsRef.current.set("bingoWin", playBingoWin);
    soundsRef.current.set("bingoFalse", playBingoFalse);
    soundsRef.current.set("gameStart", playGameStart);
    soundsRef.current.set("gameEnd", playGameEnd);
    soundsRef.current.set("cardShuffle", playCardShuffle);
    soundsRef.current.set("playerJoin", playPlayerJoin);
    soundsRef.current.set("playerLeave", playPlayerLeave);
    soundsRef.current.set("adminMessage", playAdminMessage);
    soundsRef.current.set("click", playClick);
    soundsRef.current.set("success", playSuccess);
    soundsRef.current.set("error", playError);
  }, [
    playBallCalled, playBallDraw, playMark, playBingoCalled, playBingoWin,
    playBingoFalse, playGameStart, playGameEnd, playCardShuffle,
    playPlayerJoin, playPlayerLeave, playAdminMessage, playClick, playSuccess, playError
  ]);

  // Función para reproducir un sonido por nombre
  const play = useCallback((soundName: SoundName) => {
    if (!soundEnabled) return;
    
    const playFn = soundsRef.current.get(soundName);
    if (playFn) {
      try {
        playFn();
      } catch (e) {
        // Ignorar errores de reproducción (ej: autoplay bloqueado)
        console.debug(`No se pudo reproducir sonido: ${soundName}`, e);
      }
    }
  }, [soundEnabled]);

  return {
    play,
    // Funciones específicas para conveniencia
    playBallCalled: useCallback(() => play("ballCalled"), [play]),
    playBallDraw: useCallback(() => play("ballDraw"), [play]),
    playMark: useCallback(() => play("mark"), [play]),
    playBingoCalled: useCallback(() => play("bingoCalled"), [play]),
    playBingoWin: useCallback(() => play("bingoWin"), [play]),
    playBingoFalse: useCallback(() => play("bingoFalse"), [play]),
    playGameStart: useCallback(() => play("gameStart"), [play]),
    playGameEnd: useCallback(() => play("gameEnd"), [play]),
    playCardShuffle: useCallback(() => play("cardShuffle"), [play]),
    playPlayerJoin: useCallback(() => play("playerJoin"), [play]),
    playPlayerLeave: useCallback(() => play("playerLeave"), [play]),
    playAdminMessage: useCallback(() => play("adminMessage"), [play]),
    playClick: useCallback(() => play("click"), [play]),
    playSuccess: useCallback(() => play("success"), [play]),
    playError: useCallback(() => play("error"), [play]),
  };
}
