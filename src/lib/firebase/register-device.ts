"use client";

import { supabase } from "@/lib/supabase/client";
import { requestNotificationPermission } from "./get-token";

export async function registerDevice(
  userId: string
): Promise<boolean> {
  try {
    const token =
      await requestNotificationPermission();

    if (!token) {
      console.warn(
        "[Device Registration] Notification permission denied"
      );
      return false;
    }

    const deviceType = getDeviceType();

    const { error } = await supabase
      .from("user_devices")
      .upsert(
        {
          user_id: userId,
          fcm_token: token,
          device_type: deviceType,
          device_name: navigator.platform,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,device_type",
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error(
        "[Device Registration Error]",
        error.message
      );
      return false;
    }

    console.log(
      "[Device Registration Success]"
    );

    return true;
  } catch (err) {
    console.error(
      "[Device Registration Exception]",
      err
    );

    return false;
  }
}

function getDeviceType(): string {
  const ua = navigator.userAgent.toLowerCase();

  if (/android/.test(ua)) {
    return "android";
  }

  if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  }

  return "web";
}