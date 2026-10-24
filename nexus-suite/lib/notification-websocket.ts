import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

import { NotificationPush } from '@/types/notifications';

// SockJS endpoint configuration.
const WS_URL = process.env.NEXT_PUBLIC_WS_URL
    ? process.env.NEXT_PUBLIC_WS_URL
    : 'http://localhost:8086/ws';
const SOCKJS_URL = WS_URL.replace(/^ws:/, 'http:').replace(/^wss:/, 'https:');
const TOKEN_ENDPOINT = '/api/notifications/ws-token';
const TOKEN_REFRESH_BEFORE_EXPIRY = 25 * 60 * 1000; // 25 minutes
const HEARTBEAT_INTERVAL = 4000; // milliseconds
const CONNECTION_TIMEOUT = 15000; // 15 seconds timeout for connection attempt

export type NotificationEventHandler = (push: NotificationPush) => void;

export interface NotificationWebSocketConfig {
    /** Organisation the user is acting in. Sent as X-Organization-ID on CONNECT. */
    organizationId?: string;
    onConnect?: () => void;
    onDisconnect?: () => void;
    onError?: (error: string) => void;
    onPush?: NotificationEventHandler;
}

class NotificationWebSocketService {
    private client: Client | null = null;
    private config: NotificationWebSocketConfig | null = null;
    private organizationId: string | null = null;
    private subscriptions: Map<string, any> = new Map();
    private isManualDisconnect = false;
    private connectionPromise: Promise<void> | null = null;
    private resolveConnection: (() => void) | null = null;
    private rejectConnection: ((error: Error) => void) | null = null;
    private tokenRefreshTimeout: NodeJS.Timeout | null = null;
    private connectionTimeoutHandle: NodeJS.Timeout | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelays = [1000, 2000, 4000, 8000, 16000];

    // Monotonically increasing counter. Incremented on every connect() so that
    // callbacks from a previous (deactivated) connection are ignored — without
    // this, a socket closed during a page reload would trigger a reconnect on
    // the already-replaced connection.
    private connectionGeneration = 0;

    private buildWebSocketDiagnostics(event: unknown): Record<string, unknown> {
        const diagnostics: Record<string, unknown> = {
            eventType:
                typeof Event !== 'undefined' && event instanceof Event
                    ? event.type
                    : typeof event,
            wsUrl: WS_URL,
            reconnectAttempts: this.reconnectAttempts,
            isClientActive: this.client?.active ?? false,
            isClientConnected: this.client?.connected ?? false,
        };
        return diagnostics;
    }

    async connect(config: NotificationWebSocketConfig): Promise<void> {
        this.config = config;
        this.organizationId = config.organizationId ?? null;

        if (this.client?.active) {
            console.log('[NOTIFICATION WS] Already connected');
            return;
        }

        if (this.connectionPromise && this.resolveConnection) {
            console.log('[NOTIFICATION WS] Connection in progress');
            return this.connectionPromise;
        }

        const generation = ++this.connectionGeneration;

        this.connectionPromise = null;
        this.resolveConnection = null;
        this.rejectConnection = null;
        this.isManualDisconnect = false;
        this.reconnectAttempts = 0;

        this.connectionPromise = new Promise((resolve, reject) => {
            this.resolveConnection = resolve;
            this.rejectConnection = reject;
            this.attemptConnection(generation);
        });

        return this.connectionPromise;
    }

    private isConnectionFailed(): boolean {
        return this.rejectConnection !== null && this.resolveConnection === null;
    }

