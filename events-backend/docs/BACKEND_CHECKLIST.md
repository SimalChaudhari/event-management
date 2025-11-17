# Backend Checklist for Push Notifications

## ✅ What's Already Done (You don't need to do anything)

### 1. WebSocket Gateway ✅
- ✅ Socket.io namespace `/push-notifications` configured
- ✅ JWT authentication for socket connections
- ✅ User room management (`user:${userId}`)
- ✅ All socket events emitting correctly

### 2. REST API Endpoints ✅
- ✅ `GET /api/user/push-notifications` - Get user notifications
- ✅ `PATCH /api/user/push-notifications/:deliveryId/read` - Mark as read
- ✅ `PATCH /api/user/push-notifications/mark-all/read` - Mark all as read

### 3. Automatic Features ✅
- ✅ Firebase push notification sending (when device token exists)
- ✅ Socket notification sending (when user online)
- ✅ PENDING → SENT auto-update when user fetches notifications
- ✅ Cleanup cron job (daily at 2 AM) to remove old records

---

## 📋 What You Need to Verify

### 1. Environment Variables
Make sure these are set in your `.env` file:

```env
# JWT Secret (required for socket/auth)
JWT_SECRET=your-secret-key

# Optional: Retention days for cleanup
PUSH_NOTIFICATION_READ_RETENTION_DAYS=30
PUSH_NOTIFICATION_UNREAD_RETENTION_DAYS=90

# Firebase Configuration (if using Firebase push)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 2. Firebase Configuration
Verify Firebase is configured for push notifications:
- ✅ Firebase Admin SDK initialized
- ✅ Firebase credentials in environment variables
- ✅ `FirebaseUtil.sendPushNotification()` working

### 3. Socket.io Configuration
Verify in `main.ts` or your app module:
- ✅ Socket.io adapter configured
- ✅ CORS enabled for mobile apps
- ✅ Port is accessible

### 4. Device Token Registration
Make sure mobile app can register device tokens:
- ✅ API endpoint exists to save device tokens
- ✅ Device tokens saved to `PushNotification` entity
- ✅ `isActive` flag set correctly

---

## 🧪 Testing Checklist

### Test 1: Socket Connection
```bash
# Use the test page
http://your-backend-url/tools/push-notification-tester
```
- ✅ Enter user JWT token
- ✅ Click Connect
- ✅ Should see "Connected" status

### Test 2: Send Notification (Admin Panel)
1. Create scheduled notification via admin panel
2. Send notification immediately
3. Check:
   - ✅ Firebase push sent (if device token exists)
   - ✅ Socket event emitted (if user online)
   - ✅ Delivery record created in database

### Test 3: API Endpoints
```bash
# Get notifications
curl -X GET http://your-backend-url/api/user/push-notifications \
  -H "Authorization: Bearer USER_JWT_TOKEN"

# Mark as read
curl -X PATCH http://your-backend-url/api/user/push-notifications/DELIVERY_ID/read \
  -H "Authorization: Bearer USER_JWT_TOKEN"
```

---

## 📱 What to Share with Mobile Developer

Share these files:
1. ✅ `docs/PUSH_NOTIFICATION_API.md` - Complete API documentation
2. ✅ Backend URL and port
3. ✅ Socket namespace: `/push-notifications`
4. ✅ REST API base: `/api/user/push-notifications`

### Quick Summary for Mobile Developer:
```
Socket Connection:
- URL: ws://your-backend/push-notifications
- Auth: JWT token in handshake
- Namespace: /push-notifications

REST API:
- Base: /api/user/push-notifications
- Auth: Bearer JWT token in header

Events to Listen:
- scheduled_push_notification:send
- scheduled_push_notification:read
- scheduled_push_notification:read_all
- scheduled_push_notification:delete
- connected
```

---

## 🔍 Debugging Tips

### If socket not connecting:
1. Check JWT token is valid
2. Check CORS settings
3. Check namespace matches exactly: `/push-notifications`

### If notifications not sending:
1. Check Firebase credentials
2. Check device tokens exist in database
3. Check logs for errors

### If PENDING not updating:
1. Verify `getUserNotifications` is called
2. Check database for delivery records
3. Check logs for update messages

---

## 📊 Database Tables

Make sure these tables exist:
- ✅ `scheduled_push_notifications` - Notification templates
- ✅ `scheduled_push_notification_deliveries` - Delivery records per user

---

## ✅ Final Checklist

- [ ] Environment variables set
- [ ] Firebase configured
- [ ] Socket connection tested
- [ ] API endpoints tested
- [ ] Documentation shared with mobile developer
- [ ] Cleanup cron job enabled
- [ ] Logs monitoring set up

---

## 🎯 That's It!

Once the above is verified, your backend is ready. The mobile developer will:
- Connect to socket
- Listen for events
- Call REST APIs
- Handle Firebase push notifications on their side

You just need to ensure backend is running and accessible!

