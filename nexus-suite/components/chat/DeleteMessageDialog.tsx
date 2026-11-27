"use client";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { ChatMessage } from "@/types/chat";

interface DeleteMessageDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  messageToDelete: ChatMessage | null;
  userId: number | null;
  onConfirmDelete: (deleteForEveryone: boolean) => void;
}

export function DeleteMessageDialog({
  isOpen,
  onOpenChange,
  messageToDelete,
  userId,
  onConfirmDelete,
}: DeleteMessageDialogProps) {
  const isOwnMessage = messageToDelete?.chatConversationParticipant?.participantId === userId;
  const preview = messageToDelete?.chatMessageText?.slice(0, 50) || "this message";

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
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
              onClick={() => onConfirmDelete(false)}
              className="mr-2"
            >
              Delete for me
            </Button>
          )}
          {isOwnMessage && (
            <AlertDialogAction
              onClick={() => onConfirmDelete(true)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete for everyone
            </AlertDialogAction>
          )}
          {!isOwnMessage && (
            <AlertDialogAction
              onClick={() => onConfirmDelete(false)}
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