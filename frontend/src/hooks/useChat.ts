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
  const [messages, setMessages] = useState<BackendMessage[]>([]);//stocker les messages de la conversation courante et l'historique des messages entre userId et otherUserId de cette conversation
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);//liste des conversations admin <=> utilisateurs avec le dernier message de chaque conversation pour affichage dans la liste des conversations
  const [isConnected, setIsConnected] = useState(false);//indique si user est connecté
  const [isLoading, setIsLoading] = useState(false);//initialement mise à false, quand le front execute fetchConversation, elle est mise à true et le front indique " chargement..." à l'utilisateur, une fois les messages chargés elle est remise à false et les messages s'affichent
  const socketRef = useRef<Socket | null>(null);//stocke la référence du socket pour pouvoir l'utiliser dans les callbacks et les effets

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
//ouvrir une connexion websocket avec le backend dont l'url est specifié 
    const socket = io(getBackendBaseUrl(), { transports: ["websocket"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      // Register userId with the server (simulated auth)
      socket.emit("register", userId);//envoyer au backend, nom de l'event et l'id de l'utilisateur qui se connecte
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("newMessage", (msg: BackendMessage) => {//quand le serveur reçoit un message 
      setMessages((prev) => {
        //remplacer le message optimiste (clientTempId) par le message réel avec id généré par le backend, ou ajouter le message s'il n'existe pas déjà dans la liste (cas où c'est un message reçu de l'autre utilisateur)
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
      if (error.clientTempId !== undefined) {//si echec d'envoie, supprimez le msg de liste des messages pour cette conversation
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

  // recharger les msgs si une conv change
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
      setMessages((prev) => [...prev, optimisticMsg]);//ajouter le message optimiste à la liste des messages pour affichage immédiat

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
          //remplacement par le vrai message uniquement pour rest, car websockets remplacement est traité par newMessage 
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
