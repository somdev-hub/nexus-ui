import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

export type ChatEventHandler = (data: any) => void;

export interface WebSocketConfig {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: string) => void;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL
  ? process.env.NEXT_PUBLIC_WS_URL
  : "http://localhost:8086/ws";
const SOCKJS_URL = WS_URL.replace(/^ws:/, "http:").replace(/^wss:/, "https:");
const TOKEN_ENDPOINT = "/api/chat/ws-token";

class ChatWebSocketService {
  private client: Client | null = null;
  private config: WebSocketConfig | null = null;
  private subscriptions: Map<string, any> = new Map();
  private isManualDisconnect = false;

  async connect(config: WebSocketConfig): Promise<void> {
    this.config = config;
    this.isManualDisconnect = false;

    // Get token from BFF
    const tokenResponse = await fetch(TOKEN_ENDPOINT, { credentials: "include" });
    if (!tokenResponse.ok) {
      throw new Error("Failed to get WebSocket token");
    }
    const { token } = await tokenResponse.json();

    return new Promise((resolve, reject) => {
      this.client = new Client({
        webSocketFactory: () => new SockJS(SOCKJS_URL),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        onConnect: () => {
          this.config?.onConnect?.();
          resolve();
        },
        onDisconnect: () => {
          this.config?.onDisconnect?.();
        },
        onStompError: (frame) => {
          this.config?.onError?.(frame.headers["message"] || "STOMP error");
          reject(new Error(frame.headers["message"] || "STOMP error"));
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      });

      this.client.activate();
    });
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }
    this.subscriptions.clear();
  }

  subscribe(destination: string, callback: (data: any) => void): () => void {
    if (!this.client || !this.client.connected) {
      console.warn("[WS] Not connected, cannot subscribe to", destination);
      return () => {};
    }

    const sub = this.client.subscribe(destination, (message) => {
      try {
        const data = JSON.parse(message.body);
        callback(data);
      } catch {
        callback(message.body);
      }
    });

    this.subscriptions.set(destination, sub);
    return () => {
      sub.unsubscribe();
      this.subscriptions.delete(destination);
    };
  }

  send(destination: string, body: any): void {
    if (!this.client || !this.client.connected) {
      console.warn("[WS] Not connected, cannot send to", destination);
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  get isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const chatWebSocketService = new ChatWebSocketService();