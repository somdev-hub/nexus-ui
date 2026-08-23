# Real-Time Chat System Implementation

## Overview

This is a production-ready WebSocket-based real-time chat system integrated with your Next.js application. It features:

- ✅ **WebSocket Communication** - Real-time messaging via STOMP/SockJS
- ✅ **Fallback to REST API** - Automatic fallback for failed WebSocket messages
- ✅ **Typing Indicators** - Real-time typing status across conversations
- ✅ **Presence Events** - User joined/left notifications
- ✅ **Error Handling & Reconnection** - Automatic reconnection with exponential backoff
- ✅ **Message History** - Paginated message fetching
- ✅ **User Search** - Search users for conversations
- ✅ **Optimistic UI** - Immediate message display before server confirmation

---

## Architecture

### Services

#### 1. **ChatWebSocketService** (`lib/chat-websocket.ts`)

Manages WebSocket lifecycle and subscriptions:

- Establishes connection with JWT authentication
- Handles reconnection logic (5 attempts, exponential backoff)
- Manages STOMP subscriptions
- Provides send/subscribe/unsubscribe methods

#### 2. **ChatApiService** (`lib/chat-api.ts`)

Handles REST API calls for non-real-time operations:

- Create/fetch conversations
- Send messages (fallback)
- Get message history
- Search users
- Conversation statistics

#### 3. **useChatWebSocket Hook** (`hooks/use-chat-websocket.ts`)

React hook for WebSocket integration:

- Manages connection lifecycle
- Handles subscriptions
- Provides event callbacks
- Offers send/typing methods

---

## Backend Requirements

### WebSocket Server (Port 8086 - CMS)

```
Base URL: http://localhost:8086/chat/ws
```

**Required Endpoints:**

- `/app/chat/send` - Send message
- `/app/chat/typing` - Send typing indicator
- `/app/chat/typing/stop` - Stop typing
- `/app/chat/joined/{conversationId}` - Notify join
- `/app/chat/left/{conversationId}` - Notify leave
- `/topic/conversations/{conversationId}` - Subscribe to messages
- `/topic/conversations/{conversationId}/typing` - Subscribe to typing
- `/topic/conversations/{conversationId}/presence` - Subscribe to presence

### REST API (Port 8080 - IAM/CMS)

```
Base URLs:
- REST: http://localhost:8080/cms/chat
- IAM: http://localhost:8080/iam
```

**Required Endpoints:**

- `POST /cms/chat/conversations` - Create conversation
- `GET /cms/chat/conversations` - List conversations
- `GET /cms/chat/conversations/{id}/messages` - Get messages
- `POST /cms/chat/messages` - Send message (REST fallback)
- `GET /iam/users/get-user-by-name?name={name}` - Search users

---

## Usage

### Basic Integration

```typescript
import { ChatDialog } from '@/components/chat';

export default function App() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      <button onClick={() => setShowChat(true)}>Open Chat</button>
      <ChatDialog showDialog={showChat} setOpenChatDialog={setShowChat} />
    </>
  );
}
```

### Using the WebSocket Hook Directly

```typescript
import { useChatWebSocket } from '@/hooks/use-chat-websocket';

function MyComponent() {
  const {
    isConnected,
    connectionError,
    sendMessage,
    notifyTyping,
    notifyStopTyping,
    notifyLeft,
  } = useChatWebSocket({
    conversationId: 'conv-123',
    orgId: 1,
    onMessageReceived: (message) => {
      console.log('New message:', message);
    },
    onTypingStatusChanged: (isTyping, userId) => {
      console.log(`User ${userId} is ${isTyping ? 'typing' : 'stopped typing'}`);
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

  return (
    <div>
      {connectionError && <p>Connection error: {connectionError}</p>}
      <button onClick={() => sendMessage('Hello!')}>Send</button>
    </div>
  );
}
```

---

## Error Handling

### Connection Errors

The system automatically handles:

1. **Initial Connection Failure** → Retry up to 5 times with exponential backoff
2. **Mid-Stream Disconnection** → Automatic reconnection
3. **Token Expiration (401)** → Falls back to REST API, prompts re-auth
4. **Service Unavailable (503)** → Retry with backoff

### Message Delivery

- **WebSocket Failure** → Automatic fallback to REST API
- **Network Timeout** → Message queued for retry
- **Server Error** → Error callback triggered

### Error Callback

```typescript
onError: (error: string) => {
  // Handle errors gracefully
  if (error.includes("authentication")) {
    redirectToLogin();
  } else if (error.includes("network")) {
    showRetryButton();
  }
};
```

