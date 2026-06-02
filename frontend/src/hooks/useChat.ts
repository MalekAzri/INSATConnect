"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

const BACKEND_URL = "http://localhost:3001";

export interface BackendMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender?: { id: number; name: string; role: string };
}

export interface ConversationSummary {
  user: { id: number; name: string; role: string };
  lastMessage: BackendMessage;
}

interface UseChatOptions {
  userId: number | null;
  otherUserId?: number | null;
}

export function useChat({ userId, otherUserId }: UseChatOptions) {
  const [messages, setMessages] = useState<BackendMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const fetchConversation = useCallback(async (user1Id: number, user2Id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/messages/conversation/${user1Id}/${user2Id}`);
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement conversation:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchConversationsList = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/messages/list/${userId}`);
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement liste conversations:", err);
    }
  }, [userId]);

  // Connect socket and register user
  useEffect(() => {
    if (!userId) return;

    const socket = io(BACKEND_URL, { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Register userId with the server (simulated auth)
      socket.emit("register", userId);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("newMessage", (msg: BackendMessage) => {
      // Only add the message if it belongs to the active conversation
      setMessages((prev) => {
        const alreadyExists = prev.some((m) => m.id === msg.id);
        if (alreadyExists) return prev;
        return [...prev, msg];
      });
      // Refresh conversation list for admin
      fetchConversationsList();
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, fetchConversationsList]);

  // Load conversation history when otherUserId changes
  useEffect(() => {
    if (userId && otherUserId) {
      fetchConversation(userId, otherUserId);
    }
  }, [userId, otherUserId, fetchConversation]);

  const sendMessage = useCallback(
    async (receiverId: number, content: string) => {
      if (!userId || !content.trim()) return;

      // Optimistic update: add message immediately to the UI
      const optimisticMsg: BackendMessage = {
        id: Date.now(), // temporary id
        content,
        senderId: userId,
        receiverId,
        createdAt: new Date().toISOString(),
        sender: undefined,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Send via WebSocket (server will save to DB and emit to receiver)
      if (socketRef.current?.connected) {
        socketRef.current.emit("sendMessage", { senderId: userId, receiverId, content });
      } else {
        // Fallback: use REST API if socket is not connected
        try {
          await fetch(`${BACKEND_URL}/messages`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: userId, receiverId, content }),
          });
        } catch (err) {
          console.error("Erreur envoi message (REST fallback):", err);
        }
      }
    },
    [userId]
  );

  return {
    messages,
    conversations,
    isConnected,
    isLoading,
    sendMessage,
    fetchConversationsList,
    fetchConversation,
  };
}
