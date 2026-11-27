"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { chatService } from "@/lib/services";
import type { ChatConversation, ChatConversationParticipant, User } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Check, Loader2, Search, Trash2, Users, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useUserMetadata } from "@/hooks/use-user-metadata";

interface ManageGroupDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedConvDetails: ChatConversation | null;
  selectedConvId: number | null;
  onSaveDetails: () => void;
  onAddMembers: () => void;
  onSetAdmin: (memberId: number, isAdmin: boolean) => void;
  onRemoveMember: (memberId: number) => void;
  onDeleteGroup: () => void;
}

export function ManageGroupDialog({
  isOpen,
  onOpenChange,
  selectedConvDetails,
  selectedConvId,
  onSaveDetails,
  onAddMembers,
  onSetAdmin,
  onRemoveMember,
  onDeleteGroup,
}: ManageGroupDialogProps) {
  const { userId: userIdStr, orgId: orgIdStr, name: userName, avatar: userAvatar } = useUserMetadata();
  const userId = userIdStr ? Number(userIdStr) : null;
  const orgId = orgIdStr ? Number(orgIdStr) : null;
  const { toast } = useToast();

  const [manageGroupName, setManageGroupName] = useState("");
  const [manageGroupDescription, setManageGroupDescription] = useState("");
  const [manageSearchQuery, setManageSearchQuery] = useState("");
  const [manageSearchResults, setManageSearchResults] = useState<User[]>([]);
  const [isManageSearching, setIsManageSearching] = useState(false);
  const [selectedToAdd, setSelectedToAdd] = useState<User[]>([]);
  const [actionLoading, setActionLoading] = useState<{ memberId: number; action: "admin" | "remove" } | null>(null);
  const [isSavingGroupDetails, setIsSavingGroupDetails] = useState(false);
  const [isAddingMembers, setIsAddingMembers] = useState(false);
  const [isDeletingConversation, setIsDeletingConversation] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const savedGroupNameRef = useRef("");
  const savedGroupDescriptionRef = useRef("");

  useEffect(() => {
    if (isOpen && selectedConvDetails) {
      setManageGroupName(selectedConvDetails.chatConversationName || "");
      setManageGroupDescription(selectedConvDetails.chatConversationDescription || "");
      savedGroupNameRef.current = selectedConvDetails.chatConversationName || "";
      savedGroupDescriptionRef.current = selectedConvDetails.chatConversationDescription || "";
      setManageSearchQuery("");
      setManageSearchResults([]);
      setSelectedToAdd([]);
    } else if (!isOpen) {
      setManageGroupName("");
      setManageGroupDescription("");
      setManageSearchQuery("");
      setManageSearchResults([]);
      setSelectedToAdd([]);
    }
  }, [isOpen, selectedConvDetails]);

  useEffect(() => {
    if (!manageSearchQuery.trim()) {
      const t = setTimeout(() => setManageSearchResults([]), 0);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(async () => {
      setIsManageSearching(true);
      try {
        const results = await chatService.searchUsers(manageSearchQuery);
        setManageSearchResults(results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsManageSearching(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [manageSearchQuery]);

  const handleSaveGroupDetails = async () => {
    if (!selectedConvId || !userId || !orgId) return;
    setIsSavingGroupDetails(true);
    try {
      const updated = await chatService.updateConversation(selectedConvId, manageGroupName.trim() || undefined, manageGroupDescription.trim() || undefined, undefined, orgId, userId ?? undefined);
      toast({ title: "Group updated" });
      onSaveDetails();
      setIsSavingGroupDetails(false);
    } catch (e: unknown) {
      toast({ title: "Failed to update group", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
      setIsSavingGroupDetails(false);
    }
  };

  const handleAddGroupMembers = async () => {
    if (!selectedConvId || !orgId || !userId || selectedToAdd.length === 0) return;
    setIsAddingMembers(true);
    try {
      await chatService.addParticipants(selectedConvId, selectedToAdd.map((u) => u.id), orgId, userId);
      setSelectedToAdd([]);
      setManageSearchQuery("");
      setManageSearchResults([]);
      toast({ title: "Members added" });
      onAddMembers();
    } catch (e: unknown) {
      toast({ title: "Failed to add members", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" });
    } finally {
      setIsAddingMembers(false);
    }
  };

  const getOrgBadgeColor = (orgType?: string) => {
    switch (orgType?.toUpperCase()) {
      case "RETAILER": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "SUPPLIER": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "LOGISTICS": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[80vh] overflow-y-auto thin-scrollbar">
          <DialogHeader>
            <DialogTitle>Manage Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedConvDetails?.chatConversationAvatar} />
                <AvatarFallback className="bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <label className="text-sm font-medium mb-1 block">Group Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !selectedConvId || !userId || !orgId) return;
                    try {
                      await chatService.updateConversation(selectedConvId, manageGroupName || undefined, manageGroupDescription || undefined, file, orgId, userId ?? undefined);
                      toast({ title: "Group photo updated" });
                    } catch (err) {
                      toast({ title: "Failed to update photo", description: err instanceof Error ? err.message : "Unknown error", variant: "destructive" });
                    }
                  }}
                />
              </div>
            </div>
            <Input placeholder="Group name" value={manageGroupName} onChange={(e) => setManageGroupName(e.target.value)} />
            <Input placeholder="Description" value={manageGroupDescription} onChange={(e) => setManageGroupDescription(e.target.value)} />
            <Button onClick={handleSaveGroupDetails} disabled={isSavingGroupDetails} className="w-full">
              {isSavingGroupDetails ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Details"}
            </Button>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Members</p>
              <div className="space-y-2 max-h-32 overflow-y-auto thin-scrollbar">
                {selectedConvDetails?.chatConversationParticipants?.map((m) => (
                  <div key={m.participantId} className="flex items-center gap-3 p-2 rounded-lg">
                    <Avatar className="h-8 w-8"><AvatarImage src={m.participantAvatar} /><AvatarFallback>{(m.participantName || "?").charAt(0)}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{m.participantName}</p>
                        {(m.isAdmin || m.isChatCreator) && <Badge variant="secondary" className="text-[9px] bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">Admin</Badge>}
                        {m.isChatCreator && <Badge variant="secondary" className="text-[9px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Creator</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.participantRole}</p>
                    </div>
                    {m.participantId !== userId && (
                      <div className="flex items-center gap-1">
                        {(selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isAdmin || selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isChatCreator) && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" disabled={actionLoading?.memberId === m.participantId} onClick={() => onSetAdmin(m.participantId, !m.isAdmin)}>
                            {actionLoading?.memberId === m.participantId && actionLoading?.action === "admin" ? <Loader2 className="h-3 w-3 animate-spin" /> : (m.isAdmin ? "Remove Admin" : "Make Admin")}
                          </Button>
                        )}
                        {(selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isAdmin || selectedConvDetails?.chatConversationParticipants?.find((p) => p.participantId === userId)?.isChatCreator) && (
                          <Button size="sm" variant="destructive" className="h-7 text-xs" disabled={actionLoading?.memberId === m.participantId} onClick={() => onRemoveMember(m.participantId)}>
                            {actionLoading?.memberId === m.participantId && actionLoading?.action === "remove" ? <Loader2 className="h-3 w-3 animate-spin" /> : "Remove"}
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-sm font-medium mb-2">Add Members</p>
              <Input placeholder="Search users..." value={manageSearchQuery} onChange={(e) => setManageSearchQuery(e.target.value)} />
              {isManageSearching && (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              <ScrollArea className="h-24 mt-2" scrollbarClassName="w-1.5">
                <div className="space-y-2">
                  {manageSearchResults
                    .filter((u) => !selectedConvDetails?.chatConversationParticipants?.some((m) => m.participantId === u.id))
                    .map((user) => {
                      const selected = selectedToAdd.some((u) => u.id === user.id);
                      return (
                        <div
                          key={user.id}
                          className={cn("flex items-center gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer", selected && "bg-muted")}
                          onClick={() => setSelectedToAdd((prev) => selected ? prev.filter((u) => u.id !== user.id) : [...prev, user])}
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
              {selectedToAdd.length > 0 && (
                <Button onClick={handleAddGroupMembers} disabled={isAddingMembers} className="w-full mt-2">
                  {isAddingMembers ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add Selected (${selectedToAdd.length})`}
                </Button>
              )}
            </div>
            <div className="border-t pt-3">
              <Button variant="destructive" className="w-full" disabled={isDeletingConversation} onClick={() => {
                onOpenChange(false);
                setIsDeleteDialogOpen(true);
              }}>
                {isDeletingConversation ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Group
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this group and all its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteGroup} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}