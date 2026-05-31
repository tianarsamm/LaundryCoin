// ============================================================
// lib/storage.ts — CRUD Supabase untuk pemasukan & pengeluaran
// ============================================================

import { getSupabaseClient } from "./client";
export const supabase = getSupabaseClient();
import type {
  Pemasukan,
  Pengeluaran,
  RingkasanHarian,
  FilterPemasukan,
  FilterPengeluaran,
} from "./types";

// ── Supabase client (singleton) ───────────────────────────────


// ═══════════════════════════════════════════════════════════════
// MAPPERS  (DB snake_case ↔ App camelCase)
// ═══════════════════════════════════════════════════════════════

interface PemasukanRow {
  id: string;
  tanggal: string;
  layanan_utama: string;
  layanan_tambahan: string[];
  harga_layanan: number;
  harga_tambahan: number;
  total_pembayaran: number;
  metode_pembayaran: string;
  created_at: string;
}

interface PengeluaranRow {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
  created_at: string;
}

function rowToPemasukan(row: PemasukanRow): Pemasukan {
  return {
    id:               row.id,
    tanggal:          row.tanggal,
    layananUtama:     row.layanan_utama     as Pemasukan["layananUtama"],
    layananTambahan:  (row.layanan_tambahan ?? []) as Pemasukan["layananTambahan"],
    hargaLayanan:     Number(row.harga_layanan),
    hargaTambahan:    Number(row.harga_tambahan),
    totalPembayaran:  Number(row.total_pembayaran),
    metodePembayaran: row.metode_pembayaran as Pemasukan["metodePembayaran"],
    createdAt:        row.created_at,
  };
}

function pemasukanToRow(
  data: Omit<Pemasukan, "id" | "createdAt">
): Omit<PemasukanRow, "id" | "created_at"> {
  return {
    tanggal:           data.tanggal,
    layanan_utama:     data.layananUtama,
    layanan_tambahan:  data.layananTambahan,
    harga_layanan:     data.hargaLayanan,
    harga_tambahan:    data.hargaTambahan,
    total_pembayaran:  data.totalPembayaran,
    metode_pembayaran: data.metodePembayaran,
  };
}

function rowToPengeluaran(row: PengeluaranRow): Pengeluaran {
  return {
    id:         row.id,
    tanggal:    row.tanggal,
    kategori:   row.kategori   as Pengeluaran["kategori"],
    keterangan: row.keterangan,
    jumlah:     Number(row.jumlah),
    createdAt:  row.created_at,
  };
}

function pengeluaranToRow(
  data: Omit<Pengeluaran, "id" | "createdAt">
): Omit<PengeluaranRow, "id" | "created_at"> {
  return {
    tanggal:    data.tanggal,
    kategori:   data.kategori,
    keterangan: data.keterangan,
    jumlah:     data.jumlah,
  };
}

// ═══════════════════════════════════════════════════════════════
// PEMASUKAN
// ═══════════════════════════════════════════════════════════════

/** Ambil semua data pemasukan, terbaru dulu */
export async function getAllPemasukan(): Promise<Pemasukan[]> {
  const { data, error } = await supabase
    .from("pemasukan")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("[getAllPemasukan]", error.message); return []; }
  return (data as PemasukanRow[]).map(rowToPemasukan);
}

/** Tambah pemasukan baru — id & createdAt di-generate oleh DB */
export async function addPemasukan(
  data: Omit<Pemasukan, "id" | "createdAt">
): Promise<Pemasukan | null> {
  const { data: row, error } = await supabase
    .from("pemasukan")
    .insert(pemasukanToRow(data))
    .select()
    .single();

  if (error) { console.error("[addPemasukan]", error.message); return null; }
  return rowToPemasukan(row as PemasukanRow);
}

/** Hapus pemasukan berdasarkan id */
export async function deletePemasukan(id: string): Promise<boolean> {
  const { error } = await supabase.from("pemasukan").delete().eq("id", id);
  if (error) { console.error("[deletePemasukan]", error.message); return false; }
  return true;
}

