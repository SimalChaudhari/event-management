/*
====================================
Chat API Documentation for Android
====================================

Server Details:
- Server URL: http://your-server-url:3000
- Socket URL: ws://your-server-url:3000/chat
- Auth: JWT Token required

====================================
API ENDPOINTS
====================================

1. Send Message
   URL: POST /api/chat/send/{receiverID}
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "msg": "Hello there!",
     "msgType": "text",
     "reply": "previous_message_id"
   }

2. Get Messages
   URL: GET /api/chat/open-chat
   Headers: Authorization: Bearer YOUR_TOKEN
   Parameters: 
   - receiverID=user123
   - paginationCount=20 
   - paginationCurrentPage=1

3. Mark as Read
   URL: POST /api/chat/read
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "threadID": "thread_abc123",
     "msgID": "msg_xyz789"
   }

4. Delete Message  
   URL: POST /api/chat/delete-message
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "threadID": "thread_abc123",
     "msgID": "msg_xyz789"
   }

5. Edit Message
   URL: POST /api/chat/edit-message
   Headers: Authorization: Bearer YOUR_TOKEN
   Body: {
     "threadID": "thread_abc123", 
     "msgID": "msg_xyz789",
     "newMsg": "Updated message text"
   }

====================================
SOCKET EVENTS
====================================

Socket Connection:

Connect:
URL: ws://your-server:3000/chat
Auth Method 1: Pass token in auth object
Auth Method 2: Pass token as query parameter (?token=YOUR_JWT_TOKEN)

Connection Events:
- connect: Successfully connected to server
- connected: Server confirms connection with user data
- disconnect: Connection lost or closed
- connect_error: Failed to connect (check token/network)

How to Handle Connection:
1. Connect with JWT token
2. Listen for 'connect' event = connection successful
3. Listen for 'connected' event = server ready
4. Listen for 'disconnect' = handle reconnection
5. Listen for 'connect_error' = show error message

====================================
Send Events (Emit to Server):

Send Message:
Event: 'send_message'
Data: {
  "receiverID": "user123",
  "msg": "Hello!",
  "msgType": "text"
}

Show Typing:
Event: 'typing'
Data: {
  "threadID": "thread_abc123",
  "isTyping": true
}

Mark Read:
Event: 'mark_read'
Data: {
  "threadID": "thread_abc123",
  "msgID": "msg_xyz789"
}

Join Chat:
Event: 'join_thread'  
Data: {
  "threadID": "thread_abc123"
}

Enter Chat Screen:
Event: 'user_entered_chat'
Data: {
  "threadID": "thread_abc123",
  "userId": "current_user_id"
}

====================================
Listen Events (Receive from Server):

New Message Received:
Event: 'new_message'
Response: Full message object with all details

Message Sent Successfully:
Event: 'message_sent'  
Response: Confirmation with message data

Someone is Typing:
Event: 'typing_start'
Response: { "threadID": "abc", "userId": "user123" }

Typing Stopped:
Event: 'typing_stop'
Response: { "threadID": "abc", "userId": "user123" }

Message Read (Blue Ticks):
Event: 'message_read'
Response: { "threadID": "abc", "readBy": "user123" }

User Online/Offline:
Event: 'user_online' or 'user_offline'
Response: { "userId": "user123", "isOnline": true, "lastSeen": "timestamp" }

Connection Status:
- connect: Connected to server
- connected: Server ready (receives: {userId, timestamp})
- disconnect: Disconnected from server
- connect_error: Connection failed
- error: General socket error
- online_users: List of currently online users

====================================
MESSAGE OBJECT STRUCTURE
====================================

{
  "msgID": "unique_message_id",
  "threadID": "conversation_id", 
  "msg": "actual message text",
  "senderID": "sender_user_id",
  "senderNick": "sender_name",
  "receiverID": "receiver_user_id",
  "isRead": false,
  "isDelivered": true,
  "msgDateUTC": "2024-01-01T12:00:00Z",
  "replyToMessage": {
    "msgID": "original_message_id",
    "msg": "original message text", 
    "senderNick": "original_sender_name"
  }
}

====================================
SIMPLE IMPLEMENTATION FLOW
====================================

1. Connect & Disconnect

Connect:
1. Create socket connection with JWT token
2. Listen for 'connect' event = connection successful
3. Listen for 'connected' event = server confirms with user data
4. You're ready to chat!

Disconnect:
1. Listen for 'disconnect' event = connection lost
2. Show "Connecting..." or offline indicator
3. Socket will auto-reconnect
4. Handle reconnection in your app

Connection Errors:
1. Listen for 'connect_error' = token invalid or network issue
2. Show error message to user
3. Ask user to login again if token expired

2. Send Message
1. Emit 'send_message' with receiver ID and message
2. Listen for 'message_sent' confirmation
3. Message appears in chat

3. Receive Message
1. Listen for 'new_message' event
2. Add message to chat list
3. Show notification if needed

4. Show Typing
1. When user types, emit 'typing' with isTyping: true
2. Listen for 'typing_start' from others
3. Show "User is typing..." indicator

5. Mark as Read
1. When user sees message, emit 'mark_read'
2. Other user gets 'message_read' event
3. Show blue double ticks

6. Online Status
1. Listen for 'user_online' and 'user_offline' events
2. Update user status in UI
3. Show "Online" or "Last seen" accordingly

====================================
IMPORTANT NOTES
====================================

- Always pass JWT token for authentication
- ThreadID is auto-generated when first message is sent
- Typing stops automatically after 1 second
- Messages are delivered instantly via socket
- Use API calls as backup for reliability
- Socket namespace is '/chat' - don't forget this!

That's it! Simple and straightforward for Android implementation.

*/
