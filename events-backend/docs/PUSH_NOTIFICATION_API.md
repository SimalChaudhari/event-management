# Push Notification API Documentation for Mobile App

## Overview
This document describes how mobile apps should integrate with the push notification system for scheduled push notifications.

---

## 1. WebSocket Connection (Real-time Notifications)

### Connection Details
- **Namespace**: `/push-notifications`
- **URL**: `ws://your-backend-url/push-notifications` or `wss://your-backend-url/push-notifications` (for HTTPS)
- **Authentication**: JWT token required in connection handshake

### Connection Setup
```javascript
// Example connection (adjust for your mobile framework)
const socket = io('http://your-backend-url/push-notifications', {
  auth: {
    token: 'Bearer YOUR_JWT_TOKEN'  // JWT token from user login
  },
  transports: ['websocket', 'polling']
});
```

### Socket Events to Listen

#### 1. `connected` - Initial Connection Response
**Emitted when**: User successfully connects to socket
```json
{
  "userId": "user-uuid",
  "timestamp": "2024-01-30T12:00:00Z"
}
```

#### 2. `scheduled_push_notification:send` - New Notification Received
**Emitted when**: A new push notification is sent to the user
```json
{
  "userId": "user-uuid",
  "notificationId": "notification-uuid",
  "deliveryId": "delivery-uuid",
  "message": "Your notification message",
  "eventId": "event-uuid",
  "redirectType": "url|app_page|none",
  "redirectUrl": "https://example.com",
  "appPageRoute": "/surveys/:eventId",
  "scheduledAt": "2024-01-30T12:00:00Z",
  "sentAt": "2024-01-30T12:00:00Z",
  "status": "sent",
  "timestamp": "2024-01-30T12:00:00Z"
}
```

#### 3. `scheduled_push_notification:list` - Notification List Updated
**Emitted when**: User's notification list changes (after fetching via API)
```json
{
  "userId": "user-uuid",
  "notifications": [
    {
      "id": "delivery-uuid",
      "message": "Notification message",
      "status": "sent",
      "isRead": false,
      "deliveredAt": "2024-01-30T12:00:00Z",
      // ... other fields
    }
  ],
  "timestamp": "2024-01-30T12:00:00Z"
}
```

#### 4. `scheduled_push_notification:read` - Notification Marked as Read
**Emitted when**: A notification is marked as read
```json
{
  "userId": "user-uuid",
  "deliveryId": "delivery-uuid",
  "timestamp": "2024-01-30T12:00:00Z"
}
```

#### 5. `scheduled_push_notification:read_all` - All Notifications Marked as Read
**Emitted when**: All notifications are marked as read
```json
{
  "userId": "user-uuid",
  "timestamp": "2024-01-30T12:00:00Z"
}
```

#### 6. `scheduled_push_notification:delete` - Notification Deleted
**Emitted when**: A scheduled notification is deleted by admin
```json
{
  "userId": "user-uuid",
  "notificationId": "notification-uuid",
  "timestamp": "2024-01-30T12:00:00Z"
}
```

---

## 2. REST API Endpoints

### Base URL
```
http://your-backend-url/api/user/push-notifications
```

All endpoints require **JWT Authentication** in the header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Endpoints

#### 1. Get User Notifications
**GET** `/api/user/push-notifications`

**Query Parameters** (optional):
- `status`: Filter by status (`pending`, `sent`, `failed`)
- `isRead`: Filter by read status (`true`, `false`)

**Example Request**:
```
GET /api/user/push-notifications?status=sent&isRead=false
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "data": [
    {
      "id": "delivery-uuid",
      "message": "Your notification message",
      "sendToAllUsers": false,
      "eventId": "event-uuid",
      "eventName": "Event Name",
      "redirectType": "url|app_page|none",
      "redirectUrl": "https://example.com",
      "appPageRoute": "/surveys/event-uuid",
      "scheduledAt": "2024-01-30T12:00:00Z",
      "deliveredAt": "2024-01-30T12:00:00Z",
      "failedAt": null,
      "status": "sent",
      "isRead": false,
      "readAt": null,
      "createdAt": "2024-01-30T12:00:00Z",
      "updatedAt": "2024-01-30T12:00:00Z"
    }
  ]
}
```

**Note**: When user fetches notifications via this endpoint, all PENDING notifications are automatically marked as SENT.

---

#### 2. Mark Notification as Read
**PATCH** `/api/user/push-notifications/:deliveryId/read`

**Example Request**:
```
PATCH /api/user/push-notifications/delivery-uuid/read
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "message": "Notification marked as read",
  "success": true
}
```