/** Edit pemasukan — partial update */
export async function updatePemasukan(
  id: string,
  updated: Partial<Omit<Pemasukan, "id" | "createdAt">>
): Promise<Pemasukan | null> {
  const row: Partial<Omit<PemasukanRow, "id" | "created_at">> = {};
  if (updated.tanggal          !== undefined) row.tanggal           = updated.tanggal;
  if (updated.layananUtama     !== undefined) row.layanan_utama     = updated.layananUtama;
  if (updated.layananTambahan  !== undefined) row.layanan_tambahan  = updated.layananTambahan;
  if (updated.hargaLayanan     !== undefined) row.harga_layanan     = updated.hargaLayanan;
  if (updated.hargaTambahan    !== undefined) row.harga_tambahan    = updated.hargaTambahan;
  if (updated.totalPembayaran  !== undefined) row.total_pembayaran  = updated.totalPembayaran;
  if (updated.metodePembayaran !== undefined) row.metode_pembayaran = updated.metodePembayaran;

  const { data, error } = await supabase
    .from("pemasukan")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[updatePemasukan]", error.message); return null; }
  return rowToPemasukan(data as PemasukanRow);
}

/** Pemasukan berdasarkan tanggal tertentu (YYYY-MM-DD) */
export async function getPemasukanByTanggal(tanggal: string): Promise<Pemasukan[]> {
  const { data, error } = await supabase
    .from("pemasukan")
    .select("*")
    .eq("tanggal", tanggal)
    .order("created_at", { ascending: false });

  if (error) { console.error("[getPemasukanByTanggal]", error.message); return []; }
  return (data as PemasukanRow[]).map(rowToPemasukan);
}

/** Total pemasukan berdasarkan tanggal */
export async function getTotalPemasukanHariIni(tanggal: string): Promise<number> {
  const list = await getPemasukanByTanggal(tanggal);
  return list.reduce((sum, p) => sum + p.totalPembayaran, 0);
}

/** Filter pemasukan dengan kriteria lengkap */
export async function getFilteredPemasukan(
  filter: FilterPemasukan
): Promise<Pemasukan[]> {
  let query = supabase.from("pemasukan").select("*");
  if (filter.tanggalDari)   query = query.gte("tanggal", filter.tanggalDari);
  if (filter.tanggalSampai) query = query.lte("tanggal", filter.tanggalSampai);
  if (filter.metodePembayaran && filter.metodePembayaran !== "Semua")
    query = query.eq("metode_pembayaran", filter.metodePembayaran);
  if (filter.layanan && filter.layanan !== "Semua")
    query = query.eq("layanan_utama", filter.layanan);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) { console.error("[getFilteredPemasukan]", error.message); return []; }
  return (data as PemasukanRow[]).map(rowToPemasukan);
}

// ═══════════════════════════════════════════════════════════════
// PENGELUARAN
// ═══════════════════════════════════════════════════════════════

/** Ambil semua data pengeluaran, terbaru dulu */
export async function getAllPengeluaran(): Promise<Pengeluaran[]> {
  const { data, error } = await supabase
    .from("pengeluaran")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) { console.error("[getAllPengeluaran]", error.message); return []; }
  return (data as PengeluaranRow[]).map(rowToPengeluaran);
}

/** Tambah pengeluaran baru */
export async function addPengeluaran(
  data: Omit<Pengeluaran, "id" | "createdAt">
): Promise<Pengeluaran | null> {
  const { data: row, error } = await supabase
    .from("pengeluaran")
    .insert(pengeluaranToRow(data))
    .select()
    .single();

  if (error) { console.error("[addPengeluaran]", error.message); return null; }
  return rowToPengeluaran(row as PengeluaranRow);
}

/** Hapus pengeluaran berdasarkan id */
export async function deletePengeluaran(id: string): Promise<boolean> {
  const { error } = await supabase.from("pengeluaran").delete().eq("id", id);
  if (error) { console.error("[deletePengeluaran]", error.message); return false; }
  return true;
}

