"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import React from "react";
import { ChatInterface } from "./chat-components";
import { useUserMetadata } from "@/hooks/use-user-metadata";

const ChatDialog = ({
  showDialog,
  setOpenChatDialog
}: {
  showDialog: boolean;
  setOpenChatDialog: (open: boolean) => void;
}) => {
  const { userId, orgId } = useUserMetadata(); // Ensure user metadata is loaded for chat functionality
  return (
    <Dialog open={showDialog} onOpenChange={setOpenChatDialog}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 flex flex-col rounded-lg overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Chat</DialogTitle>
        </VisuallyHidden>
        <ChatInterface userId={userId} orgId={orgId} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
