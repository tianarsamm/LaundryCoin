importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-app-compat.js"
);

importScripts(
  "https://www.gstatic.com/firebasejs/11.6.0/firebase-messaging-compat.js"
);

// Firebase config should be fetched from config endpoint or environment
// For now, using the same config as client
const firebaseConfig = {
  apiKey: "AIzaSyDuw1caz_6olLHXveJZSx9gpNJ0pF-GXe8",
  authDomain: "laundry-coin-ad6eb.firebaseapp.com",
  projectId: "laundry-coin-ad6eb",
  storageBucket: "laundry-coin-ad6eb.firebasestorage.app",
  messagingSenderId: "144371384449",
  appId: "1:144371384449:web:b2638b708c7502ee5d0d80",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Handle background messages when app is closed
messaging.onBackgroundMessage((payload) => {
  console.log("[Firebase SW] Received background message:", payload);

  try {
    const notificationTitle = payload.notification?.title || "Notifikasi";
    const notificationOptions = {
      body: payload.notification?.body || "",
      icon: "/logo/Laundry2.png",
      badge: "/logo/Laundry2.png",
      tag: "firebase-notification",
      renotify: true,
      requireInteraction: true,
      data: payload.data || {},
    };

    console.log("[Firebase SW] Showing notification:", {
      title: notificationTitle,
      options: notificationOptions,
    });

    self.registration
      .showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log("[Firebase SW] Notification shown successfully");
      })
      .catch((error) => {
        console.error(
          "[Firebase SW] Error showing notification:",
          error.message,
          error
        );
      });
  } catch (error) {
    console.error(
      "[Firebase SW] Error in onBackgroundMessage handler:",
      error.message,
      error
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Check if app window already open
      for (let client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});