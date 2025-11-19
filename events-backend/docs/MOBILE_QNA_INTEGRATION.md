# Mobile Q&A Integration Guide - API First, Then WebSocket

## 📱 For Mobile Developers

This guide shows you how to integrate Q&A functionality in your mobile app using **API first** to get existing questions, then **WebSocket** for real-time auto-updates.

---

## 🎯 Quick Overview

**Flow:**
1. **Step 1:** Use REST API to fetch existing questions using **Engagement ID** (one-time)
2. **Step 2:** Connect to WebSocket and join room using **Engagement ID** for real-time auto-updates
3. **Step 3:** Listen to WebSocket events to update your UI automatically

**Important:** Always use **Engagement ID** (not Session ID) for mobile apps. Session ID is only a fallback option.

---

## 📡 Step 1: Fetch Existing Questions via API

**IMPORTANT:** Always fetch existing questions first using the API. WebSocket only sends **NEW** updates, not existing data.

### API Endpoint

**Primary (Recommended):**
```
GET /api/engagements/qna/questions?engagementId={uuid}
```

**Alternative (Only if Engagement ID is not available):**
```
GET /api/engagements/qna/questions?sessionId={uuid}
```

### Query Parameters

- `engagementId` (required, preferred): UUID of the engagement - **Use this for mobile apps**
- `sessionId` (required only if engagementId is not available): UUID of the session - **Use only as fallback**
- `status` (optional): Filter by status (`all`, `not_answered`, `answered`)
- `sortBy` (optional): Sort order (`likes`, `createdAt`, `answeredAt`)

**Note:** Always use `engagementId` when available. Only use `sessionId` if you don't have the engagement ID.

### Example Request

```javascript
// Using Engagement ID
const response = await fetch(
  'https://api.example.com/api/engagements/qna/questions?engagementId=engagement-uuid-123',
  {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN', // Optional - API is public
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
```

### Example Response

```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "engagement": {
      "id": "engagement-uuid",
      "trackTitle": "Track Name",
      "eventName": "Event Name"
    },
    "questions": [
      {
        "id": "question-uuid",
        "question": "What is the question text?",
        "askedBy": {
          "id": "user-uuid",
          "firstName": "John",
          "lastName": "Doe",
          "fullName": "John Doe"
        },
        "answer": null,
        "likesCount": 5,
        "isPinned": false,
        "status": "not_answered",
        "createdAt": "2024-01-01T11:00:00.000Z",
        "answeredAt": null
      }
    ]
  },
  "metadata": {
    "total": 10,
    "answered": 3,
    "unanswered": 7,
    "pinned": 0
  }
}
```

### React Native Example

```javascript
async function fetchExistingQuestions(engagementId) {
  try {
    const response = await fetch(
      `https://api.example.com/api/engagements/qna/questions?engagementId=${engagementId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    const result = await response.json();
    
    if (result.success && result.data.questions) {
      // Store questions in your state/Redux
      setQuestions(result.data.questions);
      return result.data.questions;
    }
  } catch (error) {
    console.error('Error fetching questions:', error);
  }
}
```

---

## 🔌 Step 2: Connect to WebSocket for Auto-Updates

After fetching existing questions, connect to WebSocket to receive **real-time updates automatically**.

### WebSocket URL

```
ws://YOUR_API_URL/qna
```

**OR for HTTPS:**

```
wss://YOUR_API_URL/qna
```

### Connection Code

```javascript
import io from 'socket.io-client';

// Connect to WebSocket
const socket = io('https://api.example.com/qna', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});
```

### Join Room

After connection, join the room using **Engagement ID** (preferred) or **Session ID** (only if Engagement ID is not available):

```javascript
// Wait for connection
socket.on('connect', () => {
  console.log('Connected to WebSocket');
  
  // Join by Engagement ID (PRIMARY - Use this for mobile apps)
  socket.emit('join_engagement', {
    engagementId: 'engagement-uuid-123'
  });
  
  // ONLY use Session ID if Engagement ID is not available
  // socket.emit('join_session', {
  //   sessionId: 'session-uuid-456'
  // });
});

// Confirm join for Engagement ID
socket.on('joined_engagement', (data) => {
  console.log('Joined engagement room:', data.engagementId);
  // Now you'll receive real-time updates
});

