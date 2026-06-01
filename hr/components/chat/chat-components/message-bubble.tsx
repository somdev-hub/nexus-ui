"use client";

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { ChatMessage } from "./types";
import { formatMessageTime, getInitials } from "./data";
import { cn } from "@/lib/utils";
import { FileIcon, ImageIcon, Music, Video } from "lucide-react";

interface MessageBubbleProps {
  message: ChatMessage;
  onAttachmentClick?: (attachment: any) => void;
}

/**
 * Get icon for attachment type
 */
function getAttachmentIcon(type: string) {
  const typeUpper = type.toUpperCase();

  if (["JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(typeUpper)) {
    return <ImageIcon className="w-4 h-4" />;
  }
  if (["MP4", "MOV", "AVI", "WMV", "MKV"].includes(typeUpper)) {
    return <Video className="w-4 h-4" />;
  }
  if (["MP3", "WAV", "OGG", "M4A", "FLAC"].includes(typeUpper)) {
    return <Music className="w-4 h-4" />;
  }
  return <FileIcon className="w-4 h-4" />;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

export function MessageBubble({
  message,
  onAttachmentClick
}: MessageBubbleProps) {
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <div className={cn("flex gap-2 mb-2", message.isOwn && "flex-row-reverse")}>
      {!message.isOwn && (
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback className="text-xs">
            {getInitials(message.senderName)}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "flex flex-col gap-1 max-w-[70%]",
          message.isOwn ? "items-end" : "items-start"
        )}
      >
        {!message.isOwn && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {message.senderName}
            </span>
            {message.status === "read" &&
              message.messageSeenByList &&
              message.messageSeenByList.length > 0 && (
                <span className="text-xs text-muted-foreground">
                  ✓✓ {message.messageSeenByList.length}
                </span>
              )}
          </div>
        )}

        {/* Text message */}
        {message.content && (
          <div
            className={cn(
              "px-3 py-2 rounded-2xl",
              message.isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            )}
          >
            <p className="text-sm whitespace-pre-wrap wrap-break-word">
              {message.content}
            </p>
          </div>
        )}

        {/* Attachments */}
        {hasAttachments && (
          <div
            className={cn(
              "flex flex-col gap-2",
              message.isOwn ? "items-end" : "items-start"
            )}
          >
            {message.attachments.map((attachment, idx) => (
              <div
                key={idx}
                onClick={() => onAttachmentClick?.(attachment)}
                className={cn(
                  "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors",
                  message.isOwn
                    ? "bg-primary/20 hover:bg-primary/30"
                    : "bg-muted hover:bg-muted/80"
                )}
              >
                {getAttachmentIcon(attachment.attachmentType)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {attachment.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {attachment.attachmentType}
                  </p>
                </div>
                {/* For images/videos, show preview icon */}
                {["JPG", "JPEG", "PNG", "GIF", "WEBP"].includes(
                  attachment.attachmentType.toUpperCase()
                ) && <ImageIcon className="w-4 h-4 shrink-0 opacity-50" />}
              </div>
            ))}
          </div>
        )}

        {/* Message metadata */}
        <div
          className={cn(
            "flex items-center gap-2 text-xs text-muted-foreground",
            message.isOwn && "justify-end"
          )}
        >
          <span>{formatMessageTime(message.timestamp)}</span>
          {message.isEdited && <span className="italic">(edited)</span>}
          {message.isOwn && (
            <span>
              {message.status === "sent" && "✓"}
              {message.status === "delivered" && "✓✓"}
              {message.status === "received" && "✓✓"}
              {message.status === "read" && "✓✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
