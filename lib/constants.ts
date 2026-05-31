// ============================================================
// lib/constants.ts — Harga layanan & kategori pengeluaran
// ============================================================

import type { LayananUtama, LayananTambahan, KategoriPengeluaran, MetodePembayaran } from "./supabase/types";

// ── Harga Layanan Utama ───────────────────────────────────────
export const HARGA_LAYANAN_UTAMA: Record<LayananUtama, number> = {
  "Cuci Biasa":        15000,
  "Pengering Level 1": 15000,
  "Pengering Level 2": 22000,
  "Pengering Level 3": 30000,
};

// ── Deskripsi Layanan Utama ───────────────────────────────────
export const DESKRIPSI_LAYANAN_UTAMA: Record<LayananUtama, string> = {
  "Cuci Biasa":        "Per mesin",
  "Pengering Level 1": "26 menit",
  "Pengering Level 2": "39 menit",
  "Pengering Level 3": "51 menit",
};

// ── Harga Layanan Tambahan ────────────────────────────────────
export const HARGA_LAYANAN_TAMBAHAN: Record<LayananTambahan, number> = {
  "Cuci oleh Karyawan": 10000,
  "Lipat Pakaian":      10000,
};

// ── Daftar semua layanan utama ────────────────────────────────
export const LIST_LAYANAN_UTAMA: LayananUtama[] = [
  "Cuci Biasa",
  "Pengering Level 1",
  "Pengering Level 2",
  "Pengering Level 3",
];

// ── Daftar semua layanan tambahan ────────────────────────────
export const LIST_LAYANAN_TAMBAHAN: LayananTambahan[] = [
  "Cuci oleh Karyawan",
  "Lipat Pakaian",
];

// ── Daftar kategori pengeluaran ───────────────────────────────
export const LIST_KATEGORI_PENGELUARAN: KategoriPengeluaran[] = [
  "Gas",
  "Listrik",
  "Air",
  "Sabun",
  "Molto",
  "Gaji Karyawan",
  "Sewa Toko",
  "Iuran Sampah",
  "Sewa Parkir",
];

// ── Metode pembayaran ─────────────────────────────────────────
export const LIST_METODE_PEMBAYARAN: MetodePembayaran[] = [
  "Cash",
  "QRIS",
  "Transfer Bank (BCA)",
];

// ── Ikon kategori pengeluaran ─────────────────────────────────
export const IKON_KATEGORI: Record<KategoriPengeluaran, string> = {
  "Gas":           "🔥",
  "Listrik":       "⚡",
  "Air":           "💧",
  "Sabun":         "🧴",
  "Molto":         "👕",
  "Gaji Karyawan": "👨‍💼",
  "Sewa Toko":     "🏠",
  "Iuran Sampah":  "🗑️",
  "Sewa Parkir":   "🚗",
};

// ── Ikon metode pembayaran ────────────────────────────────────
export const IKON_PEMBAYARAN: Record<MetodePembayaran, string> = {
  "Cash":               "💵",
  "QRIS":               "📱",
  "Transfer Bank (BCA)":"🏦",
};

// ── Format rupiah ─────────────────────────────────────────────
export const formatRupiah = (angka: number): string => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

// ── Format tanggal display ────────────────────────────────────
export const formatTanggal = (tanggal: string): string => {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ── Format tanggal pendek ─────────────────────────────────────
export const formatTanggalPendek = (tanggal: string): string => {
  return new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ── Tanggal hari ini format YYYY-MM-DD ────────────────────────
export const getTanggalHariIni = (): string => {
  return new Date().toISOString().split("T")[0];
};

// ── Generate unique ID ────────────────────────────────────────
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};