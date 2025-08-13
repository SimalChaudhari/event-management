# 📡 Chat API Endpoints Summary

## 🔐 Authentication Required
All endpoints require Bearer token in Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## 📬 REST API Endpoints

### 🔑 Authentication
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | User login | `{email, password}` |
| POST | `/api/auth/register` | User registration | `{firstName, lastName, email, password}` |

### 💬 Chat Management
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/api/chat/send/:receiverID` | Send message | `{msg, msgType?, reply?, msgJson?}` |
| GET | `/api/chat/open-chat` | Open/get chat messages | Query: `receiverID, paginationCount?, paginationCurrentPage?` |
| POST | `/api/chat/read` | Mark messages as read | `{threadID, msgID?}` |
| POST | `/api/chat/seen` | Update last seen | `{threadID}` |

### 👥 User Management
| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | Get user profile | - |
| GET | `/api/users` | Get all users | - |

## 🔌 WebSocket Events

### 📥 Events to Listen

#### Connection Events
| Event | Data | Description |
|-------|------|-------------|
| `connect` | - | Socket connected |
| `connected` | `{userId, timestamp}` | User connected confirmation |
| `disconnect` | - | Socket disconnected |

#### Message Events
| Event | Data | Description |
|-------|------|-------------|
| `new_message` | `{msgID, threadID, msg, senderID, receiverID, ...}` | New message received |
| `message_sent` | `{msgID, threadID, success, ...}` | Message sent confirmation |
| `message_delivered` | `{msgID, threadID, deliveredTo, timestamp}` | Message delivered |
| `message_read` | `{threadID, readBy, timestamp, messagesRead}` | Messages marked as read |

#### User Status Events
| Event | Data | Description |
|-------|------|-------------|
| `user_online` | `{userId, lastSeen, isOnline}` | User came online |
| `user_offline` | `{userId, lastSeen, isOnline}` | User went offline |
| `online_users` | `[userIds]` | List of online users |
| `user_status` | `{userId, isOnline, lastSeen}` | User status response |

#### Typing Events
| Event | Data | Description |
|-------|------|-------------|
| `typing_start` | `{threadID, userId, timestamp}` | User started typing |
| `typing_stop` | `{threadID, userId, timestamp}` | User stopped typing |

#### Error Events
| Event | Data | Description |
|-------|------|-------------|
| `error` | `{message}` | Error occurred |

### 📤 Events to Emit

#### Message Actions
| Event | Data | Description |
|-------|------|-------------|
| `send_message` | `{receiverID, msg, msgType?, reply?, msgJson?}` | Send a message |
| `mark_read` | `{threadID, msgID?}` | Mark message(s) as read |

#### Chat Actions
| Event | Data | Description |
|-------|------|-------------|
| `join_thread` | `{threadID}` | Join a chat thread |
| `user_entered_chat` | `{threadID, userId}` | User entered/focused chat |

#### Typing Actions
| Event | Data | Description |
|-------|------|-------------|
| `typing` | `{threadID, isTyping}` | Send typing status |

#### User Actions
| Event | Data | Description |
|-------|------|-------------|
| `get_user_status` | `{userId}` | Get user's online status |

## 📋 Data Models

### 💬 Message Object
```javascript
{
  msgID: "uuid",
  threadID: "uuid", 
  msg: "string",
  msgType: "text|image|file|reply",
  msgJson: object, // optional
  reply: "uuid", // optional
  senderID: "uuid",
  senderNick: "string",
  receiverID: "uuid", 
  isRead: boolean,
  isDelivered: boolean,
  msgDateUTC: "2024-01-01T00:00:00.000Z",
  replyToMessage: { // if reply
    msgID: "uuid",
    msg: "string", 
    senderNick: "string"
  }
}
```

### 🧵 Thread Object
```javascript
{
  threadID: "uuid",
  receiverID: "uuid",
  receiverName: "string",
  lastSeen: "2024-01-01T00:00:00.000Z",
  unreadCount: number,
  lastMessage: "string",
  aChatOpen: [Message] // array of messages
}
```

### 👤 User Status
```javascript
{
  userId: "uuid",
  isOnline: boolean,
  lastSeen: "2024-01-01T00:00:00.000Z"
}
```

## 🚀 Quick Start Integration

### 1. Connect to Socket
```javascript
const socket = io('http://localhost:5000/chat', {
  auth: { token: 'YOUR_JWT_TOKEN' }
});
```

### 2. Listen to Events
```javascript
socket.on('new_message', (message) => {
  addMessageToUI(message);
});

socket.on('typing_start', (data) => {
  showTypingIndicator(data.userId);
});
```

### 3. Send Message
```javascript
socket.emit('send_message', {
  receiverID: 'USER_ID',
  msg: 'Hello World!'
});
```

### 4. Join Thread
```javascript
socket.emit('join_thread', { 
  threadID: 'THREAD_ID' 
});
```

### 5. Handle Typing
```javascript
// Start typing
socket.emit('typing', { 
  threadID: 'THREAD_ID', 
  isTyping: true 
});

// Auto-stops after 2 seconds of inactivity
```

## ⚡ Performance Tips

1. **Pagination**: Use pagination for large message lists
2. **Debouncing**: Debounce typing events to avoid spam
3. **Reconnection**: Handle socket disconnection gracefully
4. **Caching**: Cache messages locally for better performance
5. **Lazy Loading**: Load images and files on demand

## 🔒 Security Notes

1. **Authentication**: Always validate JWT tokens
2. **Rate Limiting**: Implement rate limiting for message sending
3. **Input Validation**: Sanitize all user inputs
4. **CORS**: Configure CORS properly for production
5. **HTTPS**: Use HTTPS in production

## 🐛 Common Issues

### Socket Connection Issues
- Check if JWT token is valid
- Verify server is running on correct port
- Check network connectivity

### Message Not Delivered
- Ensure receiver is online
- Check if thread exists
- Verify user permissions

### Typing Indicator Not Working
- Confirm socket events are being emitted
- Check if users are in same thread
- Verify event listeners are set up correctly

## 📞 Support

For integration support:
1. Check this documentation first
2. Test with Postman collection
3. Verify socket events in browser dev tools
4. Check server logs for errors
