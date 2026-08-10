"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Paperclip, Smile, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { chatApiService } from "@/lib/chat-api";

interface MessageInputProps {
    onSendMessage: (message: string, attachments?: any[]) => void;
    onTyping?: () => void;
    isConnected?: boolean;
    orgId?: number;
    participantId?: number;
}

interface FilePreview {
    file: File;
    preview: string;
    type: "image" | "video" | "document";
}

export function MessageInput({
    onSendMessage,
    onTyping,
    isConnected = true,
    orgId,
    participantId
}: MessageInputProps) {
    const [message, setMessage] = useState("");
    const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([]);
    const [uploadedAttachments, setUploadedAttachments] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    /**
     * Handle file selection
     */
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.currentTarget.files;
        if (!files) return;

        const newPreviews: FilePreview[] = [];

        Array.from(files).forEach((file) => {
            const type = getFileType(file.type);

            let preview = "";
            if (type === "image" || type === "video") {
                preview = URL.createObjectURL(file);
            }

            newPreviews.push({ file, preview, type });
        });

        setSelectedFiles((prev) => [...prev, ...newPreviews]);
        setUploadError(null);

        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    /**
     * Determine file type from MIME type
     */
    const getFileType = (mimeType: string): "image" | "video" | "document" => {
        if (mimeType.startsWith("image/")) return "image";
        if (mimeType.startsWith("video/")) return "video";
        return "document";
    };

    /**
     * Remove selected file before upload
     */
    const removeFile = (index: number) => {
        setSelectedFiles((prev) => {
            const newFiles = prev.filter((_, i) => i !== index);
            // Clean up preview URL
            if (prev[index].preview) {
                URL.revokeObjectURL(prev[index].preview);
            }
            return newFiles;
        });
    };

    /**
     * Upload files and get attachment metadata
     */
    const handleUploadFiles = async () => {
        if (selectedFiles.length === 0 || !orgId || !participantId) return;

        setIsUploading(true);
        setUploadError(null);

        try {
            console.log("[MESSAGE INPUT] Uploading", selectedFiles.length, "files");
            const files = selectedFiles.map((fp) => fp.file);

            const attachments = await chatApiService.uploadMultimedia(
                files,
                participantId,
                orgId
            );

            console.log(
                "[MESSAGE INPUT] Upload successful:",
                attachments.length,
                "attachments"
            );
            setUploadedAttachments((prev) => [...prev, ...attachments]);
            setSelectedFiles([]);
        } catch (error) {
            console.error("[MESSAGE INPUT] Upload failed:", error);
            setUploadError(
                error instanceof Error ? error.message : "Failed to upload files"
            );
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Send message with attachments
     */
    const handleSend = async () => {
        if (!message.trim() && uploadedAttachments.length === 0) {
            return;
        }

        // If files are selected but not uploaded, upload first
        if (selectedFiles.length > 0) {
            await handleUploadFiles();
            return;
        }

        try {
            console.log(
                "[MESSAGE INPUT] Sending message with",
                uploadedAttachments.length,
                "attachments"
            );
            onSendMessage(message.trim(), uploadedAttachments);
            setMessage("");
            setUploadedAttachments([]);
        } catch (error) {
            console.error("[MESSAGE INPUT] Error sending message:", error);
            setUploadError(
                error instanceof Error ? error.message : "Failed to send message"
            );
        }
    };

    /**
     * Handle input change with typing indicator
     */
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setMessage(value);

        // Notify typing with debounce
        if (onTyping && isConnected) {
            onTyping();

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = setTimeout(() => {
                // Typing indicator will auto-stop after 5 seconds on the backend
            }, 1000);
        }
    };

    /**
     * Handle keyboard shortcuts
     */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const hasMessage = message.trim().length > 0;
    const hasFiles = selectedFiles.length > 0;
    const isReady = hasMessage || uploadedAttachments.length > 0;

    return (
        <div className="flex flex-col gap-2 p-4 border-t bg-card shrink-0">
            {/* Uploaded attachments preview */}
            {uploadedAttachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {uploadedAttachments.map((attachment, idx) => (
                        <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-sm"
                        >
                            <span className="truncate max-w-50">{attachment.fileName}</span>
                            <button
                                onClick={() => {
                                    setUploadedAttachments((prev) =>
                                        prev.filter((_, i) => i !== idx)
                                    );
                                }}
                                className="ml-1 hover:opacity-70"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Selected files preview before upload */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedFiles.map((preview, idx) => (
                        <div key={idx} className="relative group">
                            {preview.type === "image" && preview.preview && (
                                <img
                                    src={preview.preview}
                                    alt="preview"
                                    className="w-20 h-20 object-cover rounded border border-muted"
                                />
                            )}
                            {preview.type === "video" && preview.preview && (
                                <video
                                    src={preview.preview}
                                    className="w-20 h-20 object-cover rounded border border-muted"
                                />
                            )}
                            {preview.type === "document" && (
                                <div className="w-20 h-20 rounded border border-muted bg-muted flex items-center justify-center">
                                    <span className="text-xs text-center px-1">
                                        {preview.file.name.split(".").pop()?.toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <button
                                onClick={() => removeFile(idx)}
                                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Error message */}
            {uploadError && (
                <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
                    {uploadError}
                </div>
            )}

            {/* Main input area */}
            <div className="flex items-end gap-2">
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    disabled={!isConnected || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach files"
                >
                    <Paperclip className="size-5" />
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip"
                />

                <div className="flex-1 relative">
                    <Textarea
                        placeholder={
                            isConnected ? "Type a message..." : "Not connected to chat..."
                        }
                        value={message}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        className="min-h-10 max-h-32 resize-none pr-10"
                        disabled={!isConnected || isUploading}
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 bottom-1 size-8"
                        disabled={!isConnected}
                    >
                        <Smile className="size-5" />
                    </Button>
                </div>

                <Button
                    onClick={async () => {
                        if (selectedFiles.length > 0) {
                            await handleUploadFiles();
                        } else {
                            handleSend();
                        }
                    }}
                    disabled={
                        !isReady ||
                        !isConnected ||
                        isUploading ||
                        (selectedFiles.length === 0 && !hasMessage)
                    }
                    size="icon"
                    className="shrink-0"
                    title={selectedFiles.length > 0 ? "Upload files" : "Send message"}
                >
                    {isUploading ? (
                        <Loader2 className="size-4 animate-spin" />
                    ) : selectedFiles.length > 0 ? (
                        <Paperclip className="size-4" />
                    ) : (
                        <Send className="size-4" />
                    )}
                </Button>
            </div>
        </div>
    );
}
