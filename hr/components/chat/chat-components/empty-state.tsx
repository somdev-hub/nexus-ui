'use client'

import { Empty } from '@/components/ui/empty'
import { MessageSquare } from 'lucide-react'

export function ChatEmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <Empty
        icon={<MessageSquare className="size-10 text-muted-foreground" />}
        title="Select a conversation"
        description="Choose a chat from the sidebar to start messaging"
      />
    </div>
  )
}
