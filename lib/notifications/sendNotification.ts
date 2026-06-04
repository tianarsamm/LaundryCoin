// ============================================================
// lib/notifications/sendNotification.ts
// Helper function to send push notifications from the app
// ============================================================

import { supabase } from "@/lib/supabase/client";

interface SendNotificationOptions {
  title: string;
  body: string;
  userId?: string; // If provided, send to specific user, else send to all super admins
}

export async function sendNotification(
  options: SendNotificationOptions
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
  successCount?: number;
  failureCount?: number;
}> {
  try {
    // Get current user's session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Call API endpoint
    const response = await fetch(
      "/api/notifications/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title: options.title,
          body: options.body,
          userId: options.userId,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "Failed to send notification",
      };
    }

    return {
      success: true,
      message: data.message || "Notification sent successfully",
      successCount: data.successCount,
      failureCount: data.failureCount,
    };
  } catch (error) {
    console.error("[Send Notification Error]", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Unknown error occurred",
    };
  }
}

/**
 * Convenience function untuk mengirim notifikasi izin yang baru/diupdate
 */
export async function notifyPermissionUpdate(
  actionType: "created" | "updated" | "approved" | "rejected",
  employeeName: string,
  reason?: string
) {
  const titleMap = {
    created: "Izin Baru",
    updated: "Izin Diperbarui",
    approved: "Izin Disetujui",
    rejected: "Izin Ditolak",
  };

  const title = titleMap[actionType];
  const body =
    actionType === "created"
      ? `${employeeName} telah mengajukan izin baru${reason ? `: ${reason}` : ""}`
      : actionType === "updated"
        ? `Izin dari ${employeeName} telah diperbarui`
        : actionType === "approved"
          ? `Izin dari ${employeeName} telah disetujui`
          : `Izin dari ${employeeName} telah ditolak`;

  return sendNotification({ title, body });
}

/**
 * Convenience function untuk mengirim notifikasi absensi
 */
export async function notifyAbsenceUpdate(
  actionType: "checked_in" | "checked_out",
  employeeName: string,
  time?: string
) {
  const titleMap = {
    checked_in: "Absensi Masuk",
    checked_out: "Absensi Keluar",
  };

  const title = titleMap[actionType];
  const body =
    actionType === "checked_in"
      ? `${employeeName} telah melakukan absensi masuk${time ? ` pada ${time}` : ""}`
      : `${employeeName} telah melakukan absensi keluar${time ? ` pada ${time}` : ""}`;

  return sendNotification({ title, body });
}

/**
 * Example usage dalam component:
 *
 * import { sendNotification } from "@/lib/notifications/sendNotification";
 *
 * // Send to all super admins
 * const result = await sendNotification({
 *   title: "Laporan Bulanan",
 *   body: "Laporan keuangan telah selesai diolah"
 * });
 *
 * // Send to specific user
 * const result = await sendNotification({
 *   title: "Izin Ditolak",
 *   body: "Permintaan izin Anda telah ditolak",
 *   userId: "user-uuid-here"
 * });
 *
 * if (result.success) {
 *   console.log(`Sent to ${result.successCount} devices`);
 * } else {
 *   console.error(result.error);
 * }
 */
