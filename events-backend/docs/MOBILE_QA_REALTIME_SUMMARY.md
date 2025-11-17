# Mobile App के लिए Real-Time Q&A Updates - Summary

## क्या किया गया है? (What Has Been Done)

Backend में WebSocket support add किया गया है जो mobile app को real-time updates दे सकता है। अब mobile app को automatically updates मिलेंगे जब:

1. ✅ **नया Question create हो** - `question_created` event
2. ✅ **Question update हो** (like/vote, status change) - `question_updated` event  
3. ✅ **Question answered हो** - `question_answered` event
4. ✅ **Question delete हो** - `question_deleted` event

## Mobile Developer को क्या करना है?

### Step 1: WebSocket Connect करें

```javascript
import io from 'socket.io-client';

const socket = io('YOUR_API_URL/qna', {
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

### Step 2: Room Join करें

आपके पास दो options हैं:

**Option A: Engagement ID से Join करें** (Recommended)
```javascript
socket.emit('join_engagement', {
  engagementId: 'your-engagement-id'  // API response से मिलेगा
});
```

**Option B: Session ID से Join करें**
```javascript
socket.emit('join_session', {
  sessionId: 'your-session-id'  // API response से मिलेगा
});
```

### Step 3: Real-time Events Listen करें

```javascript
socket.on('question_update', (data) => {
  const { type, data: eventData } = data;
  const question = eventData.question;
  
  switch (type) {
    case 'question_created':
      // नया question add करें list में
      addQuestionToList(question);
      break;
      
    case 'question_updated':
      // Existing question को update करें
      // यह like/vote count change या status change के लिए भी fire होगा
      updateQuestionInList(question);
      break;
      
    case 'question_answered':
      // Question answered हो गया - answer add करें
      updateQuestionWithAnswer(question);
      break;
      
    case 'question_deleted':
      // Question delete हो गया - list से remove करें
      removeQuestionFromList(eventData.questionId);
      break;
  }
});
```

## Complete Example (React Native)

```javascript
import io from 'socket.io-client';
import { useEffect, useState } from 'react';

function QnAScreen({ engagementId, sessionId }) {
  const [questions, setQuestions] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to WebSocket
    const newSocket = io('YOUR_API_URL/qna', {
      transports: ['websocket', 'polling'],
      reconnection: true,
    });

    newSocket.on('connect', () => {
      console.log('Connected to Q&A WebSocket');
      
      // Join room
      if (engagementId) {
        newSocket.emit('join_engagement', { engagementId });
      } else if (sessionId) {
        newSocket.emit('join_session', { sessionId });
      }
    });

    // Listen for question updates
    newSocket.on('question_update', (data) => {
      const { type, data: eventData } = data;
      const question = eventData.question;

      if (type === 'question_created') {
        setQuestions(prev => [question, ...prev]);
      } else if (type === 'question_updated') {
        setQuestions(prev => 
          prev.map(q => q.id === question.id ? question : q)
        );
      } else if (type === 'question_answered') {
        setQuestions(prev => 
          prev.map(q => q.id === question.id ? question : q)
        );
      } else if (type === 'question_deleted') {
        setQuestions(prev => 
          prev.filter(q => q.id !== eventData.questionId)
        );
      }
    });

    // Handle reconnection
    newSocket.on('reconnect', () => {
      // Rejoin room after reconnection
      if (engagementId) {
        newSocket.emit('join_engagement', { engagementId });
      } else if (sessionId) {
        newSocket.emit('join_session', { sessionId });
      }
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.disconnect();
    };
  }, [engagementId, sessionId]);

  // Rest of your component...
}
```

## Important Points

1. **Engagement ID या Session ID कहाँ से मिलेगा?**
   - जब आप `GET /api/engagements/qna/questions?engagementId=xxx` या `?sessionId=xxx` API call करते हैं, तो response में `engagementId` और `sessionId` मिलता है
   - या question object में `engagementId` और `sessionId` fields होते हैं

2. **Reconnection Handling:**
   - Socket automatically reconnect होता है
   - लेकिन reconnect के बाद room को फिर से join करना होगा

3. **No Authentication Required:**
   - WebSocket connection public है, JWT token की जरूरत नहीं

4. **Event Data Structure:**
   ```json
   {
     "type": "question_created | question_updated | question_answered | question_deleted",
     "data": {
       "question": { /* Full question object */ },
       "sessionId": "session-uuid",
       "engagementId": "engagement-uuid"
     },
     "timestamp": "2024-01-01T12:00:00.000Z"
   }
   ```

## Testing

1. Mobile app में WebSocket connect करें
2. Room join करें (engagementId या sessionId से)
3. दूसरे device से question create/update/delete करें
4. Mobile app में automatically update देखें

## Full Documentation

Complete documentation के लिए देखें: `QNA_WEBSOCKET_MOBILE_INTEGRATION.md`

---

**Summary:** Mobile app को real-time updates मिलेंगे automatically जब कोई question create, update, answer, या delete होगा। बस WebSocket connect करके room join करना है!

