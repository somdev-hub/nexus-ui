"use client";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRef, useEffect } from "react";
import { ChatInterface } from "./chat-components";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { Loader2 } from "lucide-react";

/**
 * ChatDialog Component
 *
 * Wrapper dialog that displays the ChatInterface.
 * User metadata is obtained directly by ChatInterface via use-user-metadata hook.
 */
const ChatDialog = ({
  showDialog,
  setOpenChatDialog
}: {
  showDialog: boolean;
  setOpenChatDialog: (open: boolean) => void;
}) => {
  const { isLoading } = useUserMetadata();
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    console.log(
      `[CHAT DIALOG] Render #${renderCount.current}, open: ${showDialog}`
    );
  });

  if (isLoading) {
    return (
      <Dialog open={showDialog} onOpenChange={setOpenChatDialog}>
        <DialogContent className="max-w-6xl h-[85vh] p-0 flex flex-col rounded-lg overflow-hidden items-center justify-center">
          <VisuallyHidden>
            <DialogTitle>Chat</DialogTitle>
          </VisuallyHidden>
          <Loader2 className="w-8 h-8 animate-spin" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={showDialog} onOpenChange={setOpenChatDialog}>
      <DialogContent className="max-w-6xl h-[85vh] p-0 flex flex-col rounded-lg overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Chat</DialogTitle>
        </VisuallyHidden>
        <ChatInterface />
      </DialogContent>
    </Dialog>
  );
};

export default ChatDialog;
