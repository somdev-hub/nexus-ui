"use client";

import { useState, useRef, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  IconSend,
  IconSearch,
  IconDots,
  IconPhone,
  IconVideo,
  IconMessagePlus
} from "@tabler/icons-react";

// Mock data for conversations
const conversations = [
  {
    id: "conv-001",
    partner: "Premium Suppliers Ltd.",
    avatar: "PS",
    lastMessage: "We'll send the updated quote by tomorrow",
    timestamp: "2 min ago",
    unread: 2,
    online: true,
    type: "Supplier"
  },
  {
    id: "conv-002",
    partner: "Global Logistics Inc.",
    avatar: "GL",
    lastMessage: "Shipment confirmed for December 30th",
    timestamp: "1 hour ago",
    unread: 0,
    online: true,
    type: "Logistics"
  },
  {
    id: "conv-003",
    partner: "Material Masters Co.",
    avatar: "MM",
    lastMessage: "Can we schedule a call to discuss bulk orders?",
    timestamp: "3 hours ago",
    unread: 1,
    online: false,
    type: "Materials"
  },
  {
    id: "conv-004",
    partner: "Express Logistics",
    avatar: "EL",
    lastMessage: "The tracking number is updated in your account",
    timestamp: "Yesterday",
    unread: 0,
    online: true,
    type: "Logistics"
  },
  {
    id: "conv-005",
    partner: "Quality Materials Inc.",
    avatar: "QM",
    lastMessage: "Thank you for your business",
    timestamp: "2 days ago",
    unread: 0,
    online: false,
    type: "Materials"
  }
];

// Mock messages for the first conversation
const initialMessages = [
  {
    id: "msg-001",
    sender: "Premium Suppliers Ltd.",
    avatar: "PS",
    message: "Hi! Thanks for reaching out about the bulk order.",
    timestamp: "9:30 AM",
    isSent: false
  },
  {
    id: "msg-002",
    sender: "You",
    avatar: "YU",
    message:
      "Yes, we're interested in ordering 500 units of the premium series.",
    timestamp: "9:35 AM",
    isSent: true
  },
  {
    id: "msg-003",
    sender: "Premium Suppliers Ltd.",
    avatar: "PS",
    message:
      "Great! Let me prepare a detailed quotation for you. Will that include the customization options we discussed?",
    timestamp: "9:40 AM",
    isSent: false
  },
  {
    id: "msg-004",
    sender: "You",
    avatar: "YU",
    message:
      "Yes, with all the customization options and expedited shipping if possible.",
    timestamp: "9:45 AM",
    isSent: true
  },
  {
    id: "msg-005",
    sender: "Premium Suppliers Ltd.",
    avatar: "PS",
    message: "We'll send the updated quote by tomorrow",
    timestamp: "10:15 AM",
    isSent: false
  }
];

export default function ChatsPage() {
  const [selectedConversation, setSelectedConversation] = useState(
    conversations[0]
  );
  const [messages, setMessages] = useState(initialMessages);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const filteredConversations = conversations.filter((conv) =>
    conv.partner.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      const newMessage = {
        id: `msg-${Date.now()}`,
        sender: "You",
        avatar: "YU",
        message: messageInput,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit"
        }),
        isSent: true
      };
      setMessages([...messages, newMessage]);
      setMessageInput("");

      // Simulate partner response after a delay
      setTimeout(() => {
        const responseMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: selectedConversation.partner,
          avatar: selectedConversation.avatar,
          message:
            "Thanks for your message! I'll look into this and get back to you soon.",
          timestamp: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
          }),
          isSent: false
        };
        setMessages((prev) => [...prev, responseMessage]);
      }, 1000);
    }
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    const scrollElement = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      <div className="flex h-[calc(100vh-60px)]">
        {/* Sidebar - Conversations List */}
        <div className="w-100 border-r flex flex-col bg-card/50">
          {/* Header */}
          <div className="border-b p-4">
            <h2 className="text-xl font-bold mb-4">Messages</h2>
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground size-4" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 w-full">
            <div className="flex flex-col gap-1 p-2 mr-4 w-full">
              {filteredConversations.map((conversation) => (
                <Button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  variant="ghost"
                  className={`justify-start items-start gap-3 p-3 rounded-lg h-auto ${
                    selectedConversation.id === conversation.id
                      ? "bg-primary/10"
                      : ""
                  }`}
                >
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{conversation.avatar}</AvatarFallback>
                    </Avatar>
                    {conversation.online && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-sm truncate">
                        {conversation.partner}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {conversation.timestamp}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conversation.lastMessage}
                    </p>
                    {conversation.unread > 0 && (
                      <Badge variant="default" className="mt-1 text-xs">
                        {conversation.unread}
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* New Chat Button */}
          <div className="border-t p-4">
            <Button className="w-full">
              <IconMessagePlus className="size-4" />
              New Message
            </Button>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarFallback>
                        {selectedConversation.avatar}
                      </AvatarFallback>
                    </Avatar>
                    {selectedConversation.online && (
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">
                      {selectedConversation.partner}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {selectedConversation.type}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation.online ? "Online" : "Offline"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <IconPhone className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <IconVideo className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <IconDots className="size-4" />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
                <div className="flex flex-col gap-4 pr-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.isSent ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex items-end gap-2 ${
                          message.isSent ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {message.avatar}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`max-w-xs lg:max-w-md rounded-lg px-4 py-2 ${
                            message.isSent
                              ? "bg-primary text-primary-foreground rounded-br-none"
                              : "bg-muted text-muted-foreground rounded-bl-none"
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.isSent
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            }`}
                          >
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <IconSend className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <IconMessagePlus className="size-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
