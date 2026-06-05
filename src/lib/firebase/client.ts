import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, onMessage, type Messaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export function getFirebaseMessaging(): Messaging | null {
  if (typeof window === "undefined") return null;
  try {
    return getMessaging(firebaseApp);
  } catch {
    return null;
  }
}

export function setupForegroundNotifications(): () => void {
  const messaging = getFirebaseMessaging();
  if (!messaging) return () => {};

  const unsubscribe = onMessage(messaging, (payload) => {
    console.log("[FCM Foreground] Received:", payload);

    if (Notification.permission !== "granted") return;

    const title = payload.notification?.title ?? "Laundry Coin";
    const body = payload.notification?.body ?? "Ada notifikasi baru";

    new Notification(title, {
      body,
      icon: "/logo/Laundry2.png",
      badge: "/logo/Laundry2.png",
      tag: "laundry-notification",
    });
  });

  return unsubscribe;
}