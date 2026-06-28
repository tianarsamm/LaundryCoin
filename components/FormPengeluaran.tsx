"use client";

import { useState, type FormEvent } from "react";
import { addPengeluaran } from "@/lib/supabase/storage";
import { LIST_KATEGORI_PENGELUARAN, formatRupiah, getTanggalHariIni } from "@/lib/constants";
import type { KategoriPengeluaran } from "@/lib/supabase/types";

interface FormPengeluaranProps {
  onSuccess?: () => void;
}

export default function FormPengeluaran({ onSuccess }: FormPengeluaranProps) {
  const [tanggal, setTanggal] = useState(getTanggalHariIni());
  const [kategori, setKategori] = useState<KategoriPengeluaran>(LIST_KATEGORI_PENGELUARAN[0]);
  const [keterangan, setKeterangan] = useState("");
  const [jumlah, setJumlah] = useState<number>(0);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (jumlah <= 0) return;
    addPengeluaran({ tanggal, kategori, keterangan, jumlah });
    setTanggal(getTanggalHariIni());
    setKategori(LIST_KATEGORI_PENGELUARAN[0]);
    setKeterangan("");
    setJumlah(0);
    onSuccess?.();
  };

  return (
    <div className="form-pengeluaran">
      <h2>Catat Pengeluaran</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label className="field">
          <span>Tanggal Pengeluaran</span>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </label>

        <label className="field">
          <span>Kategori</span>
          <select value={kategori} onChange={(e) => setKategori(e.target.value as KategoriPengeluaran)}>
            {LIST_KATEGORI_PENGELUARAN.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>

        <label className="field">
          <span>Keterangan</span>
          <input type="text" value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Contoh: Beli sabun detergen cair" />
        </label>

        <label className="field">
          <span>Jumlah Biaya</span>
          <input type="number" min={0} value={jumlah || ""} onChange={(e) => setJumlah(Number(e.target.value))} placeholder="Rp 0" />
        </label>

        <div className="summary-box">
          <span>Jumlah Pengeluaran</span>
          <strong>{formatRupiah(jumlah)}</strong>
        </div>

        <button type="submit" className="submit-button" disabled={jumlah <= 0}>
          Simpan Transaksi Pengeluaran
        </button>
      </form>

      <style jsx>{`
        .form-pengeluaran {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-width: 0;
          width: 100%;
        }

        /* ✅ FIX: pakai var */
        .form-pengeluaran h2 {
          margin: 0;
          font-family: var(--font-display);
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-text);
          letter-spacing: -0.2px;
        }

        .form-grid { display: grid; gap: 1.25rem; min-width: 0; width: 100%; }
        .field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }

        .field span {
          font-family: var(--font-body);
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--color-text-muted);
          text-transform: uppercase;
          letter-spacing: 0.8px;
        }

        /* ✅ FIX: input/select pakai var */
        .field input,
        .field select {
          width: 100%;
          box-sizing: border-box;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          color: var(--color-text);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          outline: none;
          transition: all 0.25s ease;
          appearance: none;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .field select {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 40px;
        }

        /* ✅ FIX: option pakai var */
        .field select option {
          background: var(--color-bg-alt, #0d1322);
          color: var(--color-text);
        }

        .field input:focus,
        .field select:focus {
          border-color: rgba(244, 63, 94, 0.4);
          box-shadow: 0 0 15px rgba(244, 63, 94, 0.15);
          background: var(--color-surface);
        }

        /* ✅ FIX: summary box pakai var */
        .summary-box {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
          padding: 18px;
          border-radius: 12px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          font-size: 0.88rem;
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .summary-box span { color: var(--color-text-muted); font-weight: 500; flex-shrink: 0; }
        .summary-box strong {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-danger);
          text-align: right;
          word-break: break-all;
          min-width: 0;
        }

        .submit-button {
          width: 100%;
          box-sizing: border-box;
          border-radius: 12px;
          padding: 14px 12px;
          background: linear-gradient(135deg, var(--color-danger), #f43f5e);
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(244, 63, 94, 0.3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .submit-button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(244, 63, 94, 0.45); filter: brightness(1.1); }
        .submit-button:active:not(:disabled) { transform: translateY(0); }

        /* ✅ FIX: disabled pakai var */
        .submit-button:disabled {
          background: var(--color-surface-2);
          color: var(--color-text-muted);
          border: 1px solid var(--color-border);
          box-shadow: none;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          .form-grid { gap: 1rem; }
          .form-pengeluaran h2 { font-size: 1.1rem; }
          .field input, .field select { padding: 10px 12px; font-size: 0.9rem; }
          .summary-box { padding: 14px; }
          .summary-box strong { font-size: 1rem; }
          .submit-button { padding: 13px 10px; font-size: 0.88rem; }
        }
        @media (max-width: 380px) {
          .field input, .field select { padding: 9px 10px; font-size: 0.85rem; }
          .summary-box strong { font-size: 0.95rem; }
          .submit-button { font-size: 0.82rem; padding: 12px 8px; }
        }
      `}</style>
    </div>
  );
}