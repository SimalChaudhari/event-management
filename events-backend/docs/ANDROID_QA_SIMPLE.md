# Android Q&A - Simple Guide

## ⚠️ First: Test WSS Connection

**Before implementing, test if WSS is working:**

1. Open: `https://app.evential.sg:5000/qna-realtime`
2. Enter URL: `https://app.evential.sg:5000`
3. Click **"Test WSS Connection"** button
4. Check result:
   - ✅ "Connection successful!" → WSS is working, proceed
   - ❌ Error → Fix server first, then proceed

**Only start implementation if test passes!**

---

## What is Socket?
**Socket = Real-time updates** - When anyone creates/updates/answers/deletes a question, your screen automatically refreshes (no API call needed)

---

## 2 APIs You Need

### 1. Get Questions (Load List)
```
GET /api/engagements/qna/questions?sessionId={uuid}
Header: Authorization: Bearer YOUR_TOKEN
```

### 2. Create Question
```
POST /api/engagements/qna
Header: Authorization: Bearer YOUR_TOKEN
Body: {
  "engagementId": "uuid",
  "sessionId": "uuid", 
  "question": "Your question text"
}
```

---

## 3 Socket Events (Just Listen)

### 1. Connect & Join
```java
// Use https:// (Socket.IO auto-converts to wss:// for WebSocket)
socket = IO.socket("https://app.evential.sg:5000/qna");
socket.connect();

// Join session room
JSONObject data = new JSONObject();
data.put("sessionId", sessionId);
socket.emit("join_session", data);
```

### 2. Listen for Updates
```java
socket.on("question_update", args -> {
    JSONObject data = (JSONObject) args[0];
    String type = data.getString("type");
    
    if (type.equals("question_created")) {
        // Add new question to list
    }
    else if (type.equals("question_updated")) {
        // Update question in list
    }
    else if (type.equals("question_answered")) {
        // Update question with answer
    }
    else if (type.equals("question_deleted")) {
        // Remove question from list
    }
});
```

### 3. Confirm Join
```java
socket.on("joined_session", args -> {
    // Successfully joined - will receive updates now
});
```

---

## Simple Flow

```
1. Load questions (API) → Display in list
2. Connect socket → Join session room
3. Listen for updates → Auto refresh when anyone changes anything
```

---

## That's It!

- **2 APIs**: Get questions, Create question
- **3 Socket Events**: Connect, Listen for updates, Confirm join
- **Use Session ID** (not Engagement ID)

**Done!** 🎉

