'use client'

import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { ChatMessage } from './types'
import { formatMessageTime, getInitials } from './data'
import { cn } from '@/lib/utils'

interface MessageBubbleProps {
  message: ChatMessage
}

export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={cn('flex gap-2', message.isOwn && 'flex-row-reverse')}>
      {!message.isOwn && (
        <Avatar className="size-8 shrink-0">
          <AvatarImage src={message.senderAvatar} alt={message.senderName} />
          <AvatarFallback className="text-xs">{getInitials(message.senderName)}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col gap-1 max-w-[70%]', message.isOwn ? 'items-end' : 'items-start')}>
        {!message.isOwn && (
          <span className="text-xs font-medium text-muted-foreground">{message.senderName}</span>
        )}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl wrap-break-word',
            message.isOwn
              ? 'bg-primary text-primary-foreground rounded-br-md'
              : 'bg-muted rounded-bl-md'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground">{formatMessageTime(message.timestamp)}</span>
      </div>
    </div>
  )
}
