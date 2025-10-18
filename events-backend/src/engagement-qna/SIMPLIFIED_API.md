# Engagement Q&A - Simplified API

## Overview
Simplified Question & Answer system for Engagements with only essential features.

## ✅ Features

1. ✅ **Create Question** - Only registered users for the event
2. ✅ **Answer Question** - Only Admin
3. ✅ **Like/Unlike** - Registered users only
4. ✅ **View All Questions** - Users + Admin
5. ✅ **Delete Question** - Own question (User) + Admin (any question)
6. ✅ **Update Question** - Own question (User) + Admin (any question)
7. ✅ **Vote Count** - View like count for questions

## API Endpoints

### 1. Create Question
**POST** `/api/engagements/qna`

**Authorization:** Bearer {token} (Registered users only for the event)

**Request:**
```json
{
  "engagementId": "uuid",
  "question": "Your question here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question created successfully",
  "data": {
    "id": "uuid",
    "question": "Your question here",
    "engagementId": "uuid",
    "askedById": "uuid",
    "askedBy": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "likesCount": 0,
    "isPinned": false,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "askedBy": "uuid",
    "engagementId": "uuid"
  }
}
```

**Validation:**
- User must be registered for the event associated with the engagement
- Question text is required
- Engagement ID must be valid

---

### 2. Answer Question (Admin Only)
**PUT** `/api/engagements/qna/:id/answer`

**Authorization:** Bearer {token} (Admin role required)

**Request:**
```json
{
  "answer": "Your answer here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question answered successfully",
  "data": {
    "id": "uuid",
    "question": "Question text",
    "answer": "Your answer here",
    "answeredAt": "2024-01-01T00:00:00Z",
    "answeredBy": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "fullName": "Admin User"
    },
    "isUpdated": false
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "answeredBy": "uuid",
    "isUpdated": false
  }
}
```

---

### 3. Like/Unlike Question
**POST** `/api/engagements/qna/like`

**Authorization:** Bearer {token} (Registered users only)

**Request:**
```json
{
  "questionId": "uuid"
}
```

**Response (Like):**
```json
{
  "success": true,
  "message": "Question liked successfully",
  "data": {
    "questionId": "uuid",
    "liked": true,
    "likesCount": 1
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "userId": "uuid",
    "voteCount": 1
  }
}
```

**Response (Unlike):**
```json
{
  "success": true,
  "message": "Question unliked successfully",
  "data": {
    "questionId": "uuid",
    "liked": false,
    "likesCount": 0
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "userId": "uuid",
    "voteCount": 0
  }
}
```

---

### 4. Get All Questions for Engagement
**GET** `/api/engagements/qna/questions?engagementId={uuid}&status={all|not_answered|answered}&sortBy={likes|createdAt|answeredAt}`

**Authorization:** Bearer {token} (Users and Admin)

**Query Parameters:**
- `engagementId` (required): UUID of the engagement
- `status` (optional): Filter by status (all, not_answered, answered)
- `sortBy` (optional): Sort order (likes, createdAt, answeredAt)

**Response:**
```json
{
  "success": true,
  "message": "Questions retrieved successfully",
  "data": {
    "engagement": {
      "id": "uuid",
      "trackTitle": "Track Name",
      "eventName": "Event Name"
    },
    "questions": [
      {
        "id": "uuid",
        "question": "Question text",
        "askedBy": {
          "id": "uuid",
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "fullName": "John Doe"
        },
        "answeredBy": null,
        "userLiked": false,
        "likesCount": 5,
        "isPinned": false,
        "isActive": true,
        "status": "not_answered",
        "answeredAt": null,
        "answer": null,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z",
        "isAnswered": false,
        "isMyQuestion": false
      }
    ]
  },
  "metadata": {
    "total": 10,
    "answered": 3,
    "answering": 0,
    "unanswered": 7,
    "pinned": 0,
    "engagementId": "uuid",
    "status": "all",
    "sortBy": "likes",
    "timestamp": "2024-01-01T00:00:00Z",
    "userId": "uuid"
  }
}
```

---

### 5. Delete Question
**DELETE** `/api/engagements/qna/:id`

**Authorization:** Bearer {token} (User can delete own / Admin can delete any)

**Response:**
```json
{
  "success": true,
  "message": "Question deleted successfully",
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "deletedBy": "uuid",
    "isAdmin": false
  }
}
```

---

### 6. Update Question
**PUT** `/api/engagements/qna/:id`

**Authorization:** Bearer {token} (User can update own / Admin can update any)

**Request:**
```json
{
  "question": "Updated question text",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Question updated successfully",
  "data": {
    "id": "uuid",
    "question": "Updated question text",
    "isActive": true,
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "updatedBy": "uuid",
    "isAdmin": false
  }
}
```

---

### 7. Get Vote Count for Question
**GET** `/api/engagements/qna/:id`

**Authorization:** Bearer {token}

**Response:**
```json
{
  "success": true,
  "message": "Question retrieved successfully",
  "data": {
    "id": "uuid",
    "question": "Question text",
    "likesCount": 15,
    "userLiked": true,
    "isAnonymous": false,
    "isPinned": false,
    "isActive": true,
    "status": "answered",
    "answeredAt": "2024-01-01T00:00:00Z",
    "answer": "Answer text",
    "askedBy": {
      "id": "uuid",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "fullName": "John Doe"
    },
    "answeredBy": {
      "id": "uuid",
      "firstName": "Admin",
      "lastName": "User",
      "email": "admin@example.com",
      "fullName": "Admin User"
    },
    "engagement": {
      "id": "uuid",
      "trackTitle": "Track Name",
      "eventName": "Event Name"
    },
    "isMyQuestion": false,
    "isAnswered": true
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "questionId": "uuid",
    "userId": "uuid",
    "voteCount": 15
  }
}
```

---

## Error Responses

### Not Registered for Event
```json
{
  "statusCode": 400,
  "message": "You must be registered for this event to post questions",
  "error": "Bad Request"
}
```

### Not Found
```json
{
  "statusCode": 404,
  "message": "Question with ID {id} not found",
  "error": "Not Found"
}
```

### Unauthorized
```json
{
  "statusCode": 403,
  "message": "You can only update your own questions",
  "error": "Forbidden"
}
```

### Admin Only
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

---

## Key Features

✅ **Event Registration Check**: Only users registered for the event can post questions  
✅ **Admin Answering**: Only admins can answer questions  
✅ **Vote System**: Like/Unlike with duplicate prevention  
✅ **Owner Permissions**: Users can update/delete their own questions  
✅ **Admin Override**: Admins can update/delete any question  
✅ **Vote Count**: View number of likes for each question  
✅ **No Anonymous Support**: All questions show user information  

---

## Database Tables

### `engagement_qna_questions`
- Stores all questions
- Links to engagement
- Tracks likes, status, answers

### `engagement_qna_likes`
- Stores user likes
- Prevents duplicate likes (unique constraint on userId + questionId)

---

## Testing

Test using curl or Postman:

```bash
# Create a question
curl -X POST http://localhost:3000/api/engagements/qna \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"engagementId":"uuid","question":"Test question"}'

# Get questions
curl -X GET "http://localhost:3000/api/engagements/qna?engagementId=uuid" \
  -H "Authorization: Bearer {token}"

# Like a question
curl -X POST http://localhost:3000/api/engagements/qna/like \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"questionId":"uuid"}'
```

