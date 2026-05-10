'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { chatWebSocketService } from '@/lib/chat-websocket';
import { chatApiService } from '@/lib/chat-api';

interface UseChatWebSocketOptions {
  conversationId: string;
  orgId: string;
  userId: string;
  onMessageReceived?: (message: any) => void;
  onTypingStatusChanged?: (status: boolean, userId: string) => void;
  onPresenceChanged?: (event: 'joined' | 'left', userId: string) => void;
  onError?: (error: string) => void;
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
  onMessageReceived,
  onTypingStatusChanged,
  onPresenceChanged,
  onError,
}: UseChatWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void)[]>([]);

  const cleanupSubscriptions = useCallback(() => {
    unsubscribeRef.current.forEach((unsub) => {
      try {
        unsub();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    unsubscribeRef.current = [];
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeConnection = async () => {
      try {
        // Connect to WebSocket
        // Token is fetched internally from /api/chat/ws-token via BFF pattern
        await chatWebSocketService.connect({
          onConnect: () => {
            if (mounted) {
              setIsConnected(true);
              setConnectionError(null);
              setupSubscriptions();
              notifyJoined();
            }
          },
          onDisconnect: () => {
            if (mounted) {
              setIsConnected(false);
              cleanupSubscriptions();
            }
          },
          onError: (error: string) => {
            if (mounted) {
              setConnectionError(error);
              onError?.(error);
            }
          },
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Connection failed';
        console.error('Chat connection error:', error);
        if (mounted) {
          setConnectionError(errorMsg);
          onError?.(errorMsg);
        }
      }
    };

    const setupSubscriptions = () => {
      try {
        // Subscribe to messages
        const messageSub = chatWebSocketService.subscribe(
          `/topic/conversations/${conversationId}`,
          (message) => {
            onMessageReceived?.(message);
          }
        );
        if (messageSub) unsubscribeRef.current.push(messageSub);

        // Subscribe to typing indicators
        const typingSub = chatWebSocketService.subscribe(
          `/topic/conversations/${conversationId}/typing`,
          (event) => {
            if (event.eventType === 'TYPING') {
              onTypingStatusChanged?.(true, event.userId);
            } else if (event.eventType === 'STOP_TYPING') {
              onTypingStatusChanged?.(false, event.userId);
            }
          }
        );
        if (typingSub) unsubscribeRef.current.push(typingSub);

        // Subscribe to presence events
        const presenceSub = chatWebSocketService.subscribe(
          `/topic/conversations/${conversationId}/presence`,
          (event) => {
            if (event.eventType === 'JOINED') {
              onPresenceChanged?.('joined', event.userId);
            } else if (event.eventType === 'LEFT') {
              onPresenceChanged?.('left', event.userId);
            }
          }
        );
        if (presenceSub) unsubscribeRef.current.push(presenceSub);
      } catch (error) {
        console.error('Error setting up subscriptions:', error);
        onError?.('Failed to subscribe to chat');
      }
    };

    const notifyJoined = () => {
      try {
        chatWebSocketService.send(`/app/chat/joined/${conversationId}`, {});
      } catch (error) {
        console.error('Error notifying joined:', error);
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      cleanupSubscriptions();
    };
  }, [conversationId, onMessageReceived, onTypingStatusChanged, onPresenceChanged, onError, cleanupSubscriptions]);

  const sendMessage = useCallback(
    (content: string): boolean => {
      if (!isConnected) {
        setConnectionError('Not connected to chat');
        return false;
      }

      try {
        const success = chatWebSocketService.send('/app/chat/send', {
          conversationId,
          content,
          orgId,
        });

        if (!success) {
          // Fallback to REST API
          const payload={
            conversationId,
            content,
            orgId
          }
          chatApiService.sendMessage(userId, payload, orgId).catch((error) => {
            console.error('REST API fallback failed:', error);
            onError?.('Failed to send message');
          });
        }

        return success;
      } catch (error) {
        console.error('Error sending message:', error);
        onError?.('Failed to send message');
        return false;
      }
    },
    [isConnected, conversationId, orgId, userId, onError]
  );

  const notifyTyping = useCallback(() => {
    if (!isConnected) return;

    try {
      chatWebSocketService.send('/app/chat/typing', {
        conversationId,
      });
    } catch (error) {
      console.error('Error notifying typing:', error);
    }
  }, [isConnected, conversationId]);

  const notifyStopTyping = useCallback(() => {
    if (!isConnected) return;

    try {
      chatWebSocketService.send('/app/chat/typing/stop', {
        conversationId,
      });
    } catch (error) {
      console.error('Error notifying stop typing:', error);
    }
  }, [isConnected, conversationId]);

  const notifyLeft = useCallback(() => {
    try {
      chatWebSocketService.send(`/app/chat/left/${conversationId}`, {});
    } catch (error) {
      console.error('Error notifying left:', error);
    }
  }, [conversationId]);

  return {
    isConnected,
    connectionError,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    notifyLeft,
  };
}