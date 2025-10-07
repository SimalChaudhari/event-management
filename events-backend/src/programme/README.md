# Programme Management System

## Overview

The Programme Management System allows admins to create and manage structured event programmes with tracks and sessions. Each event can have multiple tracks, and each track can contain multiple sessions with detailed information including speakers, timing, and venue details.

## Database Schema

### ProgrammeTrack Entity
- **id**: UUID primary key
- **eventId**: Foreign key to Event
- **title**: Track title (required)
- **description**: Optional track description
- **order**: Ordering number for track display
- **isActive**: Boolean flag for track status
- **createdAt/updatedAt**: Timestamps

### ProgrammeSession Entity
- **id**: UUID primary key
- **trackId**: Foreign key to ProgrammeTrack
- **title**: Session title (required)
- **description**: Optional session description
- **sessionDate**: Date of the session
- **startTime**: Session start time
- **endTime**: Session end time
- **venue**: Optional venue information
- **order**: Ordering number within track
- **isActive**: Boolean flag for session status
- **speakers**: Many-to-many relationship with UserEntity (speakers)

## API Endpoints

### Track Management

#### Create Track
```
POST /api/programme/events/:eventId/tracks
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Technical Track",
  "description": "Technical sessions and workshops",
  "order": 1,
  "isActive": true
}
```

#### Get Tracks by Event
```
GET /api/programme/events/:eventId/tracks
Authorization: Bearer <token>
```

#### Update Track
```
PUT /api/programme/tracks/:trackId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Track Title",
  "description": "Updated description"
}
```

#### Delete Track
```
DELETE /api/programme/tracks/:trackId
Authorization: Bearer <admin_token>
```

### Session Management

#### Create Session
```
POST /api/programme/sessions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "trackId": "track-uuid",
  "title": "Introduction to AI",
  "description": "Learn the basics of artificial intelligence",
  "sessionDate": "2024-01-15",
  "startTime": "09:00",
  "endTime": "10:30",
  "venue": "Main Hall",
  "order": 1,
  "isActive": true,
  "speakerIds": ["speaker-uuid-1", "speaker-uuid-2"]
}
```

#### Get Sessions by Track
```
GET /api/programme/tracks/:trackId/sessions
Authorization: Bearer <token>
```

#### Get Sessions by Event
```
GET /api/programme/events/:eventId/sessions
Authorization: Bearer <token>
```

#### Update Session
```
PUT /api/programme/sessions/:sessionId
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Updated Session Title",
  "description": "Updated description",
  "sessionDate": "2024-01-16",
  "startTime": "10:00",
  "endTime": "11:30",
  "venue": "Conference Room A",
  "speakerIds": ["speaker-uuid-3"]
}
```

#### Delete Session
```
DELETE /api/programme/sessions/:sessionId
Authorization: Bearer <admin_token>
```

### Event-Specific Endpoints

#### Get Event Programme
```
GET /api/events/:eventId/programme
Authorization: Bearer <token>
```

#### Create Track (via Event endpoint)
```
POST /api/events/:eventId/programme/tracks
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Business Track",
  "description": "Business-focused sessions"
}
```

#### Create Session (via Event endpoint)
```
POST /api/events/:eventId/programme/sessions
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "trackId": "track-uuid",
  "title": "Market Analysis",
  "sessionDate": "2024-01-15",
  "startTime": "14:00",
  "endTime": "15:30",
  "venue": "Business Center"
}
```

## Response Format

### Track Response
```json
{
  "success": true,
  "message": "Programme track created successfully",
  "data": {
    "id": "track-uuid",
    "eventId": "event-uuid",
    "title": "Technical Track",
    "description": "Technical sessions and workshops",
    "order": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "sessions": [
      {
        "id": "session-uuid",
        "trackId": "track-uuid",
        "title": "Introduction to AI",
        "description": "Learn the basics of artificial intelligence",
        "sessionDate": "2024-01-15T00:00:00.000Z",
        "startTime": "09:00",
        "endTime": "10:30",
        "venue": "Main Hall",
        "order": 1,
        "isActive": true,
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-01T00:00:00.000Z",
        "speakers": [
          {
            "id": "speaker-uuid",
            "firstName": "John",
            "lastName": "Doe",
            "name": "John Doe",
            "email": "john.doe@example.com",
            "position": "Senior Developer",
            "companyName": "Tech Corp",
            "description": "Expert in AI and Machine Learning",
            "location": "San Francisco, CA",
            "profilePicture": "path/to/picture.jpg",
            "speakingStartTime": "09:00",
            "speakingEndTime": "10:30"
          }
        ]
      }
    ]
  }
}
```

### Session Response
```json
{
  "success": true,
  "message": "Programme session created successfully",
  "data": {
    "id": "session-uuid",
    "trackId": "track-uuid",
    "title": "Introduction to AI",
    "description": "Learn the basics of artificial intelligence",
    "sessionDate": "2024-01-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "10:30",
    "venue": "Main Hall",
    "order": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "speakers": [
      {
        "id": "speaker-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "name": "John Doe",
        "email": "john.doe@example.com",
        "position": "Senior Developer",
        "companyName": "Tech Corp",
        "description": "Expert in AI and Machine Learning",
        "location": "San Francisco, CA",
        "profilePicture": "path/to/picture.jpg",
        "speakingStartTime": "09:00",
        "speakingEndTime": "10:30"
      }
    ]
  }
}
```

## Features

### Admin Capabilities
- ✅ Create new tracks and change track titles
- ✅ Add new sessions under tracks and change session titles
- ✅ Edit session details:
  - Date and time
  - Venue
  - Description
  - Tag speakers
- ✅ Order tracks and sessions
- ✅ Activate/deactivate tracks and sessions
- ✅ Delete tracks and sessions (with cascade)

### User Capabilities
- ✅ View event programme structure
- ✅ See all tracks and sessions
- ✅ View speaker information for each session
- ✅ Access session details (date, time, venue, description)

## Error Handling

The system includes comprehensive error handling:

- **404 Not Found**: When track/session/event doesn't exist
- **400 Bad Request**: When validation fails or speakers not found
- **401 Unauthorized**: When user is not authenticated
- **403 Forbidden**: When user doesn't have admin role for write operations

## Validation Rules

### Track Validation
- `title`: Required, 1-255 characters
- `description`: Optional, text
- `order`: Optional, number
- `isActive`: Optional, boolean

### Session Validation
- `trackId`: Required, valid UUID
- `title`: Required, 1-255 characters
- `description`: Optional, text
- `sessionDate`: Required, valid date string
- `startTime`: Required, time string
- `endTime`: Required, time string
- `venue`: Optional, max 255 characters
- `order`: Optional, number
- `isActive`: Optional, boolean
- `speakerIds`: Optional, array of valid UUIDs

## Database Relationships

```
Event (1) ──→ (N) ProgrammeTrack
ProgrammeTrack (1) ──→ (N) ProgrammeSession
ProgrammeSession (N) ──→ (N) UserEntity (speakers)
```

## Security

- All endpoints require JWT authentication
- Write operations (create, update, delete) require admin role
- Read operations are available to all authenticated users
- Input validation prevents SQL injection and malformed data
- Foreign key constraints ensure data integrity
