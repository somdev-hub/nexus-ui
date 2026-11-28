'use client';

import { useEffect, useRef } from 'react';

import { useUserMetadata } from '@/hooks/use-user-metadata';
import { chatService } from '@/lib/services';
import type { ChatConversation } from '@/types/chat';

export function ChatNotificationListener() {
    const { userId: userIdStr, orgId: orgIdStr, isLoading } = useUserMetadata();
    const userId = userIdStr ? Number(userIdStr) : null;
    const orgId = orgIdStr ? Number(orgIdStr) : null;

    const convSubsRef = useRef<Map<number, () => void>>(new Map());
    const conversationsRef = useRef<ChatConversation[]>([]);

    useEffect(() => {
        if (isLoading || !userId || !orgId) return;

        let cancelled = false;
        const subsSnapshot = convSubsRef.current;
        const connectAndSubscribe = async () => {
            try {
                const convs = await chatService.getConversations(userId, orgId);
                if (cancelled) return;
                conversationsRef.current = convs;

                await chatService.connectWebSocket({
                    onConnect: () => {
                        // subscribe to each conversation using the new service method
                        const conversationIds = convs.map(
                            (c) => c.chatConversationId
                        );
                        const unsubs =
                            chatService.subscribeToGlobalConversations(
                                conversationIds,
                                (evt) => {
                                    // Notification toast is handled by the header notification bell.
                                    // We just need to subscribe to keep the connection alive
                                    console.log(
                                        '[CHAT NOTIFY] Global event:',
                                        evt
                                    );
                                }
                            );
                        // Store unsubscribes in ref
                        conversationIds.forEach((id, index) => {
                            if (unsubs[index]) {
                                convSubsRef.current.set(id, unsubs[index]);
                            }
                        });
                    },
                    onDisconnect: () => {},
                    onError: () => {},
                });
            } catch (e) {
                console.error('[CHAT NOTIFY] failed to init', e);
            }
        };

        void connectAndSubscribe();

        return () => {
            cancelled = true;
            for (const [, unsub] of subsSnapshot.entries()) {
                try {
                    unsub();
                } catch {
                    /* ignore */
                }
            }
            subsSnapshot.clear();
            chatService.disconnectWebSocket();
        };
    }, [userId, orgId, isLoading]);

    return null;
}
