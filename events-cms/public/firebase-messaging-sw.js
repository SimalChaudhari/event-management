// Firebase Cloud Messaging Service Worker
// This file must be in the public directory for proper service worker registration
// FCM token is per-origin + per service worker; each browser (Edge, Firefox, Chrome) gets its own token.
// If you see the same token in different browsers, the app now sends clientId so each browser gets a separate registration.

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyCsBBDF20-j6NzDfiXB-dCyt_4n0YDNUXw",
  authDomain: "event-isca.firebaseapp.com",
  projectId: "event-isca",
  storageBucket: "event-isca.firebasestorage.app",
  messagingSenderId: "605029586603",
  appId: "1:605029586603:web:dd95a393f1f9a93f1d89ee",
  measurementId: "G-ERBPXED94S"
};

// VAPID Key - Replace with your actual VAPID key from Firebase Console
const VAPID_KEY = 'BBwhJls4uYIXwBEleP1ysB2WP8xVw421YSKmuRAObNCNSPlJM0wSm7OwTgKC7GC4foGYtEkZhPK4ftUFfyShADY';

firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [SW] Background FCM message received:', payload);
  const notificationTitle = payload.notification?.title || 'New Message';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data || {},
    requireInteraction: true,
    tag: 'chat-notification',
    actions: [
      {
        action: 'open',
        title: 'Open Chat',
        icon: '/logo192.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/logo192.png'
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  } else if (event.action === 'dismiss') {
    event.notification.close();
  }
});

// Handle push events
self.addEventListener('push', (event) => {
  // Firebase handles the push event
});
