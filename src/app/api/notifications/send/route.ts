import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { messaging } from "@/src/lib/firebase/admin";

// Initialize Supabase server client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);

    // Verify user with Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid token" },
        { status: 401 }
      );
    }

    // Check if user is super_admin
    const { data: userProfile, error: profileError } =
      await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (
      profileError ||
      !userProfile ||
      userProfile.role !== "super_admin"
    ) {
      return NextResponse.json(
        { error: "Only super admin can send notifications" },
        { status: 403 }
      );
    }

    // Parse request body
    const { title, body, userId } = await request.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    // If userId is provided, send to specific user
    if (userId) {
      const { data: devices, error: devicesError } =
        await supabase
          .from("user_devices")
          .select("fcm_token")
          .eq("user_id", userId)
          .eq("device_type", "web");

      if (devicesError || !devices || devices.length === 0) {
        return NextResponse.json(
          {
            error: "User has no registered devices",
          },
          { status: 404 }
        );
      }

      const tokens = devices
        .map((d) => d.fcm_token)
        .filter((t): t is string => Boolean(t));

      if (tokens.length === 0) {
        return NextResponse.json(
          { error: "No valid FCM tokens found" },
          { status: 404 }
        );
      }

      // Send to specific user
      try {
        const response =
          await messaging.sendMulticast({
            tokens,
            notification: {
              title,
              body,
            },
          });

        return NextResponse.json(
          {
            success: true,
            successCount: response.successCount,
            failureCount: response.failureCount,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[FCM Error]", error);
        return NextResponse.json(
          { error: "Failed to send notification" },
          { status: 500 }
        );
      }
    } else {
      // Send to all super_admin devices
      const { data: devices, error: devicesError } =
        await supabase
          .from("user_devices")
          .select("fcm_token, user_id")
          .eq("device_type", "web");

      if (devicesError || !devices || devices.length === 0) {
        return NextResponse.json(
          { error: "No devices found" },
          { status: 404 }
        );
      }

      // Filter only super admin devices
      const { data: superAdmins } = await supabase
        .from("users")
        .select("id")
        .eq("role", "super_admin");

      const superAdminIds = new Set(
        superAdmins?.map((u) => u.id) || []
      );

      const tokens = devices
        .filter((d) => superAdminIds.has(d.user_id))
        .map((d) => d.fcm_token)
        .filter((t): t is string => Boolean(t));

      if (tokens.length === 0) {
        return NextResponse.json(
          { error: "No super admin devices found" },
          { status: 404 }
        );
      }

      // Send to all super admins
      try {
        const response =
          await messaging.sendMulticast({
            tokens,
            notification: {
              title,
              body,
            },
          });

        return NextResponse.json(
          {
            success: true,
            message:
              "Notification sent to all super admins",
            successCount: response.successCount,
            failureCount: response.failureCount,
          },
          { status: 200 }
        );
      } catch (error) {
        console.error("[FCM Error]", error);
        return NextResponse.json(
          { error: "Failed to send notification" },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("[Notification API Error]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
