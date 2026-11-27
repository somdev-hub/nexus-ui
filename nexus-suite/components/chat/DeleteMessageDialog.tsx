"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useChatStore, useChatActions } from "@/store/chatStore";
import { useUserMetadata } from "@/hooks/use-user-metadata";

export function DeleteMessageDialog() {
  const { userId: userIdStr, orgId: orgIdStr } = useUserMetadata();
  const userId = userIdStr ? Number(userIdStr) : null;
  const orgId = orgIdStr ? Number(orgIdStr) : null;
  const selectedConvId = useChatStore((s) => s.selectedConvId);
  const isOpen = useChatStore((s) => s.isDeleteMessageDialogOpen);
  const messageToDelete = useChatStore((s) => s.messageToDelete);
  const actions = useChatActions();

  const isOwnMessage = messageToDelete?.chatConversationParticipant?.participantId === userId;
  const preview = messageToDelete?.chatMessageText?.slice(0, 50) || "this message";

  return (
    <AlertDialog open={isOpen} onOpenChange={actions.setIsDeleteMessageDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete message?</AlertDialogTitle>
          <AlertDialogDescription>
            {isOwnMessage 
              ? `This will delete "${preview}...". Choose who to delete it for:`
              : `This will delete "${preview}..." for you.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          {isOwnMessage && (
            <Button
              variant="outline"
              onClick={() => actions.deleteMessage(selectedConvId!, messageToDelete!.chatMessageId, userId!, orgId!, false)}
              className="mr-2"
            >
              Delete for me
            </Button>
          )}
          {isOwnMessage && (
            <AlertDialogAction
              onClick={() => actions.deleteMessage(selectedConvId!, messageToDelete!.chatMessageId, userId!, orgId!, true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete for everyone
            </AlertDialogAction>
          )}
          {!isOwnMessage && (
            <AlertDialogAction
              onClick={() => actions.deleteMessage(selectedConvId!, messageToDelete!.chatMessageId, userId!, orgId!, false)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete for me
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}