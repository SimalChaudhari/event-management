# Programme Integration with Event Listing - Test Response

## Updated Event Listing API Response Structure

When you call `GET /api/events`, the response will now include programme data for each event:

```json
{
  "success": true,
  "message": "Events retrieved successfully",
  "data": [
    {
      "id": "event-uuid",
      "name": "Tech Conference 2024",
      "description": "Annual technology conference",
      "startDate": "2024-02-15T00:00:00.000Z",
      "endDate": "2024-02-17T00:00:00.000Z",
      "startTime": "09:00",
      "endTime": "18:00",
      "venue": "Convention Center",
      "location": "San Francisco, CA",
      "type": "Conference",
      "price": 299.99,
      "currency": "USD",
      "images": ["image1.jpg", "image2.jpg"],
      "tabVisibility": {
        "speakers": true,
        "documents": true,
        "floorplan": true,
        "gallery": true,
        "stamps": true,
        "survey": true,
        "exhibitors": true,
        "categories": true,
        "agenda": true,
        "adminInfo": true,
        "programme": true
      },
      "programmeTracks": [
        {
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
          ]
        }
      ],
      "speakers": [...],
      "exhibitors": [...],
      "galleries": [...],
      "surveys": [...],
      "categories": [...]
    }
  ],
  "metadata": {
    "total": 1,
    "page": 1,
    "limit": 10,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Key Features Added:

### 1. **Programme Data in Event Listing**
- ✅ Programme tracks are now loaded with each event
- ✅ Sessions within tracks are included
- ✅ Speakers tagged to sessions are included
- ✅ All programme data respects tab visibility settings

### 2. **Search Integration**
- ✅ Global search now includes programme track titles and descriptions
- ✅ Session titles, descriptions, venues, and times are searchable
- ✅ Speaker names in programme sessions are searchable
- ✅ Search highlighting works for programme content

### 3. **Tab Visibility Control**
- ✅ Added `programme` tab visibility option
- ✅ Non-admin users can have programme data hidden if `programme: false`
- ✅ Admin users always see full programme data

### 4. **Database Relations**
- ✅ `Event` entity has `OneToMany` relationship with `ProgrammeTrack`
- ✅ `ProgrammeTrack` has `OneToMany` relationship with `ProgrammeSession`
- ✅ `ProgrammeSession` has `ManyToMany` relationship with `UserEntity` (speakers)

## Testing the Integration:

1. **Create an event with programme tracks and sessions**
2. **Call `GET /api/events`** - you should see programme data in the response
3. **Test tab visibility** - set `programme: false` in tabVisibility and verify programme data is hidden for non-admin users
4. **Test search** - search for programme track titles, session titles, or speaker names and verify they appear in results

## API Endpoints Available:

- `GET /api/events` - Event listing with programme data
- `GET /api/events/:id/programme` - Get programme for specific event
- `POST /api/programme/events/:eventId/tracks` - Create programme track
- `POST /api/programme/sessions` - Create programme session
- And all other programme management endpoints...

The programme data is now fully integrated into the event listing system! 🎉
