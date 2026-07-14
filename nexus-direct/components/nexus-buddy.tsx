"use client"

import * as React from "react"
import { MessageCircle, X, Send, Sparkles, User, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  images?: string[]
}

interface PendingImage {
  id: string
  url: string
  name: string
}

const DUMMY_REPLIES = [
  "Got it — let me look into that for you.",
  "That's a great question. Here's a quick take on it.",
  "I hear you. Here's some dummy context while the real backend gets wired up.",
  "Thanks for sharing that. I'll simulate a helpful answer here.",
  "Interesting! Here's a placeholder reply until real AI logic is connected.",
]

function getDummyReply() {
  return DUMMY_REPLIES[Math.floor(Math.random() * DUMMY_REPLIES.length)]
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

/** A single chat bubble — shadcn doesn't ship an official "Bubble" primitive,
 *  so this follows shadcn conventions (Avatar + Card + cn) to build one that
 *  matches the rest of the design system. */
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex items-end gap-2", isUser && "flex-row-reverse")}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback
          className={cn(
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-foreground"
          )}
        >
          {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div className={cn("flex max-w-[75%] flex-col gap-1", isUser && "items-end")}>
        {message.images && message.images.length > 0 && (
          <div
            className={cn(
              "grid gap-1.5",
              message.images.length > 1 ? "grid-cols-2" : "grid-cols-1"
            )}
          >
            {message.images.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt="Attached image"
                className="h-32 w-32 rounded-xl border object-cover shadow-sm"
              />
            ))}
          </div>
        )}
        {message.content && (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm leading-relaxed shadow-sm",
              isUser
                ? "rounded-br-sm bg-primary text-primary-foreground"
                : "rounded-bl-sm bg-muted text-foreground"
            )}
          >
            {message.content}
          </div>
        )}
        <span className="px-1 text-[10px] text-muted-foreground">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback className="bg-muted text-foreground">
          <Sparkles className="h-3.5 w-3.5" />
        </AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3 shadow-sm">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60 [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/60" />
      </div>
    </div>
  )
}

export function NexusBuddy() {
  const [open, setOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [isTyping, setIsTyping] = React.useState(false)
  const [pendingImages, setPendingImages] = React.useState<PendingImage[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hey there! I'm your assistant. Ask me anything to get started.",
      timestamp: new Date(),
    },
  ])

  const scrollAnchorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping, open])

  function handleSend() {
    const trimmed = input.trim()
    if (!trimmed && pendingImages.length === 0) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
      images: pendingImages.map((img) => img.url),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setPendingImages([])
    setIsTyping(true)

    // Simulated AI response — replace with a real API call later.
    window.setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content:
          userMessage.images && userMessage.images.length > 0
            ? "Thanks for the image! Once this is wired up to a real model, I'll be able to actually look at it."
            : getDummyReply(),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 900 + Math.random() * 700)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) return

      const reader = new FileReader()
      reader.onload = () => {
        setPendingImages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), url: reader.result as string, name: file.name },
        ])
      }
      reader.readAsDataURL(file)
    })

    // Reset so selecting the same file again still fires onChange.
    e.target.value = ""
  }

  function removePendingImage(id: string) {
    setPendingImages((prev) => prev.filter((img) => img.id !== id))
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      <Card
        className={cn(
          "flex w-[22rem] origin-bottom-right flex-col overflow-hidden border shadow-2xl transition-all duration-200 ease-out sm:w-96",
          open
            ? "pointer-events-auto h-[30rem] scale-100 opacity-100"
            : "pointer-events-none h-0 scale-95 opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-foreground/15">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none">Assistant</p>
              <p className="mt-1 text-xs text-primary-foreground/80">Usually replies instantly</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/15 hover:text-primary-foreground"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 bg-background">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
              <ChatBubble key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <div ref={scrollAnchorRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t bg-background p-3">
          {pendingImages.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingImages.map((img) => (
                <div key={img.id} className="group relative h-14 w-14 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.name}
                    className="h-14 w-14 rounded-lg border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePendingImage(img.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-foreground text-background shadow-sm"
                    aria-label={`Remove ${img.name}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0"
              aria-label="Attach image"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1"
              aria-label="Chat message"
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() && pendingImages.length === 0}
              className="shrink-0"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Floating toggle button */}
      <Button
        size="icon"
        onClick={() => setOpen((prev) => !prev)}
        className="h-14 w-14 rounded-full shadow-2xl transition-transform hover:scale-105 active:scale-95"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        <span className="relative flex h-6 w-6 items-center justify-center">
          <MessageCircle
            className={cn(
              "absolute h-6 w-6 transition-all duration-200",
              open ? "scale-0 opacity-0" : "scale-100 opacity-100"
            )}
          />
          <X
            className={cn(
              "absolute h-6 w-6 transition-all duration-200",
              open ? "scale-100 opacity-100" : "scale-0 opacity-0"
            )}
          />
        </span>
      </Button>
    </div>
  )
}