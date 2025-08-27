# Event Registration API Usage Guide

## 🎯 **Overview**

The Event Registration API has **two different endpoints** with different requirements:

1. **Regular User Registration** (`POST /create`) - No `userId` needed
2. **Admin Registration** (`POST /admin/create`) - `userId` required

## 🚀 **API Endpoints**

### **1. Regular User Registration**
**Endpoint**: `POST /api/register-events/create`

**Authentication**: JWT Token required (user must be logged in)

**Request Body**:
```json
{
  "eventId": "event-uuid-123",
  "type": "Attendee",  // or "Exhibitor"
  "orderId": "order-uuid-456",  // optional
  "status": "Sucesss",  // optional, default
  "isRegister": true    // optional, default
}
```

**Key Points**:
- ✅ **No `userId` needed** - automatically taken from JWT token
- ✅ **User type auto-detected** - if user role is "Exhibitor", type automatically set to "Exhibitor"
- ✅ **Simple registration** - just specify event and type

**Example Usage**:
```bash
# User wants to register as attendee
POST /api/register-events/create
Authorization: Bearer <jwt-token>
{
  "eventId": "event-123",
  "type": "Attendee"
}

# User wants to register as exhibitor
POST /api/register-events/create
Authorization: Bearer <jwt-token>
{
  "eventId": "event-123",
  "type": "Exhibitor"
}
```

### **2. Admin Registration**
**Endpoint**: `POST /api/register-events/admin/create`

**Authentication**: JWT Token required (user must be admin)

**Request Body**:
```json
{
  "userId": "user-uuid-789",  // REQUIRED - admin specifies which user to register
  "eventId": "event-uuid-123",
  "type": "Attendee",  // or "Exhibitor"
  "orderId": "order-uuid-456",  // optional
  "status": "Sucesss",  // optional
  "isRegister": true    // optional
}
```

**Key Points**:
- ✅ **`userId` required** - admin must specify which user to register
- ✅ **Admin only** - only users with admin role can access this endpoint
- ✅ **Flexible registration** - can register any user for any event

**Example Usage**:
```bash
# Admin registering another user
POST /api/register-events/admin/create
Authorization: Bearer <admin-jwt-token>
{
  "userId": "user-789",
  "eventId": "event-123",
  "type": "Attendee"
}
```

## 🔐 **Authentication & Authorization**

### **Regular Users**
- **JWT Token**: Required (contains user ID)
- **Role**: Any role (Attendee, Exhibitor, Speaker, Admin)
- **Access**: Can only register themselves

### **Admin Users**
- **JWT Token**: Required (contains admin user ID)
- **Role**: Must be "admin"
- **Access**: Can register any user for any event

## 📱 **Frontend Implementation**

### **Regular User Registration Form**
```javascript
// No need to ask for userId - comes from token
const registrationData = {
  eventId: selectedEvent.id,
  type: userType, // "Attendee" or "Exhibitor"
  orderId: orderId // if available
};

// Send request
const response = await fetch('/api/register-events/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(registrationData)
});
```

### **Admin Registration Form**
```javascript
// Admin must specify userId
const adminRegistrationData = {
  userId: selectedUser.id, // REQUIRED
  eventId: selectedEvent.id,
  type: userType,
  orderId: orderId // if available
};

// Send request
const response = await fetch('/api/register-events/admin/create', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminJwtToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(adminRegistrationData)
});
```

## 🎯 **Business Logic**

### **User Type Auto-Detection**
```typescript
// If user role is "Exhibitor", automatically set type to "Exhibitor"
if (user.role === UserRole.Exhibitor) {
  finalType = Type.Exhibitor;
}
```

### **Duplicate Registration Handling**
- **Same type**: Error - "User already registered for this event"
- **Different type**: Auto-update to new type (e.g., Attendee → Exhibitor)

## 🔍 **Error Handling**

### **Common Errors**
1. **Missing Event**: "Event not found"
2. **Missing User**: "User not found" (admin endpoint)
3. **Duplicate Registration**: "User already registered for this event"
4. **Unauthorized**: "Only admin can create registrations for other users"
5. **Missing userId**: "userId is required for admin registration" (admin endpoint)

### **Success Responses**
```json
{
  "success": true,
  "message": "Event registration created successfully",
  "data": {
    "id": "registration-uuid",
    "userId": "user-uuid",
    "eventId": "event-uuid",
    "type": "Attendee",
    "isCreatedByAdmin": false,
    "isRegister": true
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## 📋 **Summary**

| Endpoint | User Type | userId Required | Authentication |
|----------|-----------|----------------|----------------|
| `/create` | Regular Users | ❌ No | JWT Token |
| `/admin/create` | Admin Only | ✅ Yes | Admin JWT Token |

**Key Benefits**:
- ✅ **Clean API**: Regular users don't need to pass userId
- ✅ **Secure**: User ID comes from authenticated token
- ✅ **Flexible**: Admin can register any user
- ✅ **Auto-detection**: User type automatically set based on role
- ✅ **Validation**: Proper error handling for all scenarios
