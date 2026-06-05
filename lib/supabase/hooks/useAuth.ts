// ============================================================
// lib/hooks/useAuth.ts — Client-side auth hook
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { UserProfile, MenuKey } from "@/lib/auth-types";
import { TOGGLEABLE_MENUS } from "@/lib/auth-types";
import { registerDevice } from "@/src/lib/firebase/register-device";

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  allowedMenus: MenuKey[];
}

export function useAuth(): AuthState & {
  isSuperAdmin: boolean;
  canAccess: (menu: MenuKey) => boolean;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    allowedMenus: [],
  });

  const fetchUser = useCallback(async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
    }));

    try {
      // ========================================================
      // Ambil session user
      // ========================================================
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setState({
          user: null,
          loading: false,
          allowedMenus: [],
        });
        return;
      }

      // ========================================================
      // Ambil profile dari tabel users
      // ========================================================
      const { data: profile, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error || !profile) {
        console.error(
          "[AUTH] Failed to fetch profile:",
          error
        );

        setState({
          user: null,
          loading: false,
          allowedMenus: [],
        });

        return;
      }

      const userProfile = profile as UserProfile;

      // ========================================================
      // Register FCM Device
      // Untuk semua user (super admin, admin, karyawan)
      // agar bisa menerima push notifications
      // ========================================================
      try {
        await registerDevice(authUser.id);
      } catch (err) {
        console.error(
          "[FCM] Failed to register device:",
          err
        );
      }

      // ========================================================
      // Hitung Allowed Menus
      // ========================================================
      let allowedMenus: MenuKey[] = [];

      if (userProfile.role === "super_admin") {
        allowedMenus = [
          "dashboard",
          "pemasukan",
          "pengeluaran",
          "laporan",
          "jadwal",
          "manajemen_karyawan",
          "manajemen_izin",
          "kelola_absensi",
        ];

        // Ambil custom permissions
        const { data: perms } = await supabase
          .from("menu_permissions")
          .select("menu_key, is_enabled")
          .eq("user_id", authUser.id)
          .eq("is_enabled", true);

        if (perms) {
          perms.forEach((p) => {
            const key = p.menu_key as MenuKey;

            if (
              TOGGLEABLE_MENUS.includes(key) &&
              !allowedMenus.includes(key)
            ) {
              allowedMenus.push(key);
            }
          });
        }
      } else {
        // ========================================================
        // ADMIN
        // ========================================================
        allowedMenus = [
          "dashboard",
          "pemasukan",
          "pengeluaran",
          "absensi",
          "izin",
        ];
      }

      setState({
        user: userProfile,
        loading: false,
        allowedMenus,
      });
    } catch (error) {
      console.error("[AUTH ERROR]", error);

      setState({
        user: null,
        loading: false,
        allowedMenus: [],
      });
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (isMounted) {
        await fetchUser();
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        if (isMounted) {
          if (
            event === "SIGNED_IN" ||
            event === "TOKEN_REFRESHED"
          ) {
            fetchUser();
          } else if (event === "SIGNED_OUT") {
            setState({
              user: null,
              loading: false,
              allowedMenus: [],
            });
          }
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUser]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const canAccess = (menu: MenuKey): boolean => {
    return state.allowedMenus.includes(menu);
  };

  return {
    ...state,
    isSuperAdmin:
      state.user?.role === "super_admin",
    canAccess,
    signOut,
    refetch: fetchUser,
  };
}