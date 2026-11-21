"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNexusBuddy } from "@/hooks/use-nexus-buddy";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, Copy, History, Loader2, MessageCircle, Plus, Send, Sparkles, Terminal, Trash2, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NexusBuddyChatProps {
	context?: string;
	allowedTools?: string[];
	className?: string;
	placeholder?: string;
	maxHeight?: string;
	title?: string;
	description?: string;
	showHeader?: boolean;
	fullScreen?: boolean;
	onConversationsChange?: (conversations: Array<{ id: string; title: string; updatedAt: string }>) => void;
}

export function NexusBuddyChat({
	context,
	allowedTools,
	className,
	placeholder = "Type a message...",
	maxHeight = "h-96",
	title = "Nexus Buddy",
	description = "AI-powered assistant",
	showHeader = true,
	fullScreen = false,
}: NexusBuddyChatProps) {
	const [inputValue, setInputValue] = useState("");
	const [copiedId, setCopiedId] = useState<string | null>(null);

	const { toast } = useToast();

	const {
		messages: rawMessages,
		isLoading,
		sendMessage,
		error,
		loadConversation,
		newConversation,
	} = useNexusBuddy({
		context,
		allowedTools,
	});

	// Listen for history panel events
	useEffect(() => {
		const loadHandler = (e: Event) => {
			const convId = (e as CustomEvent).detail;
			if (convId) loadConversation(convId);
		};
		const newHandler = () => {
			newConversation();
		};
		window.addEventListener("nexus-buddy-load-conversation", loadHandler);
		window.addEventListener("nexus-buddy-new-conversation", newHandler);
		return () => {
			window.removeEventListener("nexus-buddy-load-conversation", loadHandler);
			window.removeEventListener("nexus-buddy-new-conversation", newHandler);
		};
	}, [loadConversation, newConversation]);


	const messages = rawMessages as unknown as Array<{
		id: string;
		role: "user" | "assistant" | "system" | "tool";
		content: string;
		timestamp: Date;

		toolCall?: {
			name: string;
			arguments: Record<string, unknown>;
			status: "pending" | "in_progress" | "completed" | "failed";
			result?: unknown;
		};
	}>;

	const handleSend = async () => {
		if (!inputValue.trim() || isLoading) return;

		await sendMessage(inputValue);
		setInputValue("");
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleCopy = (content: string, id: string) => {
		navigator.clipboard.writeText(content);
		setCopiedId(id);
		toast({
			title: "Copied to clipboard",
		});
		setTimeout(() => setCopiedId(null), 2000);
	};

	const formatTime = (date: Date | string) => {
		const d = date instanceof Date ? date : new Date(date);
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	};

	const isToolResult = (msg: typeof messages[0]) => {
		return msg.role === "user" && msg.toolCall?.status === "completed";
	};

	// Render message content with markdown for assistant
	const renderContent = (msg: typeof messages[0]) => {
		const isUser = msg.role === "user";

		if (isToolResult(msg)) {
			return (
				<div className="font-mono text-xs bg-muted/50 p-2 rounded border">
					<div className="text-muted-foreground mb-1 text-[10px] uppercase tracking-wide">Tool Result</div>
					<div className="whitespace-pre-wrap break-all">{msg.content}</div>
				</div>
			);
		}

		if (isUser) {
			return <div className="text-sm leading-relaxed">{msg.content}</div>;
		}

		return (
			<div className="prose dark:prose-invert max-w-none text-sm">
				<ReactMarkdown remarkPlugins={[remarkGfm]}>
					{msg.content}
				</ReactMarkdown>
			</div>
		);
	};

	return (
		<div className={cn("flex flex-col bg-background", fullScreen ? "h-full" : "", className)}>
			{/* Header */}
			{showHeader && (
				<div className="flex items-center gap-3 p-4 border-b bg-linear-to-r from-primary/10 to-transparent">
					<div className="relative">
						<Avatar className="h-10 w-10">
							<AvatarImage src="/avatars/buddy.svg" />
							<AvatarFallback className="bg-primary text-primary-foreground">
								<Sparkles className="h-5 w-5" />
							</AvatarFallback>
						</Avatar>
						<span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
					</div>
					<div className="flex-1">
						<h3 className="font-semibold text-base">{title}</h3>
						<p className="text-xs text-muted-foreground">
							{context ? `Context: ${context}` : "Online"}
						</p>
					</div>
					{allowedTools && allowedTools.length > 0 && (
						<Badge variant="secondary" className="text-[10px]">
							{allowedTools.length} tools
						</Badge>
					)}
				</div>
			)}

			{/* Messages Area */}
			<ScrollArea className={cn("flex-1 min-h-0 px-4 py-3", maxHeight)}>
				<div className="space-y-4">
					{/* Empty state */}
					{messages.length === 0 && !error && (
						<div className="flex flex-col items-center justify-center py-8 text-center">
							<div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
								<MessageCircle className="h-8 w-8 text-primary" />
							</div>
							<p className="text-sm font-medium mb-1">
								{context
									? `I can help you with ${context}`
									: "Hi there! 👋"}
							</p>
							<p className="text-xs text-muted-foreground max-w-50">
								Ask me anything about your data, and I&apos;ll help you find what you need.
							</p>
							{allowedTools && allowedTools.length > 0 && (
								<div className="mt-4 flex flex-wrap gap-1 justify-center">
									{allowedTools.slice(0, 4).map(tool => (
										<Badge key={tool} variant="outline" className="text-[10px]">
											{tool}
										</Badge>
									))}
								</div>
							)}
						</div>
					)}

					{/* Messages */}
					{messages.map((message) => {
						const isUser = message.role === "user";

						return (
							<div
								key={message.id}
								className={cn(
									"flex gap-2",
									isUser ? "flex-row-reverse" : "flex-row"
								)}
							>
								{/* Avatar */}
								{!isUser && (
									<Avatar className="h-8 w-8 shrink-0">
										<AvatarFallback className="bg-primary/10 text-primary">
											<Sparkles className="h-4 w-4" />
										</AvatarFallback>
									</Avatar>
								)}

								{/* Message Bubble */}
								<div className={cn(
									"flex flex-col max-w-[75%]",
									isUser ? "items-end" : "items-start"
								)}>
									<div className={cn(
										"rounded-2xl px-4 py-2 shadow-sm",
										isUser
											? "bg-primary text-primary-foreground rounded-br-sm"
											: "bg-muted rounded-bl-sm"
									)}>
										{renderContent(message)}
									</div>

									<div className={cn(
										"flex items-center gap-1 mt-1 px-1",
										isUser ? "flex-row-reverse" : "flex-row"
									)}>
										<span className="text-[10px] text-muted-foreground">
											{formatTime(message.timestamp)}
										</span>

										{/* Tool name indicator */}
										{message.toolCall && !isUser && (
											<Badge variant="secondary" className="text-[10px] h-4">
												<Terminal className="h-2.5 w-2.5 mr-0.5" />
												{message.toolCall.name}
											</Badge>
										)}

										{/* Copy button */}
										{!isUser && (
											<Button
												variant="ghost"
												size="icon"
												className="h-5 w-5 opacity-0 group-hover:opacity-100"
												onClick={() => handleCopy(message.content, message.id)}
											>
												{copiedId === message.id ? (
													<Check className="h-3 w-3 text-green-500" />
												) : (
													<Copy className="h-3 w-3" />
												)}
											</Button>
										)}
									</div>
								</div>

								{/* User Avatar */}
								{isUser && (
									<Avatar className="h-8 w-8 shrink-0">
										<AvatarFallback className="bg-primary text-primary-foreground">
											U
										</AvatarFallback>
									</Avatar>
								)}
							</div>
						);
					})}

					{/* Error message */}
					{error && (
						<div className="flex gap-2">
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarFallback className="bg-destructive/10 text-destructive">
									<X className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
							<div className="bg-destructive/10 text-destructive rounded-2xl rounded-bl-sm px-4 py-2 text-sm max-w-[75%]">
								{error}
							</div>
						</div>
					)}

					{/* Loading indicator - typing dots */}
					{isLoading && (
						<div className="flex gap-2">
							<Avatar className="h-8 w-8 shrink-0">
								<AvatarFallback className="bg-primary/10 text-primary">
									<Sparkles className="h-4 w-4" />
								</AvatarFallback>
							</Avatar>
							<div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
								<div className="flex items-center gap-1">
									<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0ms" }} />
									<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "150ms" }} />
									<span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "300ms" }} />
								</div>
							</div>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* Input Area */}
			<div className="p-3 border-t bg-background/50">
				<div className="flex gap-2">
					<Input
						type="text"
						placeholder={placeholder}
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						onKeyDown={handleKeyDown}
						disabled={isLoading}
						className="flex-1 rounded-full bg-muted/50 border-0 focus-visible:ring-1"
					/>
					<Button
						onClick={handleSend}
						disabled={!inputValue.trim() || isLoading}
						size="icon"
						className="rounded-full h-10 w-10 shrink-0"
					>
						{isLoading ? (
							<Loader2 className="h-4 w-4 animate-spin" />
						) : (
							<Send className="h-4 w-4" />
						)}
					</Button>
				</div>
				{allowedTools && allowedTools.length > 0 && (
					<p className="text-[10px] text-muted-foreground mt-2 text-center">
						I can help with: {allowedTools.slice(0, 3).join(", ")}
						{allowedTools.length > 3 && ` +${allowedTools.length - 3} more`}
					</p>
				)}
			</div>
		</div>
	);
}

