export interface ChatUser {
  id: string
  name: string
  avatar?: string
  status?: 'online' | 'away' | 'offline'
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  senderAvatar?: string
  content: string
  timestamp: Date
  isOwn: boolean
}

export interface ChatConversation {
  id: string
  name: string
  avatar?: string
  lastMessage: string
  lastMessageTime: Date
  unreadCount: number
  isGroup: boolean
  participants: ChatUser[]
}
