import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

/**
 * WebSocket Service for Chat v2
 *
 * Handles connection to CMS backend (port 8086) via SockJS/STOMP
 * Token is fetched from /api/chat/ws-token via BFF pattern (HttpOnly session)
 *
 * Connection Flow:
 * 1. Frontend requests token from /api/chat/ws-token
 * 2. Next.js server returns token from session (HttpOnly cookie)
 * 3. Frontend connects to ws://localhost:8086/ws with JWT Bearer token
 * 4. STOMP layer enables reliable message delivery and subscriptions
 */

export type ChatEventHandler = (data: any) => void;

export interface WebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

// SockJS endpoint configuration
const WS_URL = process.env.NEXT_PUBLIC_WS_URL
  ? process.env.NEXT_PUBLIC_WS_URL
  : "http://localhost:8086/ws";
const SOCKJS_URL = WS_URL.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
const TOKEN_ENDPOINT = "/api/chat/ws-token";
const TOKEN_REFRESH_BEFORE_EXPIRY = 25 * 60 * 1000; // 25 minutes
const HEARTBEAT_INTERVAL = 4000; // milliseconds
const CONNECTION_TIMEOUT = 15000; // 15 seconds timeout for connection attempt

class ChatWebSocketService {
  private client: Client | null = null;
  private config: WebSocketConfig | null = null;
  private subscriptions: Map<string, any> = new Map();
  private isManualDisconnect = false;
  private connectionPromise: Promise<void> | null = null;
  private resolveConnection: (() => void) | null = null;
  private rejectConnection: ((error: Error) => void) | null = null;
  private tokenRefreshTimeout: NodeJS.Timeout | null = null;
  private connectionTimeoutHandle: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelays = [1000, 2000, 4000, 8000, 16000]; // exponential backoff

  /**
   * Convert browser websocket events into plain diagnostics for logging.
   */
  private buildWebSocketDiagnostics(event: unknown): Record<string, unknown> {
    const diagnostics: Record<string, unknown> = {
      eventType:
        typeof Event !== "undefined" && event instanceof Event
          ? event.type
          : typeof event,
      wsUrl: WS_URL,
      reconnectAttempts: this.reconnectAttempts,
      isClientActive: this.client?.active ?? false,
      isClientConnected: this.client?.connected ?? false
    };

    if (event instanceof ErrorEvent) {
      diagnostics.errorName = event.error?.name ?? "ErrorEvent";
      diagnostics.errorMessage = event.message;
      diagnostics.filename = event.filename;
      diagnostics.lineno = event.lineno;
      diagnostics.colno = event.colno;
      diagnostics.eventError = event.error
        ? {
            name: event.error.name,
            message: event.error.message,
            stack: event.error.stack
          }
        : undefined;
    } else if (
      typeof CloseEvent !== "undefined" &&
      event instanceof CloseEvent
    ) {
      diagnostics.code = event.code;
      diagnostics.reason = event.reason;
      diagnostics.wasClean = event.wasClean;
    } else if (event instanceof Event) {
      diagnostics.eventTarget = event.target
        ? {
            readyState:
              "readyState" in event.target
                ? (event.target as { readyState?: number }).readyState
                : undefined,
            url:
              "url" in event.target
                ? String((event.target as { url?: string }).url)
                : undefined
          }
        : undefined;
    } else if (event && typeof event === "object") {
      diagnostics.details = Object.fromEntries(
        Object.entries(event as Record<string, unknown>).map(([key, value]) => [
          key,
          value instanceof Error
            ? {
                name: value.name,
                message: value.message,
                stack: value.stack
              }
            : value
        ])
      );
    } else {
      diagnostics.details = event;
    }

    return diagnostics;
  }

  /**
   * Establish WebSocket connection
   */
  async connect(config: WebSocketConfig): Promise<void> {
    this.config = config;

    // If already connected, return immediately
    if (this.client?.active) {
      console.log("[WEBSOCKET] Already connected");
      return;
    }

    // Only return existing promise if connection is in progress
    if (this.connectionPromise && !this.isConnectionFailed()) {
      console.log(
        "[WEBSOCKET] Connection in progress, returning existing promise"
      );
      return this.connectionPromise;
    }

    // Reset connection state
    this.connectionPromise = null;
    this.resolveConnection = null;
    this.rejectConnection = null;
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;

    this.connectionPromise = new Promise((resolve, reject) => {
      this.resolveConnection = resolve;
      this.rejectConnection = reject;
      this.attemptConnection();
    });

    return this.connectionPromise;
  }

  /**
   * Check if previous connection attempt failed
   */
  private isConnectionFailed(): boolean {
    return this.rejectConnection !== null && this.resolveConnection === null;
  }

