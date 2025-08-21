# User Management & Role Switching

## Overview
This module handles user management and role switching functionality. The role switching process has been simplified to a single endpoint that handles all role changes directly.

## Role Switching Process

### Single Endpoint for Role Switching
**Endpoint:** `POST /api/users/role-switch`

**Smart Verification Logic:**
- **When switching TO exhibitor role**: Booth code verification is required
- **When switching FROM exhibitor role**: No verification needed, direct switch
- **When switching between other roles**: No verification needed

**Request Body:**
```json
{
  "newRole": "exhibitor",
  "boothCode": "EB123456789ABC"  // Required only for exhibitor role
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role switched successfully",
  "data": {
    "id": "user-id",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "role": "exhibitor"
  }
}
```

## Benefits of New Approach

### ✅ **Ultra-Simplified Process**
- Single endpoint handles all role changes
- No pending states or email notifications
- Direct role switching with smart verification

### ✅ **Smart Security**
- Booth code verification only when needed (switching TO exhibitor)
- No unnecessary verification for other role changes
- Uses existing event booth table for verification

### ✅ **Better User Experience**
- Immediate role changes without waiting
- No need to check emails or remember pending requests
- Simple one-step process

### ✅ **Efficient Maintenance**
- Single method instead of multiple endpoints
- No database fields for pending states
- Cleaner, more maintainable code

## Smart Verification Logic

The system automatically determines when verification is needed:

### **Exhibitor Role Switch (Requires Booth Code)**
```typescript
// User switching TO exhibitor role
const response = await fetch('/api/users/role-switch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    newRole: 'exhibitor',
    boothCode: 'EB123456789ABC'  // Required!
  })
});
```

### **User Role Switch (No Verification Needed)**
```typescript
// Exhibitor switching TO user role
const response = await fetch('/api/users/role-switch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    newRole: 'user'
    // No booth code needed
  })
});
```

## 🔒 **Smart Booth Code Security Feature**

### **Booth Code Protection:**
- **One User Per Code**: Each booth code can only be used by **one specific user**
- **Reusable by Owner**: Same user can reuse their booth code multiple times
- **Prevents Cross-User Abuse**: Other users cannot use codes that belong to someone else
- **Smart Reactivation**: Codes become reusable when user switches back to user role

### **How It Works:**
1. **First Use**: User uses booth code → Code marked as `usedBy: userId` and `isActive: false`
2. **Other Users**: Try same code → Get error "code already used by another user"
3. **Same User Switches Back**: From exhibitor to user role → Code reactivated (`isActive: true`)
4. **Same User Reuses**: Can use their own code again → Code becomes inactive again

### **Database Changes:**
- **`usedBy`**: Stores the user ID who used the code
- **`usedAt`**: Timestamp when the code was used
- **`isActive`**: Set to `false` after code is used, `true` when reactivated

### **Smart Reactivation Logic:**
- **When switching TO exhibitor**: Booth code becomes inactive (`isActive: false`)
- **When switching FROM exhibitor to user**: Booth code reactivates (`isActive: true`)
- **Same user can reuse**: Their own booth code multiple times
- **Other users cannot use**: Codes that belong to someone else

## Error Handling

- **Missing Booth Code**: Returns error when switching TO exhibitor role without booth code
- **Invalid Booth Code**: Returns error if booth code doesn't exist or is inactive
- **Booth Ownership Mismatch**: Returns error if booth code doesn't belong to user's email
- **Already in Role**: Returns error if user is already in the requested role

## Usage Examples

### **Switch to Exhibitor Role**
```typescript
const response = await fetch('/api/users/role-switch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    newRole: 'exhibitor',
    boothCode: 'EB123456789ABC'
  })
});
```

### **Switch to User Role**
```typescript
const response = await fetch('/api/users/role-switch', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ 
    newRole: 'user'
  })
});
```

## Security Considerations

- All endpoints require JWT authentication
- Booth code verification ensures only legitimate users can switch roles
- Email verification maintains user identity confirmation
- Role switching is limited to valid user roles defined in the system
