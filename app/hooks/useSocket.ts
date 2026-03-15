"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";

let globalSocket: Socket | null = null;

/**
 * Hook que provee una única instancia de Socket.IO compartida entre componentes.
 * Incluye estado de conexión y funcionalidad de reconexión manual.
 */
export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectFailed, setReconnectFailed] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Reconexión manual
  const manualReconnect = useCallback(() => {
    if (globalSocket && !globalSocket.connected) {
      setReconnectFailed(false);
      setIsReconnecting(true);
      globalSocket.connect();
    }
  }, []);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io({
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    const socket = globalSocket;
    socketRef.current = socket;

    const onConnect = () => {
      setIsConnected(true);
      setIsReconnecting(false);
      setReconnectFailed(false);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    const onReconnectAttempt = () => {
      setIsReconnecting(true);
    };

    const onReconnectFailed = () => {
      setIsReconnecting(false);
      setReconnectFailed(true);
    };

    const onReconnect = () => {
      setIsReconnecting(false);
      setReconnectFailed(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.io.on("reconnect_attempt", onReconnectAttempt);
    socket.io.on("reconnect_failed", onReconnectFailed);
    socket.io.on("reconnect", onReconnect);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.io.off("reconnect", onReconnect);
    };
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    reconnectFailed,
    manualReconnect,
    // Alias para compatibilidad
    connected: isConnected,
  };
}
