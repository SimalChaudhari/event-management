// Firebase Cloud Messaging Service Worker
// This file must be in the public directory for proper service worker registration

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
const firebaseConfig = {
  apiKey: "AIzaSyB-jL5NGhUvYWWlwooVWBvMgby35dyY-WI",
  authDomain: "react-native-apps-11b65.firebaseapp.com",
  projectId: "react-native-apps-11b65",
  storageBucket: "react-native-apps-11b65.firebasestorage.app",
  messagingSenderId: "899849144398",
  appId: "1:899849144398:web:a0add6895682e67ceddb1f",
  measurementId: "G-1STZ7L4GPP"
};

// VAPID Key - Replace with your actual VAPID key from Firebase Console
const VAPID_KEY = 'BL3ve9MA8jNcVVlRfkcDDTxetKf4fQzUGrA3YgKpOxgnN0DfWfpHYOEFL0Mrm458t1eFC0rjG5FID1jflQ7w_Lg';

firebase.initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
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
