'use client'

import { Empty, EmptyMedia } from '@/components/ui/empty'
import { MessageSquare } from 'lucide-react'

export function ChatEmptyState() {
    return (
        <div className="flex-1 flex items-center justify-center bg-muted/30">
            <Empty>
                <EmptyMedia variant="icon">
                    <MessageSquare className="size-10 text-muted-foreground" />
                </EmptyMedia>
                <div className="flex max-w-sm flex-col items-center gap-2 text-center">
                    <div className="text-lg font-medium tracking-tight">Select a conversation</div>
                    <div className="text-sm/relaxed text-muted-foreground">Choose a chat from the sidebar to start messaging</div>
                </div>
            </Empty>
        </div>
    )
}
