"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/chat";
import { Check, CheckCheck, Copy, Flag, MoreHorizontal, Reply, Trash2 } from "lucide-react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";

interface ChatMessagesRef {
  scrollToMessage: (messageId: number) => void;
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  userId: number | null;
  replyMap: Map<number, number>;
  hoveredMessageId: number | null;
  setHoveredMessageId: (id: number | null) => void;
  messageActionMenuId: number | null;
  setMessageActionMenuId: (id: number | null) => void;
  replyingTo: ChatMessage | null;
  onReplyMessage: (message: ChatMessage) => void;
  onPinMessage: (messageId: number) => void;
  onCopyMessage: (text: string) => void;
  onDeleteMessage: (message: ChatMessage) => void;
  firstUnreadIndex: number;
  getOrgBadgeColor: (orgType?: string) => string;
}

export const ChatMessages = forwardRef<ChatMessagesRef, ChatMessagesProps>(
  (
    {
      messages,
      isLoadingMessages,
      userId,
      replyMap,
      hoveredMessageId,
      setHoveredMessageId,
      messageActionMenuId,
      setMessageActionMenuId,
      replyingTo,
      onReplyMessage,
      onPinMessage,
      onCopyMessage,
      onDeleteMessage,
  firstUnreadIndex,
  getOrgBadgeColor,
}: ChatMessagesProps,
  ref,
) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const scrollToMessage = useCallback((messageId: number) => {
    const element = messageRefs.current.get(messageId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Highlight the message briefly
      element.classList.add('bg-yellow-100/50', 'dark:bg-yellow-900/20');
      setTimeout(() => {
        element.classList.remove('bg-yellow-100/50', 'dark:bg-yellow-900/20');
      }, 2000);
    }
  }, []);

  useImperativeHandle(ref, () => ({
    scrollToMessage,
  }));

  return (
    <ScrollArea data-messages-scroll className="flex-1 min-h-0 p-4">
      {isLoadingMessages ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1">
                <Skeleton className="h-3 w-20" />
                <Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-36")} />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          No messages yet. Start the conversation!
        </p>
      ) : (
        <div className="space-y-4">
          {/* All messages in chronological order (including pinned) */}
          {messages.map((msg, index) => {
            const participant = msg.chatConversationParticipant;
            const showNewDivider = index === firstUnreadIndex && firstUnreadIndex !== -1;
            const isMe = participant?.participantId === userId;
            return (
              <div key={msg.chatMessageId} ref={(el) => { if (el) messageRefs.current.set(msg.chatMessageId, el); }} className="space-y-2">
                {showNewDivider && (
                  <div className="flex items-center gap-2 py-2">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground font-medium">New Messages</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}
                {!msg.chatConversationParticipant ? (
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground italic px-3 py-1">
                      {msg.chatMessageText}
                    </span>
                  </div>
                ) : (msg.deletedForEveryone || msg.chatMessageText === "This message has been deleted") ? (
                  <div
                    className={cn("flex gap-2 items-center relative group", isMe ? "flex-row-reverse" : "flex-row")}
                  >
                    <Avatar className="h-8 w-8 shrink-0 opacity-50">
                      <AvatarImage src={participant?.participantAvatar} />
                      <AvatarFallback>{(participant?.participantName || "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[70%]", isMe ? "items-end" : "items-start")}>
                      <div className="relative group">
                        <div className="rounded-2xl px-3 py-2 text-sm italic text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800/50 border border-dashed border-gray-300 dark:border-gray-600">
                          This message has been deleted
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : msg.isDeleted ? (
                  <div className="flex justify-center">
                    <span className="text-xs text-muted-foreground italic px-3 py-1">
                      {msg.chatMessageText}
                    </span>
                  </div>
                ) : (
                  <div
                    className={cn("flex gap-2 items-center relative group", isMe ? "flex-row-reverse" : "flex-row")}
                    onMouseEnter={() => setHoveredMessageId(msg.chatMessageId)}
                    onMouseLeave={() => setHoveredMessageId(null)}
                  >
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={participant?.participantAvatar} />
                      <AvatarFallback>{(participant?.participantName || "?").charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn("max-w-[70%]", isMe ? "items-end" : "items-start")}>
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium">{participant?.participantName || "Unknown"}</span>
                        {participant?.orgType && (
                          <Badge className={cn("text-[9px] px-1", getOrgBadgeColor(participant.orgType))}>
                            {participant.orgType}
                          </Badge>
                        )}
                        {msg.isPinned && (
                          <Badge className="text-[9px] px-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 flex items-center gap-1">
                            <Flag className="h-2.5 w-2.5" />
                            Pinned
                          </Badge>
                        )}
                        {/* Message Action Menu - shows on hover of message row */}
                        <DropdownMenu open={messageActionMenuId === msg.chatMessageId} onOpenChange={(open) => setMessageActionMenuId(open ? msg.chatMessageId : null)}>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5"
                              aria-label="Message options"
                            >
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => onReplyMessage(msg)}
                              className="flex items-center gap-2"
                            >
                              <Reply className="h-4 w-4" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onPinMessage(msg.chatMessageId)}
                              className="flex items-center gap-2"
                            >
                              <Flag className="h-4 w-4" />
                              {msg.isPinned ? "Unpin" : "Pin"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => onCopyMessage(msg.chatMessageText || "")}
                              className="flex items-center gap-2"
                            >
                              <Copy className="h-4 w-4" />
                              Copy
                            </DropdownMenuItem>
                            {isMe && (
                              <DropdownMenuItem
                                onClick={() => onDeleteMessage(msg)}
                                className="flex items-center gap-2 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete message
                              </DropdownMenuItem>
                            )}
                            {!isMe && (
                              <DropdownMenuItem
                                onClick={() => onDeleteMessage(msg)}
                                className="flex items-center gap-2 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete for me
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {/* Reply Indicator */}
                      {replyMap.has(msg.chatMessageId) && (
                        <div className="mb-1 flex items-center gap-1 px-2 py-1 bg-black/5 rounded-xl text-xs">
                          <Reply className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-muted-foreground">
                            Replying to
                          </span>
                          <span className="text-muted-foreground truncate max-w-50">
                            {(() => {
                              const repliedToId = replyMap.get(msg.chatMessageId);
                              const repliedMsg = messages.find(m => m.chatMessageId === repliedToId);
                              return repliedMsg?.chatConversationParticipant?.participantName || "Unknown";
                            })()}
                            {" "}
                            {(() => {
                              const repliedToId = replyMap.get(msg.chatMessageId);
                              const repliedMsg = messages.find(m => m.chatMessageId === repliedToId);
                              const text = repliedMsg?.chatMessageText || "";
                              return text.length > 30 ? text.slice(0, 30) + "..." : text;
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="relative group">
                        <div className={cn(
                          "rounded-2xl px-3 py-2 text-sm",
                          isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                        )}>
                          {msg.chatMessageText}
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {isMe && (
                            <span className="text-muted-foreground">
                              {msg.messageSeenByList && msg.messageSeenByList.length > 0 ? (
                                <CheckCheck className="h-3 w-3 text-blue-500" />
                              ) : msg.chatMessageStatus === "DELIVERED" || msg.chatMessageStatus === "RECEIVED" ? (
                                <CheckCheck className="h-3 w-3" />
                              ) : (
                                <Check className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  );
});

ChatMessages.displayName = "ChatMessages";