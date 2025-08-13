# Event Management Chat System API Documentation

## Overview
यह एक professional real-time chat system है जो Socket.IO का उपयोग करता है। यह system mobile applications के लिए optimize किया गया है और comprehensive chat functionality provide करता है।

## Features
- ✅ Real-time messaging using Socket.IO
- ✅ Private, Group, और Event-based chats
- ✅ File sharing (images, documents, audio, video)
- ✅ Location sharing
- ✅ Typing indicators
- ✅ Read receipts
- ✅ Message editing और deletion
- ✅ User presence management
- ✅ Chat permissions और roles
- ✅ JWT authentication

## Installation & Setup

### Backend Dependencies
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io socket.io-client
```

### Environment Variables
```env
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

## API Endpoints

### Authentication
सभी chat endpoints के लिए JWT token required है। Header में `Authorization: Bearer <token>` भेजें।

### 1. Chat Management

#### Create Private Chat
```http
POST /api/chat/private
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "participantId": "user-uuid-here"
}
```

#### Create Group Chat
```http
POST /api/chat/group
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Group Name",
  "description": "Group Description",
  "participantIds": ["user1-uuid", "user2-uuid", "user3-uuid"]
}
```

#### Create Event Chat
```http
POST /api/chat/event
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "eventId": "event-uuid-here",
  "name": "Event Chat",
  "description": "Chat for event participants",
  "participantIds": ["user1-uuid", "user2-uuid"]
}
```

#### Get User Chats
```http
GET /api/chat/user-chats
Authorization: Bearer <jwt_token>
```

#### Get Chat Details
```http
GET /api/chat/:chatId
Authorization: Bearer <jwt_token>
```

#### Update Chat
```http
PUT /api/chat/:chatId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated Description"
}
```

### 2. Message Management

#### Send Text Message
```http
POST /api/chat/:chatId/messages/text
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Hello, how are you?",
  "replyToMessageId": "optional-reply-message-id"
}
```

#### Send File Message
```http
POST /api/chat/:chatId/messages/file
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "fileName": "document.pdf",
  "fileUrl": "https://storage.com/document.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf"
}
```

#### Send Location Message
```http
POST /api/chat/:chatId/messages/location
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "latitude": 28.6139,
  "longitude": 77.2090,
  "address": "New Delhi, India"
}
```

#### Get Chat Messages
```http
GET /api/chat/:chatId/messages?page=1&limit=50
Authorization: Bearer <jwt_token>
```

#### Edit Message
```http
PUT /api/chat/:chatId/messages/:messageId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "content": "Updated message content"
}
```

#### Delete Message
```http
DELETE /api/chat/:chatId/messages/:messageId
Authorization: Bearer <jwt_token>
```

### 3. Participant Management

#### Add Participant
```http
POST /api/chat/:chatId/participants
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "isAdmin": false
}
```

#### Remove Participant
```http
DELETE /api/chat/:chatId/participants/:userId
Authorization: Bearer <jwt_token>
```

#### Update Participant
```http
PUT /api/chat/:chatId/participants/:userId
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "isAdmin": true,
  "isMuted": false,
  "canSendMessage": true
}
```

## WebSocket Events (Socket.IO)

### Connection
```javascript
// Connect to WebSocket
const socket = io('http://your-backend-url', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client Events (Emit)

#### Join Chat Room
```javascript
socket.emit('join-chat', {
  chatId: 'chat-uuid-here'
});
```

#### Send Message
```javascript
socket.emit('send-message', {
  chatId: 'chat-uuid-here',
  content: 'Hello!',
  type: 'text'
});
```

#### Typing Indicator
```javascript
socket.emit('typing', {
  chatId: 'chat-uuid-here',
  isTyping: true
});
```

#### Mark Message as Read
```javascript
socket.emit('mark-read', {
  chatId: 'chat-uuid-here',
  messageId: 'message-uuid-here'
});
```

#### Leave Chat Room
```javascript
socket.emit('leave-chat', {
  chatId: 'chat-uuid-here'
});
```

### Server Events (Listen)

#### Message Received
```javascript
socket.on('message-received', (data) => {
  console.log('New message:', data);
  // data: { message, chatId, senderId }
});
```

#### User Typing
```javascript
socket.on('user-typing', (data) => {
  console.log('User typing:', data);
  // data: { chatId, userId, isTyping }
});
```

#### Message Read
```javascript
socket.on('message-read', (data) => {
  console.log('Message read:', data);
  // data: { chatId, messageId, userId }
});
```

#### User Joined
```javascript
socket.on('user-joined', (data) => {
  console.log('User joined:', data);
  // data: { chatId, userId, user }
});
```

#### User Left
```javascript
socket.on('user-left', (data) => {
  console.log('User left:', data);
  // data: { chatId, userId }
});
```

#### Chat Updated
```javascript
socket.on('chat-updated', (data) => {
  console.log('Chat updated:', data);
  // data: { chatId, updates }
});
```

## Mobile Integration Example

### React Native with Socket.IO
```javascript
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.token = null;
  }

  connect(token) {
    this.token = token;
    this.socket = io('http://your-backend-url', {
      auth: { token }
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.socket.on('connect', () => {
      console.log('Connected to chat server');
    });

    this.socket.on('message-received', this.handleNewMessage);
    this.socket.on('user-typing', this.handleUserTyping);
    this.socket.on('message-read', this.handleMessageRead);
  }

  joinChat(chatId) {
    this.socket.emit('join-chat', { chatId });
  }

  sendMessage(chatId, content, type = 'text') {
    this.socket.emit('send-message', {
      chatId,
      content,
      type
    });
  }

  startTyping(chatId) {
    this.socket.emit('typing', { chatId, isTyping: true });
  }

  stopTyping(chatId) {
    this.socket.emit('typing', { chatId, isTyping: false });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new ChatService();
```

### API Service Example
```javascript
class ChatAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async createPrivateChat(participantId) {
    const response = await fetch(`${this.baseURL}/api/chat/private`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ participantId })
    });

    return response.json();
  }

  async getChatMessages(chatId, page = 1, limit = 50) {
    const response = await fetch(
      `${this.baseURL}/api/chat/${chatId}/messages?page=${page}&limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    return response.json();
  }

  async sendTextMessage(chatId, content, replyToMessageId = null) {
    const response = await fetch(`${this.baseURL}/api/chat/${chatId}/messages/text`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, replyToMessageId })
    });

    return response.json();
  }
}
```

## Error Handling

### HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Error Response Format
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    "participantId must be a UUID"
  ]
}
```

## Best Practices

### 1. Authentication
- हमेशा JWT token validate करें
- Token expiration handle करें
- Secure token storage use करें

### 2. WebSocket Management
- Connection state monitor करें
- Reconnection logic implement करें
- Error handling add करें

### 3. Message Handling
- Message queuing implement करें
- Offline message storage use करें
- Message delivery confirmation handle करें

### 4. Performance
- Pagination use करें
- Image compression implement करें
- Lazy loading use करें

## Testing

### API Testing
```bash
# Test chat creation
curl -X POST http://localhost:3000/api/chat/private \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"participantId": "user-uuid"}'
```

### WebSocket Testing
```javascript
// Browser console testing
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('join-chat', { chatId: 'test-chat-id' });
});
```

## Support & Contact

यदि कोई question या issue है तो development team से contact करें।

---

**Note:** यह API mobile developers के लिए specially designed किया गया है। सभी endpoints RESTful standards follow करते हैं और comprehensive error handling provide करते हैं।
