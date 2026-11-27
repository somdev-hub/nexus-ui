"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useChatStore, useChatActions } from "@/store/chatStore";
import { useUserMetadata } from "@/hooks/use-user-metadata";

export function DeleteConversationDialog() {
  const { userId: userIdStr, orgId: orgIdStr } = useUserMetadata();
  const userId = userIdStr ? Number(userIdStr) : null;
  const orgId = orgIdStr ? Number(orgIdStr) : null;
  const selectedConvId = useChatStore((s) => s.selectedConvId);
  const isOpen = useChatStore((s) => s.isDeleteDialogOpen);
  const selectedConvDetails = useChatStore((s) => s.selectedConvDetails);
  const isDeleting = useChatStore((s) => s.isDeletingConversation);
  const actions = useChatActions();

  return (
    <AlertDialog open={isOpen} onOpenChange={actions.setIsDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete {selectedConvDetails?.chatConversationType === "GROUP" ? "this group and all its messages" : "this conversation and all its messages"}. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => actions.deleteConversation(selectedConvId!, userId!, orgId!)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}