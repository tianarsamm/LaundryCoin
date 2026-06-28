"use client";

import { useState, type FormEvent } from "react";
import { addPemasukan } from "@/lib/supabase/storage";
import {
  DESKRIPSI_LAYANAN_UTAMA,
  HARGA_LAYANAN_TAMBAHAN,
  HARGA_LAYANAN_UTAMA,
  LIST_LAYANAN_TAMBAHAN,
  LIST_LAYANAN_UTAMA,
  LIST_METODE_PEMBAYARAN,
  formatRupiah,
  getTanggalHariIni,
} from "@/lib/constants";
import type { LayananTambahan, MetodePembayaran } from "@/lib/supabase/types";

interface FormPemasukanProps {
  onSuccess?: () => void;
}

export default function FormPemasukan({ onSuccess }: FormPemasukanProps) {
  const [tanggal, setTanggal] = useState(getTanggalHariIni());
  const [layananUtama, setLayananUtama] = useState(LIST_LAYANAN_UTAMA[0]);
  const [layananTambahan, setLayananTambahan] = useState<LayananTambahan[]>([]);
  const [metodePembayaran, setMetodePembayaran] = useState<MetodePembayaran>(LIST_METODE_PEMBAYARAN[0]);

  const hargaLayanan = HARGA_LAYANAN_UTAMA[layananUtama];
  const hargaTambahan = layananTambahan.reduce((sum, item) => sum + HARGA_LAYANAN_TAMBAHAN[item], 0);
  const totalPembayaran = hargaLayanan + hargaTambahan;

  const handleToggleTambahan = (item: LayananTambahan) => {
    setLayananTambahan((current) =>
      current.includes(item) ? current.filter((v) => v !== item) : [...current, item]
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    addPemasukan({ tanggal, layananUtama, layananTambahan, hargaLayanan, hargaTambahan, totalPembayaran, metodePembayaran });
    setTanggal(getTanggalHariIni());
    setLayananUtama(LIST_LAYANAN_UTAMA[0]);
    setLayananTambahan([]);
    setMetodePembayaran(LIST_METODE_PEMBAYARAN[0]);
    onSuccess?.();
  };

  return (
    <div className="form-pemasukan">
      {/* ✅ FIX: pakai var(--color-text) */}
      <h2>Catat Pemasukan</h2>
      <form onSubmit={handleSubmit} className="form-grid">
        <label className="field">
          <span>Tanggal Transaksi</span>
          <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
        </label>

        <label className="field">
          <span>Layanan Utama</span>
          <select value={layananUtama} onChange={(e) => setLayananUtama(e.target.value as typeof layananUtama)}>
            {LIST_LAYANAN_UTAMA.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <small className="help-text">* Layanan: {DESKRIPSI_LAYANAN_UTAMA[layananUtama]}</small>
        </label>

        <div className="field field--checkbox-group">
          <span>Layanan Tambahan</span>
          <div className="checkbox-grid">
            {LIST_LAYANAN_TAMBAHAN.map((item) => {
              const isChecked = layananTambahan.includes(item);
              return (
                <button key={item} type="button" className={`checkbox-chip ${isChecked ? "checked" : ""}`} onClick={() => handleToggleTambahan(item)}>
                  <span className="chip-indicator" />
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <label className="field">
          <span>Metode Pembayaran</span>
          <select value={metodePembayaran} onChange={(e) => setMetodePembayaran(e.target.value as MetodePembayaran)}>
            {LIST_METODE_PEMBAYARAN.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>

        <div className="summary-box">
          <div className="summary-row">
            <span>Tarif Layanan</span>
            <strong>{formatRupiah(hargaLayanan)}</strong>
          </div>
          <div className="summary-row">
            <span>Tarif Tambahan</span>
            <strong>{formatRupiah(hargaTambahan)}</strong>
          </div>
          <div className="summary-divider" />
          <div className="summary-row summary-total">
            <span>Total Pembayaran</span>
            <strong>{formatRupiah(totalPembayaran)}</strong>
          </div>
        </div>

        <button type="submit" className="submit-button">
          Simpan Transaksi Pemasukan
        </button>
      </form>

      <style jsx>{`
        .form-pemasukan {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          min-width: 0;
          width: 100%;
        }

        /* ✅ FIX: pakai var */
        .form-pemasukan h2 {
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

        /* ✅ FIX: input/select pakai var — tidak lagi rgba putih hardcoded */
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
          border-color: var(--color-primary-dim);
          box-shadow: 0 0 15px rgba(99, 102, 241, 0.15);
          background: var(--color-surface);
        }

        .help-text {
          color: var(--color-primary-dim);
          font-size: 0.78rem;
          font-weight: 500;
          margin-top: 2px;
          word-break: break-word;
          white-space: normal;
        }

        .field--checkbox-group .checkbox-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr;
        }

        /* ✅ FIX: chip pakai var */
        .checkbox-chip {
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid var(--color-border);
          border-radius: 10px;
          padding: 12px 14px;
          background: var(--color-surface-2);
          color: var(--color-text-muted);
          text-align: left;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          width: 100%;
          box-sizing: border-box;
          min-width: 0;
          overflow: hidden;
        }

        .chip-indicator {
          flex-shrink: 0;
          width: 8px; height: 8px;
          border-radius: 50%;
          background: var(--color-border);
          transition: all 0.25s ease;
        }

        .checkbox-chip:hover {
          background: var(--color-surface);
          color: var(--color-text);
          border-color: var(--color-border-hover);
        }

        .checkbox-chip.checked {
          background: rgba(99, 102, 241, 0.1);
          border-color: var(--color-primary);
          color: var(--color-text);
          box-shadow: 0 0 12px rgba(99, 102, 241, 0.1);
        }

        .checkbox-chip.checked .chip-indicator {
          background: var(--color-primary);
          box-shadow: 0 0 8px var(--color-primary);
        }

        /* ✅ FIX: summary box pakai var */
        .summary-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 18px;
          border-radius: 12px;
          background: var(--color-surface-2);
          border: 1px solid var(--color-border);
          min-width: 0;
          width: 100%;
          box-sizing: border-box;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          gap: 8px;
          min-width: 0;
        }

        .summary-row span { color: var(--color-text-muted); font-weight: 500; flex-shrink: 0; }
        .summary-row strong { color: var(--color-text); font-weight: 600; text-align: right; min-width: 0; word-break: break-all; }

        .summary-divider { height: 1px; background: var(--color-border); margin: 4px 0; }

        .summary-total { font-size: 0.95rem; }
        .summary-total span { color: var(--color-text); font-weight: 700; }
        .summary-total strong {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--color-primary-dim);
        }

        .submit-button {
          width: 100%;
          box-sizing: border-box;
          border-radius: 12px;
          padding: 14px 12px;
          background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 700;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 20px rgba(99, 102, 241, 0.3);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .submit-button:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(99, 102, 241, 0.45); filter: brightness(1.1); }
        .submit-button:active { transform: translateY(0); }

        @media (max-width: 640px) {
          .form-grid { gap: 1rem; }
          .form-pemasukan h2 { font-size: 1.1rem; }
          .field input, .field select { padding: 10px 12px; font-size: 0.9rem; }
          .checkbox-chip { padding: 10px 12px; font-size: 0.85rem; }
          .summary-box { padding: 14px; }
          .submit-button { padding: 13px 10px; font-size: 0.88rem; }
        }
        @media (max-width: 380px) {
          .field input, .field select { padding: 9px 10px; font-size: 0.85rem; }
          .submit-button { font-size: 0.82rem; padding: 12px 8px; }
        }
      `}</style>
    </div>
  );
}