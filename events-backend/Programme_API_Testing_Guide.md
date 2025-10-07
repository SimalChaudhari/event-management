# Programme Management API - Postman Testing Guide

## 🚀 Quick Setup

### 1. Import Collection
Import the `Programme_API_Postman_Collection.json` file into Postman.

### 2. Set Environment Variables
Create a new environment in Postman with these variables:

```json
{
  "base_url": "http://localhost:5000",
  "admin_token": "",
  "user_token": "",
  "event_id": "",
  "track_id": "",
  "session_id": "",
  "speaker_id_1": "",
  "speaker_id_2": "",
  "speaker_id_3": ""
}
```

## 📋 Testing Workflow

### Step 1: Authentication
1. **Admin Login** - Get admin token
2. **User Login** - Get user token (optional)

### Step 2: Create Sample Data
1. **Create Track** - Create a technical track
2. **Create Session** - Add sessions to the track
3. **Create Multiple Tracks** - Add business and workshop tracks

### Step 3: Test CRUD Operations
1. **Read Operations** - Get tracks, sessions, programme
2. **Update Operations** - Modify tracks and sessions
3. **Delete Operations** - Remove sessions and tracks

## 📊 Sample Data Examples

### Track Creation Examples

#### Technical Track
```json
{
  "title": "Technical Track",
  "description": "Technical sessions and workshops covering latest technologies",
  "order": 1,
  "isActive": true
}
```

#### Business Track
```json
{
  "title": "Business Track",
  "description": "Business-focused sessions on strategy, management, and entrepreneurship",
  "order": 2,
  "isActive": true
}
```

#### Workshop Track
```json
{
  "title": "Workshop Track",
  "description": "Hands-on workshops and practical sessions",
  "order": 3,
  "isActive": true
}
```

### Session Creation Examples

#### AI Session
```json
{
  "trackId": "{{track_id}}",
  "title": "Introduction to Artificial Intelligence",
  "description": "Learn the fundamentals of AI, machine learning, and deep learning concepts",
  "sessionDate": "2024-02-15",
  "startTime": "09:00",
  "endTime": "10:30",
  "venue": "Main Conference Hall",
  "order": 1,
  "isActive": true,
  "speakerIds": ["{{speaker_id_1}}", "{{speaker_id_2}}"]
}
```

#### Machine Learning Workshop
```json
{
  "trackId": "{{track_id}}",
  "title": "Machine Learning Workshop",
  "description": "Hands-on workshop on building ML models from scratch",
  "sessionDate": "2024-02-16",
  "startTime": "09:00",
  "endTime": "12:00",
  "venue": "Workshop Room 1",
  "order": 1,
  "isActive": true,
  "speakerIds": ["{{speaker_id_1}}", "{{speaker_id_2}}"]
}
```

#### Data Science Session
```json
{
  "trackId": "{{track_id}}",
  "title": "Data Science Fundamentals",
  "description": "Introduction to data science concepts and tools",
  "sessionDate": "2024-02-16",
  "startTime": "14:00",
  "endTime": "16:00",
  "venue": "Computer Lab A",
  "order": 2,
  "isActive": true,
  "speakerIds": ["{{speaker_id_2}}"]
}
```

#### Digital Marketing Session
```json
{
  "trackId": "{{track_id}}",
  "title": "Digital Marketing Strategies",
  "description": "Learn effective digital marketing strategies for modern businesses",
  "sessionDate": "2024-02-15",
  "startTime": "14:00",
  "endTime": "15:30",
  "venue": "Business Center",
  "order": 1,
  "isActive": true,
  "speakerIds": ["{{speaker_id_3}}"]
}
```

## 🔧 Testing Scenarios

### Scenario 1: Complete Programme Setup
1. Create 3 tracks (Technical, Business, Workshop)
2. Add 2-3 sessions to each track
3. Assign different speakers to sessions
4. Test different venues and time slots

