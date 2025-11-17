# How Push Notifications Work on Mobile Side

## Complete Flow Overview

```
1. App Launch → Register Device Token → Connect Socket → Listen for Events
2. Notification Sent → Firebase Push (Background) OR Socket (Foreground) → User Receives
3. User Opens Notification → Mark as Read → Navigate/Handle Redirect
```

---

## Step-by-Step: How It Works on Mobile

### **Step 1: App Installation & Initial Setup**

#### 1.1 Request Firebase Push Notification Permission
```javascript
// React Native Example
import messaging from '@react-native-firebase/messaging';

async function requestPermission() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Push notification permission granted');
  }
}
```

#### 1.2 Get Firebase Device Token
```javascript
async function getDeviceToken() {
  const token = await messaging().getToken();
  console.log('Device Token:', token);
  
  // Send this token to your backend
  await registerDeviceToken(token);
  return token;
}
```

#### 1.3 Register Device Token with Backend
```javascript
async function registerDeviceToken(deviceToken) {
  const userToken = await getUserJWT(); // Get JWT from login
  
  await fetch('http://your-backend/api/settings/register-device-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceToken: deviceToken,
      platform: Platform.OS, // 'ios' or 'android'
      isActive: true
    })
  });
}
```

---

### **Step 2: App Launch - Connect Everything**

#### 2.1 Connect to WebSocket
```javascript
import io from 'socket.io-client';

let socket;

async function connectToPushNotificationSocket() {
  const userToken = await getUserJWT();
  
  socket = io('http://your-backend/push-notifications', {
    auth: {
      token: `Bearer ${userToken}`
    },
    transports: ['websocket', 'polling']
  });

  // Listen for connection
  socket.on('connect', () => {
    console.log('Connected to push notification socket');
  });

  // Listen for new notifications (when app is OPEN)
  socket.on('scheduled_push_notification:send', (data) => {
    console.log('New notification received:', data);
    handleNotificationReceived(data);
  });

  // Listen for notification marked as read
  socket.on('scheduled_push_notification:read', (data) => {
    console.log('Notification marked as read:', data.deliveryId);
    updateNotificationUI(data.deliveryId);
  });

  // Listen for all notifications marked as read
  socket.on('scheduled_push_notification:read_all', () => {
    console.log('All notifications marked as read');
    updateAllNotificationsUI();
  });

  // Listen for notification deleted
  socket.on('scheduled_push_notification:delete', (data) => {
    console.log('Notification deleted:', data.notificationId);
    removeNotificationFromUI(data.notificationId);
  });
}
```

#### 2.2 Fetch Existing Notifications
```javascript
async function loadNotifications() {
  const userToken = await getUserJWT();
  
  const response = await fetch(
    'http://your-backend/api/user/push-notifications',
    {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }
  );
  
  const data = await response.json();
  displayNotifications(data.data); // Show in notification list
}
```

---

### **Step 3: Handle Notifications (App in Background/Closed)**

#### 3.1 Setup Firebase Background Message Handler
```javascript
// React Native Example
messaging().setBackgroundMessageHandler(async remoteMessage => {
  console.log('Background notification:', remoteMessage);
  
  const notificationData = remoteMessage.data;
  
  // Extract notification info
  const {
    notificationId,
    deliveryId,
    message,
    redirectType,
    redirectUrl,
    appPageRoute,
    eventId
  } = notificationData;
  
  // When user taps notification, app will open
  // Handle in onNotificationOpenedApp (below)
});
```

#### 3.2 Handle Notification Tap (App Closed)
```javascript
// When app is closed and user taps notification
messaging().getInitialNotification().then(remoteMessage => {
  if (remoteMessage) {
    console.log('Notification opened app from closed state:', remoteMessage);
    handleNotificationTap(remoteMessage.data);
  }
});
```

#### 3.3 Handle Notification Tap (App in Background)
```javascript
// When app is in background and user taps notification
messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('Notification opened app from background:', remoteMessage);
  handleNotificationTap(remoteMessage.data);
});
```

#### 3.4 Handle Notification Tap Function
```javascript
async function handleNotificationTap(data) {
  const { deliveryId, redirectType, redirectUrl, appPageRoute, eventId } = data;
  
  // Mark notification as read
  if (deliveryId) {
    await markNotificationAsRead(deliveryId);
  }
  
  // Handle redirect based on type
  if (redirectType === 'url' && redirectUrl) {
    // Open external URL
    Linking.openURL(redirectUrl);
  } else if (redirectType === 'app_page' && appPageRoute) {
    // Navigate within app
    const route = appPageRoute.replace(':eventId', eventId || '');
    NavigationService.navigate(route); // Use your navigation method
  } else {
    // No redirect, just show notification
    // Maybe navigate to notifications list
    NavigationService.navigate('Notifications');
  }
}
```

---

### **Step 4: Handle Notifications (App in Foreground)**

#### 4.1 Firebase Foreground Message Handler
```javascript
// When app is open and notification arrives
messaging().onMessage(async remoteMessage => {
  console.log('Foreground notification:', remoteMessage);
  
  // Show local notification or in-app banner
  showInAppNotification(remoteMessage.notification);
  
  // You can also update UI directly since socket will also emit
  // Socket handler below will handle the real-time update
});
```