  /**
   * Attempt to establish WebSocket connection with exponential backoff
   */
  private async attemptConnection(): Promise<void> {
    try {
      console.log(
        `[WEBSOCKET] Connection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`
      );

      const token = await this.fetchWebSocketToken();

      if (!token) {
        throw new Error("Failed to fetch WebSocket token");
      }

      // Set connection timeout
      this.connectionTimeoutHandle = setTimeout(() => {
        if (this.client && !this.client.active) {
          console.error(
            "[WEBSOCKET] Connection timeout after",
            CONNECTION_TIMEOUT,
            "ms"
          );
          this.handleConnectionError(
            new Error(
              `WebSocket connection timeout. Is CMS backend running on ${WS_URL}?`
            )
          );
          this.client?.deactivate();
        }
      }, CONNECTION_TIMEOUT);

      this.createAndActivateClient(token);
    } catch (error) {
      if (this.connectionTimeoutHandle) {
        clearTimeout(this.connectionTimeoutHandle);
        this.connectionTimeoutHandle = null;
      }
      this.handleConnectionError(error);
    }
  }

  /**
   * Fetch JWT token from BFF endpoint
   */
  private async fetchWebSocketToken(): Promise<string | null> {
    try {
      console.log("[WEBSOCKET] Fetching token from", TOKEN_ENDPOINT);
      const response = await fetch(TOKEN_ENDPOINT, {
        method: "GET",
        credentials: "include", // Send cookies for session
        headers: { "Content-Type": "application/json" }
      });

      if (!response.ok) {
        const msg =
          response.status === 401
            ? "Not authenticated: Please login first"
            : `Failed to fetch token: HTTP ${response.status}`;

        // Try to get error details from response
        try {
          const errorData = await response.json();
          console.error("[WEBSOCKET] Token endpoint error:", errorData);
        } catch {
          // Ignore JSON parse errors
        }

        throw new Error(msg);
      }

      const data = await response.json();
      console.log("[WEBSOCKET] Token fetched successfully");
      return data.token;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      console.error("[WEBSOCKET] Token fetch error:", msg);
      throw error;
    }
  }

