export type UserRole = "super_admin" | "admin";

export type MenuKey =
  | "dashboard"
  | "pemasukan"
  | "pengeluaran"
  | "laporan"
  | "manajemen_karyawan"
  | "jadwal"
  | "kelola_absensi"
  | "absensi";

export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  nama: string;
  no_hp: string | null;
  role: UserRole;
  rotation_index: number | null;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
}

export interface MenuPermission {
  menu_key: MenuKey;
  is_enabled: boolean;
}

/** Menu yang SELALU tampil untuk semua user aktif */
export const ALWAYS_ENABLED_MENUS: MenuKey[] = [
  "dashboard",
  "pemasukan",
  "pengeluaran",
  "absensi",
];

/** Menu EKSKLUSIF super admin — tidak bisa di-toggle ke admin */
export const SUPER_ADMIN_ONLY_MENUS: MenuKey[] = [
  "manajemen_karyawan",
  "kelola_absensi",
];

/** Menu yang bisa di-toggle oleh super admin untuk admin biasa */
export const TOGGLEABLE_MENUS: MenuKey[] = [
  "laporan",
  "jadwal",
];