// Confirm join for Session ID (only if using sessionId)
socket.on('joined_session', (data) => {
  console.log('Joined session room:', data.sessionId);
  // Now you'll receive real-time updates
});
```

---

## 📨 Step 3: Listen to Auto-Updates

WebSocket will automatically send you updates when questions change. You just need to listen and update your UI.

### Listen for Question Updates

```javascript
socket.on('question_update', (data) => {
  console.log('Question update received:', data.type);
  
  switch (data.type) {
    case 'question_created':
      // New question created - add to your list
      addQuestionToList(data.data.question);
      break;
      
    case 'question_updated':
      // Question updated (likes, status, etc.) - update in your list
      updateQuestionInList(data.data.question);
      break;
      
    case 'question_answered':
      // Question answered - update with answer
      updateQuestionAnswer(data.data.question);
      break;
      
    case 'question_deleted':
      // Question deleted - remove from your list
      removeQuestionFromList(data.data.questionId);
      break;
  }
});
```

### Question Update Event Structure

```json
{
  "type": "question_created | question_updated | question_answered | question_deleted",
  "data": {
    "question": {
      "id": "question-uuid",
      "question": "What is the question?",
      "askedBy": {
        "id": "user-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "fullName": "John Doe"
      },
      "answer": "The answer (if answered)",
      "likesCount": 5,
      "isPinned": false,
      "status": "answered | not_answered | approved",
      "createdAt": "2024-01-01T11:00:00.000Z",
      "answeredAt": "2024-01-01T12:00:00.000Z"
    }
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**For `question_deleted` type:**
```json
{
  "type": "question_deleted",
  "data": {
    "questionId": "question-uuid"
  },
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

---

## 💻 Complete React Native Example

```javascript
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';

function QnAScreen({ engagementId }) {
  const [questions, setQuestions] = useState([]);
  const [socket, setSocket] = useState(null);

  // Step 1: Fetch existing questions on mount
  useEffect(() => {
    fetchExistingQuestions();
  }, [engagementId]);

  // Step 2: Connect to WebSocket after fetching
  useEffect(() => {
    if (questions.length > 0) {
      connectWebSocket();
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [questions.length]);

  // Fetch existing questions via API
  async function fetchExistingQuestions() {
    try {
      const response = await fetch(
        `https://api.example.com/api/engagements/qna/questions?engagementId=${engagementId}`
      );
      const result = await response.json();
      
      if (result.success && result.data.questions) {
        setQuestions(result.data.questions);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
    }
  }

  // Connect to WebSocket
  function connectWebSocket() {
    const newSocket = io('https://api.example.com/qna', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    newSocket.on('connect', () => {
      console.log('WebSocket connected');
      // Join engagement room
      newSocket.emit('join_engagement', { engagementId });
    });

    newSocket.on('joined_engagement', (data) => {
      console.log('Joined engagement room:', data.engagementId);
    });

    // Listen for real-time updates
    newSocket.on('question_update', (data) => {
      console.log('Question update:', data.type);
      
      if (data.type === 'question_created') {
        // Add new question to list
        setQuestions(prev => [data.data.question, ...prev]);
      } else if (data.type === 'question_updated') {
        // Update existing question
        setQuestions(prev => 
          prev.map(q => 
            q.id === data.data.question.id ? data.data.question : q
          )
        );
      } else if (data.type === 'question_answered') {
        // Update question with answer
        setQuestions(prev => 
          prev.map(q => 
            q.id === data.data.question.id ? data.data.question : q
          )
        );
      } else if (data.type === 'question_deleted') {
        // Remove question from list
        setQuestions(prev => 
          prev.filter(q => q.id !== data.data.questionId)
        );
      }
    });

    // Handle reconnection
    newSocket.on('reconnect', () => {
      // Rejoin room after reconnection
      newSocket.emit('join_engagement', { engagementId });
    });

    setSocket(newSocket);
  }

  return (
    <View>
      {questions.map(question => (
        <QuestionCard key={question.id} question={question} />
      ))}
    </View>
  );
}
```

---

## 🔗 API Endpoints Summary

### Get Questions (REST API)
```
GET /api/engagements/qna/questions?engagementId={uuid}  (PRIMARY - Use this)
GET /api/engagements/qna/questions?sessionId={uuid}     (Fallback only)
```

**Query Parameters:**
- `engagementId` (required, preferred) - **Use this for mobile apps**
- `sessionId` (required only if engagementId unavailable) - **Fallback only**
- `status` (optional): `all`, `not_answered`, `answered`
- `sortBy` (optional): `likes`, `createdAt`, `answeredAt`

### WebSocket Connection
```
ws://YOUR_API_URL/qna
wss://YOUR_API_URL/qna (for HTTPS)
```

**Events to Emit:**
- `join_engagement` - Join by Engagement ID (PRIMARY - Use this)
- `join_session` - Join by Session ID (Fallback only)
- `leave_engagement` - Leave engagement room
- `leave_session` - Leave session room

**Events to Listen:**
- `connected` - Connection established
- `joined_engagement` - Successfully joined engagement room
- `joined_session` - Successfully joined session room
- `question_update` - Question created/updated/answered/deleted
- `error` - Error occurred

---

## ⚠️ Important Notes

1. **API First, WebSocket Second**
   - Always fetch existing questions via API first
   - WebSocket only sends NEW updates, not existing data

2. **No Authentication Required**
   - WebSocket connection is public (no JWT token needed)
   - API endpoint is also public (no auth required)

3. **Use Engagement ID (Primary)**
   - **Mobile apps MUST use `engagementId`** - This is the primary identifier
   - Only use `sessionId` if Engagement ID is not available (fallback)
   - Do NOT use `shareToken` (that's for web share links only)

4. **Automatic Reconnection**
   - WebSocket reconnects automatically
   - You must rejoin the room after reconnection

5. **Full Question Data in Events**
   - All WebSocket events include complete question objects
   - You can update your UI directly without API calls

---

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────┐
│  1. Fetch Existing Questions (API)    │
│  GET /api/engagements/qna/questions    │
│  ?engagementId={uuid}                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. Display Questions in UI            │
│  Show all fetched questions             │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. Connect to WebSocket                │
│  io('https://api.example.com/qna')      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. Join Room                           │
│  emit('join_engagement', {engagementId}) │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. Listen for Auto-Updates             │
│  on('question_update', handler)         │
│  - question_created                     │
│  - question_updated                     │
│  - question_answered                    │
│  - question_deleted                     │
└─────────────────────────────────────────┘
```

---

## ✅ Testing Checklist

- [ ] Fetch existing questions via API successfully
- [ ] Display questions in UI
- [ ] Connect to WebSocket successfully
- [ ] Join engagement/session room successfully
- [ ] Receive `question_created` events
- [ ] Receive `question_updated` events
- [ ] Receive `question_answered` events
- [ ] Receive `question_deleted` events
- [ ] Handle reconnection properly
- [ ] Rejoin room after reconnection

---

## 📞 Support

For questions or issues, contact the backend team or refer to:
- [Full WebSocket Documentation](./QNA_WEBSOCKET_MOBILE_INTEGRATION.md)
- [API Documentation](./SIMPLIFIED_API.md)

