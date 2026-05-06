'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ChatConversation } from './types'
import { formatTime, getInitials, getStatusColor } from './data'

interface ChatListItemProps {
  conversation: ChatConversation
  isSelected: boolean
  onClick: (id: string) => void
}

export function ChatListItem({ conversation, isSelected, onClick }: ChatListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(conversation.id)}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-lg text-left transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'bg-accent'
      )}
    >
      <div className="relative shrink-0">
        <Avatar className="size-10">
          <AvatarImage src={conversation.avatar} alt={conversation.name} />
          <AvatarFallback>{getInitials(conversation.name)}</AvatarFallback>
        </Avatar>
        {conversation.participants.length > 0 && (
          <span
            className={cn(
              'absolute bottom-0 right-0 size-3 rounded-full border-2 border-card',
              getStatusColor(conversation.participants[0].status)
            )}
          />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium text-sm truncate text-foreground">{conversation.name}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {formatTime(conversation.lastMessageTime)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-1">
          <p className="text-xs text-muted-foreground truncate">{conversation.lastMessage}</p>
          {conversation.unreadCount > 0 && (
            <Badge variant="default" className="shrink-0 text-xs h-5 min-w-5 px-1.5">
              {conversation.unreadCount}
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}