/** Edit pengeluaran — partial update */
export async function updatePengeluaran(
  id: string,
  updated: Partial<Omit<Pengeluaran, "id" | "createdAt">>
): Promise<Pengeluaran | null> {
  const row: Partial<Omit<PengeluaranRow, "id" | "created_at">> = {};
  if (updated.tanggal    !== undefined) row.tanggal    = updated.tanggal;
  if (updated.kategori   !== undefined) row.kategori   = updated.kategori;
  if (updated.keterangan !== undefined) row.keterangan = updated.keterangan;
  if (updated.jumlah     !== undefined) row.jumlah     = updated.jumlah;

  const { data, error } = await supabase
    .from("pengeluaran")
    .update(row)
    .eq("id", id)
    .select()
    .single();

  if (error) { console.error("[updatePengeluaran]", error.message); return null; }
  return rowToPengeluaran(data as PengeluaranRow);
}

/** Pengeluaran berdasarkan tanggal */
export async function getPengeluaranByTanggal(tanggal: string): Promise<Pengeluaran[]> {
  const { data, error } = await supabase
    .from("pengeluaran")
    .select("*")
    .eq("tanggal", tanggal)
    .order("created_at", { ascending: false });

  if (error) { console.error("[getPengeluaranByTanggal]", error.message); return []; }
  return (data as PengeluaranRow[]).map(rowToPengeluaran);
}

/** Total pengeluaran berdasarkan tanggal */
export async function getTotalPengeluaranHariIni(tanggal: string): Promise<number> {
  const list = await getPengeluaranByTanggal(tanggal);
  return list.reduce((sum, p) => sum + p.jumlah, 0);
}

/** Filter pengeluaran dengan kriteria lengkap */
export async function getFilteredPengeluaran(
  filter: FilterPengeluaran
): Promise<Pengeluaran[]> {
  let query = supabase.from("pengeluaran").select("*");
  if (filter.tanggalDari)   query = query.gte("tanggal", filter.tanggalDari);
  if (filter.tanggalSampai) query = query.lte("tanggal", filter.tanggalSampai);
  if (filter.kategori && filter.kategori !== "Semua")
    query = query.eq("kategori", filter.kategori);

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) { console.error("[getFilteredPengeluaran]", error.message); return []; }
  return (data as PengeluaranRow[]).map(rowToPengeluaran);
}

// ═══════════════════════════════════════════════════════════════
// LAPORAN & RINGKASAN
// ═══════════════════════════════════════════════════════════════

/** Ringkasan harian: pemasukan, pengeluaran, laba */
export async function getRingkasanHarian(tanggal: string): Promise<RingkasanHarian> {
  const [totalPemasukan, totalPengeluaran] = await Promise.all([
    getTotalPemasukanHariIni(tanggal),
    getTotalPengeluaranHariIni(tanggal),
  ]);
  return { tanggal, totalPemasukan, totalPengeluaran, laba: totalPemasukan - totalPengeluaran };
}

/** Data grafik 7 hari terakhir — 2 query saja, bukan N queries */
export async function getDataGrafik7Hari(): Promise<RingkasanHarian[]> {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().split("T")[0]);
  }
  const startDate = dates[0];
  const endDate   = dates[dates.length - 1];

  const [pRes, eRes] = await Promise.all([
    supabase.from("pemasukan").select("tanggal, total_pembayaran").gte("tanggal", startDate).lte("tanggal", endDate),
    supabase.from("pengeluaran").select("tanggal, jumlah").gte("tanggal", startDate).lte("tanggal", endDate),
  ]);

  if (pRes.error) console.error("[grafik pemasukan]",   pRes.error.message);
  if (eRes.error) console.error("[grafik pengeluaran]", eRes.error.message);

  const pRows = (pRes.data ?? []) as { tanggal: string; total_pembayaran: number }[];
  const eRows = (eRes.data ?? []) as { tanggal: string; jumlah: number }[];

  return dates.map((tanggal) => {
    const totalPemasukan   = pRows.filter(r => r.tanggal === tanggal).reduce((s, r) => s + Number(r.total_pembayaran), 0);
    const totalPengeluaran = eRows.filter(r => r.tanggal === tanggal).reduce((s, r) => s + Number(r.jumlah), 0);
    return { tanggal, totalPemasukan, totalPengeluaran, laba: totalPemasukan - totalPengeluaran };
  });
}

