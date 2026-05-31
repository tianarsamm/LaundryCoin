// ============================================================
// lib/types.ts — Semua TypeScript types & interfaces
// ============================================================

export type MetodePembayaran = "Cash" | "QRIS" | "Transfer Bank (BCA)";

export type LayananUtama =
  | "Cuci Biasa"
  | "Pengering Level 1"
  | "Pengering Level 2"
  | "Pengering Level 3";

export type LayananTambahan = "Cuci oleh Karyawan" | "Lipat Pakaian";

export type KategoriPengeluaran =
  | "Gas"
  | "Listrik"
  | "Air"
  | "Sabun"
  | "Molto"
  | "Gaji Karyawan"
  | "Sewa Toko"
  | "Iuran Sampah"
  | "Sewa Parkir";

// ── Pemasukan ────────────────────────────────────────────────
export interface Pemasukan {
  id: string;
  tanggal: string;                        // format: YYYY-MM-DD
  layananUtama: LayananUtama;
  layananTambahan: LayananTambahan[];
  hargaLayanan: number;
  hargaTambahan: number;
  totalPembayaran: number;
  metodePembayaran: MetodePembayaran;
  createdAt: string;                      // ISO timestamp
}

// ── Pengeluaran ──────────────────────────────────────────────
export interface Pengeluaran {
  id: string;
  tanggal: string;                        // format: YYYY-MM-DD
  kategori: KategoriPengeluaran;
  keterangan: string;
  jumlah: number;
  createdAt: string;                      // ISO timestamp
}

// ── Ringkasan untuk dashboard ────────────────────────────────
export interface RingkasanHarian {
  tanggal: string;
  totalPemasukan: number;
  totalPengeluaran: number;
  laba: number;
}

// ── Filter transaksi ─────────────────────────────────────────
export interface FilterPemasukan {
  tanggalDari?: string;
  tanggalSampai?: string;
  metodePembayaran?: MetodePembayaran | "Semua";
  layanan?: LayananUtama | "Semua";
}

export interface FilterPengeluaran {
  tanggalDari?: string;
  tanggalSampai?: string;
  kategori?: KategoriPengeluaran | "Semua";
}

export type AttendanceType = 'checkin' | 'checkout'
export type AttendanceStatus = 'ontime' | 'late'

export interface AttendanceLog {
  id: string
  user_id: string
  store_id: string
  type: AttendanceType
  latitude: number
  longitude: number
  distance_meter: number
  photo_url: string
  status: AttendanceStatus
  device_info: Record<string, string> | null
  ip_address: string | null
  created_at: string
}

export interface StoreConfig {
  id: string
  nama_toko: string
  lat: number
  lng: number
  radius_meter: number
  jam_masuk: string        // format "HH:mm:ss"
  toleransi_menit: number
  updated_by: string | null
  updated_at: string
}

export interface PushSubscription {
  id: string
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
  created_at: string
}

// Untuk state halaman absensi
export interface TodayAttendance {
  checkin: AttendanceLog | null
  checkout: AttendanceLog | null
}