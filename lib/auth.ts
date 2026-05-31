// ============================================================
// lib/auth.ts — Auth helpers: getUser, role, permissions
// ============================================================

import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type {
  MenuKey,
  MenuPermission,
  UserProfile,
  UserRole,
} from "@/lib/auth-types";
import {
  ALWAYS_ENABLED_MENUS,
  SUPER_ADMIN_ONLY_MENUS,
  TOGGLEABLE_MENUS,
} from "@/lib/auth-types";

// ── Supabase server client (untuk Server Components & actions) ─

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Diabaikan di Server Components — hanya middleware yang bisa set cookies
          }
        },
      },
    }
  );
}

// ── Supabase admin client (service role — hanya server side) ─

export function createSupabaseAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ═══════════════════════════════════════════════════════════════
// GET USER
// ═══════════════════════════════════════════════════════════════

/**
 * Ambil session user yang sedang login (server side).
 * Return null jika belum login.
 */
export async function getAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return user;
}

/**
 * Ambil profil lengkap user dari tabel public.users.
 * Return null jika belum login atau profil tidak ditemukan.
 */
export async function getUserProfile(
  userId?: string
): Promise<UserProfile | null> {
  const supabase = await createSupabaseServerClient();

  let targetId = userId;
  if (!targetId) {
    const user = await getAuthUser();
    if (!user) return null;
    targetId = user.id;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", targetId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

/**
 * Ambil profil user dari sisi client (untuk komponen client).
 * Menerima supabase client instance dari luar.
 */
export async function getUserProfileClient(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as UserProfile;
}

// ═══════════════════════════════════════════════════════════════
// ROLE CHECKS
// ═══════════════════════════════════════════════════════════════

/** Cek apakah user yang login adalah super admin */
export async function isSuperAdmin(): Promise<boolean> {
  const profile = await getUserProfile();
  return profile?.role === "super_admin" && profile?.is_active === true;
}

/** Cek apakah ada super admin di sistem (untuk setup awal) */
export async function hasSuperAdmin(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("role", "super_admin")
    .eq("is_active", true)
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}

// ═══════════════════════════════════════════════════════════════
// MENU PERMISSIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Ambil daftar menu yang boleh diakses user tertentu.
 * Super admin → semua menu.
 * Admin biasa → menu default + yang di-toggle aktif.
 */
export async function getAllowedMenus(userId?: string): Promise<MenuKey[]> {
  const profile = await getUserProfile(userId);
  if (!profile || !profile.is_active) return [];

  if (profile.role === "super_admin") {
    return [
      "dashboard",
      "pemasukan",
      "pengeluaran",
      "absensi",
      "laporan",
      "jadwal",
      "manajemen_karyawan",
      "kelola_absensi",
    ];
  }

  const allowed: MenuKey[] = [...ALWAYS_ENABLED_MENUS];

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("menu_permissions")
    .select("menu_key, is_enabled")
    .eq("user_id", profile.id)
    .eq("is_enabled", true);

  if (!error && data) {
    data.forEach((perm) => {
      const key = perm.menu_key as MenuKey;
      if (TOGGLEABLE_MENUS.includes(key) && !allowed.includes(key)) {
        allowed.push(key);
      }
    });
  }

  return allowed;
}

/** Cek apakah user boleh mengakses menu tertentu. */
export async function canAccessMenu(
  menuKey: MenuKey,
  userId?: string
): Promise<boolean> {
  const allowedMenus = await getAllowedMenus(userId);
  return allowedMenus.includes(menuKey);
}

/**
 * Ambil semua permission untuk ditampilkan di halaman
 * manajemen karyawan (toggle UI).
 */
export async function getMenuPermissionsForUser(
  userId: string
): Promise<MenuPermission[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("menu_permissions")
    .select("menu_key, is_enabled")
    .eq("user_id", userId);

  if (error)
    return TOGGLEABLE_MENUS.map((key) => ({ menu_key: key, is_enabled: false }));

  return TOGGLEABLE_MENUS.map((key) => {
    const found = data?.find((p) => p.menu_key === key);
    return {
      menu_key: key,
      is_enabled: found?.is_enabled ?? false,
    };
  });
}

/**
 * Toggle menu permission untuk satu user (dipanggil oleh super admin).
 */
export async function toggleMenuPermission(
  targetUserId: string,
  menuKey: MenuKey,
  isEnabled: boolean,
  updatedBy: string
): Promise<boolean> {
  if (!TOGGLEABLE_MENUS.includes(menuKey)) {
    console.error("[toggleMenuPermission] Menu tidak bisa di-toggle:", menuKey);
    return false;
  }

  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("menu_permissions")
    .upsert(
      {
        user_id: targetUserId,
        menu_key: menuKey,
        is_enabled: isEnabled,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,menu_key" }
    );

  if (error) {
    console.error("[toggleMenuPermission]", error.message);
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// USER MANAGEMENT (super admin only)
// ═══════════════════════════════════════════════════════════════

/**
 * Buat akun karyawan baru oleh super admin.
 *
 * Alur:
 *  1. Deklarasi usernameToUse lebih dulu
 *  2. createUser dengan user_metadata → trigger handle_new_user pakai metadata ini
 *  3. Update row yang sudah dibuat trigger (bukan insert ulang)
 *  4. Upsert menu_permissions → aman meski trigger sudah insert sebagian
 */
export async function createKaryawan(payload: {
  email: string;
  username?: string;
  password: string;
  nama: string;
  no_hp?: string;
  rotation_index?: number;
  role?: UserRole;
}): Promise<{ success: boolean; error?: string; user?: UserProfile | null }> {
  try {
    // ── Validasi ───────────────────────────────────────────────
    if (!payload.email || !payload.password || !payload.nama) {
      return { success: false, error: "Email, password, dan nama wajib diisi" };
    }
    if (payload.password.length < 8) {
      return { success: false, error: "Password minimal 8 karakter" };
    }
    if (!payload.email.includes("@")) {
      return { success: false, error: "Format email tidak valid" };
    }

    const adminClient = createSupabaseAdminClient();

    // ── FIX: deklarasikan SEBELUM createUser ──────────────────
    const usernameToUse =
      payload.username ?? splitEmailLocalPart(payload.email);

    // ── 1. Buat user di Supabase Auth ─────────────────────────
    // user_metadata dikirim agar trigger handle_new_user bisa pakai
    // nilai username, nama, no_hp, role yang benar.
    console.log("[createKaryawan] Creating auth user:", payload.email);

    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: payload.email,
        password: payload.password,
        email_confirm: true,
        user_metadata: {
          username: usernameToUse,
          nama: payload.nama,
          no_hp: payload.no_hp ?? null,
          role: payload.role ?? "admin",
        },
      });

    if (authError || !authData.user) {
      const errorMsg = authError?.message ?? "Gagal membuat akun";
      console.error("[createKaryawan] Auth creation failed:", errorMsg);

      if (errorMsg.includes("already registered")) {
        return { success: false, error: "Email sudah terdaftar" };
      }
      if (errorMsg.includes("password")) {
        return {
          success: false,
          error: "Password tidak memenuhi kriteria (minimal 6 karakter)",
        };
      }
      return { success: false, error: `Gagal membuat akun: ${errorMsg}` };
    }

    console.log("[createKaryawan] Auth user created:", authData.user.id);

    // ── 2. Update profil yang sudah dibuat trigger ────────────
    // Trigger handle_new_user sudah INSERT row ke public.users,
    // kita UPDATE dengan data lengkap (username, rotation_index, dll).
    const { data: updatedProfile, error: profileError } = await adminClient
      .from("users")
      .update({
        username: usernameToUse,
        nama: payload.nama,
        no_hp: payload.no_hp ?? null,
        role: payload.role ?? "admin",
        rotation_index: payload.rotation_index ?? null,
        is_active: true,
      })
      .eq("id", authData.user.id)
      .select("*")
      .single();

    if (profileError || !updatedProfile) {
      const errorMsg = profileError?.message ?? "Gagal menyimpan profil";
      console.error("[createKaryawan] Profile update failed:", errorMsg);

      // Rollback auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);

      if (errorMsg.includes("duplicate")) {
        return { success: false, error: "Username sudah digunakan" };
      }
      return { success: false, error: `Gagal menyimpan profil: ${errorMsg}` };
    }

    console.log("[createKaryawan] Profile updated:", updatedProfile.id);

    // ── 3. Upsert menu permissions ────────────────────────────
    // Pakai upsert (bukan insert) agar tidak conflict dengan
    // baris yang mungkin sudah dibuat oleh trigger.
    const defaultEnabled = ["dashboard", "pemasukan", "pengeluaran"];
    const allMenuKeys = [
      ...ALWAYS_ENABLED_MENUS,
      ...TOGGLEABLE_MENUS,
      "manajemen_karyawan",
      "kelola_absensi",
      "absensi",
    ];

    const permissions = allMenuKeys.map((key) => ({
      user_id: authData.user!.id,
      menu_key: key,
      is_enabled: defaultEnabled.includes(key),
    }));

    const { error: permError } = await adminClient
      .from("menu_permissions")
      .upsert(permissions, { onConflict: "user_id,menu_key" }); // ← upsert, bukan insert

    if (permError) {
      // Non-fatal — user sudah berhasil dibuat
      console.error(
        "[createKaryawan] Menu permissions error (non-fatal):",
        permError.message
      );
    }

    console.log("[createKaryawan] Karyawan berhasil dibuat:", updatedProfile.id);
    return { success: true, user: updatedProfile as UserProfile };
  } catch (err: any) {
    console.error("[createKaryawan] Unexpected error:", err);
    return { success: false, error: `Error: ${err?.message ?? String(err)}` };
  }
}

function splitEmailLocalPart(email: string) {
  return email.split("@")[0];
}

// ═══════════════════════════════════════════════════════════════
// KARYAWAN MANAGEMENT
// ═══════════════════════════════════════════════════════════════

/** Aktifkan / nonaktifkan karyawan. */
export async function setKaryawanActive(
  userId: string,
  isActive: boolean
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({ is_active: isActive })
    .eq("id", userId);

  if (error) {
    console.error("[setKaryawanActive]", error.message);
    return false;
  }
  return true;
}

/**
 * Ganti role karyawan.
 * Proteksi: tidak bisa downgrade jika satu-satunya super admin.
 */
export async function updateKaryawanRole(
  targetUserId: string,
  newRole: UserRole,
  requesterId: string
): Promise<{ success: boolean; error?: string }> {
  if (newRole === "admin") {
    const supabase = await createSupabaseServerClient();
    const { data } = await supabase
      .from("users")
      .select("id")
      .eq("role", "super_admin")
      .eq("is_active", true);

    if ((data?.length ?? 0) <= 1) {
      return {
        success: false,
        error: "Minimal harus ada 1 super admin aktif di sistem.",
      };
    }
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("users")
    .update({ role: newRole })
    .eq("id", targetUserId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

/** Update last_login setiap kali user berhasil login. */
export async function updateLastLogin(userId: string): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase
    .from("users")
    .update({ last_login: new Date().toISOString() })
    .eq("id", userId);
}

/** Ambil semua karyawan (untuk halaman manajemen karyawan). */
export async function getAllKaryawan(): Promise<UserProfile[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[getAllKaryawan]", error.message);
    return [];
  }
  return data as UserProfile[];
}