// ============================================================
// lib/hooks/useAuth.ts — Client-side auth hook
// ============================================================

"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { UserProfile, MenuKey } from "@/lib/auth-types";
import {
  ALWAYS_ENABLED_MENUS,
  TOGGLEABLE_MENUS,
} from "@/lib/auth-types";



interface AuthState {
  user:        UserProfile | null;
  loading:     boolean;
  allowedMenus: MenuKey[];
}

export function useAuth(): AuthState & {
  isSuperAdmin: boolean;
  canAccess: (menu: MenuKey) => boolean;
  signOut: () => Promise<void>;
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<AuthState>({
    user:         null,
    loading:      true,
    allowedMenus: [],
  });

  const fetchUser = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true }));

    // 1. Ambil session
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setState({ user: null, loading: false, allowedMenus: [] });
      return;
    }

    // 2. Ambil profil
    const { data: profile, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (error || !profile) {
      setState({ user: null, loading: false, allowedMenus: [] });
      return;
    }

    const userProfile = profile as UserProfile;

    // 3. Hitung allowed menus
let allowedMenus: MenuKey[] = [];

if (userProfile.role === "super_admin") {
  allowedMenus = [
    "dashboard",
    "pemasukan",
    "pengeluaran",
    "absensi",
    "laporan",
    "jadwal",
    "manajemen_karyawan",
    "kelola_absensi",
  ];

  // optional custom permissions super admin
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

  // ADMIN HANYA BOLEH MENU INI
  allowedMenus = [
    "dashboard",
    "pemasukan",
    "pengeluaran",
  ];
}

    setState({ user: userProfile, loading: false, allowedMenus });
  }, []);

  useEffect(() => {
    fetchUser();

    // Subscribe ke perubahan auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          fetchUser();
        } else if (event === "SIGNED_OUT") {
          setState({ user: null, loading: false, allowedMenus: [] });
        }
      }
    );

    return () => subscription.unsubscribe();
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
    isSuperAdmin: state.user?.role === "super_admin",
    canAccess,
    signOut,
    refetch: fetchUser,
  };
}