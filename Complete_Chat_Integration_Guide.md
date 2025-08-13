# Complete Chat System Integration Guide
## Frontend + Backend Integration (WhatsApp Style)

---

## Table of Contents
1. [Database Setup](#database-setup)
2. [Backend Configuration](#backend-configuration)
3. [Frontend Setup](#frontend-setup)
4. [Authentication Integration](#authentication-integration)
5. [Chat Components](#chat-components)
6. [WebSocket Integration](#websocket-integration)
7. [API Integration](#api-integration)
8. [Complete Examples](#complete-examples)
9. [Testing Guide](#testing-guide)
10. [Troubleshooting](#troubleshooting)

---

## 1. Database Setup

### Step 1: Run Migrations
```sql
-- First, add visibility columns
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS "visibleToSender" boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS "visibleToReceiver" boolean DEFAULT true;

-- Then, add edit columns
ALTER TABLE chat_messages 
ADD COLUMN IF NOT EXISTS "isEdited" boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS "editedAt" timestamp NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_messages_visibility 
ON chat_messages ("threadID", "visibleToSender", "visibleToReceiver");

CREATE INDEX IF NOT EXISTS idx_chat_messages_edited 
ON chat_messages ("threadID", "isEdited");

-- Update existing data
UPDATE chat_messages 
SET "visibleToSender" = true, "visibleToReceiver" = true, "isEdited" = false
WHERE "visibleToSender" IS NULL OR "visibleToReceiver" IS NULL OR "isEdited" IS NULL;
```

### Step 2: Verify Tables
```sql
-- Check if all columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_messages' 
ORDER BY ordinal_position;
```

---

## 2. Backend Configuration

### Step 1: Environment Variables
```env
# .env file
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://username:password@localhost:5432/database
PORT=3000
```

### Step 2: Backend Dependencies
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "socket.io": "^4.7.0",
    "typeorm": "^0.3.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  }
}
```

### Step 3: Module Registration
```typescript
// app.module.ts
import { ChatModule } from './chat/chat.module';

@Module({
  imports: [
    // ... other modules
    ChatModule,
  ],
})
export class AppModule {}
```

---

## 3. Frontend Setup

### Step 1: Install Dependencies
```bash
npm install socket.io-client axios
# For React
npm install react react-dom @types/react @types/react-dom

# For styling (optional)
npm install styled-components
```

### Step 2: Environment Configuration
```javascript
// config/env.js
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000/chat',
  JWT_TOKEN_KEY: 'auth_token'
};
```

### Step 3: API Service Setup
```javascript
// services/apiService.js
import axios from 'axios';
import { API_CONFIG } from '../config/env';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add token to all requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem(API_CONFIG.JWT_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle response errors
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem(API_CONFIG.JWT_TOKEN_KEY);
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Chat APIs
  async sendMessage(receiverID, messageData) {
    const response = await this.api.post(`/api/chat/send/${receiverID}`, messageData);
    return response.data;
  }

  async getChat(receiverID, pagination = {}) {
    const params = new URLSearchParams({
      receiverID,
      paginationCount: pagination.count || 20,
      paginationCurrentPage: pagination.page || 1
    });
    const response = await this.api.get(`/api/chat/open-chat?${params}`);
    return response.data;
  }

  async markAsRead(threadID, msgID = null) {
    const response = await this.api.post('/api/chat/read', { threadID, msgID });
    return response.data;
  }

  async deleteMessage(msgID, threadID) {
    const response = await this.api.post('/api/chat/delete-message', { msgID, threadID });
    return response.data;
  }

  async deleteAllMessages(threadID, receiverID) {
    const response = await this.api.post('/api/chat/delete-all-messages', { threadID, receiverID });
    return response.data;
  }

  async editMessage(msgID, threadID, newMsg) {
    const response = await this.api.post('/api/chat/edit-message', { msgID, threadID, newMsg });
    return response.data;
  }
}

export default new ApiService();
```

---

## 4. Authentication Integration

### Frontend Auth Hook
```javascript
// hooks/useAuth.js
import { useState, useEffect, createContext, useContext } from 'react';
import { API_CONFIG } from '../config/env';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem(API_CONFIG.JWT_TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
      // Decode JWT to get user info (optional)
      try {
        const payload = JSON.parse(atob(savedToken.split('.')[1]));
        setUser({ id: payload.sub, ...payload });
      } catch (error) {
        console.error('Invalid token');
        localStorage.removeItem(API_CONFIG.JWT_TOKEN_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (authToken, userData) => {
    localStorage.setItem(API_CONFIG.JWT_TOKEN_KEY, authToken);
    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem(API_CONFIG.JWT_TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

---

## 5. Chat Components

### Main Chat Component
```javascript
// components/Chat/ChatContainer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';
import ApiService from '../../services/apiService';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import './Chat.css';

const ChatContainer = ({ receiverID, receiverName }) => {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [threadID, setThreadID] = useState(null);
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Load chat messages
  useEffect(() => {
    loadChatMessages();
  }, [receiverID]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !threadID) return;

    // Join thread
    socket.emit('join_thread', { threadID });
    socket.emit('user_entered_chat', { threadID, userId: user.id });

    // Listen for new messages
    socket.on('new_message', handleNewMessage);
    socket.on('message_delivered', handleMessageDelivered);
    socket.on('message_read', handleMessageRead);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('all_messages_deleted', handleAllMessagesDeleted);
    socket.on('message_edited', handleMessageEdited);
    socket.on('typing_start', handleTypingStart);
    socket.on('typing_stop', handleTypingStop);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_delivered', handleMessageDelivered);
      socket.off('message_read', handleMessageRead);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('all_messages_deleted', handleAllMessagesDeleted);
      socket.off('message_edited', handleMessageEdited);
      socket.off('typing_start', handleTypingStart);
      socket.off('typing_stop', handleTypingStop);
    };
  }, [socket, threadID]);

  // Auto scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadChatMessages = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getChat(receiverID);
      if (response.success) {
        setMessages(response.data.aChatOpen || []);
        setThreadID(response.data.threadID);
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Event handlers
  const handleNewMessage = (message) => {
    if (message.threadID === threadID) {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if message is from other user
      if (message.senderID !== user.id) {
        socket.emit('mark_read', { threadID: message.threadID });
      }
    }
  };

  const handleMessageDelivered = (data) => {
    setMessages(prev => prev.map(msg => 
      msg.msgID === data.msgID ? { ...msg, isDelivered: true } : msg
    ));
  };

  const handleMessageRead = (data) => {
    if (data.readBy !== user.id) {
      setMessages(prev => prev.map(msg => 
        msg.senderID === user.id && msg.threadID === data.threadID 
          ? { ...msg, isRead: true } 
          : msg
      ));
    }
  };

  const handleMessageDeleted = (data) => {
    if (data.deleteType === 'both') {
      // Remove message from UI for both users
      setMessages(prev => prev.filter(msg => msg.msgID !== data.msgID));
    } else if (data.deletedBy === user.id) {
      // Remove message from current user's UI only
      setMessages(prev => prev.filter(msg => msg.msgID !== data.msgID));
    }
  };

  const handleAllMessagesDeleted = (data) => {
    if (data.deletedBy === user.id) {
      setMessages([]);
    }
  };

  const handleMessageEdited = (data) => {
    setMessages(prev => prev.map(msg => 
      msg.msgID === data.msgID 
        ? { ...msg, msg: data.newMsg, isEdited: data.isEdited, editedAt: data.editedAt }
        : msg
    ));
  };

  const handleTypingStart = (data) => {
    if (data.userId !== user.id && data.threadID === threadID) {
      setTyping(true);
    }
  };

  const handleTypingStop = (data) => {
    if (data.userId !== user.id && data.threadID === threadID) {
      setTyping(false);
    }
  };

  // Message actions
  const sendMessage = async (messageText, replyToMessage = null) => {
    try {
      const messageData = {
        msg: messageText,
        msgType: 'text',
        reply: replyToMessage?.msgID || null
      };

      // Send via socket for real-time
      socket.emit('send_message', {
        receiverID,
        ...messageData
      });

    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const deleteMessage = async (msgID) => {
    try {
      await ApiService.deleteMessage(msgID, threadID);
      // UI will be updated via socket event
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const editMessage = async (msgID, newMsg) => {
    try {
      await ApiService.editMessage(msgID, threadID, newMsg);
      // UI will be updated via socket event
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const deleteAllMessages = async () => {
    try {
      await ApiService.deleteAllMessages(threadID, receiverID);
      // UI will be updated via socket event
    } catch (error) {
      console.error('Error deleting all messages:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (socket && threadID) {
      socket.emit('typing', { threadID, isTyping });
    }
  };

  if (loading) {
    return <div className="chat-loading">Loading chat...</div>;
  }

  return (
    <div className="chat-container">
      <ChatHeader 
        receiverName={receiverName}
        onDeleteAll={deleteAllMessages}
      />
      
      <MessageList 
        messages={messages}
        currentUserId={user.id}
        onDeleteMessage={deleteMessage}
        onEditMessage={editMessage}
        typing={typing}
      />
      
      <MessageInput 
        onSendMessage={sendMessage}
        onTyping={handleTyping}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;
```

### Message List Component
```javascript
// components/Chat/MessageList.jsx
import React from 'react';
import MessageItem from './MessageItem';

const MessageList = ({ messages, currentUserId, onDeleteMessage, onEditMessage, typing }) => {
  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageItem
          key={message.msgID}
          message={message}
          isOwn={message.senderID === currentUserId}
          onDelete={() => onDeleteMessage(message.msgID)}
          onEdit={(newMsg) => onEditMessage(message.msgID, newMsg)}
        />
      ))}
      
      {typing && (
        <div className="typing-indicator">
          <span>Typing...</span>
        </div>
      )}
    </div>
  );
};

export default MessageList;
```

### Message Item Component
```javascript
// components/Chat/MessageItem.jsx
import React, { useState } from 'react';

const MessageItem = ({ message, isOwn, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.msg);
  const [showActions, setShowActions] = useState(false);

  const handleEdit = () => {
    if (editText.trim() && editText !== message.msg) {
      onEdit(editText.trim());
      setIsEditing(false);
    }
  };

  const formatTime = (dateStr) => {
    return new Date(dateStr).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      className={`message-item ${isOwn ? 'own' : 'other'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Reply indicator */}
      {message.replyToMessage && (
        <div className="reply-preview">
          <div className="reply-line"></div>
          <div className="reply-content">
            <span className="reply-sender">{message.replyToMessage.senderNick}</span>
            <span className="reply-text">{message.replyToMessage.msg}</span>
          </div>
        </div>
      )}

      {/* Message content */}
      <div className="message-content">
        {isEditing ? (
          <div className="edit-mode">
            <input
              type="text"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEdit()}
              autoFocus
            />
            <div className="edit-actions">
              <button onClick={handleEdit} className="save-btn">Save</button>
              <button onClick={() => setIsEditing(false)} className="cancel-btn">Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <div className="message-text">{message.msg}</div>
            <div className="message-meta">
              <span className="message-time">{formatTime(message.msgDateUTC)}</span>
              {message.isEdited && (
                <span className="edited-indicator">
                  edited {formatTime(message.editedAt)}
                </span>
              )}
              {isOwn && (
                <div className="message-status">
                  {message.isRead ? (
                    <span className="read-status">✓✓</span>
                  ) : message.isDelivered ? (
                    <span className="delivered-status">✓</span>
                  ) : (
                    <span className="sent-status">⏰</span>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Message actions */}
      {showActions && !isEditing && (
        <div className="message-actions">
          {isOwn && (
            <button onClick={() => setIsEditing(true)} className="edit-btn">
              Edit
            </button>
          )}
          <button onClick={onDelete} className="delete-btn">
            {isOwn ? 'Delete for Everyone' : 'Delete for Me'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MessageItem;
```

### Message Input Component
```javascript
// components/Chat/MessageInput.jsx
import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const typingTimeoutRef = useRef(null);

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Handle typing indicator
    onTyping(true);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing after 1 second of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      onTyping(false);
    }, 1000);
  };

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message.trim(), replyTo);
      setMessage('');
      setReplyTo(null);
      onTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="message-input-container">
      {replyTo && (
        <div className="reply-preview">
          <span>Replying to: {replyTo.msg}</span>
          <button onClick={() => setReplyTo(null)}>×</button>
        </div>
      )}
      
      <div className="message-input">
        <textarea
          value={message}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          rows={1}
        />
        <button 
          onClick={handleSend}
          disabled={!message.trim()}
          className="send-btn"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
```

---

## 6. WebSocket Integration

### Socket Hook
```javascript
// hooks/useSocket.js
import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';
import { API_CONFIG } from '../config/env';

export const useSocket = () => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token && user && !socketRef.current) {
      // Initialize socket connection
      const newSocket = io(API_CONFIG.SOCKET_URL, {
        auth: { token },
        transports: ['websocket']
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setConnected(false);
      });

      newSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });

      socketRef.current = newSocket;
      setSocket(newSocket);
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
    };
  }, [token, user]);

  return { socket, connected };
};
```

### Socket Context Provider
```javascript
// contexts/SocketContext.jsx
import React, { createContext, useContext } from 'react';
import { useSocket } from '../hooks/useSocket';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const socketData = useSocket();

  return (
    <SocketContext.Provider value={socketData}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocketContext must be used within SocketProvider');
  }
  return context;
};
```

---

## 7. API Integration

### Complete API Service
```javascript
// services/chatService.js
import ApiService from './apiService';

class ChatService extends ApiService {
  // Get user chats/threads
  async getUserChats() {
    const response = await this.api.get('/api/chat/threads');
    return response.data;
  }

  // Get chat history with pagination
  async getChatHistory(receiverID, page = 1, limit = 20) {
    const response = await this.getChat(receiverID, { page, count: limit });
    return response.data;
  }

  // Send different message types
  async sendTextMessage(receiverID, text, replyTo = null) {
    return this.sendMessage(receiverID, {
      msg: text,
      msgType: 'text',
      reply: replyTo
    });
  }

  async sendImageMessage(receiverID, imageUrl, caption = '') {
    return this.sendMessage(receiverID, {
      msg: caption,
      msgType: 'image',
      msgJson: { imageUrl }
    });
  }

  async sendFileMessage(receiverID, fileUrl, fileName) {
    return this.sendMessage(receiverID, {
      msg: fileName,
      msgType: 'file',
      msgJson: { fileUrl, fileName }
    });
  }

  // Bulk operations
  async markAllAsRead(threadID) {
    return this.markAsRead(threadID);
  }

  async exportChatHistory(threadID) {
    const response = await this.api.get(`/api/chat/export/${threadID}`);
    return response.data;
  }
}

export default new ChatService();
```

---

## 8. Complete Examples

### App.jsx - Main Application
```javascript
// App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { SocketProvider } from './contexts/SocketContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import PrivateRoute from './components/PrivateRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/chat/:receiverID?" 
                element={
                  <PrivateRoute>
                    <ChatPage />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <ChatPage />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
```

### Chat Page Component
```javascript
// pages/ChatPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ChatContainer from '../components/Chat/ChatContainer';
import UserList from '../components/Chat/UserList';
import { useAuth } from '../hooks/useAuth';
import ChatService from '../services/chatService';

const ChatPage = () => {
  const { receiverID } = useParams();
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (receiverID) {
      const receiver = users.find(u => u.id === receiverID);
      setSelectedUser(receiver);
    }
  }, [receiverID, users]);

  const loadUsers = async () => {
    try {
      // Load users from your API
      const response = await ChatService.api.get('/api/users');
      setUsers(response.data.filter(u => u.id !== user.id));
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  return (
    <div className="chat-page">
      <div className="chat-sidebar">
        <div className="current-user">
          <h3>Welcome, {user.firstName}</h3>
        </div>
        <UserList 
          users={users}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
      </div>

      <div className="chat-main">
        {selectedUser ? (
          <ChatContainer 
            receiverID={selectedUser.id}
            receiverName={selectedUser.firstName}
          />
        ) : (
          <div className="no-chat-selected">
            <h2>Select a user to start chatting</h2>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
```

### Styling (CSS)
```css
/* Chat.css */
.chat-page {
  display: flex;
  height: 100vh;
  background-color: #f0f0f0;
}

.chat-sidebar {
  width: 300px;
  background: #fff;
  border-right: 1px solid #ddd;
  overflow-y: auto;
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
}

.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #e5ddd5;
}

.message-item {
  margin-bottom: 15px;
  position: relative;
}

.message-item.own {
  margin-left: auto;
  margin-right: 0;
  max-width: 70%;
}

.message-item.other {
  margin-left: 0;
  margin-right: auto;
  max-width: 70%;
}

.message-content {
  padding: 8px 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-item.own .message-content {
  background: #dcf8c6;
}

.message-text {
  margin-bottom: 5px;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #888;
}

.edited-indicator {
  font-style: italic;
  color: #666;
}

.message-status {
  margin-left: 5px;
}

.read-status {
  color: #4fc3f7;
}

.delivered-status {
  color: #999;
}

.sent-status {
  color: #ccc;
}

.message-actions {
  position: absolute;
  top: 0;
  right: -80px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  z-index: 10;
}

.message-actions button {
  display: block;
  width: 100%;
  padding: 5px 10px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 12px;
}

.message-actions button:hover {
  background: #f0f0f0;
}

.edit-mode {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 8px;
}

.edit-mode input {
  width: 100%;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
  margin-bottom: 10px;
}

.edit-actions {
  display: flex;
  gap: 5px;
}

.edit-actions button {
  padding: 5px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.save-btn {
  background: #4caf50;
  color: white;
}

.cancel-btn {
  background: #f44336;
  color: white;
}

.message-input-container {
  padding: 20px;
  background: #fff;
  border-top: 1px solid #ddd;
}

.message-input {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.message-input textarea {
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  max-height: 100px;
  font-family: inherit;
}

.send-btn {
  padding: 10px 20px;
  background: #25d366;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  font-weight: bold;
}

.send-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.typing-indicator {
  padding: 10px;
  font-style: italic;
  color: #666;
  font-size: 14px;
}

.reply-preview {
  background: #f0f0f0;
  padding: 8px;
  border-left: 3px solid #25d366;
  margin-bottom: 5px;
  border-radius: 4px;
}

.reply-sender {
  font-weight: bold;
  color: #25d366;
  font-size: 12px;
  display: block;
}

.reply-text {
  color: #666;
  font-size: 12px;
}

.no-chat-selected {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-page {
    flex-direction: column;
  }
  
  .chat-sidebar {
    width: 100%;
    height: 200px;
  }
  
  .message-item {
    max-width: 85%;
  }
  
  .message-actions {
    position: static;
    margin-top: 5px;
    display: flex;
    gap: 5px;
  }
}
```

---

## 9. Testing Guide

### Frontend Testing
```javascript
// tests/Chat.test.js
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { io } from 'socket.io-client';
import ChatContainer from '../components/Chat/ChatContainer';
import { AuthProvider } from '../hooks/useAuth';

// Mock socket.io
jest.mock('socket.io-client');

const mockUser = { id: 'user1', firstName: 'John' };
const mockReceiver = { id: 'user2', firstName: 'Jane' };

const ChatWrapper = ({ children }) => (
  <AuthProvider value={{ user: mockUser }}>
    {children}
  </AuthProvider>
);

describe('ChatContainer', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = {
      emit: jest.fn(),
      on: jest.fn(),
      off: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    
    io.mockReturnValue(mockSocket);
  });

  test('renders chat container', () => {
    render(
      <ChatWrapper>
        <ChatContainer receiverID={mockReceiver.id} receiverName={mockReceiver.firstName} />
      </ChatWrapper>
    );
    
    expect(screen.getByText('Jane')).toBeInTheDocument();
  });

  test('sends message on submit', async () => {
    render(
      <ChatWrapper>
        <ChatContainer receiverID={mockReceiver.id} receiverName={mockReceiver.firstName} />
      </ChatWrapper>
    );
    
    const input = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');
    
    fireEvent.change(input, { target: { value: 'Hello Jane!' } });
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSocket.emit).toHaveBeenCalledWith('send_message', {
        receiverID: mockReceiver.id,
        msg: 'Hello Jane!',
        msgType: 'text',
        reply: null
      });
    });
  });
});
```

### Backend Testing
```javascript
// tests/chat.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ChatService } from '../src/chat/chat.service';
import { ChatMessage, ChatThread, ChatParticipant } from '../src/chat/chat.entity';
import { UserEntity } from '../src/user/users.entity';

describe('ChatService', () => {
  let service: ChatService;
  let mockMessageRepo;
  let mockThreadRepo;
  let mockParticipantRepo;
  let mockUserRepo;

  beforeEach(async () => {
    mockMessageRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      createQueryBuilder: jest.fn()
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: getRepositoryToken(ChatMessage), useValue: mockMessageRepo },
        { provide: getRepositoryToken(ChatThread), useValue: mockThreadRepo },
        { provide: getRepositoryToken(ChatParticipant), useValue: mockParticipantRepo },
        { provide: getRepositoryToken(UserEntity), useValue: mockUserRepo }
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  it('should send message successfully', async () => {
    const mockMessage = {
      msgID: 'msg1',
      msg: 'Hello',
      senderID: 'user1',
      receiverID: 'user2'
    };

    mockMessageRepo.create.mockReturnValue(mockMessage);
    mockMessageRepo.save.mockResolvedValue(mockMessage);
    mockMessageRepo.findOne.mockResolvedValue(mockMessage);

    const result = await service.sendMessage('user1', 'user2', {
      msg: 'Hello',
      msgType: 'text'
    });

    expect(result.msg).toBe('Hello');
    expect(mockMessageRepo.save).toHaveBeenCalled();
  });

  it('should edit message successfully', async () => {
    const mockMessage = {
      msgID: 'msg1',
      msg: 'Hello',
      senderID: 'user1',
      visibleToSender: true
    };

    mockMessageRepo.findOne.mockResolvedValue(mockMessage);
    mockMessageRepo.update.mockResolvedValue({ affected: 1 });

    const result = await service.editMessage('user1', {
      msgID: 'msg1',
      threadID: 'thread1',
      newMsg: 'Hello World'
    });

    expect(result.success).toBe(true);
    expect(mockMessageRepo.update).toHaveBeenCalledWith(
      { msgID: 'msg1' },
      { msg: 'Hello World', isEdited: true, editedAt: expect.any(Date) }
    );
  });
});
```

---

## 10. Troubleshooting

### Common Issues और Solutions

#### 1. Socket Connection Issues
```javascript
// Problem: Socket not connecting
// Solution: Check token and CORS settings

// Frontend debugging
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Check if token is valid
  const token = localStorage.getItem('auth_token');
  console.log('Token:', token);
});

// Backend CORS configuration
@WebSocketGateway({
  cors: { 
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true 
  },
  namespace: '/chat'
})
```

#### 2. Messages Not Updating
```javascript
// Problem: Real-time updates not working
// Solution: Ensure proper room joining

// Check if user joined thread
socket.emit('join_thread', { threadID });

// Debug socket events
socket.onAny((event, data) => {
  console.log('Socket event:', event, data);
});
```

#### 3. Authentication Errors
```javascript
// Problem: JWT token issues
// Solution: Proper token handling

// Check token expiry
const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Auto-refresh token
if (isTokenExpired(token)) {
  // Refresh token logic
  refreshAuthToken();
}
```

#### 4. Message Order Issues
```javascript
// Problem: Messages appearing out of order
// Solution: Sort by timestamp

const sortedMessages = messages.sort((a, b) => 
  new Date(a.msgDateUTC) - new Date(b.msgDateUTC)
);
```

#### 5. Performance Issues
```javascript
// Problem: Slow message loading
// Solution: Implement pagination and virtualization

// Use React.memo for message components
const MessageItem = React.memo(({ message, isOwn, onDelete, onEdit }) => {
  // Component logic
});

// Implement virtual scrolling for large message lists
import { FixedSizeList as List } from 'react-window';

const VirtualizedMessageList = ({ messages }) => (
  <List
    height={400}
    itemCount={messages.length}
    itemSize={80}
    itemData={messages}
  >
    {MessageItem}
  </List>
);
```

### Debug Tools

#### Frontend Debug Helper
```javascript
// utils/debugHelper.js
export const debugChat = {
  logSocketEvents: (socket) => {
    socket.onAny((event, data) => {
      console.log(`🔔 Socket Event: ${event}`, data);
    });
  },
  
  logAPIRequests: (apiService) => {
    apiService.api.interceptors.request.use(config => {
      console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data);
      return config;
    });
  },
  
  measurePerformance: (name, fn) => {
    console.time(name);
    const result = fn();
    console.timeEnd(name);
    return result;
  }
};
```

#### Backend Debug Middleware
```typescript
// middleware/debug.middleware.ts
@Injectable()
export class DebugMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    console.log(`📝 ${req.method} ${req.path}`, {
      body: req.body,
      query: req.query,
      headers: req.headers.authorization
    });
    next();
  }
}
```

---


