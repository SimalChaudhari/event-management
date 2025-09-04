# Contact Info Module

This module provides CRUD operations for managing contact information and storing scanned user contacts from QR code scanning.

## Features

- **CRUD Operations**: Create, read, update, and delete contact information
- **Store Scanned Contacts**: Save user information from QR code scanning
- **Sync to Phone**: Sync contacts to phone with confirmation
- **Contact List Management**: View and manage all stored contacts
- **Event-based Organization**: Organize contacts by events

## API Endpoints

### 1. Create Contact Info
```
POST /contact-info
```
**Body:**
```json
{
  "eventId": "uuid",
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "phone": "string (optional)",
  "location": "string (optional)",
  "companyName": "string (optional)",
  "position": "string (optional)",
  "notes": "string (optional)"
}
```

### 2. Store Scanned Contact
```
POST /contact-info/store-scanned
```
**Body:**
```json
{
  "scannedUserId": "uuid",
  "eventId": "uuid",
  "location": "string (optional)",
  "notes": "string (optional)",
  "autoSyncToPhone": "boolean (optional)"
}
```

### 3. Get All Contacts
```
GET /contact-info?eventId=uuid&page=1&limit=10
```
**Query Parameters:**
- `eventId` (optional): Filter by event
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

### 4. Get Contact by ID
```
GET /contact-info/:id
```

### 5. Update Contact
```
PUT /contact-info/:id
```
**Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)",
  "email": "string (optional)",
  "phone": "string (optional)",
  "location": "string (optional)",
  "companyName": "string (optional)",
  "position": "string (optional)",
  "notes": "string (optional)",
  "isActive": "boolean (optional)"
}
```

### 6. Delete Contact
```
DELETE /contact-info/:id
```

### 7. Sync Contacts to Phone
```
POST /contact-info/sync-to-phone
```
**Body:**
```json
{
  "contactId": "uuid (optional)",
  "eventId": "uuid (optional)"
}
```

## Response Format

All endpoints return responses in the following format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z",
    "page": 1,
    "limit": 10
  }
}
```

## Contact Information Fields

- `id`: Unique identifier
- `firstName`: Contact's first name
- `lastName`: Contact's last name
- `email`: Contact's email address
- `phone`: Contact's phone number
- `location`: Location where contact was made
- `companyName`: Contact's company name
- `position`: Contact's position/title
- `notes`: Additional notes
- `isActive`: Whether contact is active
- `isSyncedToPhone`: Whether contact is synced to phone
- `syncedAt`: Timestamp when synced to phone
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Authentication

All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The module includes comprehensive error handling for:
- Authentication errors
- Validation errors
- Database errors
- Not found errors
- Conflict errors (duplicate contacts)

## Usage Examples

### Store a scanned contact
```javascript
const response = await fetch('/contact-info/store-scanned', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    scannedUserId: 'user-uuid',
    eventId: 'event-uuid',
    location: 'Conference Hall A',
    notes: 'Met at networking session',
    autoSyncToPhone: true
  })
});
```

### Get all contacts for an event
```javascript
const response = await fetch('/contact-info?eventId=event-uuid&page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});
```

### Sync all contacts to phone
```javascript
const response = await fetch('/contact-info/sync-to-phone', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({})
});
```
