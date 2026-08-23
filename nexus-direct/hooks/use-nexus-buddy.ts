"use client";

import {
  nexusBuddyChatByDomain,
  NexusBuddyChatRequest,
  nexusBuddyChatWithConversation,
  nexusBuddyStreamChat,
  nexusBuddyStreamChatByDomain,
  nexusBuddyStreamTestLogs,
} from "@/lib/auth-service";
import { useCallback, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  conversationId?: string;
  status?: "sending" | "sent" | "delivered" | "read" | "error";
}

interface UseNexusBuddyOptions {
  clientIds?: number[];
  domain?: string; // Domain for domain-based tool loading (e.g., "localhost:3001")
  model?: string;
  temperature?: number;
  maxTokens?: number;
  useStreaming?: boolean;
  useTestMode?: boolean; // Use test streaming endpoint (dummy logs)
  onError?: (error: Error) => void;
}

export function useNexusBuddy(options: UseNexusBuddyOptions = {}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const {
    clientIds = [],
    domain,
    model,
    temperature,
    maxTokens,
    useStreaming = true,
    useTestMode = false,
    onError,
  } = options;

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading) return;

      setError(null);
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content,
        timestamp: new Date(),
        conversationId: conversationId || undefined,
        status: "sent",
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      abortControllerRef.current = new AbortController();

      try {
        const request: NexusBuddyChatRequest = {
          message: content,
          history: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          clientIds,
          conversationId: conversationId || undefined,
          model,
          temperature,
          maxTokens,
        };

        if (useStreaming) {
          setIsStreaming(true);
          let assistantContent = "";
          const assistantMessageId = crypto.randomUUID();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            timestamp: new Date(),
            conversationId: conversationId || undefined,
            status: "sending",
          };

          setMessages((prev) => [...prev, assistantMessage]);

          // Use domain-based streaming if domain is provided, or test mode
          const streamGenerator = useTestMode
            ? nexusBuddyStreamTestLogs(request)
            : domain
              ? nexusBuddyStreamChatByDomain(request, domain)
              : nexusBuddyStreamChat(request);

          let buffer = "";

          // Helper function to parse a single SSE event string
          const parseSSEEvent = (
            event: string,
          ): { eventType: string; eventData: string } => {
            const lines = event.split(/\r?\n/);
            let eventData = "";
            let eventType = "message";

            for (const line of lines) {
              if (line.startsWith("event:")) {
                eventType = line.slice(6).trim();
              } else if (line.startsWith("data:")) {
                const data = line.slice(5).trimStart();
                if (data && data !== "[DONE]") {
                  eventData += data + "\n";
                }
              }
            }
            eventData = eventData.trimEnd();
            return { eventType, eventData };
          };

          // Helper function to process all complete events in buffer
          const processBuffer = (buf: string): string => {
            let remaining = buf;
            let eventEndIndex;
            // Handle both \n\n and \r\n\r\n as event separators
            while (true) {
              const idx1 = remaining.indexOf("\n\n");
              const idx2 = remaining.indexOf("\r\n\r\n");
              if (idx1 === -1 && idx2 === -1) break;
              // Use the earliest separator found
              eventEndIndex =
                idx1 !== -1 && idx2 !== -1
                  ? Math.min(idx1, idx2)
                  : idx1 !== -1
                    ? idx1
                    : idx2;
              const separatorLength = remaining[eventEndIndex] === "\r" ? 4 : 2;

              const event = remaining.slice(0, eventEndIndex);
              remaining = remaining.slice(eventEndIndex + separatorLength);

              if (!event.trim()) continue;

              console.log(
                "[useNexusBuddy] Processing event:",
                JSON.stringify(event),
              );

              const { eventType, eventData } = parseSSEEvent(event);

              console.log(
                "[useNexusBuddy] Event type:",
                eventType,
                "data:",
                JSON.stringify(eventData),
              );

              if (eventType === "done") {
                // Streaming complete
                setIsStreaming(false);
              } else if (eventData) {
                assistantContent += eventData;
                console.log(
                  "[useNexusBuddy] Updating assistant message, new content length:",
                  assistantContent.length,
                );
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: assistantContent, status: "sent" }
                      : m,
                  ),
                );
              }
            }
            return remaining;
          };

          for await (const chunk of streamGenerator) {
            console.log("[useNexusBuddy] Raw chunk:", JSON.stringify(chunk));
            buffer += chunk;
            buffer = processBuffer(buffer);
          }

          // Process any remaining buffer (incomplete event at the end)
          if (buffer.trim()) {
            console.log(
              "[useNexusBuddy] Processing remaining buffer:",
              JSON.stringify(buffer),
            );
            // Try to parse any complete events in the remaining buffer
            buffer = processBuffer(buffer);

            // If there's still content, try to parse it as a final event
            if (buffer.trim()) {
              const { eventType, eventData } = parseSSEEvent(buffer);
              console.log(
                "[useNexusBuddy] Final event type:",
                eventType,
                "data:",
                JSON.stringify(eventData),
              );
              if (eventType === "done") {
                setIsStreaming(false);
              } else if (eventData) {
                assistantContent += eventData;
                console.log(
                  "[useNexusBuddy] Final buffer - Updating assistant message, new content length:",
                  assistantContent.length,
                );
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessageId
                      ? { ...m, content: assistantContent, status: "sent" }
                      : m,
                  ),
                );
              }
            }
          }

          setIsStreaming(false);
          // Update conversation ID from the last message if available
          // The backend sends conversationId in the SSE event
        } else {
          // Use domain-based chat if domain is provided
          const response = domain
            ? await nexusBuddyChatByDomain(request, domain)
            : await nexusBuddyChatWithConversation(request);

          const assistantMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: "assistant",
            content: response.message,
            timestamp: new Date(response.timestamp),
            conversationId: response.conversationId,
            status: "delivered",
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setConversationId(response.conversationId);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Unknown error");
        const errorMsg = err.message;
        setError(errorMsg);
        onError?.(err);

        // Add error message
        const errorMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
          status: "error",
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [
      isLoading,
      conversationId,
      messages,
      clientIds,
      model,
      temperature,
      maxTokens,
      useStreaming,
      useTestMode,
      domain,
      onError,
    ],
  );

  const clearConversation = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }, []);

  const retryLastMessage = useCallback(() => {
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    if (lastUserMessage) {
      // Remove the failed assistant response
      setMessages((prev) =>
        prev.filter(
          (m) =>
            m.role !== "assistant" || m.timestamp > lastUserMessage.timestamp,
        ),
      );
      sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    conversationId,
    sendMessage,
    clearConversation,
    retryLastMessage,
  };
}
