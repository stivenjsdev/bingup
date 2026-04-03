// Directiva de Next.js: indica que este archivo solo se ejecuta en el navegador (cliente)
"use client";

// Hooks de React necesarios para manejar efectos, referencias, estado y funciones memorizadas
import { useEffect, useRef, useState, useCallback } from "react";
// 'io' crea la conexión WebSocket; 'Socket' es el tipo TypeScript del socket
import { io, Socket } from "socket.io-client";

// Instancia global del socket compartida entre todos los componentes que usen este hook.
// Se declara fuera del hook para que persista entre re-renders y no se creen múltiples conexiones.
let globalSocket: Socket | null = null;

/**
 * Hook personalizado que provee una única instancia de Socket.IO compartida entre componentes.
 * Incluye estado de conexión y funcionalidad de reconexión manual.
 *
 * USO: const { socket, isConnected, manualReconnect } = useSocket();
 *
 * RETORNA:
 *  - socket: la instancia del socket para emitir/escuchar eventos
 *  - isConnected: true si hay conexión activa con el servidor
 *  - isReconnecting: true mientras se intenta reconectar automáticamente
 *  - reconnectFailed: true si todos los intentos de reconexión fallaron
 *  - manualReconnect: función para reintentar la conexión manualmente (ej: botón "Reintentar")
 *  - connected: alias de isConnected (para compatibilidad con código existente)
 */
export function useSocket() {
  // Estado que indica si el socket está conectado al servidor
  const [isConnected, setIsConnected] = useState(false);
  // Estado que indica si se está intentando reconectar automáticamente
  const [isReconnecting, setIsReconnecting] = useState(false);
  // Estado que indica si la reconexión automática falló después de todos los intentos
  const [reconnectFailed, setReconnectFailed] = useState(false);
  // Ref para almacenar la referencia al socket sin causar re-renders al asignarla
  const socketRef = useRef<Socket | null>(null);

  // Función para reconectar manualmente (ej: cuando el usuario presiona un botón "Reintentar conexión")
  // Se usa useCallback para evitar recrear la función en cada render
  const manualReconnect = useCallback(() => {
    // Solo intenta reconectar si el socket existe pero NO está conectado
    if (globalSocket && !globalSocket.connected) {
      setReconnectFailed(false);   // Limpia el estado de fallo previo
      setIsReconnecting(true);     // Indica que se está intentando reconectar
      globalSocket.connect();      // Inicia la reconexión al servidor
    }
  }, []);

  // Efecto que se ejecuta UNA sola vez al montar el componente ([] = sin dependencias)
  useEffect(() => {
    // Si no existe una instancia global del socket, la crea con la configuración de reconexión
    if (!globalSocket) {
      globalSocket = io({
        reconnectionAttempts: 3,       // Máximo 3 intentos de reconexión automática antes de rendirse
        reconnectionDelay: 1000,       // Espera 1 segundo entre cada intento de reconexión
        reconnectionDelayMax: 5000,    // Máximo 5 segundos de espera entre intentos (crece progresivamente)
      });
    }

    // Variable local para facilitar el uso dentro del efecto
    const socket = globalSocket;
    // Guarda la referencia del socket en el ref para exponerla a los componentes
    socketRef.current = socket;

    // --- Handlers de eventos del socket ---

    // Se ejecuta cuando el socket se conecta exitosamente al servidor
    const onConnect = () => {
      setIsConnected(true);        // Marca como conectado
      setIsReconnecting(false);    // Ya no está reconectando
      setReconnectFailed(false);   // Limpia cualquier error previo de reconexión
    };

    // Se ejecuta cuando el socket pierde la conexión con el servidor
    const onDisconnect = () => {
      setIsConnected(false);       // Marca como desconectado
    };

    // Se ejecuta cada vez que Socket.IO intenta reconectarse automáticamente
    const onReconnectAttempt = () => {
      setIsReconnecting(true);     // Indica que hay un intento de reconexión en curso
    };

    // Se ejecuta cuando Socket.IO agotó todos los intentos de reconexión sin éxito
    const onReconnectFailed = () => {
      setIsReconnecting(false);    // Ya no está intentando reconectar
      setReconnectFailed(true);    // Marca que la reconexión falló (se puede mostrar botón de reintento)
    };

    // Se ejecuta cuando Socket.IO logra reconectarse exitosamente después de una desconexión
    const onReconnect = () => {
      setIsReconnecting(false);    // Ya no está reconectando
      setReconnectFailed(false);   // Limpia el estado de fallo
    };

    // --- Registro de listeners de eventos ---

    // Eventos del socket (conexión directa)
    socket.on("connect", onConnect);            // Escucha conexión exitosa
    socket.on("disconnect", onDisconnect);      // Escucha desconexión
    // Eventos del manager de Socket.IO (manejo de reconexión automática)
    socket.io.on("reconnect_attempt", onReconnectAttempt);  // Escucha intentos de reconexión
    socket.io.on("reconnect_failed", onReconnectFailed);    // Escucha fallo total de reconexión
    socket.io.on("reconnect", onReconnect);                 // Escucha reconexión exitosa

    // Si el socket ya estaba conectado antes de montar este componente, sincroniza el estado
    if (socket.connected) {
      setIsConnected(true);
    }

    // Función de limpieza: se ejecuta cuando el componente se desmonta.
    // Remueve todos los listeners para evitar fugas de memoria (memory leaks).
    // NOTA: No se destruye el socket porque es global y otros componentes pueden seguir usándolo.
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.io.off("reconnect_attempt", onReconnectAttempt);
      socket.io.off("reconnect_failed", onReconnectFailed);
      socket.io.off("reconnect", onReconnect);
    };
  }, []);

  // Retorna el socket y los estados de conexión para que los componentes los consuman
  return {
    socket: socketRef.current,       // Instancia del socket para emitir/escuchar eventos personalizados
    isConnected,                     // true = conectado al servidor
    isReconnecting,                  // true = intentando reconectar
    reconnectFailed,                 // true = reconexión falló (mostrar UI de reintento)
    manualReconnect,                 // Función para reconectar manualmente desde la UI
    connected: isConnected,          // Alias de isConnected para compatibilidad con código anterior
  };
}