  /**
   * Create STOMP client and activate connection
   */
  private createAndActivateClient(token: string): void {
    console.log("[WEBSOCKET] Creating client for", SOCKJS_URL);
    console.log("[WEBSOCKET] Environment:", {
      nodeEnv: process.env.NODE_ENV,
      publicWsUrl: process.env.NEXT_PUBLIC_WS_URL,
      finalWsUrl: WS_URL,
      finalSockJsUrl: SOCKJS_URL
    });

    this.client = new Client({
      webSocketFactory: () => new SockJS(SOCKJS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      reconnectDelay: 0, // Manual reconnection
      heartbeatIncoming: HEARTBEAT_INTERVAL,
      heartbeatOutgoing: HEARTBEAT_INTERVAL,
      onConnect: () => {
        if (this.connectionTimeoutHandle) {
          clearTimeout(this.connectionTimeoutHandle);
          this.connectionTimeoutHandle = null;
        }
        console.log("[WEBSOCKET] ✅ Connected to STOMP server");
        this.reconnectAttempts = 0;
        this.resolveConnection?.();
        this.config?.onConnect?.();
        this.scheduleTokenRefresh();
      },
      onStompError: (frame) => {
        const errorMsg = frame.headers["message"] || "STOMP error";
        console.error("[WEBSOCKET] STOMP error:", errorMsg, "Frame:", frame);
        this.handleConnectionError(new Error(errorMsg));
      },
      onDisconnect: () => {
        console.log("[WEBSOCKET] Disconnected from STOMP server");
        if (!this.isManualDisconnect) {
          this.config?.onDisconnect?.();
        }
      },
      onWebSocketClose: () => {
        console.log("[WEBSOCKET] WebSocket connection closed");
        if (
          !this.isManualDisconnect &&
          this.reconnectAttempts < this.maxReconnectAttempts
        ) {
          this.scheduleReconnect();
        }
      },
      onWebSocketError: (event) => {
        const errorMsg =
          event instanceof Event
            ? `WebSocket Error: ${event.type}`
            : event instanceof Error
              ? event.message
              : typeof event === "object" &&
                  event !== null &&
                  "message" in event
                ? String((event as any).message)
                : "Unknown WebSocket error";

        const diagnostics = this.buildWebSocketDiagnostics(event);

        // Log detailed diagnostics for generic errors
        console.error("[WEBSOCKET] WebSocket error occurred", {
          errorMsg,
          ...diagnostics
        });

        if (event instanceof ErrorEvent && event.error) {
          console.error("[WEBSOCKET] WebSocket native error", event.error);
        }

        this.handleConnectionError(new Error(errorMsg));
      }
    });

    // Disable debug output in production
    if (process.env.NODE_ENV === "development") {
      // Enable debug if needed
    }

    console.log("[WEBSOCKET] Activating client to URL:", SOCKJS_URL);
    this.client.activate();
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleConnectionError(error: any): void {
    if (this.connectionTimeoutHandle) {
      clearTimeout(this.connectionTimeoutHandle);
      this.connectionTimeoutHandle = null;
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[WEBSOCKET] Connection error:", errorMsg);

    // Always notify caller on first error attempt for better UX
    if (this.reconnectAttempts === 0) {
      const userMessage = errorMsg.includes("timeout")
        ? `WebSocket connection timeout. Make sure CMS is running at ${WS_URL}`
        : errorMsg.includes("Not authenticated")
          ? "WebSocket: Not authenticated. Please log in again."
          : errorMsg.includes("401")
            ? "WebSocket: Authentication failed. Please log in again."
            : `WebSocket connection failed: ${errorMsg}`;
      this.config?.onError?.(userMessage);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error(
        "[WEBSOCKET] Max reconnection attempts reached, falling back to REST"
      );
      this.config?.onError?.(
        `Connection failed after ${this.maxReconnectAttempts} attempts. Using REST API fallback. ` +
          `Check that CMS backend is running at ${WS_URL}`
      );
      this.rejectConnection?.(
        error instanceof Error ? error : new Error(errorMsg)
      );
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    const delay = this.reconnectDelays[this.reconnectAttempts];
    this.reconnectAttempts++;
    console.log(
      `[WEBSOCKET] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isManualDisconnect) {
        this.attemptConnection();
      }
    }, delay);
  }

  /**
   * Schedule token refresh before expiry
   */
  private scheduleTokenRefresh(): void {
    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
    }

    this.tokenRefreshTimeout = setTimeout(() => {
      console.log("[WEBSOCKET] Token refresh needed, reconnecting...");
      this.disconnect();
      // Connection will be re-established by the hook with fresh token
    }, TOKEN_REFRESH_BEFORE_EXPIRY);
  }

  /**
   * Subscribe to a destination (topic)
   */
  subscribe(
    destination: string,
    handler: ChatEventHandler
  ): (() => void) | null {
    if (!this.client?.connected) {
      console.warn(
        `[WEBSOCKET] Cannot subscribe to ${destination}: WebSocket not connected`
      );
      return null;
    }

    try {
      console.log(`[WEBSOCKET] 📡 Subscribing to: ${destination}`);
      const subscription = this.client.subscribe(destination, (message) => {
        try {
          const data = JSON.parse(message.body);
          console.log(`[WEBSOCKET] ✅ Received from ${destination}:`, data);
          handler(data);
        } catch (parseError) {
          console.error("[WEBSOCKET] Error parsing message:", parseError);
        }
      });

      this.subscriptions.set(destination, subscription);
      return () => this.unsubscribe(destination);
    } catch (error) {
      console.error("[WEBSOCKET] Subscription error:", error);
      return null;
    }
  }

  /**
   * Unsubscribe from a destination
   */
  private unsubscribe(destination: string): void {
    const subscription = this.subscriptions.get(destination);
    if (subscription) {
      console.log(`[WEBSOCKET] Unsubscribing from: ${destination}`);
      subscription.unsubscribe();
      this.subscriptions.delete(destination);
    }
  }

  /**
   * Send a message to a destination
   */
  send(destination: string, payload: any): boolean {
    if (!this.client?.connected) {
      console.warn(
        `[WEBSOCKET] Cannot send to ${destination}: WebSocket not connected`
      );
      return false;
    }

    try {
      console.log(`[WEBSOCKET] 📤 Sending to ${destination}:`, payload);
      this.client.publish({
        destination,
        body: JSON.stringify(payload)
      });
      console.log(`[WEBSOCKET] ✅ Message published to ${destination}`);
      return true;
    } catch (error) {
      console.error("[WEBSOCKET] Send error:", error);
      return false;
    }
  }

  /**
   * Get connection status
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    console.log("[WEBSOCKET] Disconnecting...");
    this.isManualDisconnect = true;
    this.reconnectAttempts = 0;
    this.connectionPromise = null;
    this.resolveConnection = null;
    this.rejectConnection = null;
    this.config = null;

    if (this.tokenRefreshTimeout) {
      clearTimeout(this.tokenRefreshTimeout);
      this.tokenRefreshTimeout = null;
    }

    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((_, destination) => {
      this.unsubscribe(destination);
    });

    if (this.client?.active) {
      this.client.deactivate();
    }
    this.client = null;
  }
}

export const chatWebSocketService = new ChatWebSocketService();