/**
 * Floating Nexus Buddy chat widget
 */
export function NexusBuddyFloatingChat({
	context,
	allowedTools,
}: {
	context?: string;
	allowedTools?: string[];
}) {
	const [isOpen, setIsOpen] = useState(false);
	const [showHistory, setShowHistory] = useState(false);

	// Lock body scroll when chat is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [isOpen]);

	const [conversations, setConversations] = useState<Array<{
		id: string;
		title: string;
		updatedAt: string;
	}>>([]);
	const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

	// Load conversations from server
	const loadConversationsFromServer = useCallback(async () => {
		if (typeof window === "undefined") return;
		let userId: string | null = null;
		try {
			const stored = localStorage.getItem('auth_user');
			if (stored) {
				const parsed = JSON.parse(stored) as { id?: string };
				userId = parsed.id || null;
			}
		} catch {
			// ignore
		}
		if (!userId) return;
		try {
			const { getConversations } = await import("@/lib/nexus-buddy-service");
			const serverConvs = await getConversations(userId);
			setConversations(serverConvs.map((c: { id: number; title: string; updatedAt: string }) => ({
				id: String(c.id),
				title: c.title,
				updatedAt: c.updatedAt,
			})));
		} catch {
			setConversations([]);
		}
	}, []);

	// Load on mount and when chat opens
	useEffect(() => {
		const timer = setTimeout(() => {
			loadConversationsFromServer();
		}, 0);
		return () => clearTimeout(timer);
	}, [loadConversationsFromServer, isOpen]);

	// Listen for conversation changes from NexusBuddyChat
	useEffect(() => {
		const handler = () => {
			setTimeout(() => loadConversationsFromServer(), 0);
		};
		window.addEventListener("nexus-buddy-conversations-changed", handler);
		return () => window.removeEventListener("nexus-buddy-conversations-changed", handler);
	}, [loadConversationsFromServer]);

	const loadConversation = (convId: string) => {
		window.dispatchEvent(new CustomEvent("nexus-buddy-load-conversation", { detail: convId }));
		setShowHistory(false);
	};

	const newConversation = () => {
		window.dispatchEvent(new CustomEvent("nexus-buddy-new-conversation"));
		setShowHistory(false);
	};

	const deleteConversation = async (convId: string) => {
		if (typeof window === "undefined") return;
		let userId: string | null = null;
		try {
			const stored = localStorage.getItem('auth_user');
			if (stored) {
				const parsed = JSON.parse(stored) as { id?: string };
				userId = parsed.id || null;
			}
		} catch {
			// ignore
		}
		if (!userId) return;
		try {
			const { deleteServerConversation } = await import("@/lib/nexus-buddy-service");
			await deleteServerConversation(Number(convId), userId);
			setConversations(prev => prev.filter(c => c.id !== convId));
			window.dispatchEvent(new Event("nexus-buddy-conversations-changed"));
		} catch {
			// ignore
		}
	};

	return (
		<>
			{/* Floating toggle button with tooltip */}
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							onClick={() => setIsOpen(prev => !prev)}
							className="h-14 w-14 rounded-full shadow-2xl bg-linear-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 fixed bottom-6 right-6 z-40 transition-transform hover:scale-105"
							aria-label={isOpen ? "Close Nexus Buddy chat" : "Open Nexus Buddy chat"}
						>
							{isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="left" sideOffset={8}>
						{isOpen ? "Close Nexus Buddy" : "Ask Nexus Buddy"}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			{/* Chat panel */}
			{isOpen && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
						onClick={() => setIsOpen(false)}
					/>

					{/* Chat panel */}
					<div className="fixed bottom-24 right-6 z-40 w-95 sm:w-105 h-137.5 max-h-[80vh] shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-background border animate-slide-up">
						<div className="flex items-center justify-between p-4 border-b bg-linear-to-r from-primary/10 to-transparent">
							<div className="flex items-center gap-3">
								<div className="relative">
									<Avatar className="h-10 w-10">
										<AvatarFallback className="bg-primary text-primary-foreground">
											<Sparkles className="h-5 w-5" />
										</AvatarFallback>
									</Avatar>
									<span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
								</div>
								<div>
									<h3 className="font-semibold text-base">Nexus Buddy</h3>
									<p className="text-xs text-muted-foreground">
										{context ? `Context: ${context}` : "Online • AI Assistant"}
									</p>
								</div>
							</div>
							<div className="flex items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setShowHistory(!showHistory)}
									className="h-8 w-8"
									title="Conversation history"
								>
									<History className="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									onClick={() => setIsOpen(false)}
									className="h-8 w-8"
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<div className="relative flex-1 min-h-0">
							{/* Chat (always mounted) */}
							<div className={cn("absolute inset-0", showHistory && "invisible")}>
								<NexusBuddyChat
									context={context}
									allowedTools={allowedTools}
									placeholder="Type a message..."
									maxHeight="flex-1"
									showHeader={false}
									className="flex-1 min-h-0 h-full"
								/>
							</div>

							{/* History panel (overlay) */}
							{showHistory && (
								<div className="absolute inset-0 bg-background flex flex-col">
									<div className="flex items-center justify-between p-3 border-b">
										<h4 className="text-sm font-medium">Conversations</h4>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => { newConversation(); setShowHistory(false); }}
											className="h-7 text-xs"
										>
											<Plus className="h-3 w-3 mr-1" />
											New
										</Button>
									</div>
									<ScrollArea className="flex-1 px-2 py-2">
										<div className="space-y-1">
											{conversations.length === 0 && (
												<p className="text-xs text-muted-foreground text-center py-4">
													No conversations yet
												</p>
											)}
											{conversations.map((conv) => (
												<div
													key={conv.id}
													className={cn(
														"flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-muted group",
														activeConversationId === conv.id && "bg-muted"
													)}
													onClick={() => { loadConversation(conv.id); setShowHistory(false); }}
												>
													<div className="flex-1 min-w-0">
														<p className="text-xs font-medium truncate">{conv.title}</p>
														<p className="text-[10px] text-muted-foreground">
															{new Date(conv.updatedAt).toLocaleDateString()}
														</p>
													</div>
													<Button
														variant="ghost"
														size="icon"
														className="h-6 w-6 opacity-0 group-hover:opacity-100"
														onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
													>
														<Trash2 className="h-3 w-3" />
													</Button>
												</div>
											))}
										</div>
									</ScrollArea>
								</div>
							)}
						</div>
					</div>
				</>
			)}
		</>
	);
}

