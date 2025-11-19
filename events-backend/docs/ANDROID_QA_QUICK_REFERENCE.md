# Android Q&A - Quick Reference Guide

## 📱 For Android Developers - Simple & Short

**Socket = Real-time updates** - When anyone creates/updates/answers/deletes a question, your screen will automatically refresh (no need to call API again)

**Server URL:** `http://events.isca.org.sg:5000`  
**Socket URL:** `ws://events.isca.org.sg:5000/qna`

---

## 🔌 2 Main API Endpoints

### 1. Get Questions (List)
```
GET /api/engagements/qna/questions?sessionId={uuid}
```
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "questions": [
      {
        "id": "uuid",
        "question": "Question text",
        "answer": null,
        "likesCount": 5,
        "status": "not_answered",
        "askedBy": {
          "fullName": "John Doe"
        },
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### 2. Create Question
```
POST /api/engagements/qna
```
**Headers:**
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "engagementId": "uuid",
  "sessionId": "uuid",
  "question": "Your question text here"
}
```
**Note:** Both `engagementId` and `sessionId` are required in request body, but use `sessionId` for API query and WebSocket room.

**Response:**
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "uuid",
    "question": "Your question text here",
    "likesCount": 0,
    "status": "not_answered"
  }
}
```

---

## 🔌 3 Socket Events (Listen Only)

### Socket Connection
```java
socket = IO.socket("http://events.isca.org.sg:5000/qna");
socket.connect();

// Join room using Session ID (each session has its own Q&A)
JSONObject data = new JSONObject();
data.put("sessionId", sessionId);
socket.emit("join_session", data);
```

---

### Event 1: `question_update` - Main Event

**Listen to this event:**
```java
socket.on("question_update", new Emitter.Listener() {
    @Override
    public void call(Object... args) {
        JSONObject data = (JSONObject) args[0];
        String type = data.getString("type");
        
        if (type.equals("question_created")) {
            // New question created - ADD to list
            Question question = parseQuestion(data.getJSONObject("data").getJSONObject("question"));
            addQuestionToList(question);
        }
        else if (type.equals("question_updated")) {
            // Question updated (likes, status) - UPDATE in list
            Question question = parseQuestion(data.getJSONObject("data").getJSONObject("question"));
            updateQuestionInList(question);
        }
        else if (type.equals("question_answered")) {
            // Question answered - UPDATE in list
            Question question = parseQuestion(data.getJSONObject("data").getJSONObject("question"));
            updateQuestionInList(question);
        }
        else if (type.equals("question_deleted")) {
            // Question deleted - REMOVE from list
            String questionId = data.getJSONObject("data").getString("questionId");
            removeQuestionFromList(questionId);
        }
    }
});
```

**Event Types:**
- `question_created` → Add new question to list
- `question_updated` → Update existing question in list
- `question_answered` → Update question with answer in list
- `question_deleted` → Remove question from list

---

### Event 2: `joined_session` - Confirm Join

**Listen to this event:**
```java
socket.on("joined_session", new Emitter.Listener() {
    @Override
    public void call(Object... args) {
        JSONObject data = (JSONObject) args[0];
        String sessionId = data.getString("sessionId");
        // Successfully joined session room - now you'll receive updates for this session
    }
});
```

---

### Event 3: `connected` - Connection Status

**Listen to this event:**
```java
socket.on("connected", new Emitter.Listener() {
    @Override
    public void call(Object... args) {
        // WebSocket connected successfully
    }
});

socket.on(Socket.EVENT_CONNECT, new Emitter.Listener() {
    @Override
    public void call(Object... args) {
        // Socket.IO connected - now join room
        joinRoom();
    }
});
```

---

## 📋 Complete Flow (Simple)

```
1. Load Questions (API)
   GET /api/engagements/qna/questions?sessionId={uuid}
   ↓
2. Display in RecyclerView
   ↓
3. Connect WebSocket
   ws://server/qna
   ↓
4. Join Session Room
   emit('join_session', {sessionId})
   ↓
5. Listen for Updates
   on('question_update') → Auto refresh list
```

---

## 💻 Minimal Code Example

```java
// 1. Load questions using Session ID
Call<QuestionsResponse> call = apiService.getQuestions("Bearer " + token, sessionId, "all", "likes");
call.enqueue(new Callback<QuestionsResponse>() {
    @Override
    public void onResponse(Call<QuestionsResponse> call, Response<QuestionsResponse> response) {
        questionList.addAll(response.body().getData().getQuestions());
        adapter.notifyDataSetChanged();
        
        // 2. Connect WebSocket
        connectWebSocket();
    }
});

// 3. Connect WebSocket and join session room
private void connectWebSocket() {
    socket = IO.socket("http://events.isca.org.sg:5000/qna");
    
    socket.on(Socket.EVENT_CONNECT, args -> {
        // Join session room (each session has its own Q&A)
        JSONObject data = new JSONObject();
        data.put("sessionId", sessionId);
        socket.emit("join_session", data);
    });
    
    // Listen for updates
    socket.on("question_update", args -> {
        JSONObject data = (JSONObject) args[0];
        String type = data.getString("type");
        
        if (type.equals("question_created")) {
            Question q = parseQuestion(data.getJSONObject("data").getJSONObject("question"));
            runOnUiThread(() -> {
                questionList.add(0, q);
                adapter.notifyItemInserted(0);
            });
        }
        // ... handle other types
    });
    
    socket.connect();
}

// 4. Create question (both engagementId and sessionId required in body)
private void createQuestion(String questionText) {
    CreateQuestionRequest request = new CreateQuestionRequest(engagementId, sessionId, questionText);
    Call<CreateQuestionResponse> call = apiService.createQuestion("Bearer " + token, request);
    call.enqueue(new Callback<CreateQuestionResponse>() {
        @Override
        public void onResponse(Call<CreateQuestionResponse> call, Response<CreateQuestionResponse> response) {
            // Question will appear automatically via WebSocket (question_created event)
        }
    });
}
```

---

## ✅ Summary

**2 APIs:**
1. `GET /api/engagements/qna/questions?sessionId={uuid}` - List questions (use sessionId)
2. `POST /api/engagements/qna` - Create question (both engagementId and sessionId in body)

**3 Socket Events:**
1. `question_update` - Main event (created/updated/answered/deleted)
2. `joined_session` - Confirm session room join
3. `connected` - Connection status

**Important:** Use **Session ID** (not Engagement ID) because each session has its own direct Q&A.

**That's it!** Simple and straightforward.

