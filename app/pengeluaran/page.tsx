"use client";

import { useEffect, useState, useCallback } from "react";
import FormPengeluaran from "@/components/FormPengeluaran";
import TabelTransaksi from "@/components/TabelTransaksi";
import { getAllPengeluaran, deletePengeluaran } from "@/lib/supabase/storage";
import { Pengeluaran } from "@/lib/supabase/types";
import { formatRupiah } from "@/lib/constants";

export default function PengeluaranPage() {
  const [data, setData] = useState<Pengeluaran[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAllPengeluaran();
      setData(result);
    } catch (err) {
      setError("Gagal memuat data. Periksa koneksi Anda.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    setData((prev) => prev.filter((item) => item.id !== id));
    const ok = await deletePengeluaran(id);
    if (!ok) {
      await loadData();
      setError("Gagal menghapus pengeluaran. Silakan coba lagi.");
    }
  };

  const totalPengeluaran = data.reduce((sum, item) => sum + item.jumlah, 0);

  return (
    <div className="pengeluaran-page">
      <div className="pengeluaran-bg-glow glow-pengeluaran-1" />
      <div className="pengeluaran-bg-glow glow-pengeluaran-2" />

      <div className="pengeluaran-container container">
        {/* Header */}
        <header className="page-header">
          <div className="page-header-text">
            <p className="page-eyebrow">TRANSAKSI KELUAR</p>
            <h1>Catat Pengeluaran</h1>
            <p className="page-description">
              Pantau dan kelola seluruh pengeluaran operasional laundry Anda dengan rapi.
            </p>
          </div>
          <div className="summary-card glass-panel">
            <span>Total Pengeluaran</span>
            <strong>{formatRupiah(totalPengeluaran)}</strong>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div className="error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span className="error-text">{error}</span>
            <button className="error-dismiss" onClick={() => setError(null)} aria-label="Tutup">✕</button>
          </div>
        )}

        {/* Main grid */}
        <div className="pengeluaran-grid">
          <section className="form-panel glass-panel">
            <FormPengeluaran onSuccess={loadData} />
          </section>

          <section className="table-panel glass-panel">
            <div className="table-header">
              <h2>Riwayat Pengeluaran</h2>
              <span className="count-badge">
                {loading ? "…" : `${data.length} item`}
              </span>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner" />
                <p>Memuat data…</p>
              </div>
            ) : (
              <TabelTransaksi
                mode="pengeluaran"
                items={data}
                onDelete={handleDelete}
              />
            )}
          </section>
        </div>
      </div>

      <style jsx>{`
        /* ── Page shell ── */
        .pengeluaran-page {
          position: relative;
          min-height: 100vh;
          padding: 2.5rem 0 5rem;
          overflow-x: hidden;
          overflow-y: auto;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Decorative glows ── */
        .pengeluaran-bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.2;
          animation: pulse 10s infinite alternate;
        }
        .glow-pengeluaran-1 {
          width: 450px; height: 450px;
          background: radial-gradient(circle, var(--color-primary), transparent 70%);
          top: -120px; right: -80px;
        }
        .glow-pengeluaran-2 {
          width: 350px; height: 350px;
          background: radial-gradient(circle, var(--color-danger), transparent 70%);
          bottom: 50px; left: -80px;
          animation-delay: 2s;
        }
        @keyframes pulse {
          0%   { transform: translateY(0) scale(1);    opacity: 0.15; }
          100% { transform: translateY(15px) scale(1.05); opacity: 0.25; }
        }

        /* ── Container ── */
        .pengeluaran-container {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Header ── */
        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 1.5rem;
          flex-wrap: wrap;
          min-width: 0;
        }

        .page-header-text {
          flex: 1;
          min-width: 0;
        }

        .page-eyebrow {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--color-danger);
          letter-spacing: 2.5px;
          margin-bottom: 0.4rem;
        }
        .page-header h1 {
          font-family: var(--font-display);
          font-size: clamp(1.9rem, 3.5vw, 2.75rem);
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          letter-spacing: -0.8px;
          line-height: 1.1;
        }
        .page-description {
          color: var(--color-text-muted);
          margin-top: 0.4rem;
          max-width: 560px;
          font-size: 0.93rem;
        }

        /* ── Summary card ── */
        .summary-card {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 200px;
          max-width: 100%;
          position: relative;
          overflow: hidden;
          box-sizing: border-box;
        }
        .summary-card::before {
          content: "";
          position: absolute;
          left: 0; top: 0;
          width: 4px; height: 100%;
          background: var(--color-danger);
          border-radius: 4px 0 0 4px;
        }
        .summary-card span {
          color: var(--color-text-muted);
          font-size: 0.78rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }
        .summary-card strong {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 800;
          color: var(--color-danger);
          text-shadow: 0 0 12px rgba(244, 63, 94, 0.25);
          word-break: break-all;
        }

        /* ── Error banner ── */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          background: var(--color-danger-dim);
          border: 1px solid rgba(244, 63, 94, 0.25);
          border-radius: var(--radius-sm);
          color: #fda4af;
          font-size: 0.88rem;
          font-weight: 500;
          animation: fadeSlideDown 0.3s ease;
          box-sizing: border-box;
          min-width: 0;
        }

        .error-text {
          flex: 1;
          min-width: 0;
          word-break: break-word;
        }

        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .error-dismiss {
          flex-shrink: 0;
          margin-left: auto;
          background: none;
          border: none;
          color: inherit;
          cursor: pointer;
          opacity: 0.6;
          font-size: 0.8rem;
          padding: 0 4px;
          transition: opacity 0.15s;
        }
        .error-dismiss:hover { opacity: 1; }

        /* ── Grid layout ── */
        .pengeluaran-grid {
          display: grid;
          grid-template-columns: 340px minmax(0, 1fr);
          gap: 1.5rem;
          align-items: start;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        /* ── Panels ── */
        .form-panel,
        .table-panel {
          padding: 24px;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
          overflow: hidden;
        }

        /* ── Table header ── */
        .table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .table-header h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
        }
        .count-badge {
          color: var(--color-text-muted);
          font-size: 0.82rem;
          font-weight: 600;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.07);
          padding: 3px 10px;
          border-radius: 99px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Loading state ── */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 4rem 1rem;
          color: var(--color-text-muted);
          font-size: 0.88rem;
        }
        .spinner {
          width: 32px; height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.07);
          border-top-color: var(--color-danger);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* ── Responsive ── */
        @media (max-width: 1100px) {
          .pengeluaran-grid {
            grid-template-columns: 300px minmax(0, 1fr);
          }
        }

        @media (max-width: 900px) {
          .pengeluaran-grid {
            grid-template-columns: 1fr;
          }
          .glow-pengeluaran-1 { width: 350px; height: 350px; }
          .glow-pengeluaran-2 { width: 280px; height: 280px; }
        }

        @media (max-width: 768px) {
          .pengeluaran-page { padding: 1.5rem 0 4rem; }
          .pengeluaran-container { gap: 1.25rem; }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 1rem;
          }
          .page-header h1 { font-size: clamp(1.5rem, 4vw, 2rem); }
          .summary-card { width: 100%; min-width: auto; }
        }

        @media (max-width: 640px) {
          .pengeluaran-page { padding: 1rem 0 4rem; }
          .form-panel, .table-panel { padding: 16px; }
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
          }
          .page-eyebrow { font-size: 0.65rem; margin-bottom: 0.3rem; }
          .page-header h1 { font-size: clamp(1.3rem, 5vw, 1.8rem); }
          .page-description { font-size: 0.85rem; }
          .summary-card { width: 100%; padding: 16px 20px; }
          .summary-card strong { font-size: 1.3rem; }
          .glow-pengeluaran-1, .glow-pengeluaran-2 {
            filter: blur(80px);
            opacity: 0.12;
          }
          .table-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.5rem;
          }
          .table-header h2 { font-size: 1rem; }
        }

        @media (max-width: 480px) {
          .pengeluaran-container { gap: 1rem; }
          .form-panel, .table-panel { padding: 12px; }
          .page-header h1 { font-size: 1.4rem; }
          .summary-card { padding: 14px 16px; }
          .summary-card strong { font-size: 1.1rem; }
          .error-banner { font-size: 0.8rem; padding: 10px 12px; gap: 8px; }
        }

        @media (max-width: 360px) {
          .form-panel, .table-panel { padding: 10px; }
          .page-header h1 { font-size: 1.2rem; }
          .summary-card strong { font-size: 1rem; }
        }
      `}</style>
    </div>
  );
}