"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

export default function Home() {
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("message", (data: string) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (input.trim() && socketRef.current) {
      socketRef.current.emit("message", input);
      setInput("");
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 font-sans">
      <h1 className="text-3xl font-bold">Socket.IO Demo</h1>
      <p className={connected ? "text-green-500" : "text-red-500"}>
        {connected ? "🟢 Conectado" : "🔴 Desconectado"}
      </p>

      <div className="flex gap-2">
        <input
          className="rounded border border-zinc-300 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={sendMessage}
        >
          Enviar
        </button>
      </div>

      <div className="w-full max-w-md rounded border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-2 font-semibold">Mensajes:</h2>
        {messages.length === 0 ? (
          <p className="text-zinc-400">Sin mensajes aún...</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {messages.map((msg, i) => (
              <li key={i} className="rounded bg-zinc-100 px-3 py-1 dark:bg-zinc-800">
                {msg}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
