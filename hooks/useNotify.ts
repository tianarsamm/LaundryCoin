"use client";

/**
 * useNotify — hook wrapper yang menggabungkan:
 * 1. Push notification (via sendNotification API)
 * 2. In-app toast + bell panel (via NotificationContext)
 *
 * Gunakan ini sebagai pengganti langsung dari sendNotification()
 * di semua komponen client-side.
 */

import { useCallback } from "react";
import { useNotifications, NotifType } from "@/context/NotificationContext";
import { sendNotification } from "@/lib/notifications/sendNotification";

interface NotifyOptions {
  title: string;
  body: string;
  type?: NotifType;
  userId?: string;       // jika ada → kirim push ke user tertentu
  pushOnly?: boolean;    // true → skip in-app (jarang dipakai)
  inAppOnly?: boolean;   // true → skip push notification
}

export function useNotify() {
  const { addNotification } = useNotifications();

  const notify = useCallback(async (opts: NotifyOptions) => {
    const type = opts.type ?? "info";

    // 1. Tampilkan in-app notification (toast + panel)
    if (!opts.pushOnly) {
      addNotification(opts.title, opts.body, type);
    }

    // 2. Kirim push notification (background/device)
    if (!opts.inAppOnly) {
      await sendNotification({
        title: opts.title,
        body: opts.body,
        userId: opts.userId,
      });
    }
  }, [addNotification]);

  return { notify };
}