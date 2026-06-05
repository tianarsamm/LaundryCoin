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
    const notificationTitle = payload.notification?.title || "Laundry Coin";
    const notificationBody = payload.notification?.body || "Ada notifikasi baru";
    
    // Android-optimized notification options
    const notificationOptions = {
      // UI Elements
      body: notificationBody,
      icon: "/logo/Laundry2.png",
      badge: "/logo/Laundry1.png",
      
      // Critical for Android notification panel
      tag: "laundry-notification", // Unique ID
      renotify: true, // Notify again even if same tag
      requireInteraction: true, // Stay visible until user acts
      
      // Visual (Android)
      color: "#6366f1",
      vibrate: [200, 100, 200],
      sound: "default",
      
      // Behavior
      silent: false, // Enable sound/vibration
      dir: "ltr",
      
      // Data for click handler
      data: {
        ...payload.data,
        link: payload.webpush?.fcmOptions?.link || "/",
        timestamp: Date.now(),
      },
    };

    console.log("[Firebase SW] 📢 Showing notification to panel:", {
      title: notificationTitle,
      body: notificationBody,
    });

    // Show notification - will appear in Android notification panel
    self.registration
      .showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log("[Firebase SW] ✅ Notification added to panel");
      })
      .catch((error) => {
        console.error(
          "[Firebase SW] ❌ Failed to show notification:",
          error.message
        );
      });
  } catch (error) {
    console.error(
      "[Firebase SW] ❌ Error processing message:",
      error.message
    );
  }
});

// Handle notification clicks (user click di notification panel)
self.addEventListener("notificationclick", (event) => {
  console.log(
    "[Firebase SW] 👆 User clicked notification:",
    event.notification.tag
  );
  
  const urlToOpen = event.notification.data?.link || "/";
  event.notification.close(); // Dismiss notification

  event.waitUntil(
    // Get all open windows/tabs
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if app already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          // If same URL, just focus
          if (client.url === urlToOpen && "focus" in client) {
            console.log("[Firebase SW] ✅ App open, focusing window");
            return client.focus();
          }
        }

        // If app open but different URL, navigate to new page
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(location.origin) && "navigate" in client) {
            console.log("[Firebase SW] ✅ Navigating to:", urlToOpen);
            return client
              .navigate(urlToOpen)
              .then((c) => (c ? c.focus() : null));
          }
        }

        // If app not open, open new window
        if (clients.openWindow) {
          console.log("[Firebase SW] ✅ Opening new window:", urlToOpen);
          return clients.openWindow(urlToOpen);
        }
      })
  );
});