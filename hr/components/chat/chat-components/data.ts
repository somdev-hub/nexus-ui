import { ChatConversation, ChatMessage } from './types'

export const conversations: ChatConversation[] = [
  {
    id: '1',
    name: 'Sarah Anderson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    lastMessage: 'That sounds great! Let me check my calendar.',
    lastMessageTime: new Date(Date.now() - 5 * 60000),
    unreadCount: 2,
    isGroup: false,
    participants: [
      {
        id: 'user-1',
        name: 'Sarah Anderson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        status: 'online',
      },
    ],
  },
  {
    id: '2',
    name: 'Design Team',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Design',
    lastMessage: 'John: Just pushed the new design system updates',
    lastMessageTime: new Date(Date.now() - 2 * 60000),
    unreadCount: 0,
    isGroup: true,
    participants: [
      {
        id: 'user-2',
        name: 'John Smith',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
        status: 'online',
      },
      {
        id: 'user-3',
        name: 'Emily Davis',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
        status: 'away',
      },
      {
        id: 'user-4',
        name: 'Mike Wilson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mike',
        status: 'offline',
      },
    ],
  },
  {
    id: '3',
    name: 'Alex Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    lastMessage: 'See you at the meeting tomorrow!',
    lastMessageTime: new Date(Date.now() - 1 * 60 * 60000),
    unreadCount: 0,
    isGroup: false,
    participants: [
      {
        id: 'user-5',
        name: 'Alex Johnson',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        status: 'offline',
      },
    ],
  },
  {
    id: '4',
    name: 'Product Roadmap',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Product',
    lastMessage: 'Lisa: We should prioritize the mobile experience',
    lastMessageTime: new Date(Date.now() - 3 * 60 * 60000),
    unreadCount: 1,
    isGroup: true,
    participants: [
      {
        id: 'user-6',
        name: 'Lisa Chen',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
        status: 'online',
      },
      {
        id: 'user-7',
        name: 'David Martinez',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        status: 'online',
      },
    ],
  },
  {
    id: '5',
    name: 'Jessica Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    lastMessage: 'Thanks for your help with the project!',
    lastMessageTime: new Date(Date.now() - 6 * 60 * 60000),
    unreadCount: 0,
    isGroup: false,
    participants: [
      {
        id: 'user-8',
        name: 'Jessica Brown',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
        status: 'away',
      },
    ],
  },
]

export const messages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: 'm1',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'Hey, how was your weekend?',
      timestamp: new Date(Date.now() - 20 * 60000),
      isOwn: false,
    },
    {
      id: 'm2',
      senderId: 'user-0',
      senderName: 'You',
      content: 'Pretty good! Just relaxed at home. You?',
      timestamp: new Date(Date.now() - 18 * 60000),
      isOwn: true,
    },
    {
      id: 'm3',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'Nice! I went hiking with some friends',
      timestamp: new Date(Date.now() - 15 * 60000),
      isOwn: false,
    },
    {
      id: 'm4',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },
    {
      id: 'm5',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm6',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm7',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm8',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm9',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },{
      id: 'm10',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },
    {
      id: 'm7',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm8',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm9',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },{
      id: 'm10',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },
    {
      id: 'm7',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm8',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm9',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },{
      id: 'm10',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },
    {
      id: 'm7',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm8',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm9',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },{
      id: 'm10',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },
    {
      id: 'm7',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm8',
      senderId: 'user-1',
      senderName: 'Sarah Anderson',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      content: 'That sounds great! Let me check my calendar.',
      timestamp: new Date(Date.now() - 5 * 60000),
      isOwn: false,
    },
    {
      id: 'm9',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },{
      id: 'm10',
      senderId: 'user-0',
      senderName: 'You',
      content: 'That sounds nice! We should grab coffee soon',
      timestamp: new Date(Date.now() - 10 * 60000),
      isOwn: true,
    },
  ],
  '2': [
    {
      id: 'm6',
      senderId: 'user-2',
      senderName: 'John Smith',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      content: 'Morning everyone! Quick design sync at 10am?',
      timestamp: new Date(Date.now() - 30 * 60000),
      isOwn: false,
    },
    {
      id: 'm7',
      senderId: 'user-3',
      senderName: 'Emily Davis',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
      content: 'Sounds good! I can make it',
      timestamp: new Date(Date.now() - 25 * 60000),
      isOwn: false,
    },
    {
      id: 'm8',
      senderId: 'user-0',
      senderName: 'You',
      content: 'Count me in!',
      timestamp: new Date(Date.now() - 20 * 60000),
      isOwn: true,
    },
    {
      id: 'm9',
      senderId: 'user-2',
      senderName: 'John Smith',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
      content: 'Just pushed the new design system updates',
      timestamp: new Date(Date.now() - 2 * 60000),
      isOwn: false,
    },
  ],
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function formatTime(date: Date): string {
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000)

  if (diffInMinutes < 1) return 'now'
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`

  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatMessageTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function getStatusColor(status?: string): string {
  switch (status) {
    case 'online':
      return 'bg-green-500'
    case 'away':
      return 'bg-yellow-500'
    case 'offline':
      return 'bg-gray-400'
    default:
      return 'bg-gray-400'
  }
}