#### 4.2 Socket Handler (App Open)
```javascript
// This fires when notification is sent and app is open
socket.on('scheduled_push_notification:send', (data) => {
  // Show in-app notification banner
  showInAppBanner({
    title: 'Notification',
    message: data.message,
    onPress: () => handleNotificationTap(data)
  });
  
  // Update notification list
  addNotificationToList(data);
  
  // Show badge count
  updateBadgeCount();
});
```

---

### **Step 5: User Actions**

#### 5.1 Mark Notification as Read
```javascript
async function markNotificationAsRead(deliveryId) {
  const userToken = await getUserJWT();
  
  await fetch(
    `http://your-backend/api/user/push-notifications/${deliveryId}/read`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }
  );
  
  // Update UI - socket event will also fire
  updateNotificationUI(deliveryId);
}
```

#### 5.2 Mark All as Read
```javascript
async function markAllAsRead() {
  const userToken = await getUserJWT();
  
  await fetch(
    'http://your-backend/api/user/push-notifications/mark-all/read',
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    }
  );
  
  // Update UI - socket event will also fire
  updateAllNotificationsUI();
}
```

---

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    APP LAUNCH                            │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Request Push Permission│
        └──────────┬─────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Get Firebase Token   │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Register Token (Backend)│
        └──────────┬─────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Connect Socket       │
        └──────────┬─────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │ Load Notifications   │
        └──────────────────────┘

┌─────────────────────────────────────────────────────────┐
│              NOTIFICATION SENT BY ADMIN                  │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ App OPEN     │      │ App CLOSED   │
│ (Foreground) │      │ (Background) │
└──────┬───────┘      └──────┬───────┘
       │                     │
       │ Socket Event        │ Firebase Push
       │ (Real-time)         │ (Native)
       │                     │
       ▼                     ▼
┌──────────────┐      ┌──────────────┐
│ Show Banner  │      │ Show Native  │
│ In-App       │      │ Notification │
└──────┬───────┘      └──────┬───────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
         ┌────────────────┐
         │ User Taps      │
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │ Mark as Read   │
         └───────┬────────┘
                 │
                 ▼
         ┌────────────────┐
         │ Handle Redirect│
         └────────────────┘
```

---

## Two Delivery Channels Explained

### **1. Firebase Push Notification (Background/Closed App)**
- **When it works**: App is closed or in background
- **How it works**: Firebase Cloud Messaging (FCM) → Device → Native notification
- **User sees**: System notification banner
- **User action**: Taps notification → App opens → Handle redirect

### **2. Socket Notification (Foreground/Open App)**
- **When it works**: App is open, socket connected
- **How it works**: Backend emits socket event → App receives → Show in-app banner
- **User sees**: Custom in-app notification banner
- **User action**: Taps banner → Handle redirect immediately

---

## Why Two Channels?

| Scenario | Firebase Push | Socket |
|----------|---------------|--------|
| App Closed | ✅ Works | ❌ Can't connect |
| App Background | ✅ Works | ⚠️ May disconnect |
| App Open | ✅ Works | ✅ Better (faster) |

**Best Practice**: 
- Use **Firebase Push** as backup (always works)
- Use **Socket** for real-time when app is open (better UX)

---

## Complete Example: App Initialization

```javascript
import React, { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import io from 'socket.io-client';

function App() {
  useEffect(() => {
    initializePushNotifications();
  }, []);

  async function initializePushNotifications() {
    // 1. Request permission
    await messaging().requestPermission();
    
    // 2. Get device token
    const deviceToken = await messaging().getToken();
    
    // 3. Register with backend
    await registerDeviceToken(deviceToken);
    
    // 4. Connect socket
    await connectToSocket();
    
    // 5. Load existing notifications
    await loadNotifications();
    
    // 6. Setup handlers
    setupNotificationHandlers();
  }

  function setupNotificationHandlers() {
    // Background notification handler
    messaging().setBackgroundMessageHandler(handleBackgroundNotification);
    
    // Notification opened from closed state
    messaging().getInitialNotification().then(handleNotificationTap);
    
    // Notification opened from background
    messaging().onNotificationOpenedApp(handleNotificationTap);
    
    // Foreground notification handler
    messaging().onMessage(handleForegroundNotification);
    
    // Socket handlers
    socket.on('scheduled_push_notification:send', handleSocketNotification);
    socket.on('scheduled_push_notification:read', handleReadUpdate);
  }
}
```

---

## Key Points for Mobile Developer

1. **Register device token** when user logs in
2. **Connect socket** when app opens
3. **Listen for socket events** for real-time updates
4. **Handle Firebase push** for background notifications
5. **Mark as read** when user interacts
6. **Handle redirect** based on `redirectType`

---

## Testing Checklist

- [ ] App requests push permission on first launch
- [ ] Device token registered with backend
- [ ] Socket connects successfully
- [ ] Background notification received (app closed)
- [ ] Background notification opens app correctly
- [ ] Foreground notification shows in-app banner
- [ ] Socket notification received when app open
- [ ] Mark as read API works
- [ ] Redirect handling works for all types (url, app_page, none)

---

This is how push notifications work on mobile side! 📱

