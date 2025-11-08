# Q&A WebSocket API Documentation
## For Mobile App Integration

### Overview
This document describes the WebSocket API for real-time Q&A updates. The WebSocket connection allows mobile apps to receive live updates when questions are created, updated, answered, or deleted.

---

## Connection Details

### WebSocket URL
```
ws://YOUR_API_URL/qna
```
or
```
wss://YOUR_API_URL/qna (for HTTPS)
```

### Namespace
- **Namespace**: `/qna`
- **Full URL**: `${API_URL}/qna`

---

## Connection Flow

### 1. Connect to WebSocket
```javascript
const socket = io('YOUR_API_URL/qna', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### 2. Join Share Token Room
After connection, you must join a room using the share token:

**Event**: `join_share_token`
```javascript
socket.emit('join_share_token', {
  shareToken: 'your_share_token_here'
});
```

**Response**: `joined`
```javascript
{
  shareToken: 'your_share_token_here',
  message: 'Successfully joined Q&A updates room'
}
```

### 3. Leave Share Token Room (Optional)
**Event**: `leave_share_token`
```javascript
socket.emit('leave_share_token', {
  shareToken: 'your_share_token_here'
});
```

---

## Events Received (Listen to These)

### 1. Connection Events

#### `connected`
Emitted when WebSocket connection is established.
```javascript
{
  message: 'Connected to Q&A updates',
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

#### `joined`
Emitted after successfully joining a share token room.
```javascript
{
  shareToken: 'abc123...',
  message: 'Successfully joined Q&A updates room'
}
```

#### `error`
Emitted when an error occurs.
```javascript
{
  message: 'Error description here'
}
```

---

### 2. Question Update Events

#### `question_update`
Emitted when a question is created, updated, answered, or deleted.

**Event Structure**:
```javascript
{
  type: 'question_created' | 'question_updated' | 'question_deleted' | 'question_answered',
  data: {
    question: {
      id: 'uuid',
      question: 'Question text here',
      status: 'not_answered' | 'answered' | 'approved',
      likesCount: 0,
      isPinned: false,
      isActive: true,
      sessionId: 'session-uuid',
      engagementId: 'engagement-uuid',
      askedById: 'user-uuid',
      createdAt: '2024-01-01T12:00:00.000Z',
      updatedAt: '2024-01-01T12:00:00.000Z',
      answer: null | 'Answer text',
      answeredAt: null | '2024-01-01T12:00:00.000Z',
      answeredBy: null | 'user-uuid'
    },
    sessionId: 'session-uuid',  // Always present
    trackId: 'track-uuid',       // Only for track share links
    shareToken: 'share-token'    // Share token that triggered the event
  },
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

**Event Types**:

1. **`question_created`**: New question was created
   - Action: Add question to your local list
   - Question will have `status: 'not_answered'` by default

2. **`question_updated`**: Question was updated (text, status, etc.)
   - Action: Update existing question in your local list
   - Check if `status === 'answered'` to close modal if open

3. **`question_deleted`**: Question was deleted
   - Action: Remove question from your local list
   - Close modal if this question is currently displayed

4. **`question_answered`**: Question was marked as answered
   - Action: Update question status to 'answered'
   - Close modal if this question is currently displayed

---

### 3. Session Update Events

#### `session_update`
Emitted when session statistics or metadata changes.

**Event Structure**:
```javascript
{
  type: 'session_updated',
  data: {
    sessionId: 'session-uuid',
    trackId: 'track-uuid',      // Optional, only for track share links
    shareToken: 'share-token'
  },
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

**Note**: This event is usually emitted after question updates. You may need to refresh session statistics from the API.

---

### 4. Modal State Change Events

#### `modal_state_change`
Emitted when a modal (fullscreen popup) is opened or closed on another device.

**Event Structure**:
```javascript
{
  modalType: 'fullscreen_popup',
  action: 'open' | 'close',
  questionData: {
    id: 'question-uuid',
    question: 'Question text',
    // ... other question fields
  } | null,
  timestamp: '2024-01-01T12:00:00.000Z'
}
```

**Actions**:
- **`open`**: Open the modal with the specified question
- **`close`**: Close the modal if it's showing the specified question (or close any modal if `questionData` is null)

---

## Events to Emit (Send These)

### 1. Join Share Token Room
```javascript
socket.emit('join_share_token', {
  shareToken: 'your_share_token_here'
});
```

### 2. Leave Share Token Room
```javascript
socket.emit('leave_share_token', {
  shareToken: 'your_share_token_here'
});
```

### 3. Modal State Change (Optional)
If you want to sync modal state across devices:

**Open Modal**:
```javascript
socket.emit('modal_state_change', {
  shareToken: 'your_share_token_here',
  modalType: 'fullscreen_popup',
  action: 'open',
  questionData: {
    id: 'question-uuid',
    question: 'Question text',
    // ... other question fields
  },
  timestamp: new Date().toISOString()
});
```

**Close Modal**:
```javascript
socket.emit('modal_state_change', {
  shareToken: 'your_share_token_here',
  modalType: 'fullscreen_popup',
  action: 'close',
  questionData: {
    id: 'question-uuid',
    // ... question fields
  } | null,  // null to close any modal
  timestamp: new Date().toISOString()
});
```

---

## Complete Example (JavaScript/TypeScript)

```javascript
import io from 'socket.io-client';

class QnAWebSocketClient {
  constructor(apiUrl, shareToken) {
    this.apiUrl = apiUrl;
    this.shareToken = shareToken;
    this.socket = null;
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
      console.log('WebSocket connected');
      this.joinRoom();
    });

    this.socket.on('connected', (data) => {
      console.log('Connected:', data);
    });

    this.socket.on('joined', (data) => {
      console.log('Joined room:', data);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    // Question update handler
    this.socket.on('question_update', (data) => {
      this.handleQuestionUpdate(data);
    });

    // Session update handler
    this.socket.on('session_update', (data) => {
      this.handleSessionUpdate(data);
    });

    // Modal state change handler
    this.socket.on('modal_state_change', (data) => {
      this.handleModalStateChange(data);
    });

    // Disconnect handler
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }

  joinRoom() {
    if (this.socket && this.shareToken) {
      this.socket.emit('join_share_token', {
        shareToken: this.shareToken
      });
    }
  }

  handleQuestionUpdate(data) {
    const { type, data: eventData } = data;
    const question = eventData?.question;
    const sessionId = eventData?.sessionId;

    switch (type) {
      case 'question_created':
        // Add new question to your list
        this.onQuestionCreated(question, sessionId);
        break;

      case 'question_updated':
        // Update existing question
        this.onQuestionUpdated(question, sessionId);
        
        // If status changed to 'answered', close modal
        if (question.status === 'answered') {
          this.onQuestionAnswered(question);
        }
        break;

      case 'question_deleted':
        // Remove question from list
        this.onQuestionDeleted(question, sessionId);
        break;

      case 'question_answered':
        // Question was marked as answered
        this.onQuestionAnswered(question, sessionId);
        break;
    }
  }

  handleSessionUpdate(data) {
    // Refresh session statistics if needed
    this.onSessionUpdated(data.data);
  }

  handleModalStateChange(data) {
    if (data.modalType === 'fullscreen_popup') {
      if (data.action === 'open' && data.questionData) {
        // Open modal with question
        this.onModalOpen(data.questionData);
      } else if (data.action === 'close') {
        // Close modal
        this.onModalClose(data.questionData);
      }
    }
  }

  // Callback methods - implement these in your app
  onQuestionCreated(question, sessionId) {
    // Add question to your local state
  }

  onQuestionUpdated(question, sessionId) {
    // Update question in your local state
  }

  onQuestionDeleted(question, sessionId) {
    // Remove question from your local state
  }

  onQuestionAnswered(question, sessionId) {
    // Update question status and close modal if open
  }

  onSessionUpdated(data) {
    // Refresh session statistics
  }

  onModalOpen(questionData) {
    // Open modal with question
  }

  onModalClose(questionData) {
    // Close modal
  }

  // Emit modal state change
  emitModalStateChange(modalType, action, questionData = null) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('modal_state_change', {
        shareToken: this.shareToken,
        modalType,
        action,
        questionData,
        timestamp: new Date().toISOString()
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('leave_share_token', {
        shareToken: this.shareToken
      });
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Usage
const client = new QnAWebSocketClient('https://api.example.com', 'your-share-token');
client.connect();
```

---

## Question Object Structure

```typescript
interface Question {
  id: string;                    // UUID
  question: string;             // Question text
  status: 'not_answered' | 'answered' | 'approved';
  likesCount: number;           // Number of likes
  isPinned: boolean;            // Is question pinned
  isActive: boolean;            // Is question active
  sessionId: string;            // Session UUID
  engagementId: string;         // Engagement UUID
  askedById: string;            // User UUID who asked
  createdAt: string;            // ISO date string
  updatedAt: string;            // ISO date string
  answer: string | null;        // Answer text (if answered)
  answeredAt: string | null;    // ISO date string (if answered)
  answeredBy: string | null;    // User UUID who answered
}
```

---

## Important Notes

1. **Share Token**: You need a valid share token to join the room. Get this from the API endpoint that provides Q&A data.

2. **Reconnection**: The WebSocket automatically reconnects if the connection is lost. Make sure to rejoin the room after reconnection.

3. **Multiple Share Tokens**: If you're viewing multiple sessions/tracks, you may need multiple WebSocket connections or handle multiple share tokens.

4. **Event Order**: Events may arrive out of order. Always use the `timestamp` field to determine the latest state.

5. **Question Status**: 
   - `not_answered`: Question is waiting for an answer
   - `answered`: Question has been answered
   - `approved`: Question has been approved (may be shown in public view)

6. **Modal Sync**: Modal state changes are optional. Only implement if you want to sync modal open/close across devices.

7. **Error Handling**: Always handle connection errors and implement retry logic.

---

## API Endpoints Reference

### Get Share Token
```
GET /api/engagements/qna/share-link?sessionId={sessionId}
```

### Get Track Share Token
```
GET /api/engagements/qna/track-share-link?trackId={trackId}
```

### Get Questions by Share Token
```
GET /api/engagements/qna/share/{shareToken}
```

---

## Testing

1. Connect to WebSocket
2. Join a share token room
3. Create a question via API
4. You should receive `question_created` event
5. Update question status via API
6. You should receive `question_updated` event

---

## Support

For questions or issues, contact the backend team or refer to the backend codebase:
- Gateway: `events-backend/src/engagement-qna/engagement-qna.gateway.ts`
- Service: `events-backend/src/engagement-qna/engagement-qna.service.ts`

---

**Last Updated**: 2024
**Version**: 1.0

