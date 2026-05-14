import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export type ChatEventHandler = (data: any) => void;

export interface WebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

class ChatWebSocketService {
  private client: Client | null = null;
  private config: WebSocketConfig | null = null;
  private subscriptions: Map<string, any> = new Map();
  private isManualDisconnect = false;
  private connectionPromise: Promise<void> | null = null;
  private resolveConnection: (() => void) | null = null;
  private rejectConnection: ((error: Error) => void) | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private hasErrored = false;

  async connect(config: WebSocketConfig): Promise<void> {
    // ✅ FIX ISSUE #2: ALLOW CONFIG UPDATES - Always accept new config
    this.config = config;

    // ✅ If already connected, return immediately
    if (this.client?.active) {
      return;
    }

    // ✅ FIX ISSUE #1 & #4: Only return existing promise if it hasn't failed
    if (this.connectionPromise && !this.hasErrored) {
      return this.connectionPromise;
    }

    // ✅ Clear previous failed promise to allow retry
    this.connectionPromise = null;
    this.resolveConnection = null;
    this.rejectConnection = null;
    this.isManualDisconnect = false;
    this.hasErrored = false;

    // ✅ FIX ISSUE #1: Create promise with BOTH resolve and reject
    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
      this.attemptConnection();
    });

    return this.connectionPromise;
  }

  private async attemptConnection(): Promise<void> {
    // ✅ FIX ISSUE #1: If already errored, reject the promise
    if (this.hasErrored) {
      this.rejectConnection?.(new Error("Connection already failed"));
      return;
    }

    try {
      const token = await this.getWebSocketToken();

      // ✅ If token fetch failed, getWebSocketToken already called onError
      if (!token) {
        this.rejectConnection?.(new Error("Failed to get token"));
        return;
      }

      this.client = new Client({
        webSocketFactory: () => new SockJS("http://localhost:8086/chat/ws"),
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        // ✅ Disable built-in reconnect — we handle it manually
        reconnectDelay: 0,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log("WebSocket connected");
          this.resolveConnection?.();
          this.config?.onConnect?.();
          this.scheduleTokenRefresh();
        },
        onStompError: (frame) => {
          // ✅ FIX ISSUE #1: Only report once and reject promise
          if (!this.hasErrored) {
            this.hasErrored = true;
            const errorMsg = frame.headers["message"] || "STOMP error";
            this.config?.onError?.(errorMsg);
            this.rejectConnection?.(new Error(errorMsg));
          }
        },
        onDisconnect: () => {
          if (!this.isManualDisconnect) {
            this.config?.onDisconnect?.();
          }
        },
        onWebSocketClose: () => {
          console.log("WebSocket closed");
        }
      });

      this.client.debug = () => {};
      this.client.activate();
    } catch (error) {
      // ✅ FIX ISSUE #1: Only report once and reject promise
      if (!this.hasErrored) {
        this.hasErrored = true;
        const errorMsg =
          error instanceof Error ? error.message : "Connection failed";
        this.config?.onError?.(errorMsg);
        this.rejectConnection?.(
          error instanceof Error ? error : new Error(errorMsg)
        );
      }
    }
  }

  private async getWebSocketToken(): Promise<string | null> {
    try {
      const response = await fetch("/api/chat/ws-token", {
        method: "GET",
        credentials: "include",
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        // ✅ FIX ISSUE #6: Report once and reject
        if (!this.hasErrored) {
          this.hasErrored = true;
          const msg =
            response.status === 401
              ? "Not authenticated"
              : `Failed to get token: ${response.status}`;
          this.config?.onError?.(msg);
          this.rejectConnection?.(new Error(msg));
        }
        return null;
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      // ✅ FIX ISSUE #6: Report once and reject
      if (!this.hasErrored) {
        this.hasErrored = true;
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error";
        this.config?.onError?.(errorMsg);
        this.rejectConnection?.(
          error instanceof Error ? error : new Error(errorMsg)
        );
      }
      return null;
    }
  }

  private scheduleTokenRefresh(): void {
    const REFRESH_BEFORE_EXPIRY = 25 * 60 * 1000; // 25 minutes
    if (this.tokenRefreshTimeout) clearTimeout(this.tokenRefreshTimeout);
    this.tokenRefreshTimeout = setTimeout(() => {
      // ✅ FIX ISSUE #5: Clear promise state properly
      this.connectionPromise = null;
      this.resolveConnection = null;
      this.rejectConnection = null;
      this.hasErrored = false;
      this.client?.deactivate();
      // Don't call attemptConnection here - let new connect() call handle it
      // This prevents stale config from being used
    }, REFRESH_BEFORE_EXPIRY);
  }

  subscribe(
    destination: string,
    handler: ChatEventHandler
  ): (() => void) | null {
    if (!this.client?.connected) return null;
    try {
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          handler(data);
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      });
      this.subscriptions.set(destination, subscription);
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
    }
  }

  send(destination: string, payload: any): boolean {
    if (!this.client?.connected) return false;
    try {
      this.client.publish({ destination, body: JSON.stringify(payload) });
      return true;
    } catch (error) {
      console.error("Send error:", error);
      return false;
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this.hasErrored = false;
    this.connectionPromise = null;
    this.resolveConnection = null;
    this.rejectConnection = null;
    this.config = null;
    if (this.tokenRefreshTimeout) clearTimeout(this.tokenRefreshTimeout);
    this.client?.deactivate();
  }
}

export const chatWebSocketService = new ChatWebSocketService();
