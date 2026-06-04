"use client";

import { getMessaging, getToken } from "firebase/messaging";
import { firebaseApp } from "./client";

export async function requestNotificationPermission() {
  try {
    const permission =
      await Notification.requestPermission();

    if (permission !== "granted") {
      return null;
    }

    const messaging = getMessaging(firebaseApp);

    const token = await getToken(messaging, {
      vapidKey:
        process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    return token;
  } catch (error) {
    console.error(
      "FCM Permission Error:",
      error
    );

    return null;
  }
}