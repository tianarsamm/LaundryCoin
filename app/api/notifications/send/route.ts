import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { messaging } from "@/src/lib/firebase/admin";

// Gunakan service role agar bisa query semua user_devices (bypass RLS)
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function POST(req: NextRequest) {
  try {
    // ── 0. Validate Firebase is initialized ───────────────────
    if (!messaging) {
      console.error("[Notification API] Firebase not initialized");
      return NextResponse.json(
        {
          error: "Notification service unavailable",
          detail: "Firebase Admin SDK initialization failed",
        },
        { status: 503 }
      );
    }

    // ── 1. Parse request body ─────────────────────────────────
    const body = await req.json();
    const { title, body: messageBody, userId } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Title dan body wajib diisi" },
        { status: 400 }
      );
    }

    const supabase = getAdminSupabase();

    // ── 2. Ambil FCM tokens ───────────────────────────────────
    let tokens: string[] = [];

    if (userId) {
      // Kirim ke user tertentu
      const { data, error } = await supabase
        .from("user_devices")
        .select("fcm_token")
        .eq("user_id", userId);

      if (error) {
        console.error("[Notification API] Error fetching user devices:", error);
        return NextResponse.json(
          { error: "Gagal mengambil data device" },
          { status: 500 }
        );
      }

      if (!data || data.length === 0) {
        return NextResponse.json(
          { error: "User has no registered devices" },
          { status: 404 }
        );
      }

      tokens = data.map((d) => d.fcm_token);
    } else {
      // Kirim ke semua super admin
      // 1. Cari semua user dengan role super_admin
      const { data: superAdmins, error: saError } = await supabase
        .from("users")
        .select("id")
        .eq("role", "super_admin")
        .eq("is_active", true);

      if (saError || !superAdmins || superAdmins.length === 0) {
        console.error("[Notification API] No super admins found:", saError);
        return NextResponse.json(
          { error: "Tidak ada super admin yang aktif" },
          { status: 404 }
        );
      }

      const superAdminIds = superAdmins.map((sa) => sa.id);

      // 2. Ambil FCM tokens untuk semua super admin
      const { data: devices, error: devError } = await supabase
        .from("user_devices")
        .select("fcm_token")
        .in("user_id", superAdminIds);

      if (devError) {
        console.error("[Notification API] Error fetching devices:", devError);
        return NextResponse.json(
          { error: "Gagal mengambil data device super admin" },
          { status: 500 }
        );
      }

      if (!devices || devices.length === 0) {
        console.warn("[Notification API] Super admins have no registered devices");
        return NextResponse.json(
          { error: "Super admin belum mendaftarkan device" },
          { status: 404 }
        );
      }

      tokens = devices.map((d) => d.fcm_token);
    }

    // ── 3. Hapus duplikat token ───────────────────────────────
    tokens = [...new Set(tokens)];

    console.log(`[Notification API] Sending to ${tokens.length} device(s)`);

    // ── 4. Kirim FCM notification ─────────────────────────────
    let successCount = 0;
    let failureCount = 0;
    const failedTokens: string[] = [];

    // Gunakan sendEachForMulticast untuk mengirim ke banyak token
    if (tokens.length > 0) {
      const response = await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: messageBody,
        },
        // Web push configuration untuk browser & mobile web
        webpush: {
          notification: {
            // UI Elements
            title,
            body: messageBody,
            icon: "/logo/Laundry.png",
            badge: "/logo/Laundry.png",
            image: "/logo/Laundry.png",
            
            // Critical for Android notification panel visibility
            tag: "laundry-notification",
            renotify: true,
            requireInteraction: true,
            
            // Visual (Android)
            vibrate: [200, 100, 200],
            color: "#6366f1",
            silent: false,
            dir: "ltr",
          },
          fcmOptions: {
            link: "/manajemen/izin",
          },
          headers: {
            "TTL": "3600",
            "Urgency": "high", // Important priority
          },
        },
        // Android-specific configuration
        android: {
          priority: "high",
          notification: {
            title,
            body: messageBody,
            icon: "ic_launcher", // Reference to app icon
            color: "#6366f1",
            sound: "default",
            channelId: "laundry-notifications",
            clickAction: "/manajemen/izin",
            priority: "high",
            tag: "laundry-notification",
            vibrateTimingsMillis: [200, 100, 200],
          },
          ttl: 3600,
        },
      });

      successCount = response.successCount;
      failureCount = response.failureCount;

      // Kumpulkan token yang gagal untuk cleanup
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(
            `[Notification API] Failed to send to token ${idx}:`,
            resp.error?.message
          );
          failedTokens.push(tokens[idx]);
        }
      });

      // ── 5. Bersihkan token yang sudah invalid ───────────────
      if (failedTokens.length > 0) {
        console.log(
          `[Notification API] Cleaning up ${failedTokens.length} invalid token(s)`
        );
        await supabase
          .from("user_devices")
          .delete()
          .in("fcm_token", failedTokens);
      }
    }

    console.log(
      `[Notification API] Result: ${successCount} success, ${failureCount} failure`
    );

    return NextResponse.json({
      success: true,
      message: userId
        ? "Notification sent to user"
        : "Notification sent to all super admins",
      successCount,
      failureCount,
    });
  } catch (error) {
    console.error("[Notification API] Unexpected error:", error);
    return NextResponse.json(
      {
        error: "Failed to send notification",
        detail: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
