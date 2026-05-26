"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { buildBackendUrl, getBackendBaseUrl } from "@/lib/backend";

export interface BackendMessage {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  createdAt: string;
  sender?: { id: number; name: string; role: string };
  clientTempId?: number;
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
      const res = await fetch(buildBackendUrl(`/messages/conversation/${user1Id}/${user2Id}`));
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
      const res = await fetch(buildBackendUrl(`/messages/list/${userId}`));
      const data = await res.json();
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erreur chargement liste conversations:", err);
    }
  }, [userId]);

  // Connect socket and register user
  useEffect(() => {
    if (!userId) return;

    const socket = io(getBackendBaseUrl(), { transports: ["websocket"] });
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
      setMessages((prev) => {
        const withoutOptimistic =
          msg.clientTempId !== undefined
            ? prev.filter((m) => m.id !== msg.clientTempId)
            : prev;

        // Only add the message if it's not already in the current list
        const alreadyExists = withoutOptimistic.some((m) => m.id === msg.id);
        if (alreadyExists) return withoutOptimistic;
        return [...withoutOptimistic, msg];
      });
      // Refresh conversation list for admin
      fetchConversationsList();
    });

    socket.on("chatError", (error: { message?: string; clientTempId?: number }) => {
      if (error.clientTempId !== undefined) {
        setMessages((prev) => prev.filter((m) => m.id !== error.clientTempId));
      }
      if (error.message) {
        console.error("Erreur chat:", error.message);
      }
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

      const clientTempId = -Date.now();

      // Optimistic update: add message immediately to the UI
      const optimisticMsg: BackendMessage = {
        id: clientTempId,
        content,
        senderId: userId,
        receiverId,
        createdAt: new Date().toISOString(),
        sender: undefined,
      };
      setMessages((prev) => [...prev, optimisticMsg]);

      // Send via WebSocket (server saves to DB and emits to receiver/sender)
      if (socketRef.current?.connected) {
        socketRef.current.emit("sendMessage", {
          senderId: userId,
          receiverId,
          content,
          clientTempId,
        });
      } else {
        // Fallback: use REST API if socket is not connected
        try {
          const response = await fetch(buildBackendUrl("/messages"), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ senderId: userId, receiverId, content }),
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { message?: string } | null;
            throw new Error(payload?.message || "Échec envoi message");
          }

          const saved = (await response.json()) as BackendMessage;
          setMessages((prev) => {
            const withoutOptimistic = prev.filter((m) => m.id !== clientTempId);
            const alreadyExists = withoutOptimistic.some((m) => m.id === saved.id);
            if (alreadyExists) return withoutOptimistic;
            return [...withoutOptimistic, saved];
          });
          fetchConversationsList();
        } catch (err) {
          setMessages((prev) => prev.filter((m) => m.id !== clientTempId));
          console.error("Erreur envoi message (REST fallback):", err);
        }
      }
    },
    [userId, fetchConversationsList]
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