**Socket Event**: After this API call, `scheduled_push_notification:read` event will be emitted.

---

#### 3. Mark All Notifications as Read
**PATCH** `/api/user/push-notifications/mark-all/read`

**Example Request**:
```
PATCH /api/user/push-notifications/mark-all/read
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response**:
```json
{
  "message": "All notifications marked as read",
  "success": true
}
```

**Socket Event**: After this API call, `scheduled_push_notification:read_all` event will be emitted.

---

## 3. Firebase Push Notification Integration

### Backend automatically sends Firebase push notifications when:
- A scheduled notification is sent
- User has active device tokens registered

### Firebase Push Notification Payload Structure
```json
{
  "notification": {
    "title": "Notification",
    "body": "Your notification message"
  },
  "data": {
    "type": "scheduled_push",
    "notificationId": "notification-uuid",
    "deliveryId": "delivery-uuid",
    "message": "Your notification message",
    "eventId": "event-uuid",
    "redirectType": "url|app_page|none",
    "redirectUrl": "https://example.com",
    "appPageRoute": "/surveys/event-uuid",
    "timestamp": "2024-01-30T12:00:00Z"
  }
}
```

### Mobile App Should:
1. Handle Firebase push notification when app is in background/closed
2. Extract `notificationId` and `deliveryId` from `data` payload
3. Handle redirect based on `redirectType`:
   - `url`: Open `redirectUrl` in browser
   - `app_page`: Navigate to `appPageRoute` (replace `:eventId` with actual eventId)
   - `none`: Just show notification

---

## 4. Complete Integration Flow

### Step 1: On App Launch
```javascript
// 1. Connect to WebSocket
const socket = connectToSocket(userJWT);

// 2. Listen for real-time notifications
socket.on('scheduled_push_notification:send', (data) => {
  // Show notification in app
  showNotification(data);
  // Handle redirect if needed
  handleRedirect(data);
});

// 3. Fetch existing notifications
const notifications = await fetchNotifications(userJWT);
displayNotifications(notifications);
```

### Step 2: Handle Notification Click
```javascript
// User clicks on notification
async function onNotificationClick(deliveryId) {
  // Mark as read
  await markAsRead(deliveryId);
  // Handle redirect
  handleRedirect(notificationData);
}
```

### Step 3: Handle Background Push Notification
```javascript
// Firebase push notification received (app in background)
function onBackgroundPushNotification(data) {
  const { notificationId, deliveryId, redirectType, redirectUrl, appPageRoute } = data;
  
  // When user opens app, fetch notification details
  // Or navigate based on redirectType
  if (redirectType === 'url') {
    openBrowser(redirectUrl);
  } else if (redirectType === 'app_page') {
    navigateToPage(appPageRoute);
  }
}
```

---

## 5. Redirect Handling Examples

### Redirect Type: `url`
```javascript
if (notification.redirectType === 'url' && notification.redirectUrl) {
  // Open external URL in browser
  openInBrowser(notification.redirectUrl);
}
```

### Redirect Type: `app_page`
```javascript
if (notification.redirectType === 'app_page' && notification.appPageRoute) {
  // Navigate within app
  // appPageRoute example: "/surveys/:eventId"
  // Replace :eventId with actual eventId from notification.eventId
  const route = notification.appPageRoute.replace(':eventId', notification.eventId);
  navigate(route);
}
```

### Redirect Type: `none`
```javascript
// Just show notification, no redirect
showNotification(notification.message);
```

---

## 6. Status Values

### Delivery Status
- `pending`: Notification created but not yet delivered
- `sent`: Notification successfully delivered
- `failed`: Notification delivery failed

### Redirect Type
- `url`: Redirect to external URL
- `app_page`: Navigate to app internal page
- `none`: No redirect

---

## 7. Important Notes

1. **JWT Token**: Always include JWT token in both WebSocket connection and REST API requests
2. **Auto Status Update**: When user fetches notifications via API, PENDING status automatically changes to SENT
3. **Dual Delivery**: Backend sends both Firebase push (if device token exists) AND socket notification (if user online)
4. **Socket Reconnection**: Mobile app should handle socket disconnection and reconnect automatically
5. **Error Handling**: Handle socket connection errors gracefully

---

## 8. Testing

Use the test page to verify socket connection:
```
http://your-backend-url/tools/push-notification-tester
```

Enter JWT token and connect to test real-time events.

---

## Support
For backend issues, contact backend team.
For integration questions, refer to this document first.

