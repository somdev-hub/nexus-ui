"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { chatWebSocketService, WebSocketConfig } from "@/lib/chat-websocket";
import {
  chatApiService,
  ChatMessage,
  CreateMessagePayload
} from "@/lib/chat-api";

interface UseChatWebSocketOptions {
  conversationId: number | null;
  orgId: number;
  participantId: number;
  callbacksRef: React.RefObject<{
    onMessageReceived?: (message: ChatMessage) => void;
    onTypingStatusChanged?: (isTyping: boolean, userId: number) => void;
    onPresenceStatusChanged?: (
      userId: number,
      status: "online" | "offline"
    ) => void;
    onError?: (error: string) => void;
  }>;
}

/**
 * Hook for managing WebSocket chat connections (v2 architecture)
 *
 * Connection Flow:
 * 1. Fetch JWT token from /api/chat/ws-token (BFF pattern, uses session)
 * 2. Connect to ws://localhost:8086/ws with token in CONNECT headers
 * 3. Subscribe to /topic/conversations/{id} for incoming messages
 * 4. Send messages to /app/cms/chat/ws/message
 * 5. Send typing indicators to /app/cms/chat/ws/typing/{id}
 * 6. Send ACK to /app/cms/chat/ws/ack for read receipts
 * 7. Send heartbeat to /app/heartbeat for presence
 *
 * Fallback Strategy:
 * - If WebSocket send fails → Use REST API (POST /iam/chat/v2/message)
 * - If WebSocket connection fails → Show error & disable WebSocket UI
 * - Reconnect automatically with exponential backoff
 */

