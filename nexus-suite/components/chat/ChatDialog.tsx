"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useUserMetadata } from "@/hooks/use-user-metadata";
import { ChatInterface } from "./ChatInterface";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

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
  });

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (showDialog) {
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
    } else {
      document.body.style.overflow = "";
      document.body.style.height = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.height = "";
    };
  }, [showDialog]);

  if (!showDialog) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="w-[90vw] max-w-[1400px] h-[85vh] bg-background rounded-lg shadow-2xl flex overflow-hidden">
          <div className="w-80 border-r p-3 space-y-3">
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
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
          <div className="flex-1 flex flex-col">
            <div className="p-3 border-b flex items-center gap-3">
              <Skeleton className="h-6 w-32" />
              <div className="ml-auto flex gap-2">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
            <div className="flex-1 p-4 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className={cn("flex gap-2", i % 2 === 0 ? "flex-row" : "flex-row-reverse")}>
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className={cn("h-10 rounded-2xl", i % 2 === 0 ? "w-48" : "w-36")} />
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <Skeleton className="h-10 flex-1 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpenChatDialog(false)}>
      <div
        className="w-[90vw] max-w-[1400px] h-[85vh] bg-background rounded-lg shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <VisuallyHidden>
          <span>Chat</span>
        </VisuallyHidden>
        <ChatInterface />
      </div>
    </div>
  );
};

export default ChatDialog;