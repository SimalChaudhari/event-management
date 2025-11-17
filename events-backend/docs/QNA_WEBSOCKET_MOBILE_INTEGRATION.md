# Q&A Real-Time WebSocket Integration Guide for Mobile Developers

## Overview
This document provides everything a mobile developer needs to integrate real-time Q&A functionality using WebSocket connections. The system allows mobile apps to receive live updates when questions are created, updated, answered, or deleted.

---

## 📋 Table of Contents
1. [Quick Start for Mobile App](#quick-start-for-mobile-app)
2. [Connection Details](#connection-details)
3. [Connection Flow](#connection-flow)
4. [Events to Listen](#events-to-listen)
5. [Events to Emit](#events-to-emit)
6. [Data Structures](#data-structures)
7. [API Endpoints](#api-endpoints)
8. [Example Implementation](#example-implementation)
9. [Error Handling](#error-handling)

---

## 🚀 Quick Start for Mobile App

### For Mobile Developers - Simple Integration Steps:

1. **Connect to WebSocket:**
   ```javascript
   const socket = io('YOUR_API_URL/qna');
   ```

2. **Join Room using Engagement ID or Session ID:**
   ```javascript
   // Option A: Join by Engagement ID (if you have it)
   socket.emit('join_engagement', { engagementId: 'engagement-id' });
   
   // Option B: Join by Session ID (if you have it)
   socket.emit('join_session', { sessionId: 'session-id' });
   ```

3. **Listen for Real-time Updates:**
   ```javascript
   socket.on('question_update', (data) => {
     if (data.type === 'question_created') {
       // New question created - add to your list
     } else if (data.type === 'question_updated') {
       // Question updated (likes, status, etc.) - update in your list
     } else if (data.type === 'question_answered') {
       // Question answered - update in your list
     } else if (data.type === 'question_deleted') {
       // Question deleted - remove from your list
     }
   });
   ```

4. **That's it!** Your app will now receive real-time updates when:
   - New questions are created
   - Questions are updated (likes, status changes)
   - Questions are answered
   - Questions are deleted

### Important Notes:
- **No Authentication Required** - WebSocket connection is public
- **Use Engagement ID or Session ID** - You get these from your API responses
- **Automatic Reconnection** - Socket reconnects automatically, but you need to rejoin room after reconnection
- **All Events Include Full Question Data** - You can update your UI directly without API calls

---

## 🔌 Connection Details

### WebSocket URL
```
ws://YOUR_API_URL/qna
```
or for HTTPS:
```
wss://YOUR_API_URL/qna
```

### Namespace
- **Namespace**: `/qna`
- **Full URL**: `${API_BASE_URL}/qna`
- **Authentication**: **NOT REQUIRED** (Public access for share links)

### Connection Options
```javascript
{
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
}
```

---

## 🔄 Connection Flow

### Step 1: Connect to WebSocket
```javascript
import io from 'socket.io-client';

const socket = io('YOUR_API_URL/qna', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Step 2: Wait for Connection
```javascript
socket.on('connect', () => {
  console.log('Connected to Q&A WebSocket');
  // Now you can join a room
});
```

### Step 3: Join Room
After connection, you can join a room in one of three ways:

#### Option 1: Join by Engagement ID (Recommended for Mobile App)
```javascript
socket.emit('join_engagement', {
  engagementId: 'your_engagement_id_here'
});
```

#### Option 2: Join by Session ID (Recommended for Mobile App)
```javascript
socket.emit('join_session', {
  sessionId: 'your_session_id_here'
});
```

#### Option 3: Join by Share Token (For Share Links)
```javascript
socket.emit('join_share_token', {
  shareToken: 'your_share_token_here'
});
```

### Step 4: Confirm Join
```javascript
// For engagement room
socket.on('joined_engagement', (data) => {
  console.log('Successfully joined engagement room:', data.engagementId);
  // Now you'll receive real-time updates
});

// For session room
socket.on('joined_session', (data) => {
  console.log('Successfully joined session room:', data.sessionId);
  // Now you'll receive real-time updates
});

// For share token room
socket.on('joined', (data) => {
  console.log('Successfully joined room:', data.shareToken);
  // Now you'll receive real-time updates
});
```

---

## 👂 Events to Listen (Server → Client)

### 1. Connection Events

#### `connected`
Emitted when WebSocket connection is established.
```json
{
  "message": "Connected to Q&A updates",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

#### `joined_engagement`
Emitted after successfully joining an engagement room.
```json
{
  "engagementId": "engagement-uuid",
  "message": "Successfully joined engagement Q&A updates room"
}
```

#### `joined_session`
Emitted after successfully joining a session room.
```json
{
  "sessionId": "session-uuid",
  "message": "Successfully joined session Q&A updates room"
}
```

#### `joined`
Emitted after successfully joining a share token room.
```json
{
  "shareToken": "abc123...",
  "message": "Successfully joined Q&A updates room"
}
```

#### `left_engagement`
Emitted after leaving an engagement room.
```json
{
  "message": "Left engagement Q&A updates room"
}
```

#### `left_session`
Emitted after leaving a session room.
```json
{
  "message": "Left session Q&A updates room"
}
```

#### `left`
Emitted after leaving a share token room.
```json
{
  "message": "Left Q&A updates room"
}
```

#### `error`
Emitted when an error occurs.
```json
{
  "message": "Error description here"
}
```

---

### 2. Question Update Events

#### `question_update`
Emitted when a question is created, updated, answered, or deleted.

**Event Structure:**
```json
{
  "type": "question_created | question_updated | question_answered | question_deleted",
  "data": {
    "question": { /* Question object */ },
    "sessionId": "session-uuid",
    "trackId": "track-uuid (optional)",
    "shareToken": "share-token"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Question Object Structure:**
```json
{
  "id": "question-uuid",
  "question": "What is the question text?",
  "askedBy": {
    "id": "user-uuid",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "fullName": "John Doe"
  },
  "answeredBy": {
    "id": "user-uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "email": "jane@example.com",
    "fullName": "Jane Smith"
  },
  "answer": "The answer text (if answered)",
  "likesCount": 5,
  "isPinned": false,
  "status": "answered | not_answered | approved",
  "answeredAt": "2024-01-01T12:00:00.000Z",
  "createdAt": "2024-01-01T11:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**For `question_deleted` type:**
```json
{
  "type": "question_deleted",
  "data": {
    "questionId": "question-uuid",
    "shareToken": "share-token"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

### 3. Session Update Events

#### `session_update`
Emitted when session statistics or data changes.

```json
{
  "type": "session_updated",
  "data": {
    "sessionId": "session-uuid",
    "trackId": "track-uuid (optional)",
    "shareToken": "share-token"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Action**: Refresh session statistics or question list when this event is received.

---

### 4. Modal State Change Events

#### `modal_state_change`
Emitted when modal state changes (for UI synchronization).

```json
{
  "modalType": "question_modal | answer_modal",
  "action": "open | close",
  "questionData": { /* Question object (optional) */ },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 📤 Events to Emit (Client → Server)

### 1. Join Engagement Room (For Mobile App)
```javascript
socket.emit('join_engagement', {
  engagementId: 'your_engagement_id_here'
});
```

### 2. Join Session Room (For Mobile App)
```javascript
socket.emit('join_session', {
  sessionId: 'your_session_id_here'
});
```

### 3. Join Share Token Room (For Share Links)
```javascript
socket.emit('join_share_token', {
  shareToken: 'your_share_token_here'
});
```

### 4. Leave Engagement Room
```javascript
socket.emit('leave_engagement', {
  engagementId: 'your_engagement_id_here'
});
```

### 5. Leave Session Room
```javascript
socket.emit('leave_session', {
  sessionId: 'your_session_id_here'
});
```

### 6. Leave Share Token Room
```javascript
socket.emit('leave_share_token', {
  shareToken: 'your_share_token_here'
});
```

### 3. Modal State Change (Optional)
```javascript
socket.emit('modal_state_change', {
  shareToken: 'your_share_token_here',
  modalType: 'question_modal', // or 'answer_modal'
  action: 'open', // or 'close'
  questionData: { /* optional question object */ }
});
```

---

## 📊 Data Structures

### Question Status Values
- `"answered"` - Question has been answered
- `"not_answered"` - Question is pending
- `"approved"` - Question has been approved

### Question Object (Full Structure)
```typescript
interface Question {
  id: string;
  question: string;
  askedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  } | null;
  answeredBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    fullName: string;
  } | null;
  answer?: string | null;
  likesCount: number;
  isPinned: boolean;
  status: 'answered' | 'not_answered' | 'approved';
  answeredAt?: string | null;
  createdAt: string;
  updatedAt: string;
  isAnswered: boolean;
  isAnonymous: boolean;
}
```

---

## 🌐 API Endpoints

### Get Session Q&A by Share Link
```
GET /api/engagements/qna/share/:shareToken
```
**Response:**
```json
{
  "success": true,
  "message": "Session Q&A retrieved successfully",
  "data": {
    "session": { /* Session details */ },
    "track": { /* Track details */ },
    "event": { /* Event details */ },
    "questions": [ /* Array of questions */ ],
    "statistics": {
      "total": 10,
      "answered": 5,
      "unanswered": 3,
      "approved": 2,
      "pinned": 1
    }
  }
}
```

### Get Track Q&A by Share Link
```
GET /api/engagements/qna/track/:shareToken?page=1&pageSize=1
```
**Response:**
```json
{
  "success": true,
  "data": {
    "track": { /* Track details */ },
    "event": { /* Event details */ },
    "sessions": [ /* Array of sessions with questions */ ],
    "overallStatistics": { /* Statistics */ },
    "pagination": { /* Pagination info */ }
  }
}
```

### Answer Question via Share Link
```
PUT /api/engagements/qna/share/:shareToken/answer/:questionId
Body: { "answer": "The answer text" }
```

### Update Question via Share Link
```
PUT /api/engagements/qna/share/:shareToken/question/:questionId
Body: { "question": "Updated question text", "status": "approved" }
```

### Delete Question via Share Link
```
DELETE /api/engagements/qna/share/:shareToken/question/:questionId
```

---

## 💻 Example Implementation

### React Native Example
```javascript
import io from 'socket.io-client';

class QnAWebSocketManager {
  constructor(apiUrl, engagementId = null, sessionId = null, shareToken = null) {
    this.apiUrl = apiUrl;
    this.engagementId = engagementId;
    this.sessionId = sessionId;
    this.shareToken = shareToken;
    this.socket = null;
    this.onQuestionUpdate = null;
    this.onSessionUpdate = null;
  }

  connect() {
    this.socket = io(`${this.apiUrl}/qna`, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    // Connection handlers
    this.socket.on('connect', () => {
      console.log('Q&A WebSocket connected');
      this.joinRoom();
    });

    this.socket.on('connected', (data) => {
      console.log('Connected:', data.message);
    });

    // Handle different join confirmations
    this.socket.on('joined_engagement', (data) => {
      console.log('Joined engagement room:', data.engagementId);
    });

    this.socket.on('joined_session', (data) => {
      console.log('Joined session room:', data.sessionId);
    });

    this.socket.on('joined', (data) => {
      console.log('Joined share token room:', data.shareToken);
    });

    // Question update handler
    this.socket.on('question_update', (data) => {
      console.log('Question update:', data.type);
      
      if (this.onQuestionUpdate) {
        this.onQuestionUpdate(data);
      }
    });

    // Session update handler
    this.socket.on('session_update', (data) => {
      console.log('Session update:', data.type);
      
      if (this.onSessionUpdate) {
        this.onSessionUpdate(data);
      }
    });

    // Error handler
    this.socket.on('error', (error) => {
      console.error('Q&A WebSocket error:', error);
    });

    // Disconnect handler
    this.socket.on('disconnect', () => {
      console.log('Q&A WebSocket disconnected');
    });
  }

  joinRoom() {
    if (this.socket && this.socket.connected) {
      // Join by engagement ID (preferred for mobile app)
      if (this.engagementId) {
        this.socket.emit('join_engagement', {
          engagementId: this.engagementId
        });
      }
      
      // Join by session ID (alternative for mobile app)
      if (this.sessionId) {
        this.socket.emit('join_session', {
          sessionId: this.sessionId
        });
      }
      
      // Join by share token (for share links)
      if (this.shareToken) {
        this.socket.emit('join_share_token', {
          shareToken: this.shareToken
        });
      }
    }
  }

  leaveRoom() {
    if (this.socket && this.socket.connected) {
      if (this.engagementId) {
        this.socket.emit('leave_engagement', {
          engagementId: this.engagementId
        });
      }
      
      if (this.sessionId) {
        this.socket.emit('leave_session', {
          sessionId: this.sessionId
        });
      }
      
      if (this.shareToken) {
        this.socket.emit('leave_share_token', {
          shareToken: this.shareToken
        });
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.leaveRoom();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  setQuestionUpdateHandler(handler) {
    this.onQuestionUpdate = handler;
  }

  setSessionUpdateHandler(handler) {
    this.onSessionUpdate = handler;
  }
}

// Usage - For Mobile App (using engagementId or sessionId)
const qnaManager = new QnAWebSocketManager(
  'https://api.example.com', 
  'engagement-id-123',  // engagementId
  'session-id-456',     // sessionId (optional)
  null                   // shareToken (optional, for share links)
);

// Or if you only have sessionId:
const qnaManager = new QnAWebSocketManager(
  'https://api.example.com', 
  null,                  // engagementId
  'session-id-456',      // sessionId
  null                    // shareToken
);

qnaManager.setQuestionUpdateHandler((data) => {
  switch (data.type) {
    case 'question_created':
      // Add new question to list
      addQuestionToList(data.data.question);
      break;
    case 'question_updated':
      // Update existing question
      updateQuestionInList(data.data.question);
      break;
    case 'question_answered':
      // Update question with answer
      updateQuestionAnswer(data.data.question);
      break;
    case 'question_deleted':
      // Remove question from list
      removeQuestionFromList(data.data.questionId);
      break;
  }
});

qnaManager.setSessionUpdateHandler((data) => {
  // Refresh session statistics
  refreshSessionStatistics();
});

qnaManager.connect();
```

### Swift (iOS) Example
```swift
import SocketIO

class QnAWebSocketManager {
    var socket: SocketIOClient?
    let apiUrl: String
    let shareToken: String
    
    init(apiUrl: String, shareToken: String) {
        self.apiUrl = apiUrl
        self.shareToken = shareToken
    }
    
    func connect() {
        let manager = SocketManager(socketURL: URL(string: "\(apiUrl)/qna")!, config: [
            .log(true),
            .reconnects(true),
            .reconnectWait(1000),
            .reconnectAttempts(5)
        ])
        
        socket = manager.defaultSocket
        
        socket?.on(clientEvent: .connect) { data, ack in
            print("Q&A WebSocket connected")
            self.joinRoom()
        }
        
        socket?.on("connected") { data, ack in
            print("Connected to Q&A updates")
        }
        
        socket?.on("joined") { data, ack in
            print("Joined Q&A room")
        }
        
        socket?.on("question_update") { data, ack in
            if let updateData = data[0] as? [String: Any] {
                self.handleQuestionUpdate(updateData)
            }
        }
        
        socket?.on("session_update") { data, ack in
            if let updateData = data[0] as? [String: Any] {
                self.handleSessionUpdate(updateData)
            }
        }
        
        socket?.connect()
    }
    
    func joinRoom() {
        socket?.emit("join_share_token", ["shareToken": shareToken])
    }
    
    func leaveRoom() {
        socket?.emit("leave_share_token", ["shareToken": shareToken])
    }
    
    func disconnect() {
        leaveRoom()
        socket?.disconnect()
    }
    
    func handleQuestionUpdate(_ data: [String: Any]) {
        // Handle question update
        if let type = data["type"] as? String {
            switch type {
            case "question_created":
                // Add new question
                break
            case "question_updated":
                // Update question
                break
            case "question_answered":
                // Update with answer
                break
            case "question_deleted":
                // Remove question
                break
            default:
                break
            }
        }
    }
    
    func handleSessionUpdate(_ data: [String: Any]) {
        // Refresh session statistics
    }
}
```

### Kotlin (Android) Example
```kotlin
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class QnAWebSocketManager(private val apiUrl: String, private val shareToken: String) {
    private var socket: Socket? = null
    
    fun connect() {
        val options = IO.Options().apply {
            reconnection = true
            reconnectionDelay = 1000
            reconnectionAttempts = 5
        }
        
        socket = IO.socket("$apiUrl/qna", options)
        
        socket?.on(Socket.EVENT_CONNECT) {
            println("Q&A WebSocket connected")
            joinRoom()
        }
        
        socket?.on("connected") { args ->
            println("Connected to Q&A updates")
        }
        
        socket?.on("joined") { args ->
            println("Joined Q&A room")
        }
        
        socket?.on("question_update") { args ->
            val data = args[0] as? JSONObject
            data?.let { handleQuestionUpdate(it) }
        }
        
        socket?.on("session_update") { args ->
            val data = args[0] as? JSONObject
            data?.let { handleSessionUpdate(it) }
        }
        
        socket?.connect()
    }
    
    private fun joinRoom() {
        val data = JSONObject().apply {
            put("shareToken", shareToken)
        }
        socket?.emit("join_share_token", data)
    }
    
    private fun leaveRoom() {
        val data = JSONObject().apply {
            put("shareToken", shareToken)
        }
        socket?.emit("leave_share_token", data)
    }
    
    fun disconnect() {
        leaveRoom()
        socket?.disconnect()
    }
    
    private fun handleQuestionUpdate(data: JSONObject) {
        val type = data.optString("type")
        when (type) {
            "question_created" -> {
                // Add new question
            }
            "question_updated" -> {
                // Update question
            }
            "question_answered" -> {
                // Update with answer
            }
            "question_deleted" -> {
                // Remove question
            }
        }
    }
    
    private fun handleSessionUpdate(data: JSONObject) {
        // Refresh session statistics
    }
}
```

---

## ⚠️ Error Handling

### Connection Errors
```javascript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Retry connection or show error to user
});

socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  // Handle error appropriately
});
```

### Reconnection
The socket automatically reconnects on disconnect. You can listen for reconnection events:

```javascript
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Rejoin room after reconnection
  socket.emit('join_share_token', { shareToken: shareToken });
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt', attemptNumber);
});

socket.on('reconnect_failed', () => {
  console.error('Failed to reconnect');
  // Show error to user or implement manual retry
});
```

---

## ✅ Testing Checklist

- [ ] WebSocket connects successfully
- [ ] Can join share token room
- [ ] Receives `question_created` events
- [ ] Receives `question_updated` events
- [ ] Receives `question_answered` events
- [ ] Receives `question_deleted` events
- [ ] Receives `session_update` events
- [ ] Handles reconnection properly
- [ ] Handles errors gracefully
- [ ] Can leave room and disconnect cleanly

---

## 📝 Important Notes

1. **No Authentication Required**: The Q&A WebSocket is public and doesn't require JWT tokens (unlike push notifications).

2. **Share Token**: You need a valid share token to join a room. Get this from:
   - Session share link: `/api/engagements/qna/share/:shareToken`
   - Track share link: `/api/engagements/qna/track/:shareToken`

3. **Reconnection**: The socket automatically reconnects. Make sure to rejoin the room after reconnection.

4. **Room Management**: One socket can join multiple rooms by calling `join_share_token` multiple times with different tokens.

5. **Performance**: For better performance, use WebSocket transport when available, with polling as fallback.

---

## 🔗 Related Documentation

- [Push Notification API](./PUSH_NOTIFICATION_API.md) - For push notifications (different namespace)
- [Mobile App Integration](./MOBILE_APP_INTEGRATION.md) - General mobile integration guide

---

## 📞 Support

If you have questions or need help with integration, please contact the backend team or refer to the API documentation.

