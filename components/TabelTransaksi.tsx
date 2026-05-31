"use client";

import type { Pemasukan, Pengeluaran } from "@/lib/supabase/types";
import { formatTanggalPendek, formatRupiah } from "@/lib/constants";

interface TabelTransaksiProps {
  mode: "pemasukan" | "pengeluaran";
  items: Pemasukan[] | Pengeluaran[];
  onDelete: (id: string) => void;
}

const isPemasukan = (item: Pemasukan | Pengeluaran): item is Pemasukan =>
  (item as Pemasukan).layananUtama !== undefined;

export default function TabelTransaksi({ mode, items, onDelete }: TabelTransaksiProps) {
  return (
    <div className="table-wrap">
      {items.length === 0 ? (
        <div className="empty-state">
          <p>Belum ada data {mode === "pemasukan" ? "pemasukan" : "pengeluaran"}.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table className="table-transaksi">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>{mode === "pemasukan" ? "Layanan" : "Kategori"}</th>
                <th>{mode === "pemasukan" ? "Metode" : "Keterangan"}</th>
                <th className="numeric">Total</th>
                <th className="action-col">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {(items as Array<Pemasukan | Pengeluaran>).map((item) => (
                <tr key={item.id}>
                  <td className="date-cell">{formatTanggalPendek(item.tanggal)}</td>
                  <td>
                    {mode === "pemasukan" ? (
                      isPemasukan(item) ? (
                        <span className="badge badge--primary">{item.layananUtama}</span>
                      ) : (
                        "-"
                      )
                    ) : isPemasukan(item) ? (
                      "-"
                    ) : (
                      <span className="badge badge--warning">{item.kategori}</span>
                    )}
                  </td>
                  <td className="meta-cell">
                    {mode === "pemasukan" ? (
                      isPemasukan(item) ? (
                        <span className="method-tag">{item.metodePembayaran}</span>
                      ) : (
                        "-"
                      )
                    ) : isPemasukan(item) ? (
                      "-"
                    ) : (
                      item.keterangan || <span className="no-desc">Tanpa keterangan</span>
                    )}
                  </td>
                  <td className="numeric total-cell">
                    {mode === "pemasukan" ? (
                      <span className="value-pemasukan">
                        +{formatRupiah(isPemasukan(item) ? item.totalPembayaran : 0)}
                      </span>
                    ) : (
                      <span className="value-pengeluaran">
                        -{formatRupiah(isPemasukan(item) ? 0 : item.jumlah)}
                      </span>
                    )}
                  </td>
                  <td className="action-col">
                    <button
                      type="button"
                      className="delete-button"
                      onClick={() => onDelete(item.id)}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style jsx>{`
        .table-wrap {
          width: 100%;
        }

        .table-scroll {
          overflow-x: auto;
          scrollbar-width: thin;
        }

        .table-transaksi {
          width: 100%;
          border-collapse: collapse;
          min-width: 600px;
        }

        th,
        td {
          padding: 14px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--color-text);
          font-size: 0.9rem;
        }

        th {
          font-family: var(--font-body);
          font-size: 0.72rem;
          color: var(--color-text-muted);
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          border-bottom: 2px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 10px;
        }

        tbody tr {
          background: transparent;
          transition: all 0.2s ease;
        }

        tbody tr:hover {
          background: rgba(255, 255, 255, 0.02);
        }

        .date-cell {
          font-weight: 500;
          color: var(--color-text-muted);
        }

        .meta-cell {
          color: #e2e8f0;
          max-width: 180px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .no-desc {
          color: var(--color-text-muted);
          font-style: italic;
          font-size: 0.85rem;
        }

        .numeric {
          text-align: right;
        }

        .total-cell {
          font-family: var(--font-display);
          font-weight: 700;
        }

        .value-pemasukan {
          color: var(--color-success);
        }

        .value-pengeluaran {
          color: var(--color-danger);
        }

        /* Badge and Tags */
        .badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .badge--primary {
          background: rgba(99, 102, 241, 0.12);
          color: var(--color-primary-dim);
          border: 1px solid rgba(99, 102, 241, 0.15);
        }

        .badge--warning {
          background: rgba(245, 158, 11, 0.12);
          color: var(--color-warning);
          border: 1px solid rgba(245, 158, 11, 0.15);
        }

        .method-tag {
          font-size: 0.82rem;
          color: #94a3b8;
          background: rgba(255, 255, 255, 0.04);
          padding: 3px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.06);
        }

        .action-col {
          text-align: right;
          width: 80px;
        }

        .delete-button {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--color-danger);
          background: rgba(244, 63, 94, 0.06);
          border: 1px solid rgba(244, 63, 94, 0.15);
          border-radius: 8px;
          padding: 6px 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .delete-button:hover {
          background: var(--color-danger);
          color: #ffffff;
          box-shadow: 0 0 10px rgba(244, 63, 94, 0.3);
          transform: translateY(-1px);
        }

        .empty-state {
          padding: 2.5rem 1rem;
          color: var(--color-text-muted);
          text-align: center;
          border: 1px dashed rgba(255, 255, 255, 0.1);
          border-radius: var(--radius);
          background: rgba(255, 255, 255, 0.01);
        }
      `}</style>
    </div>
  );
}