/**
 * Inline chat bubble for specific entities
 */
export function NexusBuddyChatBubble({
	context,
	allowedTools,
	entityName,
}: {
	context?: string;
	allowedTools?: string[];
	entityName?: string;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const effectiveContext = context;

	return (
		<>
			<Button
				onClick={() => setIsOpen(true)}
				variant="ghost"
				size="sm"
				className="text-primary hover:bg-primary/10 gap-1"
			>
				<MessageCircle className="h-4 w-4" />
				Ask AI
			</Button>

			{isOpen && (
				<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
					<div className="w-full max-w-2xl h-150 max-h-[80vh] bg-background rounded-2xl shadow-2xl overflow-hidden flex flex-col">
						<div className="flex items-center justify-between p-4 border-b bg-linear-to-r from-primary/10 to-transparent">
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10">
									<AvatarFallback className="bg-primary text-primary-foreground">
										<Sparkles className="h-5 w-5" />
									</AvatarFallback>
								</Avatar>
								<div>
									<h3 className="font-semibold text-base">
										{entityName ? `AI Assistant for ${entityName}` : "Nexus Buddy"}
									</h3>
									<p className="text-xs text-muted-foreground">
										{context ? `Context: ${context}` : "Online • AI Assistant"}
									</p>
								</div>
							</div>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => setIsOpen(false)}
								className="h-8 w-8"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<NexusBuddyChat
							context={effectiveContext}
							allowedTools={allowedTools}
							placeholder={entityName ? `Ask about ${entityName}...` : "Type a message..."}
							maxHeight="flex-1"
							showHeader={false}
							className="flex-1 min-h-0"
						/>
					</div>
				</div>
			)}
		</>
	);
}