export function useChatWebSocket({
  conversationId,
  orgId,
  participantId,
  callbacksRef
}: UseChatWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const unsubscribeRef = useRef<(() => void)[]>([]);
  const mountedRef = useRef(true);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsConfigRef = useRef<WebSocketConfig>({});

  /**
   * Safe state updates for unmounted components
   */
  const setIsConnectedSafe = useCallback((value: boolean) => {
    if (mountedRef.current) setIsConnected(value);
  }, []);

  const setConnectionErrorSafe = useCallback((error: string | null) => {
    if (mountedRef.current) {
      setConnectionError((prev) => (prev === error ? prev : error));
    }
  }, []);

  /**
   * Cleanup all subscriptions
   */
  const cleanupSubscriptions = useCallback(() => {
    unsubscribeRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (error) {
        console.error("[CHAT HOOK] Error unsubscribing:", error);
      }
    });
    unsubscribeRef.current = [];
  }, []);

  /**
   * Stop heartbeat (declare early, no dependencies)
   */
  const stopHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
      heartbeatTimeoutRef.current = null;
    }
  }, []);

  /**
   * Heartbeat to keep user marked as online
   */
  const startHeartbeat = useCallback(() => {
    stopHeartbeat(); // Clear any existing heartbeat
    console.log("[CHAT HOOK] Starting heartbeat");

    const sendHeartbeat = () => {
      if (!mountedRef.current || !isConnected) {
        console.log("[CHAT HOOK] Heartbeat stopped");
        return;
      }

      const success = chatWebSocketService.send("/app/heartbeat", {
        timestamp: new Date().toISOString(),
        userId: participantId
      });

      if (success) {
        console.log("[CHAT HOOK] Heartbeat sent");
        // Send next heartbeat in 20 seconds
        heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, 20000);
      }
    };

    heartbeatTimeoutRef.current = setTimeout(sendHeartbeat, 20000);
  }, [isConnected, participantId, stopHeartbeat]);

  /**
   * Acknowledge message receipt
   */
  const acknowledgeMessage = useCallback(
    (messageId: number, conversationId?: number) => {
      if (!isConnected) {
        return;
      }

      console.log(
        "[CHAT HOOK] Acknowledging message:",
        messageId,
        "in conversation:",
        conversationId
      );
      // Send ACK to /app/cms/chat/ws/ack/{messageId}
      chatWebSocketService.send(`/app/cms/chat/ws/ack/${messageId}`, {});
    },
    [isConnected]
  );

  /**
   * Setup WebSocket connection. Connect when participantId is available so presence
   * and global topic subscriptions work even without a selected conversation.
   */
  useEffect(() => {
    if (!participantId) {
      console.log(
        "[CHAT HOOK] No participantId yet, skipping connection setup"
      );
      return;
    }

    console.log(
      "[CHAT HOOK] Setting up WebSocket connection for participant:",
      participantId,
      "org:",
      orgId
    );

    wsConfigRef.current = {
      onConnect: () => {
        console.log("[CHAT HOOK] WebSocket connected");
        setIsConnectedSafe(true);
        setConnectionErrorSafe(null);
        // Start heartbeat
        startHeartbeat();
      },
      onDisconnect: () => {
        console.log("[CHAT HOOK] WebSocket disconnected");
        setIsConnectedSafe(false);
        cleanupSubscriptions();
        stopHeartbeat();
      },
      onError: (error: string) => {
        console.error("[CHAT HOOK] WebSocket error:", error);
        setConnectionErrorSafe(error);
        callbacksRef.current?.onError?.(error);
      }
    };

    const initializeConnection = async () => {
      try {
        console.log("[CHAT HOOK] Initiating WebSocket connection...");
        await chatWebSocketService.connect(wsConfigRef.current);
      } catch (error) {
        if (!mountedRef.current) return;
        const errorMsg =
          error instanceof Error ? error.message : "Connection failed";
        console.error("[CHAT HOOK] Failed to connect:", errorMsg);
        setConnectionErrorSafe(errorMsg);
        callbacksRef.current?.onError?.(errorMsg);
      }
    };

    void initializeConnection();

    return () => {
      cleanupSubscriptions();
      stopHeartbeat();
    };
  }, [
    participantId,
    orgId,
    setIsConnectedSafe,
    setConnectionErrorSafe,
    cleanupSubscriptions,
    callbacksRef,
    startHeartbeat,
    stopHeartbeat
  ]);

  /**
   * Setup subscriptions when connected
   */
  useEffect(() => {
    if (!isConnected || !conversationId) {
      return;
    }

    console.log(
      "[CHAT HOOK] Setting up subscriptions for conversation:",
      conversationId
    );
    cleanupSubscriptions();

    // Subscribe to incoming messages. Messages may come as a wrapper
    // MessageSentEventDto { messageId, conversationId, participantId, message }
    const messageSub = chatWebSocketService.subscribe(
      `/topic/conversations/${conversationId}`,
      (data: any) => {
        try {
          // Normalize payload to the inner message entity
          const apiMessage = data?.message ? { ...data.message } : { ...data };

          // Ensure conversationId is present on the message
          if (!apiMessage.chatConversationId && data?.conversationId) {
            apiMessage.chatConversationId = data.conversationId;
          }

          console.log(
            "[CHAT HOOK] Received message (normalized):",
            apiMessage.chatMessageId || apiMessage.messageId
          );

          // Determine sender participant id safely
          const senderParticipantId =
            apiMessage?.chatConversationParticipant?.participantId ||
            apiMessage?.participantId;

          // Auto-send ACK when message is received (mark as RECEIVED)
          if (
            apiMessage &&
            senderParticipantId &&
            senderParticipantId !== participantId
          ) {
            const messageId = apiMessage.chatMessageId || apiMessage.messageId;
            if (messageId) acknowledgeMessage(messageId);
          }

          callbacksRef.current?.onMessageReceived?.(apiMessage);
        } catch (err) {
          console.error(
            "[CHAT HOOK] Error handling incoming message payload:",
            err
          );
        }
      }
    );
    if (messageSub) unsubscribeRef.current.push(messageSub);

    // Subscribe to typing indicators
    const typingSub = chatWebSocketService.subscribe(
      `/topic/conversations/${conversationId}/typing`,
      (event: { userId: number; isTyping: boolean }) => {
        if (event.userId !== participantId) {
          console.log("[CHAT HOOK] Typing indicator:", event);
          callbacksRef.current?.onTypingStatusChanged?.(
            event.isTyping,
            event.userId
          );
        }
      }
    );
    if (typingSub) unsubscribeRef.current.push(typingSub);

    return () => {
      cleanupSubscriptions();
    };
  }, [
    isConnected,
    conversationId,
    participantId,
    callbacksRef,
    cleanupSubscriptions,
    acknowledgeMessage
  ]);

  /**
   * Subscribe to presence updates regardless of selected conversation.
   * Presence events are global: /topic/presence
   */
  useEffect(() => {
    if (!isConnected) return;

    console.log("[CHAT HOOK] Subscribing to presence updates");
    const presenceSub = chatWebSocketService.subscribe(
      "/topic/presence",
      (event: any) => {
        try {
          // event: { userId: number, status: 'ONLINE'|'OFFLINE'|... }
          const userId = event?.userId;
          const statusRaw = event?.status;
          const status = statusRaw === "ONLINE" ? "online" : "offline";
          if (userId) {
            callbacksRef.current?.onPresenceStatusChanged?.(userId, status);
          }
        } catch (e) {
          console.error("[CHAT HOOK] Error handling presence event", e);
        }
      }
    );

    if (presenceSub) unsubscribeRef.current.push(presenceSub);

    return () => {
      if (presenceSub) {
        try {
          presenceSub();
        } catch (e) {
          console.warn("[CHAT HOOK] Error unsubscribing presence", e);
        }
      }
    };
  }, [isConnected, callbacksRef]);

  /**
   * Send message via WebSocket with fallback to REST
   */
  const sendMessage = useCallback(
    (messageText: string, attachmentList: any[] = []): boolean => {
      if (!conversationId) {
        console.warn(
          "[CHAT HOOK] Cannot send message: No conversation selected"
        );
        setConnectionErrorSafe("No conversation selected");
        return false;
      }

      if (!messageText.trim()) {
        console.warn("[CHAT HOOK] Cannot send empty message");
        return false;
      }

      try {
        const payload: CreateMessagePayload = {
          chatConversationId: conversationId,
          participantId: participantId,
          chatMessageText: messageText.trim(),
          chatMessageType: attachmentList.length > 0 ? "FILE" : "TEXT",
          chatMessageAttachmentList: attachmentList
        };

        console.log(
          "[CHAT HOOK] Attempting to send message via WebSocket:",
          payload
        );

        // Try WebSocket first
        if (isConnected) {
          const success = chatWebSocketService.send(
            `/app/cms/chat/ws/message/${conversationId}`,
            payload
          );

          if (success) {
            console.log("[CHAT HOOK] ✅ Message sent via WebSocket");
            return true;
          }
        }

        // Fallback to REST API
        console.warn(
          "[CHAT HOOK] WebSocket send failed or not connected, using REST API fallback"
        );

        chatApiService
          .sendMessage(payload)
          .then(() => {
            console.log("[CHAT HOOK] ✅ Message sent via REST API fallback");
          })
          .catch((error) => {
            console.error("[CHAT HOOK] ❌ REST API fallback failed:", error);
            setConnectionErrorSafe(
              error instanceof Error ? error.message : "Failed to send message"
            );
          });

        return false; // REST sends asynchronously
      } catch (error) {
        console.error("[CHAT HOOK] Error sending message:", error);
        setConnectionErrorSafe(
          error instanceof Error ? error.message : "Failed to send message"
        );
        return false;
      }
    },
    [conversationId, participantId, isConnected, setConnectionErrorSafe]
  );

  /**
   * Send typing indicator (debounced)
   */
  const sendTypingIndicator = useCallback(() => {
    if (!isConnected || !conversationId) {
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    console.log("[CHAT HOOK] Sending typing indicator");
    const success = chatWebSocketService.send(
      `/app/cms/chat/ws/typing/${conversationId}`,
      {
        userId: participantId,
        isTyping: true
      }
    );

    if (success) {
      // Send stop typing after 5 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        chatWebSocketService.send(`/app/cms/chat/ws/typing/${conversationId}`, {
          userId: participantId,
          isTyping: false
        });
      }, 5000);
    }
  }, [isConnected, conversationId, participantId]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      console.log("[CHAT HOOK] Hook unmounting, cleaning up");
      mountedRef.current = false;
      stopHeartbeat();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      cleanupSubscriptions();
    };
  }, [stopHeartbeat, cleanupSubscriptions, startHeartbeat]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    sendTypingIndicator,
    acknowledgeMessage,
    startHeartbeat,
    stopHeartbeat
  };
}
