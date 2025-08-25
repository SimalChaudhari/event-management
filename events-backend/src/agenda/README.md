# Event Agenda Feature

This module provides CRUD operations for managing event agendas with the following fields:

## Fields

- **exhibitorId**: UUID of the exhibitor responsible for the agenda item
- **title**: Title/name of the agenda item
- **time**: Start time in HH:MM format (24-hour)
- **duration**: Duration in minutes (1-1440)
- **location**: Optional location for the agenda item
- **details**: Optional detailed description
- **category**: Agenda category (Brainstorm, Discussion, Presentation, Workshop, Networking, Break, QnA, Panel, Demo, Other)
- **orderIndex**: Order of the agenda item (auto-assigned if not provided)
- **isActive**: Whether the agenda item is active

## API Endpoints

### Create Agenda Item
```
POST /api/agendas/create
Authorization: Bearer <JWT_TOKEN>
Role: Admin

Body:
{
  "eventId": "uuid",
  "exhibitorId": "uuid",
  "title": "Opening Session",
  "time": "09:00",
  "duration": 60,
  "location": "Main Hall",
  "details": "Welcome and introduction to the event",
  "category": "Presentation"
}
```

### Get All Agendas
```
GET /api/agendas?eventId=uuid&exhibitorId=uuid
Authorization: Bearer <JWT_TOKEN>
```

### Get Agenda by ID
```
GET /api/agendas/:id
Authorization: Bearer <JWT_TOKEN>
```

### Update Agenda
```
PUT /api/agendas/update/:id
Authorization: Bearer <JWT_TOKEN>
Role: Admin

Body:
{
  "title": "Updated Title",
  "time": "10:00",
  "duration": 90
}
```

### Delete Agenda
```
DELETE /api/agendas/delete/:id
Authorization: Bearer <JWT_TOKEN>
Role: Admin
```

### Reorder Agendas
```
POST /api/agendas/reorder/:eventId
Authorization: Bearer <JWT_TOKEN>
Role: Admin

Body:
{
  "agendaIds": ["uuid1", "uuid2", "uuid3"]
}
```

### Get Agendas by Category
```
GET /api/agendas/category/:eventId/:category
Authorization: Bearer <JWT_TOKEN>
```

### Get Event Agendas
```
GET /api/agendas/event/:eventId
Authorization: Bearer <JWT_TOKEN>
```

### Get Event Agendas (from Event Controller)
```
GET /api/events/:id/agendas
Authorization: Bearer <JWT_TOKEN>
```

## Features

- **Time Conflict Detection**: Prevents overlapping agenda items within the same event
- **Auto-ordering**: Automatically assigns order index if not provided
- **Soft Delete**: Agenda items are marked as inactive rather than permanently deleted
- **Category Filtering**: Filter agendas by category (Brainstorm, Discussion, etc.)
- **Exhibitor Integration**: Links agenda items to specific exhibitors
- **Event Integration**: Seamlessly integrates with the existing event system

## Database Schema

The agenda items are stored in the `event_agendas` table with proper foreign key relationships to:
- `events` table (eventId)
- `exhibitors` table (exhibitorId)

## Validation Rules

- Time format must be HH:MM (24-hour)
- Duration must be between 1-1440 minutes (1 minute to 24 hours)
- All required fields must be provided for creation
- Time conflicts are automatically detected and prevented
- UUIDs must be valid for eventId and exhibitorId

## Error Handling

The service includes comprehensive error handling for:
- Resource not found
- Validation errors
- Time conflicts
- Database errors
- Authorization errors