### Scenario 2: Speaker Management
1. Create sessions with multiple speakers
2. Update sessions to change speakers
3. Remove speakers from sessions
4. Test with invalid speaker IDs

### Scenario 3: Time Management
1. Create sessions with different dates
2. Test overlapping time slots
3. Update session times
4. Test different time formats

### Scenario 4: Venue Management
1. Create sessions in different venues
2. Update venue information
3. Test venue field validation

## 📝 Expected Responses

### Successful Track Creation
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
    "sessions": []
  }
}
```

### Successful Session Creation
```json
{
  "success": true,
  "message": "Programme session created successfully",
  "data": {
    "id": "session-uuid",
    "trackId": "track-uuid",
    "title": "Introduction to AI",
    "description": "Learn AI fundamentals",
    "sessionDate": "2024-02-15T00:00:00.000Z",
    "startTime": "09:00",
    "endTime": "10:30",
    "venue": "Main Conference Hall",
    "order": 1,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "speakers": [
      {
        "id": "speaker-uuid",
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "profilePicture": "path/to/picture.jpg"
      }
    ]
  }
}
```

### Error Responses

#### Validation Error
```json
{
  "success": false,
  "message": "title should not be empty",
  "error": {
    "type": "BadRequest",
    "code": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/programme/sessions",
    "method": "POST"
  }
}
```

#### Unauthorized Error
```json
{
  "success": false,
  "message": "Token is required for authentication",
  "error": {
    "type": "Unauthorized",
    "code": 401,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/programme/events/event-id/tracks",
    "method": "POST"
  }
}
```

#### Forbidden Error
```json
{
  "success": false,
  "message": "You do not have the required role to access this resource",
  "error": {
    "type": "Forbidden",
    "code": 403,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/programme/tracks/track-id",
    "method": "PUT"
  }
}
```

## 🧪 Test Cases Checklist

### ✅ Authentication Tests
- [ ] Admin login returns valid token
- [ ] User login returns valid token
- [ ] Invalid credentials return 401
- [ ] Missing token returns 401

### ✅ Track Management Tests
- [ ] Create track with valid data
- [ ] Create track with missing title (should fail)
- [ ] Get tracks by event
- [ ] Update track title and description
- [ ] Delete track (should cascade delete sessions)
- [ ] Non-admin cannot create/update/delete tracks

### ✅ Session Management Tests
- [ ] Create session with valid data
- [ ] Create session with invalid track ID (should fail)
- [ ] Create session with invalid speaker IDs (should fail)
- [ ] Get sessions by track
- [ ] Get sessions by event
- [ ] Update session details
- [ ] Update session speakers
- [ ] Delete session
- [ ] Non-admin cannot create/update/delete sessions

### ✅ Integration Tests
- [ ] Get complete event programme
- [ ] Create track via event endpoint
- [ ] Create session via event endpoint
- [ ] Programme data includes all tracks and sessions
- [ ] Speaker information is properly populated

### ✅ Edge Cases
- [ ] Empty track title
- [ ] Invalid date format
- [ ] Invalid time format
- [ ] Non-existent speaker IDs
- [ ] Non-existent track ID
- [ ] Non-existent event ID
- [ ] Very long descriptions
- [ ] Special characters in titles

## 🔍 Debugging Tips

1. **Check Environment Variables**: Ensure all variables are set correctly
2. **Verify Tokens**: Make sure tokens are valid and not expired
3. **Check IDs**: Ensure event_id, track_id, and speaker_id variables are set
4. **Review Response**: Check error messages for specific validation issues
5. **Database State**: Verify data exists in database for foreign key references

## 📱 Mobile App Integration

For mobile app testing, use these endpoints:
- `GET /api/events/:eventId/programme` - Get complete programme
- `GET /api/programme/events/:eventId/tracks` - Get tracks only
- `GET /api/programme/events/:eventId/sessions` - Get all sessions

These endpoints provide optimized data for mobile consumption.
