"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { formatRupiah, getTanggalHariIni } from "@/lib/constants";

const tanggal7HariLalu = () => {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split("T")[0];
};

export default function LaporanPage() {
  const [dari, setDari] = useState<string>(tanggal7HariLalu());
  const [sampai, setSampai] = useState<string>(getTanggalHariIni());
  const [pemasukan, setPemasukan] = useState(0);
  const [pengeluaran, setPengeluaran] = useState(0);
  const [metodeBreakdown, setMetodeBreakdown] = useState<Record<string, number>>({});
  const [kategoriBreakdown, setKategoriBreakdown] = useState<Record<string, number>>({});
  const [totalPemasukanAll, setTotalPemasukanAll] = useState(0);
  const [totalPengeluaranAll, setTotalPengeluaranAll] = useState(0);
  const [isLive, setIsLive] = useState(false);

  const loadCounts = useCallback(async () => {
    const [{ count: pemasukanCount }, { count: pengeluaranCount }] = await Promise.all([
      supabase.from("pemasukan").select("id", { count: "exact", head: true }),
      supabase.from("pengeluaran").select("id", { count: "exact", head: true }),
    ]);
    setTotalPemasukanAll(pemasukanCount ?? 0);
    setTotalPengeluaranAll(pengeluaranCount ?? 0);
  }, []);

  const loadRange = useCallback(async () => {
    const [{ data: pemasukanData, error: pemasukanError }, { data: pengeluaranData, error: pengeluaranError }] =
      await Promise.all([
        supabase.from("pemasukan").select("total_pembayaran, metode_pembayaran").gte("tanggal", dari).lte("tanggal", sampai),
        supabase.from("pengeluaran").select("jumlah, kategori").gte("tanggal", dari).lte("tanggal", sampai),
      ]);

    if (pemasukanError) console.error("Failed to load pemasukan:", pemasukanError.message);
    if (pengeluaranError) console.error("Failed to load pengeluaran:", pengeluaranError.message);

    type PemasukanRow = { total_pembayaran: number; metode_pembayaran: string };
    type PengeluaranRow = { jumlah: number; kategori: string };

    const pemasukanList: PemasukanRow[] = (pemasukanData ?? []) as PemasukanRow[];
    const pengeluaranList: PengeluaranRow[] = (pengeluaranData ?? []) as PengeluaranRow[];

    setPemasukan(pemasukanList.reduce((sum, item) => sum + (item.total_pembayaran ?? 0), 0));
    setPengeluaran(pengeluaranList.reduce((sum, item) => sum + (item.jumlah ?? 0), 0));

    setMetodeBreakdown(
      pemasukanList.reduce((acc: Record<string, number>, item) => {
        const key = item.metode_pembayaran || "unknown";
        acc[key] = (acc[key] ?? 0) + (item.total_pembayaran ?? 0);
        return acc;
      }, {})
    );

    setKategoriBreakdown(
      pengeluaranList.reduce((acc: Record<string, number>, item) => {
        const key = item.kategori || "unknown";
        acc[key] = (acc[key] ?? 0) + (item.jumlah ?? 0);
        return acc;
      }, {})
    );
  }, [dari, sampai]);

  useEffect(() => { Promise.resolve().then(() => loadCounts()); }, [loadCounts]);
  useEffect(() => { Promise.resolve().then(() => loadRange()); }, [loadRange]);

  useEffect(() => {
    const channel = supabase
      .channel("laporan-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "pemasukan" }, () => { void loadRange(); void loadCounts(); })
      .on("postgres_changes", { event: "*", schema: "public", table: "pengeluaran" }, () => { void loadRange(); void loadCounts(); })
      .subscribe((status: string) => { setIsLive(status === "SUBSCRIBED"); });

    return () => { supabase.removeChannel(channel); setIsLive(false); };
  }, [loadRange, loadCounts]);

  const laba = pemasukan - pengeluaran;
  const metodeList = useMemo(() => Object.entries(metodeBreakdown).sort((a, b) => b[1] - a[1]), [metodeBreakdown]);
  const kategoriList = useMemo(() => Object.entries(kategoriBreakdown).sort((a, b) => b[1] - a[1]), [kategoriBreakdown]);
  const totalPemasukanRentang = useMemo(() => metodeList.reduce((sum, item) => sum + item[1], 0), [metodeList]);
  const totalPengeluaranRentang = useMemo(() => kategoriList.reduce((sum, item) => sum + item[1], 0), [kategoriList]);

  return (
    <div className="laporan-page">
      <div className="laporan-bg-glow glow-laporan-1" />
      <div className="laporan-bg-glow glow-laporan-2" />

      <div className="laporan-container container">
        <header className="page-header">
          <div>
            <p className="page-eyebrow">MONITORING LABA RUGI</p>
            <h1>
              Laporan Keuangan{" "}
              <span className={`live-badge ${isLive ? "live-badge--on" : "live-badge--off"}`}>
                <span className="live-dot" />
                {isLive ? "LIVE" : "Connecting..."}
              </span>
            </h1>
            <p className="page-description">
              Tinjau arus kas masuk dan keluar secara real-time pada periode tanggal yang Anda pilih.
            </p>
          </div>
          <div className="period-card glass-panel">
            <label className="period-label">
              <span>Dari Tanggal</span>
              <input type="date" value={dari} max={sampai} onChange={(e) => setDari(e.target.value)} />
            </label>
            <div className="period-connector">sampai</div>
            <label className="period-label">
              <span>Sampai Tanggal</span>
              <input type="date" value={sampai} min={dari} onChange={(e) => setSampai(e.target.value)} />
            </label>
          </div>
        </header>

        <section className="summary-grid">
          <article className="summary-card summary-card--income glass-panel">
            <span>Total Pendapatan</span>
            <strong>{formatRupiah(pemasukan)}</strong>
          </article>
          <article className="summary-card summary-card--expense glass-panel">
            <span>Total Pengeluaran</span>
            <strong>{formatRupiah(pengeluaran)}</strong>
          </article>
          <article className={`summary-card ${laba >= 0 ? "summary-card--profit" : "summary-card--loss"} glass-panel`}>
            <span>Estimasi Laba Bersih</span>
            <strong>{formatRupiah(laba)}</strong>
          </article>
        </section>

        <section className="breakdown-grid">
          <div className="breakdown-card glass-panel">
            <header className="breakdown-header">
              <h2>Metode Pembayaran</h2>
              <span>{metodeList.length} metode</span>
            </header>
            <div className="breakdown-list">
              {metodeList.length === 0 ? (
                <p className="empty-text">Belum ada pemasukan pada rentang ini.</p>
              ) : (
                metodeList.map(([name, value], idx) => {
                  const pct = totalPemasukanRentang > 0 ? (value / totalPemasukanRentang) * 100 : 0;
                  return (
                    <div key={name} className="breakdown-item" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="breakdown-item__progress" style={{ width: `${pct}%` }} />
                      <span className="breakdown-item__name">{name}</span>
                      <strong className="breakdown-item__value">{formatRupiah(value)}</strong>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="breakdown-card glass-panel">
            <header className="breakdown-header">
              <h2>Kategori Pengeluaran</h2>
              <span>{kategoriList.length} kategori</span>
            </header>
            <div className="breakdown-list">
              {kategoriList.length === 0 ? (
                <p className="empty-text">Belum ada pengeluaran pada rentang ini.</p>
              ) : (
                kategoriList.map(([name, value], idx) => {
                  const pct = totalPengeluaranRentang > 0 ? (value / totalPengeluaranRentang) * 100 : 0;
                  return (
                    <div key={name} className="breakdown-item" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="breakdown-item__progress breakdown-item__progress--expense" style={{ width: `${pct}%` }} />
                      <span className="breakdown-item__name">{name}</span>
                      <strong className="breakdown-item__value">{formatRupiah(value)}</strong>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        <section className="traffic-card glass-panel">
          <div className="traffic-icon">📁</div>
          <div>
            <h2>Rekapitulasi Total Basis Data</h2>
            <p>Tersimpan {totalPemasukanAll} transaksi pemasukan dan {totalPengeluaranAll} biaya operasional di penyimpanan lokal.</p>
          </div>
        </section>
      </div>

      <style jsx>{`
        .laporan-page {
          position: relative;
          min-height: 100vh;
          padding: 2.5rem 0 5rem;
          overflow: hidden;
        }

        .laporan-bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.2;
          animation: pulse 10s infinite alternate;
        }
        .glow-laporan-1 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, var(--color-primary), transparent 70%);
          top: -100px; right: -100px;
        }
        .glow-laporan-2 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, #8b5cf6, transparent 70%);
          bottom: 100px; left: -100px;
          animation-delay: 3s;
        }
        @keyframes pulse {
          0%   { transform: translateY(0) scale(1);    opacity: 0.15; }
          100% { transform: translateY(20px) scale(1.08); opacity: 0.25; }
        }

        .laporan-container {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          flex-wrap: wrap;
        }

        .page-eyebrow {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--color-primary-dim);
          letter-spacing: 2px;
          margin-bottom: 0.5rem;
        }

        /* ✅ FIX: ganti #ffffff → var(--color-text) */
        .page-header h1 {
          font-family: var(--font-display);
          font-size: clamp(2rem, 3.5vw, 2.75rem);
          font-weight: 800;
          color: var(--color-text);
          margin: 0;
          letter-spacing: -0.8px;
          line-height: 1.1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .page-description {
          color: var(--color-text-muted);
          margin-top: 0.4rem;
          margin-bottom: 0;
          max-width: 560px;
        }

        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-body);
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 1.5px;
          padding: 4px 10px 4px 8px;
          border-radius: 999px;
          vertical-align: middle;
          transition: all 0.4s ease;
        }
        .live-badge--on {
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--color-success);
        }
        .live-badge--off {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          color: var(--color-text-muted);
        }
        .live-dot {
          width: 7px; height: 7px;
          border-radius: 50%;
          background: currentColor;
          flex-shrink: 0;
        }
        .live-badge--on .live-dot { animation: livePulse 1.5s infinite; }
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.4; transform: scale(0.75); }
        }

        /* ✅ FIX: period card pakai var */
        .period-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 20px;
          flex-wrap: wrap;
        }
        .period-label {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .period-label span {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        /* ✅ FIX: input pakai var */
        .period-label input {
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 8px;
          padding: 8px 12px;
          color: var(--color-text);
          font-size: 0.85rem;
          outline: none;
          transition: all 0.25s ease;
        }
        .period-label input:focus {
          border-color: var(--color-primary-dim);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.15);
        }
        .period-connector {
          font-size: 0.85rem;
          color: var(--color-text-muted);
          font-weight: 600;
          padding-top: 14px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 1.5rem;
        }
        .summary-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          position: relative;
        }
        .summary-card::before {
          content: "";
          position: absolute;
          left: 0; top: 0;
          width: 4px; height: 100%;
        }
        .summary-card span {
          color: var(--color-text-muted);
          font-size: 0.8rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .summary-card strong {
          font-family: var(--font-display);
          font-size: 1.85rem;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .summary-card--income::before  { background: var(--color-primary); }
        .summary-card--income strong   { color: var(--color-primary-dim); }
        .summary-card--expense::before { background: var(--color-danger); }
        .summary-card--expense strong  { color: var(--color-danger); }
        .summary-card--profit::before  { background: var(--color-success); }
        .summary-card--profit strong   { color: var(--color-success); }
        .summary-card--loss::before    { background: var(--color-danger); }
        .summary-card--loss strong     { color: var(--color-danger); }

        .breakdown-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .breakdown-card { padding: 24px; }
        .breakdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        /* ✅ FIX: heading pakai var */
        .breakdown-header h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--color-text);
        }
        /* ✅ FIX: badge pakai var */
        .breakdown-header span {
          color: var(--color-text-muted);
          font-size: 0.8rem;
          font-weight: 500;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          padding: 3px 8px;
          border-radius: 6px;
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        /* ✅ FIX: item pakai var */
        .breakdown-item {
          position: relative;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          border-radius: 12px;
          overflow: hidden;
          transition: all 0.2s ease;
          animation: fadeSlideUp 0.4s both;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .breakdown-item:hover {
          border-color: var(--color-border-hover);
          background: var(--color-surface);
        }
        .breakdown-item__progress {
          position: absolute;
          left: 0; bottom: 0;
          height: 3px;
          background: linear-gradient(90deg, transparent, var(--color-primary-dim));
          opacity: 0.4;
          transition: width 0.8s ease-out;
        }
        .breakdown-item__progress--expense {
          background: linear-gradient(90deg, transparent, var(--color-danger));
        }
        /* ✅ FIX: teks item pakai var */
        .breakdown-item__name  { font-weight: 600; color: var(--color-text); z-index: 1; }
        .breakdown-item__value { font-family: var(--font-display); font-weight: 700; color: var(--color-text); z-index: 1; }

        .empty-text {
          color: var(--color-text-muted);
          font-size: 0.9rem;
          margin: 0;
          text-align: center;
          padding: 2rem 0;
          font-style: italic;
        }

        /* ✅ FIX: traffic card pakai var */
        .traffic-card {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .traffic-icon {
          font-size: 1.75rem;
          width: 48px; height: 48px;
          border-radius: 12px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .traffic-card h2 {
          margin: 0 0 3px;
          font-family: var(--font-display);
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--color-text);
        }
        .traffic-card p { margin: 0; color: var(--color-text-muted); font-size: 0.88rem; }

        @media (max-width: 900px) {
          .summary-grid, .breakdown-grid { grid-template-columns: 1fr; gap: 1rem; }
          .period-card { width: 100%; flex-wrap: wrap; gap: 10px; }
          .period-label { flex: 1; min-width: 150px; }
          .period-label input { width: 100%; }
          .period-connector { display: none; }
          .page-header { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 768px) {
          .summary-card strong { font-size: 1.5rem; }
          .traffic-card { flex-direction: column; align-items: flex-start; }
        }
        @media (max-width: 480px) {
          .summary-card strong { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}