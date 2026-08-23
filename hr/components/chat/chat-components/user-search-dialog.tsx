"use client";

import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Loader } from "lucide-react";
import { searchUsers } from "./data";
import {
  chatApiService,
  ChatConversation as ApiChatConversation
} from "@/lib/chat-api";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { ChatUser } from "./types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserSelected: (conversation: ApiChatConversation, user: ChatUser) => void;
  orgId: string;
  userId: string;
}

export function UserSearchDialog({
  open,
  onOpenChange,
  onUserSelected,
  orgId,
  userId
}: UserSearchDialogProps) {
  const { avatar, name, email, role, phone } = useUserMetadata();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timeoutId = window.setTimeout(() => {
      const runSearch = async () => {
        setIsSearching(true);
        try {
          const results = await searchUsers(searchQuery);
          if (cancelled) {
            return;
          }
          setSearchResults(results);
        } catch (err) {
          if (cancelled) {
            return;
          }

          console.error("Search failed:", err);
          setError("Failed to search users");
        } finally {
          if (!cancelled) {
            setIsSearching(false);
          }
        }
      };

      void runSearch();
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [open, searchQuery]);

  // Handle user search
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setError(null);
  }, []);

  // Handle creating a new direct conversation with selected user
  const handleSelectUser = async (user: ChatUser) => {
    setIsCreating(user.id.toString());
    setError(null);

    try {
      // Create new direct conversation with participant details
      const conversation = await chatApiService.createConversation(
        {
          chatConversationType: "DIRECT",
          participantIds: [Number(userId), Number(user.id)],
          orgId: Number(orgId),
          chatConversationName: undefined,
          chatConversationDescription: undefined,
          participants: [
            {
              participantId: Number(userId),
              participantName: name || "Unknown",
              participantEmail: email || userId + "@nexus.local",
              isChatCreator: true,
              participantMob: phone || "",
              participantRole: role || "USER",
              chatParticipantType: "MEMBER",
              participantAvatar: avatar
            },
            {
              participantId: Number(user.id),
              participantName: user.name,
              participantEmail: user.email || user.id + "@nexus.local",
              isChatCreator: false,
              participantMob: user.phone || "",
              participantRole: user.role || "USER",
              chatParticipantType: "MEMBER",
              participantAvatar: user.profilePhoto || user.avatar
            }
          ]
        },
        Number(orgId),
        Number(userId)
      );

      // Notify parent component with created conversation details.
      onUserSelected(conversation, user);

      // Reset and close dialog
      setSearchQuery("");
      setSearchResults([]);
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setError("Failed to start conversation");
    } finally {
      setIsCreating(null);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        setSearchQuery("");
        setSearchResults([]);
        setError(null);
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Start New Chat</DialogTitle>
          <DialogDescription>
            Search for users to start a direct conversation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9"
              disabled={isSearching}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 bg-destructive/10 text-destructive text-sm rounded">
              {error}
            </div>
          )}

          {/* Search Results */}
          <ScrollArea className="h-64 border rounded-md">
            {isSearching ? (
              <div className="flex items-center justify-center h-full">
                <Loader className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults.length > 0 ? (
              <div className="p-3 space-y-2">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex item-center gap-2">
                      <Avatar>
                        <AvatarImage src={user.profilePhoto ?? user.avatar} />
                        <AvatarFallback>
                          {/* // Use initials as fallback */}
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {user.name}
                        </p>
                        {/* <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p> */}
                        {user.department && (
                          <p className="text-xs text-muted-foreground">
                            {user.department}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSelectUser(user)}
                      disabled={isCreating === user.id.toString()}
                    >
                      {isCreating === user.id.toString() ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p className="text-sm">Type to search for users</p>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