    private async attemptConnection(generation: number): Promise<void> {
        // Bail out if the connection was manually disconnected while we were
        // fetching the token.
        if (this.isManualDisconnect || generation !== this.connectionGeneration) {
            console.log('[NOTIFICATION WS] Connection attempt cancelled');
            return;
        }
        try {
            console.log(
                `[NOTIFICATION WS] Connection attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts + 1}`
            );

            const token = await this.fetchWebSocketToken();

            if (!token) {
                throw new Error('Failed to fetch WebSocket token');
            }

            this.connectionTimeoutHandle = setTimeout(() => {
                if (generation !== this.connectionGeneration) {
                    return;
                }
                if (this.client && !this.client.active) {
                    console.error('[NOTIFICATION WS] Connection timeout');
                    this.handleConnectionError(
                        new Error(
                            `WebSocket connection timeout. Is CMS backend running on ${WS_URL}?`
                        )
                    );
                    this.client?.deactivate();
                }
            }, CONNECTION_TIMEOUT);

            if (
                this.isManualDisconnect ||
                generation !== this.connectionGeneration
            ) {
                console.log('[NOTIFICATION WS] Connection attempt cancelled after token fetch');
                return;
            }

            this.createAndActivateClient(token, generation);
        } catch (error) {
            if (this.connectionTimeoutHandle) {
                clearTimeout(this.connectionTimeoutHandle);
                this.connectionTimeoutHandle = null;
            }
            if (
                this.isManualDisconnect ||
                generation !== this.connectionGeneration
            ) {
                return;
            }
            this.handleConnectionError(error);
        }
    }

    private async fetchWebSocketToken(): Promise<string | null> {
        try {
            const response = await fetch(TOKEN_ENDPOINT, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error(
                    response.status === 401
                        ? 'Not authenticated: please log in first'
                        : `Failed to fetch token: HTTP ${response.status}`
                );
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            console.error('[NOTIFICATION WS] Token fetch error:', error);
            throw error;
        }
    }

    private createAndActivateClient(token: string, generation: number): void {
        this.client = new Client({
            webSocketFactory: () => new SockJS(SOCKJS_URL),
            connectHeaders: {
                Authorization: `Bearer ${token}`,
                ...(this.organizationId
                    ? { 'X-Organization-ID': this.organizationId }
                    : {}),
            },
            reconnectDelay: 0,
            heartbeatIncoming: HEARTBEAT_INTERVAL,
            heartbeatOutgoing: HEARTBEAT_INTERVAL,
            onConnect: () => {
                if (generation !== this.connectionGeneration) {
                    console.log('[NOTIFICATION WS] Ignoring connect from a superseded connection');
                    return;
                }
                if (this.connectionTimeoutHandle) {
                    clearTimeout(this.connectionTimeoutHandle);
                    this.connectionTimeoutHandle = null;
                }
                console.log('[NOTIFICATION WS] Connected to STOMP server');
                this.reconnectAttempts = 0;
                this.resolveConnection?.();
                this.scheduleTokenRefresh(generation);
                this.config?.onConnect?.();
            },
            onStompError: (frame: any) => {
                const errorMsg =
                    frame.headers['message'] || 'STOMP error';
                console.error('[NOTIFICATION WS] STOMP error:', errorMsg);
                this.handleConnectionError(new Error(errorMsg), generation);
            },
            onDisconnect: () => {
                console.log('[NOTIFICATION WS] Disconnected');
                if (!this.isManualDisconnect) {
                    this.config?.onDisconnect?.();
                }
            },
            onWebSocketClose: () => {
                if (generation !== this.connectionGeneration) {
                    console.log('[NOTIFICATION WS] Ignoring close from a superseded connection');
                    return;
                }
                console.log('[NOTIFICATION WS] WebSocket closed');
                if (
                    !this.isManualDisconnect &&
                    this.reconnectAttempts < this.maxReconnectAttempts
                ) {
                    this.scheduleReconnect(generation);
                }
            },
            onWebSocketError: (event: any) => {
                if (generation !== this.connectionGeneration) {
                    console.log('[NOTIFICATION WS] Ignoring error from a superseded connection');
                    return;
                }
                console.error('[NOTIFICATION WS] WebSocket error:', event);
                this.handleConnectionError(
                    new Error('WebSocket error'),
                    generation
                );
            },
        });

        // Store the generation on the client so that onConnect can check it.
        (this.client as any)._generation = generation;
        this.client.activate();
    }

    private scheduleTokenRefresh(generation: number): void {
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
        }
        this.tokenRefreshTimeout = setTimeout(async () => {
            if (!this.client?.active) return;
            if (generation !== this.connectionGeneration) return;
            try {
                const token = await this.fetchWebSocketToken();
                if (token && generation === this.connectionGeneration) {
                    // Reconnect with the new token. The STOMP client does not
                    // support hot-swapping credentials, so we reconnect.
                    console.log('[NOTIFICATION WS] Token refreshed, reconnecting');
                    this.client?.deactivate();
                    await this.attemptConnection(generation);
                }
            } catch (e) {
                console.error('[NOTIFICATION WS] Token refresh failed:', e);
            }
        }, TOKEN_REFRESH_BEFORE_EXPIRY);
    }

