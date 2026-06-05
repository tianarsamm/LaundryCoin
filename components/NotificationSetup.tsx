"use client";

import { useEffect } from "react";
import { setupForegroundNotifications } from "@/src/lib/firebase/client";

export default function NotificationSetup() {
  useEffect(() => {
    const unsubscribe = setupForegroundNotifications();
    return () => unsubscribe();
  }, []);

  return null;
}