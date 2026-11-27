"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import type { ChatMessage } from "@/types/chat";

interface SearchInChatDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ChatMessage[];
  isSearching: boolean;
  onSearch: () => void;
}

export function SearchInChatDialog({
  isOpen,
  onOpenChange,
  searchQuery,
  setSearchQuery,
  searchResults,
  isSearching,
  onSearch,
}: SearchInChatDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Search in Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSearch()}
            />
            <Button onClick={onSearch} disabled={!searchQuery.trim() || isSearching}>
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