    private handleConnectionError(error: any, generation?: number): void {
        if (generation !== undefined && generation !== this.connectionGeneration) {
            console.log('[NOTIFICATION WS] Ignoring connection error from a superseded connection');
            return;
        }
        if (this.connectionTimeoutHandle) {
            clearTimeout(this.connectionTimeoutHandle);
            this.connectionTimeoutHandle = null;
        }

        const errorMsg =
            error instanceof Error ? error.message : String(error);
        console.error('[NOTIFICATION WS] Connection error:', errorMsg);

        if (this.reconnectAttempts === 0) {
            this.config?.onError?.(errorMsg);
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect(generation ?? this.connectionGeneration);
        } else {
            console.error(
                '[NOTIFICATION WS] Max reconnection attempts reached'
            );
            this.config?.onError?.(
                `Connection failed after ${this.maxReconnectAttempts} attempts`
            );
            this.rejectConnection?.(
                error instanceof Error ? error : new Error(errorMsg)
            );
        }
    }

    private scheduleReconnect(generation: number): void {
        if (generation !== this.connectionGeneration) {
            return;
        }
        const delay =
            this.reconnectDelays[this.reconnectAttempts] ?? 16000;
        this.reconnectAttempts++;
        console.log(
            `[NOTIFICATION WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
        );
        setTimeout(() => {
            if (
                !this.isManualDisconnect &&
                generation === this.connectionGeneration
            ) {
                this.attemptConnection(generation);
            }
        }, delay);
    }

    disconnect(): void {
        this.isManualDisconnect = true;
        this.organizationId = null;
        if (this.tokenRefreshTimeout) {
            clearTimeout(this.tokenRefreshTimeout);
            this.tokenRefreshTimeout = null;
        }
        if (this.connectionTimeoutHandle) {
            clearTimeout(this.connectionTimeoutHandle);
            this.connectionTimeoutHandle = null;
        }
        this.client?.deactivate();
        this.client = null;
        this.connectionPromise = null;
    }

    subscribe(destination: string, callback: (data: any) => void): () => void {
        if (!this.client?.connected) {
            console.warn('[NOTIFICATION WS] Not connected, cannot subscribe');
            return () => {};
        }

        const sub = this.client.subscribe(destination, (message: any) => {
            try {
                const data = JSON.parse(message.body);
                callback(data);
            } catch (e) {
                console.error('[NOTIFICATION WS] Failed to parse message:', e);
            }
        });

        this.subscriptions.set(destination, sub);

        return () => {
            try {
                sub.unsubscribe();
                this.subscriptions.delete(destination);
            } catch (e) {
                console.error('[NOTIFICATION WS] Error unsubscribing:', e);
            }
        };
    }

    send(destination: string, body: any): boolean {
        if (!this.client?.connected) {
            console.warn('[NOTIFICATION WS] Not connected, cannot send');
            return false;
        }

        try {
            this.client.publish({
                destination,
                body: JSON.stringify(body),
            });
            return true;
        } catch (e) {
            console.error('[NOTIFICATION WS] Send failed:', e);
            return false;
        }
    }

    get isConnected(): boolean {
        return this.client?.connected ?? false;
    }
}

export const notificationWebSocketService = new NotificationWebSocketService();
export { NotificationWebSocketService };