/** Data grafik rentang tanggal custom */
export async function getDataGrafikRentang(dari: string, sampai: string): Promise<RingkasanHarian[]> {
  const [pRes, eRes] = await Promise.all([
    supabase.from("pemasukan").select("tanggal, total_pembayaran").gte("tanggal", dari).lte("tanggal", sampai),
    supabase.from("pengeluaran").select("tanggal, jumlah").gte("tanggal", dari).lte("tanggal", sampai),
  ]);

  if (pRes.error) console.error("[rentang pemasukan]",   pRes.error.message);
  if (eRes.error) console.error("[rentang pengeluaran]", eRes.error.message);

  const pRows = (pRes.data ?? []) as { tanggal: string; total_pembayaran: number }[];
  const eRows = (eRes.data ?? []) as { tanggal: string; jumlah: number }[];

  const dates: string[] = [];
  const start = new Date(dari);
  const end   = new Date(sampai);
  for (const d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(new Date(d).toISOString().split("T")[0]);
  }

  return dates.map((tanggal) => {
    const totalPemasukan   = pRows.filter(r => r.tanggal === tanggal).reduce((s, r) => s + Number(r.total_pembayaran), 0);
    const totalPengeluaran = eRows.filter(r => r.tanggal === tanggal).reduce((s, r) => s + Number(r.jumlah), 0);
    return { tanggal, totalPemasukan, totalPengeluaran, laba: totalPemasukan - totalPengeluaran };
  });
}

/** Total pemasukan rentang tanggal */
export async function getTotalPemasukanRentang(dari: string, sampai: string): Promise<number> {
  const { data, error } = await supabase
    .from("pemasukan").select("total_pembayaran").gte("tanggal", dari).lte("tanggal", sampai);
  if (error) { console.error("[getTotalPemasukanRentang]", error.message); return 0; }
  return (data as { total_pembayaran: number }[]).reduce((s, r) => s + Number(r.total_pembayaran), 0);
}

/** Total pengeluaran rentang tanggal */
export async function getTotalPengeluaranRentang(dari: string, sampai: string): Promise<number> {
  const { data, error } = await supabase
    .from("pengeluaran").select("jumlah").gte("tanggal", dari).lte("tanggal", sampai);
  if (error) { console.error("[getTotalPengeluaranRentang]", error.message); return 0; }
  return (data as { jumlah: number }[]).reduce((s, r) => s + Number(r.jumlah), 0);
}

/** Breakdown pengeluaran per kategori */
export async function getPengeluaranPerKategori(
  dari: string, sampai: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("pengeluaran").select("kategori, jumlah").gte("tanggal", dari).lte("tanggal", sampai);
  if (error) { console.error("[getPengeluaranPerKategori]", error.message); return {}; }
  return (data as { kategori: string; jumlah: number }[]).reduce((acc, r) => {
    acc[r.kategori] = (acc[r.kategori] || 0) + Number(r.jumlah);
    return acc;
  }, {} as Record<string, number>);
}

/** Breakdown pemasukan per metode pembayaran */
export async function getPemasukanPerMetode(
  dari: string, sampai: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("pemasukan").select("metode_pembayaran, total_pembayaran").gte("tanggal", dari).lte("tanggal", sampai);
  if (error) { console.error("[getPemasukanPerMetode]", error.message); return {}; }
  return (data as { metode_pembayaran: string; total_pembayaran: number }[]).reduce((acc, r) => {
    acc[r.metode_pembayaran] = (acc[r.metode_pembayaran] || 0) + Number(r.total_pembayaran);
    return acc;
  }, {} as Record<string, number>);
}