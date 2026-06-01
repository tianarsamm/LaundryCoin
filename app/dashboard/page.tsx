"use client";

import { useEffect, useMemo, useState } from "react";
import StatCard from "@/components/Statcard";
import TransaksiChart from "@/components/TransaksiChart";
import { supabase } from "@/lib/supabaseClient";

/* ── Types ── */
type MetodePembayaran = "Cash" | "QRIS" | "Transfer Bank (BCA)";

interface Pemasukan {
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

interface Pengeluaran {
  id: string;
  tanggal: string;
  kategori: string;
  keterangan: string;
  jumlah: number;
  created_at: string;
}

interface RingkasanHarian {
  tanggal: string;
  totalPemasukan: number;
  totalPengeluaran: number;
  laba: number;
}

/* ── Helpers ── */
const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);

const tanggalHariIni = () => new Date().toISOString().split("T")[0];

const METODE_OPTIONS: Array<MetodePembayaran | "Semua"> = [
  "Semua",
  "Cash",
  "QRIS",
  "Transfer Bank (BCA)",
];

/* ── Icons ── */
const IconRevenue = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" fillOpacity="0.12"/>
    <path d="M12 6v1.5M12 16.5V18M8.5 9.5C8.5 8.12 10.07 7 12 7s3.5 1.12 3.5 2.5c0 1.5-1.5 2-2.5 2.5-.8.4-2 .9-2 2.5 0 1.38 1.57 2.5 3.5 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M9.5 14.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconExpense = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="5" width="20" height="14" rx="3" fill="currentColor" fillOpacity="0.12"/>
    <path d="M2 10h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <rect x="5" y="13.5" width="4" height="2.5" rx="1" fill="currentColor"/>
    <path d="M14 14.5h5M2 10h20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
  </svg>
);

const IconProfit = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17l4-5 4 3 4-6 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="19" cy="13" r="3" fill="currentColor" fillOpacity="0.15"/>
    <path d="M17.5 13h3M19 11.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconTransaction = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="4" fill="currentColor" fillOpacity="0.1"/>
    <path d="M8 12h8M8 8h5M8 16h3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    <path d="M14 14l2 2 2-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const IconEmpty = () => (
  <svg width="56" height="56" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="26" width="44" height="30" rx="6" fill="url(#emptyGrad)" fillOpacity="0.15"/>
    <path d="M10 32h44" stroke="url(#emptyStroke)" strokeWidth="1.5" strokeDasharray="3 2"/>
    <path d="M18 26V20a14 14 0 0128 0v6" stroke="url(#emptyStroke)" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="24" cy="42" r="3" fill="currentColor" fillOpacity="0.2"/>
    <circle cx="32" cy="38" r="2" fill="currentColor" fillOpacity="0.15"/>
    <circle cx="40" cy="43" r="2.5" fill="currentColor" fillOpacity="0.18"/>
    <path d="M50 14l1 2 2 1-2 1-1 2-1-2-2-1 2-1z" fill="#6366f1" fillOpacity="0.6"/>
    <path d="M8 18l.7 1.5 1.5.7-1.5.7L8 23l-.7-1.6L5.8 21l1.5-.7z" fill="#06b6d4" fillOpacity="0.5"/>
    <defs>
      <linearGradient id="emptyGrad" x1="10" y1="26" x2="54" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#06b6d4"/>
      </linearGradient>
      <linearGradient id="emptyStroke" x1="10" y1="26" x2="54" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#6366f1"/><stop offset="1" stopColor="#06b6d4"/>
      </linearGradient>
    </defs>
  </svg>
);

