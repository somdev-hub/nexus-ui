"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { chatService } from "@/lib/services";
import { cn } from "@/lib/utils";
import type { ChatConversation, User } from "@/types/chat";
import { Building2, Check, Loader2, MessageCircle, Plus, Search, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface ChatSidebarProps {
  conversations: ChatConversation[];
  isLoadingConvs: boolean;
  selectedConvId: number | null;
  onSelectConversation: (convId: number) => void;
  onStartDirectChat: (user: User) => void;
}

export function ChatSidebar({
  conversations,
  isLoadingConvs,
  selectedConvId,
  onSelectConversation,
  onStartDirectChat,
}: ChatSidebarProps) {
  const { userId: userIdStr, orgId: orgIdStr, name: userName, avatar: userAvatar } = useUserMetadata();
  const userId = userIdStr ? Number(userIdStr) : null;
  const orgId = orgIdStr ? Number(orgIdStr) : null;
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [orgUsers, setOrgUsers] = useState<User[]>([]);
  const [isLoadingOrgUsers, setIsLoadingOrgUsers] = useState(false);
  const [contactTab, setContactTab] = useState<'my' | 'partner'>('my');
  const [partnerOrgs, setPartnerOrgs] = useState<{ orgId: number; orgName: string; users: User[] }[]>([]);
  const [isLoadingPartners, setIsLoadingPartners] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<User[]>([]);
  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [groupSearchResults, setGroupSearchResults] = useState<User[]>([]);
  const [isGroupSearching] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [creatingUserId] = useState<number | null>(null);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await chatService.searchUsers(query);
      setSearchResults(results);
    } catch (e) {
      console.error("Search failed:", e);
      toast({ title: "Search failed", description: "Could not search users. Please try again.", variant: "destructive" });
    } finally {
      setIsSearching(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      const t = setTimeout(() => setSearchResults([]), 0);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(() => {
      handleSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch]);

  useEffect(() => {
  if (!isSearchOpen || !orgId) return;
  let cancelled = false;
  const load = async () => {
    setIsLoadingOrgUsers(true);
    try {
      const users = await chatService.getOrgUsers(orgId);
      console.log("[CHAT] org users loaded:", users.length);
      if (!cancelled) setOrgUsers(users.filter((u) => u.id !== userId));
    } catch (e) {
      console.error("Failed to load org users", e);
    } finally {
      if (!cancelled) setIsLoadingOrgUsers(false);
    }
  };
  void load();
  return () => { cancelled = true; };
}, [isSearchOpen, orgId, userId]);

useEffect(() => {
  if (!isSearchOpen || contactTab !== 'partner' || !orgId) return;
  let cancelled = false;
  const load = async () => {
    setIsLoadingPartners(true);
    try {
      const orgs = await chatService.getPartnerOrgs(orgId);
      if (!cancelled) setPartnerOrgs(orgs.filter((o) => o.orgId !== orgId).map((o) => ({ ...o, users: o.users.filter((u) => u.id !== userId) })));
    } catch (e) {
      console.error("Failed to load partner users", e);
    } finally {
      if (!cancelled) setIsLoadingPartners(false);
    }
  };
  void load();
  return () => { cancelled = true; };
}, [isSearchOpen, contactTab, orgId, userId]);

const handleCreateConversation = useCallback(async (targetUser: User) => {
    if (!userId || !orgId) return;
    onStartDirectChat(targetUser);
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  }, [onStartDirectChat, userId, orgId]);

  const handleCreateGroup = useCallback(async () => {
    if (!userId || !orgId || !groupName.trim() || selectedGroupUsers.length === 0) return;
    setIsCreatingGroup(true);
    try {
      const participants = [
        { participantId: userId, participantName: userName || "Me", participantEmail: "", isChatCreator: true, participantMob: "", participantRole: "USER", chatParticipantType: "MEMBER", participantAvatar: userAvatar, orgId: orgId, orgName: undefined, orgType: undefined },
        ...selectedGroupUsers.map((u) => ({
          participantId: u.id,
          participantName: u.name,
          participantEmail: u.email,
          isChatCreator: false,
          participantMob: u.phone || "",
          participantRole: u.role || "USER",
          chatParticipantType: "MEMBER",
          participantAvatar: u.profilePhoto,
          orgId: u.orgId,
          orgName: u.orgName,
          orgType: u.orgType,
        })),
      ];
      const conv = await chatService.createConversation(
        {
          chatConversationName: groupName.trim(),
          chatConversationDescription: groupDescription.trim() || undefined,
          chatConversationType: "GROUP",
          orgId: orgId,
          participantIds: [userId, ...selectedGroupUsers.map((u) => u.id)],
          participants: participants as NonNullable<typeof participants>,
        },
        orgId,
        userId
      );
      onSelectConversation(conv.chatConversationId);
      setIsGroupDialogOpen(false);
      setGroupName("");
      setGroupDescription("");
      setSelectedGroupUsers([]);
      setGroupSearchQuery("");
      setGroupSearchResults([]);
      toast({ title: `Group "${conv.chatConversationName}" created` });
    } catch (e: unknown) {
      console.error("Failed to create group:", e);
      toast({ title: "Failed to create group", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsCreatingGroup(false);
    }
  }, [userId, orgId, userName, userAvatar, groupName, groupDescription, selectedGroupUsers, toast, onSelectConversation]);

  const getOrgBadgeColor = (orgType?: string) => {
    switch (orgType?.toUpperCase()) {
      case "RETAILER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "SUPPLIER": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "LOGISTICS": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  if (!userId || !orgId) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to use chat.</p>
      </div>
    );
  }

  return (
    <div className="hidden md:flex md:flex-col md:w-80 lg:w-96 shrink-0 border-r h-full overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold">Messages</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuItem onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                New Chat
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsGroupDialogOpen(true)} className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                New Group
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <DialogTrigger asChild>
              <Button style={{ display: 'none' }} />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Start a new conversation</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Search users by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch(searchQuery)}
                  />
                  <Button onClick={() => handleSearch(searchQuery)} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant={contactTab === 'my' ? 'default' : 'outline'} onClick={() => setContactTab('my')}>My Org</Button>
                  <Button size="sm" variant={contactTab === 'partner' ? 'default' : 'outline'} onClick={() => setContactTab('partner')}>Partner Orgs</Button>
                </div>
                <ScrollArea className="h-60">
                  <div className="space-y-2">
                    {(searchQuery ? searchResults : contactTab === 'my' ? orgUsers : partnerOrgs.flatMap((o) => o.users)).map((user) => (
                      <div
                        key={user.id}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer",
                          creatingUserId === user.id && "opacity-50 pointer-events-none"
                        )}
                        onClick={() => handleCreateConversation(user)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.profilePhoto} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          {user.orgName && user.orgId !== orgId && (
                            <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {user.orgName}
                            </p>
                          )}
                        </div>
                        {creatingUserId === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                          <>
                            {user.orgType && (
                              <Badge className={cn("text-[10px]", getOrgBadgeColor(user.orgType))}>
                                {user.orgType}
                              </Badge>
                            )}
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </>
                        )}
                      </div>
                    ))}
                    {isSearching && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                    {((searchQuery ? searchResults : contactTab === 'my' ? orgUsers : partnerOrgs.flatMap((o) => o.users)).length === 0 && !isSearching && !isLoadingOrgUsers && !isLoadingPartners) && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        {isLoadingOrgUsers || isLoadingPartners ? "Loading..." : "No users found"}
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
            <DialogTrigger asChild>
              <Button style={{ display: 'none' }} />
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Group name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
                <Input placeholder="Description (optional)" value={groupDescription} onChange={(e) => setGroupDescription(e.target.value)} />
                <Input placeholder="Search users to add..." value={groupSearchQuery} onChange={(e) => setGroupSearchQuery(e.target.value)} />
                {isGroupSearching && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {groupSearchResults.map((user) => {
                      const selected = selectedGroupUsers.some((u) => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer", selected && "bg-muted")}
                          onClick={() => setSelectedGroupUsers((prev) => selected ? prev.filter((u) => u.id !== user.id) : [...prev, user])}
                        >
                          <Avatar className="h-8 w-8"><AvatarImage src={user.profilePhoto} /><AvatarFallback>{user.name.charAt(0)}</AvatarFallback></Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                          </div>
                          {selected && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
                {selectedGroupUsers.length > 0 && (
                  <div className="text-xs text-muted-foreground">Selected: {selectedGroupUsers.map((u) => u.name).join(", ")}</div>
                )}
                <Button onClick={handleCreateGroup} disabled={isCreatingGroup || !groupName.trim() || selectedGroupUsers.length === 0} className="w-full">
                  {isCreatingGroup ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Group"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoadingConvs ? (
            <div className="p-2 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No conversations yet. <span className="font-bold">Start a new chat!</span>
            </p>
          ) : (
            [...conversations].sort((a, b) => {
              const aNew = !a.lastMessageAt;
              const bNew = !b.lastMessageAt;
              if (aNew !== bNew) return aNew ? -1 : 1;
              if (aNew) {
                const ca = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const cb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return cb - ca;
              }
              const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
              const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
              return timeB - timeA;
            }).map((conv) => {
              const displayName = conv.chatConversationName || conv.otherParticipantName || "Conversation";
              const avatarUrl = conv.otherParticipantAvatar;
              const isGroup = conv.chatConversationType === "GROUP";
              const avatarFallback = isGroup ? null : (conv.otherParticipantName?.charAt(0) || displayName.charAt(0));
              const lastMsg = conv.lastMessage || <span className="text-primary font-medium">Start a conversation</span>;
              const lastMsgTime = conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "";

              return (
                <div
                  key={conv.chatConversationId}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer hover:bg-muted transition-colors",
                    selectedConvId === conv.chatConversationId && "bg-muted"
                  )}
                  onClick={() => onSelectConversation(conv.chatConversationId)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarImage src={avatarUrl} />
                      <AvatarFallback className={isGroup ? "bg-primary/10" : ""}>
                        {isGroup ? <Users className="h-5 w-5 text-primary" /> : avatarFallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex gap-2 items-center">
                          <p className="text-sm font-medium truncate">{displayName}</p>
                          {conv.isInterOrg && (
                            <div className="mt-1">
                              <Badge variant="secondary" className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                Inter-org
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {lastMsgTime && <span className="text-xs text-muted-foreground">{lastMsgTime}</span>}
                          {(conv.unreadCount ?? 0) > 0 && (
                            <Badge variant="default" className="text-[10px] h-4 min-w-4 px-1.5 rounded-full">
                              {conv.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">
                        {lastMsg}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}