---

## Real-Time Features

### Typing Indicators

```typescript
const { notifyTyping, notifyStopTyping } = useChatWebSocket({...});

// When user starts typing
onInputChange={() => notifyTyping()}

// Automatically stops after 3 seconds of inactivity
// or manually call notifyStopTyping()
```

### Presence Events

```typescript
onPresenceChanged: (event, userId) => {
  if (event === "joined") {
    showNotification(`User ${userId} joined`);
  } else if (event === "left") {
    showNotification(`User ${userId} left`);
  }
};
```

### Message Subscriptions

```typescript
onMessageReceived: (message) => {
  // Automatically adds to messages list
  // Message structure:
  // {
  //   id: string,
  //   senderId: string | number,
  //   senderName: string,
  //   content: string,
  //   timestamp: Date,
  //   status: 'sent' | 'delivered' | 'read'
  // }
};
```

---

## Configuration

### Environment Variables (Optional)

```env
# .env.local
NEXT_PUBLIC_WS_URL=http://localhost:8086
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### Connection Settings

Modify in `lib/chat-websocket.ts`:

```typescript
private maxReconnectAttempts = 5;           // Max retry attempts
private reconnectDelay = 1000;              // Initial delay (ms)
// Exponential backoff: 1s → 2s → 4s → 8s → 16s
```

---

## Components

### ChatDialog

Main wrapper component that handles WebSocket connection lifecycle.

**Props:**

- `showDialog: boolean` - Controls dialog visibility
- `setOpenChatDialog: (open: boolean) => void` - Dialog state setter

### ChatInterface

Manages conversation list and message thread.

**Props:**

- `orgId?: number` - Organization ID (default: 1)

### ChatSidebar

Displays conversation list with search.

### ChatMessages

Renders message thread with typing indicators.

**Props:**

- `messages: ChatMessage[]` - Message array
- `typingUsers?: Set<string>` - Users currently typing

### MessageInput

Input field with typing indicator support.

**Props:**

- `onSendMessage: (message: string) => void` - Send callback
- `onTyping?: () => void` - Typing callback
- `isConnected?: boolean` - Connection status

---

## Dependencies

```json
{
  "sockjs-client": "^1.6.1",
  "stompjs": "^2.3.3",
  "radix-ui/react-dialog": "^1.1.1",
  "radix-ui/react-scroll-area": "^1.0.5"
}
```

Install:

```bash
npm install sockjs-client stompjs
```

---

## Performance Optimization

1. **Message Pagination** - Load 50 messages at a time
2. **Virtual Scrolling** - Render only visible messages
3. **Connection Pooling** - Reuse WebSocket for multiple conversations
4. **Debounced Typing** - Send typing indicator every 1 second
5. **Optimistic Updates** - UI updates before server confirmation

---

## Security

✅ **JWT Authentication** - Token passed in WebSocket headers  
✅ **Token Refresh** - Automatic token refresh on expiration  
✅ **CORS Enabled** - WebSocket accepts all origins  
✅ **Error Masking** - Sensitive errors not exposed to UI

---

## Troubleshooting

### WebSocket Connection Fails

**Check:**

1. WebSocket server running on `localhost:8086`
2. JWT token is valid in localStorage
3. Browser WebSocket support
4. Network/proxy not blocking WebSocket

**Solution:**

```typescript
// Enable debug logging
chatWebSocketService.client.debug = (msg: string) => console.log(msg);
```

### Messages Not Sending

**Check:**

1. `isConnected` is true
2. Conversation ID is set
3. Organization ID is correct
4. Check browser console for errors

### Typing Indicators Not Showing

**Check:**

1. `onTyping()` is being called
2. Other client is subscribed to typing topic
3. Network latency not too high

---

## API Response Examples

### Create Conversation

```json
{
  "id": "conv-123",
  "name": "Sarah Anderson",
  "type": "DIRECT",
  "participantIds": [1, 2],
  "orgId": 1,
  "createdAt": "2024-05-10T10:30:00Z"
}
```

### Send Message

```json
{
  "id": "msg-456",
  "conversationId": "conv-123",
  "content": "Hello!",
  "senderId": 1,
  "senderName": "John",
  "timestamp": "2024-05-10T10:35:00Z",
  "status": "delivered"
}
```

### Search Users

```json
[
  {
    "id": 29,
    "name": "Hari Singh",
    "email": "hari.singh@cosmos.com",
    "profilePhoto": "https://...",
    "department": "HUMAN_RESOURCES",
    "role": "ADMIN"
  }
]
```

---

## License

Part of Nexus HR System
