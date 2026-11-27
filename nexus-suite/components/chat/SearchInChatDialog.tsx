"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { useChatStore, useChatActions } from "@/store/chatStore";
import { useUserMetadata } from "@/hooks/use-user-metadata";

export function SearchInChatDialog() {
  const { userId: userIdStr, orgId: orgIdStr } = useUserMetadata();
  const userId = userIdStr ? Number(userIdStr) : null;
  const orgId = orgIdStr ? Number(orgIdStr) : null;
  const selectedConvId = useChatStore((s) => s.selectedConvId);
  const isOpen = useChatStore((s) => s.isSearchInChatOpen);
  const searchQuery = useChatStore((s) => s.searchQueryInChat);
  const searchResults = useChatStore((s) => s.searchResultsInChat);
  const isSearching = useChatStore((s) => s.isSearchingInChat);
  const actions = useChatActions();

  return (
    <Dialog open={isOpen} onOpenChange={actions.setIsSearchInChatOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search in Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => actions.setSearchQueryInChat(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && selectedConvId && userId && orgId && actions.searchMessages(selectedConvId, userId, orgId, searchQuery)}
            />
            <Button onClick={() => selectedConvId && userId && orgId && actions.searchMessages(selectedConvId, userId, orgId, searchQuery)} disabled={!searchQuery.trim() || isSearching || !selectedConvId || !userId || !orgId}>
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <ScrollArea className="h-80">
              <div className="space-y-2">
                {searchResults.map((msg) => (
                  <div key={msg.chatMessageId} className="p-3 border rounded-lg hover:bg-muted cursor-pointer">
                    <div className="flex items-center gap-2 mb-1">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={msg.chatConversationParticipant?.participantAvatar} />
                        <AvatarFallback>{msg.chatConversationParticipant?.participantName?.charAt(0) || "?"}</AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium">{msg.chatConversationParticipant?.participantName}</p>
                      <p className="text-xs text-muted-foreground">{new Date(msg.sentAt).toLocaleString()}</p>
                    </div>
                    <p className="text-sm ml-8">{msg.chatMessageText}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
          {searchQuery && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-muted-foreground text-center py-4">No results found</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}