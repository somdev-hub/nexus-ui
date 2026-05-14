"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { chatWebSocketService, WebSocketConfig } from "@/lib/chat-websocket";
import { chatApiService } from "@/lib/chat-api";

interface UseChatWebSocketOptions {
  conversationId: string;
  orgId: string;
  userId: string;
  callbacksRef: React.RefObject<{
    onMessageReceived?: (message: any) => void;
    onTypingStatusChanged?: (status: boolean, userId: string) => void;
    onPresenceChanged?: (event: "joined" | "left", userId: string) => void;
    onError?: (error: string) => void;
  }>;
}

/**
 * Hook for managing WebSocket chat connections
 *
 * BFF Authentication Flow:
 * 1. Hook calls chatWebSocketService.connect()
 * 2. Service fetches token from /api/chat/ws-token endpoint
 * 3. Endpoint retrieves token from server-side session (HttpOnly cookies)
 * 4. Service uses token for WebSocket connection
 * 5. Token refresh handled automatically by service
 *
 * This ensures tokens are never exposed to browser JavaScript
 */

export function useChatWebSocket({
  userId,
  conversationId,
  orgId,
  callbacksRef
}: UseChatWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void)[]>([]);
  const mountedRef = useRef(true);
  const wsConfigRef = useRef<WebSocketConfig>({});

  const setConnectionErrorSafe = useCallback((error: string | null) => {
    setConnectionError((prev) => (prev === error ? prev : error));
  }, []);

  const cleanupSubscriptions = useCallback(() => {
    unsubscribeRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (error) {
        console.error("Error unsubscribing:", error);
      }
    });
    unsubscribeRef.current = [];
  }, []);

  useEffect(() => {
    // ✅ Don't connect if there's no conversation selected
    if (!conversationId) return;

    // ✅ FIX ISSUE #7 & #8: Update config ref with CURRENT callbacks BEFORE connecting
    wsConfigRef.current = {
      onConnect: () => {
        if (!mountedRef.current) return;
        setIsConnected(true);
        setConnectionErrorSafe(null);
        setupSubscriptions();
        notifyJoined();
      },
      onDisconnect: () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        cleanupSubscriptions();
      },
      onError: (error: string) => {
        if (!mountedRef.current) return;
        setConnectionErrorSafe(error);
        callbacksRef.current?.onError?.(error);
      }
    };

    const initializeConnection = async () => {
      try {
        await chatWebSocketService.connect(wsConfigRef.current);
      } catch (error) {
        if (!mountedRef.current) return;
        const errorMsg =
          error instanceof Error ? error.message : "Connection failed";
        setConnectionErrorSafe(errorMsg);
        callbacksRef.current?.onError?.(errorMsg);
      }
    };

    const setupSubscriptions = () => {
      const messageSub = chatWebSocketService.subscribe(
        `/topic/conversations/${conversationId}`,
        (message) => callbacksRef.current?.onMessageReceived?.(message)
      );
      if (messageSub) unsubscribeRef.current.push(messageSub);

      const typingSub = chatWebSocketService.subscribe(
        `/topic/conversations/${conversationId}/typing`,
        (event) => {
          if (event.eventType === "TYPING") {
            callbacksRef.current?.onTypingStatusChanged?.(true, event.userId);
          } else if (event.eventType === "STOP_TYPING") {
            callbacksRef.current?.onTypingStatusChanged?.(false, event.userId);
          }
        }
      );
      if (typingSub) unsubscribeRef.current.push(typingSub);

      const presenceSub = chatWebSocketService.subscribe(
        `/topic/conversations/${conversationId}/presence`,
        (event) => {
          if (event.eventType === "JOINED") {
            callbacksRef.current?.onPresenceChanged?.("joined", event.userId);
          } else if (event.eventType === "LEFT") {
            callbacksRef.current?.onPresenceChanged?.("left", event.userId);
          }
        }
      );
      if (presenceSub) unsubscribeRef.current.push(presenceSub);
    };

    const notifyJoined = () => {
      chatWebSocketService.send(`/app/chat/joined/${conversationId}`, {});
    };

    initializeConnection();

    return () => {
      mountedRef.current = false;
      cleanupSubscriptions();
      // Don't disconnect here if the service is a singleton shared across components.
      // Only notify "left" on intentional unmount.
      chatWebSocketService.send(`/app/chat/left/${conversationId}`, {});
    };
  }, [conversationId, setConnectionErrorSafe, cleanupSubscriptions]); // eslint-disable-line react-hooks/exhaustive-deps
  const sendMessage = (content: string): boolean => {
    if (!isConnected) {
      setConnectionErrorSafe("Not connected to chat");
      return false;
    }

    try {
      const success = chatWebSocketService.send("/app/chat/send", {
        conversationId,
        content,
        orgId
      });

      if (!success) {
        // Fallback to REST API
        const payload = {
          conversationId,
          content,
          orgId
        };
        chatApiService
          .sendMessage(userId, payload, Number(orgId))
          .catch((error) => {
            console.error("REST API fallback failed:", error);
            setConnectionErrorSafe("Failed to send message");
          });
      }
      // return true;
      return success;
    } catch (error) {
      console.error("Error sending message:", error);
      setConnectionErrorSafe("Failed to send message");
      return false;
    }
  };

  const notifyTyping = () => {
    if (!isConnected) return;

    try {
      chatWebSocketService.send("/app/chat/typing", {
        conversationId
      });
    } catch (error) {
      console.error("Error notifying typing:", error);
    }
  };

  const notifyStopTyping = () => {
    if (!isConnected) return;

    try {
      chatWebSocketService.send("/app/chat/typing/stop", {
        conversationId
      });
    } catch (error) {
      console.error("Error notifying stop typing:", error);
    }
  };

  const notifyLeft = () => {
    try {
      chatWebSocketService.send(`/app/chat/left/${conversationId}`, {});
    } catch (error) {
      console.error("Error notifying left:", error);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    isConnected,
    connectionError,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    notifyLeft
  };
}
