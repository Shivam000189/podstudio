import { useEffect, useState, useCallback } from "react";
import { Socket } from "socket.io-client";

export type ChatMessage = {
  id: string;
  from: string;
  senderName: string;
  text: string;
  timestamp: string;
  isLocal?: boolean;
};

const MAX_MESSAGE_LENGTH = 2000;

export function useChat(socket: Socket | null, roomId: string | undefined, myName: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on("chat-message", handleIncoming);
    return () => {
      socket.off("chat-message", handleIncoming);
    };
  }, [socket]);

  // Reset chat state when leaving/switching rooms
  useEffect(() => {
    setMessages([]);
    setUnreadCount(0);
  }, [roomId]);

  const sendMessage = useCallback(
    (rawText: string) => {
      const text = rawText.trim().slice(0, MAX_MESSAGE_LENGTH);
      if (!socket || !roomId || !text) return;

      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        from: socket.id || "me",
        senderName: myName,
        text,
        timestamp: new Date().toISOString(),
        isLocal: true,
      };

      setMessages((prev) => [...prev, localMsg]);
      socket.emit("chat-message", { roomId, text, senderName: myName });
    },
    [socket, roomId, myName]
  );

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return { messages, sendMessage, unreadCount, clearUnread };
}
