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
    const notificationBody = payload.notification?.body || "";
    
    const notificationOptions = {
      // UI Elements
      body: notificationBody,
      icon: "/logo/Laundry2.png",
      badge: "/logo/Laundry2.png",
      
      // Behavior
      tag: "laundry-notification", // Unique ID - hanya 1 notifikasi per tag
      renotify: true, // Notifikasi ulang jika sudah ada
      requireInteraction: true, // Jangan auto-dismiss, tunggu user action
      
      // Visual
      color: "#6366f1", // Warna accent (Android)
      vibrate: [200, 100, 200], // Vibrate pattern (Mobile)
      
      // Data & Links
      data: {
        ...payload.data,
        link: payload.webpush?.fcmOptions?.link || "/",
      },
    };

    console.log("[Firebase SW] Showing OS notification:", {
      title: notificationTitle,
      options: notificationOptions,
    });

    self.registration
      .showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log("[Firebase SW] ✅ OS Notification shown successfully");
      })
      .catch((error) => {
        console.error(
          "[Firebase SW] ❌ Error showing notification:",
          error.message,
          error
        );
      });
  } catch (error) {
    console.error(
      "[Firebase SW] ❌ Error in onBackgroundMessage handler:",
      error.message,
      error
    );
  }
});

// Handle notification clicks (membuka app atau navigate)
self.addEventListener("notificationclick", (event) => {
  console.log("[Firebase SW] Notification clicked:", event.notification);
  event.notification.close();

  const link = event.notification.data?.link || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if app already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === link && "focus" in client) {
            console.log("[Firebase SW] ✅ App already open, focusing...");
            return client.focus();
          }
        }
        
        // If same URL exists but different path, navigate
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if ("navigate" in client) {
            console.log("[Firebase SW] ✅ Navigating existing window to:", link);
            return client.navigate(link).then((c) => c && c.focus());
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          console.log("[Firebase SW] ✅ Opening new window:", link);
          return clients.openWindow(link);
        }
      })
  );
});