export default function DashboardPage() {
  const [pemasukan, setPemasukan] = useState<Pemasukan[]>([]);
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([]);
  const [metodeFilter, setMetodeFilter] = useState<MetodePembayaran | "Semua">("Semua");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const [{ data: pemasukanData, error: pemasukanError }, { data: pengeluaranData, error: pengeluaranError }] =
        await Promise.all([
          supabase.from("pemasukan").select("*"),
          supabase.from("pengeluaran").select("*"),
        ]);
      if (pemasukanError) console.error("Failed to load pemasukan:", pemasukanError.message);
      if (pengeluaranError) console.error("Failed to load pengeluaran:", pengeluaranError.message);
      setPemasukan((pemasukanData as Pemasukan[]) ?? []);
      setPengeluaran((pengeluaranData as Pengeluaran[]) ?? []);
      setLoading(false);
    };
    loadData();
  }, []);

  const today = tanggalHariIni();

  const pemasukanHariIni = pemasukan.filter((item) => item.tanggal === today);
  const pengeluaranHariIni = pengeluaran.filter((item) => item.tanggal === today);

  const pemasukanFiltered =
    metodeFilter === "Semua"
      ? pemasukanHariIni
      : pemasukanHariIni.filter((item) => item.metode_pembayaran === metodeFilter);

  const totalPemasukanHariIni = pemasukanFiltered.reduce(
    (sum, item) => sum + Number(item.total_pembayaran), 0
  );
  const totalPengeluaranHariIni = pengeluaranHariIni.reduce(
    (sum, item) => sum + Number(item.jumlah), 0
  );
  const totalPemasukanSemua = pemasukanHariIni.reduce(
    (sum, item) => sum + Number(item.total_pembayaran), 0
  );
  const labaHariIni = totalPemasukanSemua - totalPengeluaranHariIni;

  const grafikData = useMemo<RingkasanHarian[]>(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const tanggal = d.toISOString().split("T")[0];
      const totalPemasukan = pemasukan
        .filter((item) => item.tanggal === tanggal)
        .reduce((sum, item) => sum + Number(item.total_pembayaran), 0);
      const totalPengeluaran = pengeluaran
        .filter((item) => item.tanggal === tanggal)
        .reduce((sum, item) => sum + Number(item.jumlah), 0);
      return { tanggal, totalPemasukan, totalPengeluaran, laba: totalPemasukan - totalPengeluaran };
    });
  }, [pemasukan, pengeluaran]);

  const chartLabels = grafikData.map((item) => {
    const [, month, day] = item.tanggal.split("-");
    return `${day}/${month}`;
  });
  const chartPemasukan = grafikData.map((item) => item.totalPemasukan);
  const chartPengeluaran = grafikData.map((item) => item.totalPengeluaran);

  const recentTransaksi = [...pemasukanHariIni]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <div className="dashboard-page">
      <div className="dashboard-bg-glow glow-1" />
      <div className="dashboard-bg-glow glow-2" />

      <div className="dashboard-container container">
        {/* Header */}
        <section className="dashboard-header">
          <div>
            <p className="dashboard-eyebrow">RINGKASAN HARI INI</p>
            <h1 className="dashboard-title">Overview Laundry</h1>
            <p className="dashboard-subtitle">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>

          <div className="filter-group">
            {METODE_OPTIONS.map((option) => (
              <button
                key={option}
                className={`filter-button ${metodeFilter === option ? "active" : ""}`}
                onClick={() => setMetodeFilter(option)}
              >
                {option === "Transfer Bank (BCA)" ? "Transfer" : option}
              </button>
            ))}
          </div>
        </section>

        {/* Loading skeleton */}
        {loading ? (
          <div className="skeleton-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card" />
            ))}
          </div>
        ) : (
          <>
            {/* Stats */}
            <section className="stat-grid">
              <StatCard
                label="Pemasukan Hari Ini"
                value={formatRupiah(totalPemasukanHariIni)}
                icon={<IconRevenue />}
                variant="success"
                sublabel={`${pemasukanFiltered.length} transaksi`}
              />
              <StatCard
                label="Pengeluaran Hari Ini"
                value={formatRupiah(totalPengeluaranHariIni)}
                icon={<IconExpense />}
                variant="danger"
                sublabel={`${pengeluaranHariIni.length} pengeluaran`}
              />
              <StatCard
                label="Laba Bersih Hari Ini"
                value={formatRupiah(labaHariIni)}
                icon={<IconProfit />}
                variant={labaHariIni >= 0 ? "success" : "danger"}
                sublabel={labaHariIni >= 0 ? "Profit Untung" : "Defisit"}
              />
            </section>

            {/* Chart + Recent */}
            <div className="dashboard-main-grid">
              <section className="chart-card glass-panel">
                <div className="card-header">
                  <div className="card-header__dot" />
                  <h2>Grafik Transaksi 7 Hari Terakhir</h2>
                </div>
                {/* ✅ FIX: wrapper dengan overflow hidden + padding bawah cukup */}
                <div className="chart-card__wrapper">
                  <div className="chart-card__body">
                    <TransaksiChart
                      labels={chartLabels}
                      pemasukan={chartPemasukan}
                      pengeluaran={chartPengeluaran}
                    />
                  </div>
                </div>
              </section>

              <section className="recent-card glass-panel">
                <div className="card-header">
                  <div className="card-header__dot" />
                  <h2>Transaksi Terkini</h2>
                </div>

                {recentTransaksi.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-wrap"><IconEmpty /></div>
                    <p className="empty-title">Belum ada transaksi</p>
                    <p className="empty-sub">Transaksi hari ini akan muncul di sini</p>
                  </div>
                ) : (
                  <div className="recent-list">
                    {recentTransaksi.map((item, idx) => (
                      <div
                        key={item.id}
                        className="recent-item"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <div className="recent-item__icon"><IconTransaction /></div>
                        <div className="recent-item__info">
                          <p className="recent-name">{item.layanan_utama}</p>
                          <p className="recent-meta">{item.metode_pembayaran}</p>
                        </div>
                        <span className="recent-value">
                          +{formatRupiah(Number(item.total_pembayaran))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        /* ── Page shell ── */
        .dashboard-page {
          position: relative;
          min-height: 100vh;
          padding: 2.5rem 0 5rem;
          overflow: hidden;
        }

        /* ── Decorative glows ── */
        .dashboard-bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.22;
          animation: pulse 8s infinite alternate;
        }
        .glow-1 {
          width: 420px; height: 420px;
          background: radial-gradient(circle, var(--color-primary), transparent 70%);
          top: -100px; right: -80px;
        }
        .glow-2 {
          width: 320px; height: 320px;
          background: radial-gradient(circle, #06b6d4, transparent 70%);
          bottom: 60px; left: -80px;
          animation-delay: 2s;
        }
        @keyframes pulse {
          0%   { transform: translateY(0) scale(1);      opacity: 0.18; }
          100% { transform: translateY(20px) scale(1.1); opacity: 0.28; }
        }

        /* ── Container ── */
        .dashboard-container {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        /* ── Header ── */
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          flex-wrap: wrap;
        }
        .dashboard-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--color-primary);
          letter-spacing: 2.5px;
          margin-bottom: 0.4rem;
        }
        .dashboard-title {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.75rem);
          font-weight: 800;
          color: #fff;
          letter-spacing: -0.8px;
          line-height: 1.1;
        }
        .dashboard-subtitle {
          color: var(--color-text-muted);
          font-size: 0.92rem;
          margin-top: 0.35rem;
        }

        /* ── Filter pills ── */
        .filter-group {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          padding: 5px;
          border-radius: 999px;
        }
        .filter-button {
          border: none;
          background: transparent;
          color: var(--color-text-muted);
          padding: 0.55rem 1.1rem;
          border-radius: 999px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
          white-space: nowrap;
        }
        .filter-button:hover { color: #fff; background: rgba(255,255,255,0.05); }
        .filter-button.active {
          background: var(--color-primary);
          color: #fff;
          box-shadow: 0 4px 14px rgba(99,102,241,0.35);
        }

        /* ── Loading skeleton ── */
        .skeleton-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
        .skeleton-card {
          height: 120px;
          border-radius: 16px;
          background: linear-gradient(
            90deg,
            rgba(255,255,255,0.04) 25%,
            rgba(255,255,255,0.08) 50%,
            rgba(255,255,255,0.04) 75%
          );
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* ── Stat grid ── */
        .stat-grid {
          display: grid;
          gap: 1.25rem;
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        /* ── Main 2-col grid ── */
        .dashboard-main-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.25rem;
        }

        /* ── Cards ── */
        .chart-card,
        .recent-card {
          padding: 24px;
        }

        /* ✅ FIX: chart card dapat padding bawah ekstra agar axis label tidak keluar */
        .chart-card {
          padding-bottom: 32px;
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }
        .card-header h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.05rem;
          font-weight: 700;
          color: #fff;
          letter-spacing: -0.2px;
        }
        .card-header__dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--color-primary);
          box-shadow: 0 0 10px var(--color-primary);
          flex-shrink: 0;
        }

        /* ✅ FIX: wrapper mencegah chart overflow keluar card */
        .chart-card__wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        /* ✅ FIX: height lebih besar dari sebelumnya agar axis tidak terpotong */
        .chart-card__body {
          position: relative;
          height: 320px;
          width: 100%;
        }

        /* ── Recent list ── */
        .recent-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .recent-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 11px 14px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px;
          transition: all 0.22s cubic-bezier(0.4,0,0.2,1);
          animation: fadeSlideUp 0.4s both;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .recent-item:hover {
          border-color: rgba(99,102,241,0.25);
          background: rgba(99,102,241,0.04);
          transform: translateX(3px);
        }
        .recent-item__icon {
          width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.1);
          border: 1px solid rgba(99,102,241,0.18);
          border-radius: 10px;
          flex-shrink: 0;
          color: var(--color-primary-dim);
        }
        .recent-item__info { flex: 1; min-width: 0; }
        .recent-name {
          margin: 0 0 2px;
          font-weight: 700;
          font-size: 0.88rem;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recent-meta {
          margin: 0;
          color: var(--color-text-muted);
          font-size: 0.76rem;
          font-weight: 500;
        }
        .recent-value {
          font-family: var(--font-display);
          font-weight: 800;
          font-size: 0.88rem;
          color: var(--color-success);
          white-space: nowrap;
        }

        /* ── Empty state ── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem;
          text-align: center;
          gap: 0.5rem;
        }
        .empty-icon-wrap {
          width: 80px; height: 80px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.12);
          border-radius: 22px;
          margin-bottom: 0.75rem;
          color: var(--color-primary-dim);
          animation: float 4s ease-in-out infinite;
        }
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-7px); }
        }
        .empty-title { font-weight: 700; font-size: 0.95rem; color: var(--color-text); margin: 0; }
        .empty-sub   { font-size: 0.8rem; color: var(--color-text-muted); margin: 0; }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .dashboard-main-grid { grid-template-columns: 3fr 2fr; }
        }
        @media (max-width: 900px) {
          .dashboard-main-grid { grid-template-columns: 1fr; }
        }

        /* Stat grid: turun ke 2-col lebih awal agar angka rupiah tidak terpotong */
        @media (max-width: 720px) {
          .stat-grid,
          .skeleton-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .stat-grid > *:last-child,
          .skeleton-grid > *:last-child {
            grid-column: 1 / -1;
          }
        }

        @media (max-width: 768px) {
          .dashboard-page { padding: 1.5rem 0 4rem; }
          .dashboard-container { gap: 1.25rem; }
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .dashboard-title { font-size: clamp(1.5rem, 2.5vw, 2rem); }
          .filter-group { width: 100%; border-radius: 12px; }
          .filter-button { flex: 1; min-width: 60px; padding: 0.5rem 0.4rem; font-size: 0.76rem; }
          .chart-card, .recent-card { padding: 18px 16px; }

          /* ✅ FIX: padding bawah ekstra di tablet */
          .chart-card { padding-bottom: 36px; }

          /* ✅ FIX: height lebih tinggi agar axis label tidak terpotong */
          .chart-card__body { height: 280px; }
          .card-header h2 { font-size: 1rem; }
        }

        @media (max-width: 640px) {
          .dashboard-page { padding: 1rem 0 4rem; }
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .dashboard-title   { font-size: clamp(1.3rem, 2vw, 1.8rem); letter-spacing: -0.6px; }
          .dashboard-subtitle { font-size: 0.8rem; }
          .dashboard-eyebrow  { font-size: 0.65rem; margin-bottom: 0.2rem; }
          .stat-grid,
          .skeleton-grid {
            grid-template-columns: 1fr;
            gap: 0.875rem;
          }
          .stat-grid > *:last-child,
          .skeleton-grid > *:last-child {
            grid-column: auto;
          }
          .filter-group { width: 100%; padding: 3px; border-radius: 10px; }
          .filter-button { padding: 0.5rem 0.3rem; font-size: 0.7rem; }
          .chart-card, .recent-card { padding: 14px; }

          /* ✅ FIX: cukup ruang untuk axis label di mobile */
          .chart-card { padding-bottom: 40px; }

          /* ✅ FIX: height naik dari 200px → 240px agar axis tidak terpotong */
          .chart-card__body { height: 240px; }
          .card-header { margin-bottom: 16px; gap: 8px; }
          .card-header h2 { font-size: 0.9rem; }
          .recent-list  { gap: 6px; }
          .recent-item  { padding: 10px 12px; gap: 10px; }
          .recent-item__icon { width: 32px; height: 32px; }
          .recent-name  { font-size: 0.8rem; }
          .recent-meta  { font-size: 0.7rem; }
          .recent-value { font-size: 0.8rem; }
          .empty-state  { padding: 2rem 1rem; }
          .empty-icon-wrap { width: 60px; height: 60px; }
          .empty-title  { font-size: 0.9rem; }
          .empty-sub    { font-size: 0.75rem; }
          .glow-1, .glow-2 { filter: blur(80px); opacity: 0.12; }
        }

        @media (max-width: 480px) {
          .dashboard-page { padding: 0.75rem 0 3.5rem; }
          .dashboard-container { gap: 1rem; }
          .dashboard-title { font-size: 1.4rem; }
          /* Filter: scroll horizontal agar tidak dipaksa wrapping */
          .filter-group {
            overflow-x: auto;
            flex-wrap: nowrap;
            border-radius: 10px;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .filter-group::-webkit-scrollbar { display: none; }
          .filter-button {
            flex-shrink: 0;
            font-size: 0.65rem;
            padding: 0.45rem 0.65rem;
          }
          .chart-card, .recent-card { padding: 12px; }

          /* ✅ FIX: padding bawah extra di hp kecil */
          .chart-card { padding-bottom: 44px; }

          /* ✅ FIX: height naik dari 180px → 220px */
          .chart-card__body { height: 220px; }
          .card-header { margin-bottom: 12px; }
          .card-header__dot { width: 6px; height: 6px; }
          .recent-item { padding: 8px 10px; }
          .recent-item__icon { width: 28px; height: 28px; }
        }
      `}</style>
    </div>
  );
}