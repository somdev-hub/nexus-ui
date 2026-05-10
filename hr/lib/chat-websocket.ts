import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export type ChatEventHandler = (data: any) => void;

interface WebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

/**
 * Chat WebSocket Service
 *
 * Manages real-time chat connections using STOMP/SockJS.
 * Token is obtained from BFF endpoint (/api/chat/ws-token)
 * which retrieves it from server-side session (secure, HttpOnly cookies).
 *
 * SECURITY FLOW:
 * 1. Client calls connect()
 * 2. Client fetches token from /api/chat/ws-token (server-side session)
 * 3. Token is obtained but never stored in browser (response body only)
 * 4. Client uses token for WebSocket Authorization header
 * 5. Server-side session automatically refreshes token on expiry
 */

class ChatWebSocketService {
  private client: Client | null = null;
  private config: WebSocketConfig | null = null;
  private subscriptions: Map<string, any> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private isManualDisconnect = false;
  private connectionPromise: Promise<void> | null = null;
  private resolveConnection: (() => void) | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;

  async connect(config: WebSocketConfig): Promise<void> {
    if (this.client && this.client.connected) {
      console.log("Already connected to WebSocket");
      return;
    }

    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    this.config = config;
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;

    this.connectionPromise = new Promise((resolve) => {
      this.resolveConnection = resolve;
      this.attemptConnection();
    });

    return this.connectionPromise;
  }

  private async attemptConnection(): Promise<void> {
    try {
      // Get token from BFF endpoint (via server-side session)
      const token = await this.getWebSocketToken();
      if (!token) {
        throw new Error("Failed to obtain WebSocket token");
      }

      this.client = new Client({
        // 2. Use webSocketFactory for SockJS
        webSocketFactory: () => new SockJS("http://localhost:8086/chat/ws"),

        // 3. Set connection headers
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },

        // 4. Built-in automatic reconnection (replaces your manual logic)
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,

        // 5. Lifecycle callbacks
        onConnect: (frame) => {
          console.log("WebSocket connected");
          this.config?.onConnect?.();
          this.resolveConnection?.();
          this.scheduleTokenRefresh();
        },
        onStompError: (frame) => {
          this.handleConnectionError(new Error(frame.headers["message"]));
        },
        onWebSocketClose: () => {
          console.log("WebSocket closed");
        }
      });

      // const socket = new SockJS("http://localhost:8086/chat/ws");
      // this.client = Stomp.over(socket);

      // Disable debug logging
      this.client.debug = () => {};

      // this.client.connect(
      //   { Authorization: `Bearer ${token}` },
      //   () => {
      //     console.log("WebSocket connected");
      //     this.reconnectAttempts = 0;
      //     this.config?.onConnect?.();
      //     this.resolveConnection?.();

      //     // Setup token refresh before expiry
      //     this.scheduleTokenRefresh();
      //   },
      //   (error: any) => {
      //     this.handleConnectionError(error);
      //   }
      // );

      // 6. Start the connection
      this.client.activate();
    } catch (error) {
      this.handleConnectionError(error);
    }
  }

  private async getWebSocketToken(): Promise<string | null> {
    try {
      const response = await fetch("/api/chat/ws-token", {
        method: "GET",
        credentials: "include", // Include cookies (session)
        headers: {
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          console.error("WebSocket token: Not authenticated");
          this.config?.onError?.("Not authenticated");
          return null;
        }
        throw new Error(`Failed to get token: ${response.status}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Unknown error";
      console.error("Failed to get WebSocket token:", errorMsg);
      this.config?.onError?.(errorMsg);
      return null;
    }
  }

  private scheduleTokenRefresh(): void {
    // Refresh token 5 minutes before it expires
    // This ensures smooth reconnection with fresh token
    const REFRESH_BEFORE_EXPIRY = 5 * 60 * 1000; // 5 minutes

    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    this.tokenRefreshTimeout = setTimeout(() => {
      console.log("WebSocket token nearing expiry, refreshing...");
      this.reconnect();
    }, REFRESH_BEFORE_EXPIRY);
  }

  private reconnect(): void {
    if (this.client?.connected) {
      this.client.deactivate(); // 'deactivate' is preferred over 'disconnect'
      console.log("WebSocket deactivated for token refresh");
      this.attemptConnection();
    }
  }

  private handleConnectionError(error: any): void {
    const errorMsg = error?.message || "WebSocket connection failed";
    console.error("WebSocket connection error:", errorMsg);

    if (this.isManualDisconnect) {
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay =
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(
        `Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`
      );
      setTimeout(() => this.attemptConnection(), delay);
    } else {
      console.error("Max reconnection attempts reached");
      this.config?.onError?.(
        "Failed to connect to chat service. Please refresh and try again."
      );
    }
  }

  subscribe(
    destination: string,
    handler: ChatEventHandler
  ): (() => void) | null {
    if (!this.client?.connected) {
      console.error("WebSocket not connected");
      return null;
    }

    try {
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          handler(data);
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      });

      this.subscriptions.set(destination, subscription);
      console.log(`Subscribed to ${destination}`);

      return () => this.unsubscribe(destination);
    } catch (error) {
      console.error("Subscription error:", error);
      return null;
    }
  }

  private unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
      console.log(`Unsubscribed from ${destination}`);
    }
  }

  // Update your Send method
  send(destination: string, payload: any): boolean {
    if (!this.client?.connected) return false;

    try {
      // New API: publish takes an object, and 'body' is the key
      this.client.publish({
        destination: destination,
        body: JSON.stringify(payload)
      });
      return true;
    } catch (error) {
      console.error("Send error:", error);
      return false;
    }
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  // Update your Disconnect method
  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.client) {
      this.client.deactivate(); // 'deactivate' is preferred over 'disconnect'
      console.log("WebSocket deactivated");
    }
  }

  getClient(): Client | null {
    return this.client;
  }
}

// Singleton instance
export const chatWebSocketService = new ChatWebSocketService();
