# Engagement Q&A Module

## Overview
This module implements a Question & Answer system for Engagements, similar to the existing Q&A system for Events and Speakers. Users can post questions related to specific engagements, vote on questions, and admin can manage and answer them.

## Key Differences from Event Q&A
- **No Speaker Required**: Questions are tied to engagements (not speakers)
- **Engagement-based**: Questions reference `engagementId` instead of `speakerId`
- **Same Features**: Voting, pinning, answering, status management

## Database Tables

### `engagement_qna_questions`
Stores questions posted for engagements.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| question | text | The question text |
| engagementId | uuid | Reference to engagement |
| askedById | uuid | User who asked the question |
| isAnonymous | boolean | Whether question is anonymous |
| likesCount | int | Number of likes |
| isPinned | boolean | Whether question is pinned |
| isActive | boolean | Whether question is active |
| status | enum | not_answered, answering, answered |
| answer | text | The answer (if answered) |
| answeredAt | timestamp | When answered |
| answeredBy | uuid | Admin who answered |

### `engagement_qna_likes`
Stores user likes for questions.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| questionId | uuid | Reference to question |
| userId | uuid | User who liked |

## API Endpoints

### Public/User Endpoints

#### Create Question
```
POST /api/engagements/qna
Authorization: Bearer {token}

Body:
{
  "engagementId": "uuid",
  "question": "string",
  "isAnonymous": boolean (optional, default: false)
}
```

#### Get Questions for Engagement
```
GET /api/engagements/qna?engagementId={uuid}&status={all|not_answered|answering|answered}&sortBy={likes|createdAt|answeredAt}
Authorization: Bearer {token}
```

#### Get Question by ID
```
GET /api/engagements/qna/:id
Authorization: Bearer {token}
```

#### Like/Unlike Question
```
POST /api/engagements/qna/like
Authorization: Bearer {token}

Body:
{
  "questionId": "uuid"
}
```

#### Update Own Question
```
PUT /api/engagements/qna/:id
Authorization: Bearer {token}

Body:
{
  "question": "string",
  "isActive": boolean
}
```

#### Delete Own Question
```
DELETE /api/engagements/qna/:id
Authorization: Bearer {token}
```

### Admin Endpoints

#### Answer Question
```
PUT /api/engagements/qna/:id/answer
Authorization: Bearer {token} (Admin only)

Body:
{
  "answer": "string"
}
```

#### Pin/Unpin Question
```
PUT /api/engagements/qna/:id/pin
Authorization: Bearer {token} (Admin only)

Body:
{
  "isPinned": boolean
}
```

#### Get All Questions (Admin)
```
GET /api/engagements/qna/admin/questions?engagementId={uuid}&status={all|not_answered|answering|answered}&search={text}
Authorization: Bearer {token} (Admin only)
```

#### Update Question Status
```
PUT /api/engagements/qna/admin/update-status
Authorization: Bearer {token} (Admin only)

Body:
{
  "questionId": "uuid",
  "status": "not_answered" | "answering" | "answered"
}
```

#### Delete Question (Admin)
```
DELETE /api/engagements/qna/admin/:id
Authorization: Bearer {token} (Admin only)
```

## Features

### 1. **Question Creation**
- Registered users can post questions for any engagement
- Optional anonymous posting
- Automatic validation of engagement existence

### 2. **Voting System**
- Users can like/unlike questions
- Like count is tracked and displayed
- Duplicate likes prevented (one user, one vote per question)
- Questions sorted by likes (pinned first)

### 3. **Question Management**
- Users can edit their own questions
- Users can delete their own questions
- Admin can manage all questions

### 4. **Admin Features**
- Answer questions
- Update existing answers
- Pin/unpin important questions
- Update question status (not_answered → answering → answered)
- Delete any question
- View all questions across engagements
- Filter by status and search

### 5. **Privacy**
- Anonymous questions don't show user info
- Non-anonymous questions show user's name and email

### 6. **Sorting & Filtering**
- Sort by: likes, created date, answered date
- Filter by status
- Pinned questions always appear first

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "ISO 8601 string",
    "total": 0,
    "answered": 0,
    "answering": 0,
    "unanswered": 0,
    "pinned": 0
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "data": null
}
```

## Integration with Frontend

The module is ready for integration with the CMS frontend. You'll need to:

1. Create engagement Q&A pages similar to the existing Q&A pages
2. Add Q&A tab/component in engagement view pages
3. Implement vote/like functionality
4. Create admin pages for managing engagement questions
5. Add real-time updates (optional, using WebSockets)

## Migration

Run the NestJS application to auto-create the tables:
```bash
npm run start:dev
```

TypeORM will automatically create:
- `engagement_qna_questions` table
- `engagement_qna_likes` table
- Required indexes

## Usage Example

### User Posts a Question
```typescript
// POST /api/engagements/qna
{
  "engagementId": "abc-123-def",
  "question": "What are the key topics covered in this engagement session?",
  "isAnonymous": false
}
```

### User Likes a Question
```typescript
// POST /api/engagements/qna/like
{
  "questionId": "question-uuid"
}
```

### Admin Answers Question
```typescript
// PUT /api/engagements/qna/{questionId}/answer
{
  "answer": "This engagement session covers AI/ML fundamentals, practical implementations, and case studies."
}
```

## Security

- All endpoints require authentication (JWT)
- Admin-only endpoints protected with role-based guards
- Users can only edit/delete their own questions
- Duplicate like prevention with unique index
- SQL injection protection via TypeORM

## Future Enhancements

1. **Notifications**: Notify users when their questions are answered
2. **Moderation**: Flag inappropriate questions
3. **Categories**: Organize questions by topics
4. **Search**: Full-text search across questions
5. **Export**: Export Q&A data for reporting
6. **Analytics**: Track engagement metrics

## Testing

Test the API using the provided Postman collection or curl commands:

```bash
# Create question
curl -X POST http://localhost:3000/api/engagements/qna \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"engagementId":"uuid","question":"Test question"}'

# Get questions
curl -X GET "http://localhost:3000/api/engagements/qna?engagementId=uuid" \
  -H "Authorization: Bearer {token}"
```

## Files Created

- `engagement-qna.entity.ts` - Database entities
- `engagement-qna.dto.ts` - Data transfer objects
- `engagement-qna.service.ts` - Business logic
- `engagement-qna.controller.ts` - API endpoints
- `engagement-qna.module.ts` - Module configuration
- `ENGAGEMENT_QNA_README.md` - This file

## Related Modules

- `engagement/` - Core engagement module
- `qna/` - Event/Speaker Q&A (reference implementation)
- `user/` - User authentication and management

