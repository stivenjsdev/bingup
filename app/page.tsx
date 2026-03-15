"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

interface ChatMessage {
  _id: string;
  content: string;
  socketId: string;
  createdAt: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    // Load persisted messages on connect
    socket.on("initial-messages", (data: ChatMessage[]) => {
      setMessages(data);
    });

    // New real-time message
    socket.on("message", (data: ChatMessage) => {
      setMessages((prev) => [...prev, data]);
    });

    socket.on("error-message", (err: string) => {
      console.error("Server error:", err);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (input.trim() && socketRef.current) {
      socketRef.current.emit("message", input.trim());
      setInput("");
    }
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 font-sans">
      <h1 className="text-3xl font-bold">Socket.IO + MongoDB Demo</h1>
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
          maxLength={500}
        />
        <button
          className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          onClick={sendMessage}
        >
          Enviar
        </button>
      </div>

      <div className="w-full max-w-md rounded border border-zinc-200 p-4 dark:border-zinc-700">
        <h2 className="mb-2 font-semibold">
          Mensajes {messages.length > 0 && `(${messages.length})`}:
        </h2>
        <div className="max-h-80 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-zinc-400">Sin mensajes aún...</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {messages.map((msg) => (
                <li
                  key={msg._id}
                  className="rounded bg-zinc-100 px-3 py-1 dark:bg-zinc-800"
                >
                  <span className="text-xs text-zinc-400">
                    {formatTime(msg.createdAt)}
                  </span>{" "}
                  {msg.content}
                </li>
              ))}
            </ul>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
}
