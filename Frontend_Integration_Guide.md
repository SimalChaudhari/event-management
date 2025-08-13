# 🚀 Chat API Frontend Integration Guide

## 📋 Overview
Complete guide for integrating the Chat API with any frontend application.

## 🔧 API Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:5000';
const SOCKET_URL = 'http://localhost:5000/chat';

// Headers for authenticated requests
const getAuthHeaders = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});
```

## 💬 Chat API Endpoints

### 1. Open Chat
```javascript
const openChat = async (receiverID, token) => {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/open-chat?receiverID=${receiverID}&paginationCount=20&paginationCurrentPage=1`,
    {
      headers: getAuthHeaders(token)
    }
  );
  
  return await response.json();
};
```

### 2. Send Message
```javascript
const sendMessage = async (receiverID, messageData, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/send/${receiverID}`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      msg: messageData.msg,
      msgType: messageData.msgType || 'text', //Optional default he take "text" if not provided
      reply: messageData.reply || null, //Optional(if You reply to a message so passed msgId He will be reply to that message)
      msgJson: messageData.msgJson || null //Optional message json
    })
  });
  
  return await response.json();
};
```

### 3. Mark as Read
```javascript
const markAsRead = async (threadID, msgID, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/read`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      threadID,
      msgID: msgID || null // null marks all messages as read
    })
  });
  
  return await response.json();
};
```

### 4. Update Last Seen
```javascript
const updateLastSeen = async (threadID, token) => {
  const response = await fetch(`${API_BASE_URL}/api/chat/seen`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({ threadID })
  });
  
  return await response.json();
};
```

## 🔌 WebSocket Integration

### 1. Connection Setup
```javascript
import io from 'socket.io-client';

const connectSocket = (token) => {
  const socket = io(SOCKET_URL, {
    auth: { token: token }
  });
  
  return socket;
};
```

### 2. Socket Events

#### Connection Events
```javascript
socket.on('connect', () => {
  console.log('Connected to chat server');
});

socket.on('connected', (data) => {
  console.log('User connected:', data.userId);
});
```

#### Message Events
```javascript
// Receive new messages
socket.on('new_message', (message) => {
  // Add message to UI
  addMessageToChat(message);
});

// Message sent confirmation
socket.on('message_sent', (data) => {
  // Update message status to sent
  updateMessageStatus(data.msgID, 'sent');
});

// Message delivered
socket.on('message_delivered', (data) => {
  // Update message status to delivered (gray double tick)
  updateMessageStatus(data.msgID, 'delivered');
});

// Message read
socket.on('message_read', (data) => {
  // Update message status to read (blue double tick)
  updateMessageStatus(data.msgID, 'read');
});
```

#### User Status Events
```javascript
// User online
socket.on('user_online', (data) => {
  updateUserStatus(data.userId, 'online', data.lastSeen);
});

// User offline
socket.on('user_offline', (data) => {
  updateUserStatus(data.userId, 'offline', data.lastSeen);
});

// Online users list
socket.on('online_users', (users) => {
  setOnlineUsers(users);
});
```

#### Typing Events
```javascript
// Someone started typing
socket.on('typing_start', (data) => {
  if (data.threadID === currentThreadID) {
    showTypingIndicator(data.userId);
  }
});

// Someone stopped typing
socket.on('typing_stop', (data) => {
  if (data.threadID === currentThreadID) {
    hideTypingIndicator(data.userId);
  }
});
```

### 3. Socket Emitters

#### Send Message
```javascript
const sendMessageSocket = (receiverID, message) => {
  socket.emit('send_message', {
    receiverID,
    msg: message,
    msgType: 'text'
  });
};
```

#### Join Thread
```javascript
const joinThread = (threadID) => {
  socket.emit('join_thread', { threadID });
};
```

#### User Entered Chat
```javascript
const userEnteredChat = (threadID, userId) => {
  socket.emit('user_entered_chat', { threadID, userId });
};
```

#### Typing Events
```javascript
// Start typing
const startTyping = (threadID) => {
  socket.emit('typing', { threadID, isTyping: true });
};

// Stop typing (handled automatically by backend after 2 seconds)
```

#### Mark as Read
```javascript
const markAsReadSocket = (threadID, msgID) => {
  socket.emit('mark_read', { threadID, msgID });
};
```

#### Get User Status
```javascript
const getUserStatus = (userId) => {
  socket.emit('get_user_status', { userId });
};
```

## 📱 Complete Chat Component Example

```javascript
import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatComponent = ({ token, receiverID }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  
  // Initialize socket
  useEffect(() => {
    if (!token) return;
    
    const newSocket = io(SOCKET_URL, {
      auth: { token }
    });
    
    // Event listeners
    newSocket.on('connect', () => {
      console.log('Connected to chat');
    });
    
    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });
    
    newSocket.on('typing_start', (data) => {
      setTypingUsers(prev => new Set([...prev, data.userId]));
    });
    
    newSocket.on('typing_stop', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
    });
    
    setSocket(newSocket);
    
    return () => newSocket.close();
  }, [token]);
  
  // Open chat
  useEffect(() => {
    if (receiverID && token) {
      openChat(receiverID, token).then(data => {
        if (data.success) {
          setMessages(data.data.aChatOpen);
          socket?.emit('join_thread', { threadID: data.data.threadID });
          socket?.emit('user_entered_chat', { 
            threadID: data.data.threadID, 
            userId: getCurrentUserId() 
          });
        }
      });
    }
  }, [receiverID, socket]);
  
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    socket?.emit('send_message', {
      receiverID,
      msg: newMessage.trim()
    });
    
    setNewMessage('');
  };
  
  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true);
      socket?.emit('typing', { threadID: currentThreadID, isTyping: true });
    }
  };
  
  return (
    <div className="chat-container">
      {/* Messages */}
      <div className="messages">
        {messages.map(message => (
          <div key={message.msgID} className="message">
            <div>{message.msg}</div>
            <div className="message-status">
              {message.isRead ? '✓✓' : message.isDelivered ? '✓✓' : '✓'}
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            Someone is typing...
          </div>
        )}
      </div>
      
      {/* Input */}
      <div className="message-input">
        <input
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

## 🎯 Message Status Icons

```javascript
const MessageStatus = ({ message }) => {
  if (message.sending) {
    return <span title="Sending">⏳</span>;
  }
  
  if (message.isRead) {
    return <span style={{ color: '#4267B2' }} title="Read">✓✓</span>;
  }
  
  if (message.isDelivered) {
    return <span style={{ color: '#999' }} title="Delivered">✓✓</span>;
  }
  
  return <span style={{ color: '#999' }} title="Sent">✓</span>;
};
```

## 🔄 Auto-Reconnection

```javascript
const setupSocketWithReconnection = (token) => {
  const socket = io(SOCKET_URL, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5
  });
  
  socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });
  
  socket.on('reconnect', () => {
    console.log('Reconnected to server');
  });
  
  return socket;
};
```

## ⚠️ Error Handling

```javascript
// API Error Handling
const handleApiError = (error) => {
  if (error.status === 401) {
    // Token expired - redirect to login
    localStorage.removeItem('chat_token');
    window.location.href = '/login';
  } else if (error.status === 403) {
    // Forbidden - show error message
    showError('Access denied');
  } else {
    showError('Something went wrong');
  }
};

// Socket Error Handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
  showError(error.message);
});
```

## 📋 Required Dependencies

```json
{
  "dependencies": {
    "socket.io-client": "^4.0.0",
    "axios": "^1.0.0"
  }
}
```

## 🎯 Integration Checklist

- [ ] Install required dependencies
- [ ] Set up authentication flow
- [ ] Initialize socket connection
- [ ] Implement message sending/receiving
- [ ] Add typing indicators
- [ ] Implement read receipts
- [ ] Add user status tracking
- [ ] Handle errors and reconnection
- [ ] Style the chat UI
- [ ] Test all features

## 💡 Tips

1. **Token Management**: Store JWT token securely and refresh when needed
2. **Real-time Updates**: Use socket events for instant updates
3. **Performance**: Implement message pagination for large chats
4. **UI/UX**: Show typing indicators and message status for better UX
5. **Error Handling**: Handle network errors gracefully
6. **Security**: Validate all user inputs before sending
