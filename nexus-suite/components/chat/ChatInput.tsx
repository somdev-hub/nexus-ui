'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useChatStore, useChatActions } from '@/store/chatStore';
import { useUserMetadata } from '@/hooks/use-user-metadata';

export function ChatInput() {
    const { userId: userIdStr, orgId: orgIdStr } = useUserMetadata();
    const userId = userIdStr ? Number(userIdStr) : null;
    const orgId = orgIdStr ? Number(orgIdStr) : null;
    const newMessage = useChatStore((s) => s.newMessage);
    const isSending = useChatStore((s) => s.isSending);
    const replyingTo = useChatStore((s) => s.replyingTo);
    const wsConnected = useChatStore((s) => s.wsConnected);
    const selectedConvId = useChatStore((s) => s.selectedConvId);
    const actions = useChatActions();

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (replyingTo) {
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }, [replyingTo]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        actions.setNewMessage(e.target.value);
        if (wsConnected && selectedConvId && userId) {
            actions.sendTypingIndicator(selectedConvId, userId, true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (selectedConvId && userId && orgId) {
                actions.sendMessage(
                    newMessage,
                    selectedConvId,
                    userId,
                    orgId,
                    replyingTo
                );
            }
        }
    };

    return (
        <>
            {/* Reply Preview Bar */}
            {replyingTo && (
                <div className="p-2 border-t bg-muted/50 flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 min-w-0 border-l-2 border-primary pl-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-primary truncate">
                                {replyingTo.chatConversationParticipant
                                    ?.participantName || 'Unknown'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                                {replyingTo.chatMessageText || ''}
                            </p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => actions.setReplyingTo(null)}
                            aria-label="Cancel reply"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
            <div className="p-3 border-t flex gap-2">
                <Input
                    ref={inputRef}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    disabled={isSending}
                    className="flex-1"
                />
                <Button
                    onClick={() => {
                        if (selectedConvId && userId && orgId) {
                            actions.sendMessage(
                                newMessage,
                                selectedConvId,
                                userId,
                                orgId,
                                replyingTo
                            );
                        }
                    }}
                    disabled={!newMessage.trim() || isSending}
                >
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </>
    );
}
