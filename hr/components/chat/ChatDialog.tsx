"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import React, { useEffect,useRef, useMemo } from "react";
import { ChatInterface } from "./chat-components";
import { useUserMetadata } from "@/hooks/use-user-metadata";

const ChatDialog = ({
  showDialog,
  setOpenChatDialog
}: {
  showDialog: boolean;
  setOpenChatDialog: (open: boolean) => void;
}) => {
  
  console.log("ChatDialog rendered, showDialog:", showDialog);
  const { userId, orgId, isLoading } = useUserMetadata(); // Ensure user metadata is loaded for chat functionality

  // Track exactly which prop/value changed between renders
  const renderCount = useRef(0);
  const prevValues = useRef({ showDialog, userId, orgId, isLoading });
  
  
  useEffect(() => {
    renderCount.current++;
    const prev = prevValues.current;
    console.log(`🔁 ChatDialog render #${renderCount.current}`, {
      showDialog: { prev: prev.showDialog, curr: showDialog, changed: prev.showDialog !== showDialog },
      userId: { prev: prev.userId, curr: userId, changed: prev.userId !== userId },
      orgId: { prev: prev.orgId, curr: orgId, changed: prev.orgId !== orgId },
      isLoading: { prev: prev.isLoading, curr: isLoading, changed: prev.isLoading !== isLoading },
    });
    prevValues.current = { showDialog, userId, orgId, isLoading };
  });
  if (isLoading) return null;


  return (
    <Dialog open={showDialog} onOpenChange={setOpenChatDialog}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 flex flex-col rounded-lg overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Chat</DialogTitle>
        </VisuallyHidden>
        <ChatInterface userId={userId ?? "0"} orgId={orgId ?? "0"} />
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
