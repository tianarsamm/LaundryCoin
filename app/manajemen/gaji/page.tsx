"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────
type MetodeBayar = "Transfer Bank" | "Cash" | "GoPay" | "OVO" | "DANA";
type StatusGaji  = "Sudah Dibayar" | "Belum Dibayar" | "Proses";

interface RiwayatGaji {
  id: string;
  periode: string;          // "Mei 2026"
  hadir: number;
  telat: number;
  lembur_jam: number;
  gaji_pokok: number;
  tarif_lembur: number;
  potongan_telat: number;   // per kejadian telat
  total_gaji: number;
  status: StatusGaji;
  tanggal_bayar: string | null;
  catatan: string;
}

interface PengaturanGaji {
  gaji_pokok: number;
  tarif_lembur: number;     // per jam
  tanggal_gajian: number;   // 1–31
  metode_bayar: MetodeBayar;
  nama_bank: string;
  nomor_rekening: string;
  potongan_per_telat: number;
}

interface KaryawanInfo {
  id: string;
  nama: string;
  role: string;
  nomor_wa: string;
  email: string;
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
const MOCK_KARYAWAN: KaryawanInfo = {
  id: "1",
  nama: "Budi Santoso",
  role: "Admin",
  nomor_wa: "08123456789",
  email: "budi@gmail.com",
};

const MOCK_PENGATURAN: PengaturanGaji = {
  gaji_pokok: 2_000_000,
  tarif_lembur: 10_000,
  tanggal_gajian: 1,
  metode_bayar: "Transfer Bank",
  nama_bank: "BCA",
  nomor_rekening: "123456789",
  potongan_per_telat: 25_000,
};

const MOCK_RIWAYAT: RiwayatGaji[] = [
  {
    id: "r1",
    periode: "Mei 2026",
    hadir: 24,
    telat: 2,
    lembur_jam: 5,
    gaji_pokok: 2_000_000,
    tarif_lembur: 10_000,
    potongan_telat: 25_000,
    total_gaji: 2_000_000 + 5 * 10_000 - 2 * 25_000,
    status: "Sudah Dibayar",
    tanggal_bayar: "2026-05-01",
    catatan: "Pembayaran tepat waktu",
  },
  {
    id: "r2",
    periode: "April 2026",
    hadir: 25,
    telat: 1,
    lembur_jam: 3,
    gaji_pokok: 2_000_000,
    tarif_lembur: 10_000,
    potongan_telat: 25_000,
    total_gaji: 2_000_000 + 3 * 10_000 - 1 * 25_000,
    status: "Sudah Dibayar",
    tanggal_bayar: "2026-04-01",
    catatan: "",
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

const BULAN = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const now = new Date();
const PERIODE_OPTIONS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
  return `${BULAN[d.getMonth()]} ${d.getFullYear()}`;
});

const STATUS_COLOR: Record<StatusGaji, string> = {
  "Sudah Dibayar": "status-paid",
  "Belum Dibayar": "status-unpaid",
  "Proses":        "status-process",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IBack    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const ICalc    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h.01M8 18h2M12 18h2M16 18h.01" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>;
const IDown    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IPrint   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M6 9V2h12v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="2" y="9" width="20" height="10" rx="2" stroke="currentColor" strokeWidth="1.8"/><path d="M6 19v3h12v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><circle cx="17" cy="14" r="1" fill="currentColor"/></svg>;
const IWA      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IPlus    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
const ICheck   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IX       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const ISave    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M17 21v-8H7v8M7 3v5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;

// ─── Modal Detail Slip ────────────────────────────────────────────────────────
function ModalDetail({
  r, nama, nomor_wa, onClose,
}: {
  r: RiwayatGaji;
  nama: string;
  nomor_wa: string;
  onClose: () => void;
}) {
  const lembur_total    = r.lembur_jam * r.tarif_lembur;
  const potongan_total  = r.telat * r.potongan_telat;
  const bersih          = r.gaji_pokok + lembur_total - potongan_total;

  const handleWA = () => {
    const msg = encodeURIComponent(
      `Slip Gaji ${r.periode}\n` +
      `Nama: ${nama}\n` +
      `Gaji Pokok: ${IDR(r.gaji_pokok)}\n` +
      `Lembur (${r.lembur_jam} jam × ${IDR(r.tarif_lembur)}): ${IDR(lembur_total)}\n` +
      `Potongan Telat (${r.telat}× × ${IDR(r.potongan_telat)}): -${IDR(potongan_total)}\n` +
      `━━━━━━━━━━━━━━━\n` +
      `GAJI DITERIMA: ${IDR(bersih)}\n` +
      `Status: ${r.status}`
    );
    window.open(`https://wa.me/62${nomor_wa.slice(1)}?text=${msg}`, "_blank");
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="slip-card">
        {/* Slip header */}
        <div className="slip-top">
          <div className="slip-logo">💼</div>
          <div>
            <div className="slip-title">Slip Gaji</div>
            <div className="slip-period">{r.periode}</div>
          </div>
          <button className="btn-icon-sm" onClick={onClose}><IX /></button>
        </div>

        <div className="slip-name">{nama}</div>
        <div className="slip-divider" />

        {/* Kehadiran */}
        <div className="slip-section-label">Kehadiran</div>
        <div className="slip-rows">
          <div className="slip-row"><span>Hari Hadir</span><span>{r.hadir} hari</span></div>
          <div className="slip-row"><span>Keterlambatan</span><span>{r.telat}×</span></div>
          <div className="slip-row"><span>Lembur</span><span>{r.lembur_jam} jam</span></div>
        </div>

        <div className="slip-divider" />

        {/* Rincian */}
        <div className="slip-section-label">Rincian Gaji</div>
        <div className="slip-rows">
          <div className="slip-row">
            <span>Gaji Pokok</span>
            <span className="slip-plus">{IDR(r.gaji_pokok)}</span>
          </div>
          <div className="slip-row">
            <span>Tunjangan Lembur<br/><small>{r.lembur_jam} jam × {IDR(r.tarif_lembur)}/jam</small></span>
            <span className="slip-plus">+ {IDR(lembur_total)}</span>
          </div>
          {potongan_total > 0 && (
            <div className="slip-row">
              <span>Potongan Telat<br/><small>{r.telat}× × {IDR(r.potongan_telat)}</small></span>
              <span className="slip-minus">− {IDR(potongan_total)}</span>
            </div>
          )}
        </div>

        <div className="slip-divider" />

        <div className="slip-total-row">
          <span>GAJI DITERIMA</span>
          <span className="slip-total-num">{IDR(bersih)}</span>
        </div>

        {r.status === "Sudah Dibayar" && r.tanggal_bayar && (
          <div className="slip-paid-badge">
            <ICheck /> Dibayar {new Date(r.tanggal_bayar).toLocaleDateString("id-ID", { day:"numeric", month:"long", year:"numeric" })}
          </div>
        )}

        {r.catatan && (
          <div className="slip-catatan">📝 {r.catatan}</div>
        )}

        <div className="slip-actions">
          <button className="btn-slip btn-slip-ghost" onClick={() => window.print()}>
            <IPrint /> Print
          </button>
          <button className="btn-slip btn-slip-ghost" onClick={() => alert("Unduh slip sebagai PDF")}>
            <IDown /> Download
          </button>
          <button className="btn-slip btn-slip-wa" onClick={handleWA}>
            <IWA /> Kirim WA
          </button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn 0.15s; }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        .slip-card { background:#0f172a;border:1px solid rgba(99,102,241,0.25);border-radius:16px;width:min(100%,680px);max-width:100%;padding:1.75rem;display:flex;flex-direction:column;gap:1rem;animation:slideUp 0.2s;max-height:calc(100vh - 2rem);overflow-y:auto; }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1} }
        .slip-top { display:flex;align-items:center;gap:10px; }
        .slip-logo { font-size:1.5rem;width:40px;height:40px;background:rgba(99,102,241,0.12);border-radius:10px;display:flex;align-items:center;justify-content:center; }
        .slip-title { font-size:1rem;font-weight:800;color:#fff; }
        .slip-period { font-size:0.78rem;color:#94a3b8; }
        .btn-icon-sm { margin-left:auto;background:none;border:none;color:#64748b;cursor:pointer;padding:4px;display:flex;align-items:center;transition:color 0.15s; }
        .btn-icon-sm:hover { color:#fff; }
        .slip-name { font-size:1.1rem;font-weight:700;color:#e2e8f0; }
        .slip-divider { height:1px;background:rgba(51,65,85,0.8); }
        .slip-section-label { font-size:0.7rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.8px; }
        .slip-rows { display:flex;flex-direction:column;gap:6px; }
        .slip-row { display:flex;justify-content:space-between;align-items:flex-start;font-size:0.85rem;color:#cbd5e1; }
        .slip-row small { font-size:0.72rem;color:#64748b;display:block; }
        .slip-plus { color:#4ade80;font-weight:600; }
        .slip-minus { color:#f87171;font-weight:600; }
        .slip-total-row { display:flex;justify-content:space-between;align-items:center;padding:0.75rem 1rem;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);border-radius:10px; }
        .slip-total-row span:first-child { font-size:0.8rem;font-weight:700;color:#a5b4fc;letter-spacing:0.5px; }
        .slip-total-num { font-size:1.2rem;font-weight:800;color:#fff; }
        .slip-paid-badge { display:inline-flex;align-items:center;gap:6px;font-size:0.78rem;color:#4ade80;background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.2);border-radius:8px;padding:6px 12px; }
        .slip-catatan { font-size:0.8rem;color:#94a3b8;background:rgba(30,41,59,0.6);border-radius:8px;padding:8px 12px; }
        .slip-actions { display:flex;gap:8px;margin-top:0.25rem; }
        .btn-slip { flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:0.65rem;border-radius:8px;font-size:0.8rem;font-weight:600;cursor:pointer;transition:all 0.2s; }
        .btn-slip-ghost { background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.8);color:#94a3b8; }
        .btn-slip-ghost:hover { border-color:rgba(99,102,241,0.4);color:#a5b4fc;background:rgba(99,102,241,0.08); }
        .btn-slip-wa { background:#16a34a;border:none;color:#fff; }
        .btn-slip-wa:hover { background:#15803d; }
      `}</style>
    </div>
  );
}

// ─── Modal Tambah Gaji (Hitung & Catat) ──────────────────────────────────────
function ModalTambahGaji({
  pengaturan, onClose, onSave,
}: {
  pengaturan: PengaturanGaji;
  onClose: () => void;
  onSave: (r: Omit<RiwayatGaji, "id">) => void;
}) {
  const [periode, setPeriode]   = useState(PERIODE_OPTIONS[0]);
  const [hadir, setHadir]       = useState(26);
  const [telat, setTelat]       = useState(0);
  const [lembur, setLembur]     = useState(0);
  const [status, setStatus]     = useState<StatusGaji>("Belum Dibayar");
  const [tglBayar, setTglBayar] = useState(new Date().toISOString().slice(0,10));
  const [catatan, setCatatan]   = useState("");

  const lembur_total   = lembur * pengaturan.tarif_lembur;
  const potongan_total = telat * pengaturan.potongan_per_telat;
  const total_gaji     = pengaturan.gaji_pokok + lembur_total - potongan_total;

  const handleSave = () => {
    onSave({
      periode,
      hadir,
      telat,
      lembur_jam: lembur,
      gaji_pokok: pengaturan.gaji_pokok,
      tarif_lembur: pengaturan.tarif_lembur,
      potongan_telat: pengaturan.potongan_per_telat,
      total_gaji,
      status,
      tanggal_bayar: status === "Sudah Dibayar" ? tglBayar : null,
      catatan,
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card">
        <div className="mh">
          <div className="mh-left">
            <div className="mh-icon"><ICalc /></div>
            <div>
              <h2>Tambah Catatan Gaji</h2>
              <p>Masukkan data kehadiran & hitung gaji</p>
            </div>
          </div>
          <button className="btn-icon-sm" onClick={onClose}><IX /></button>
        </div>

        <div className="mform">
          {/* Periode */}
          <div className="mfield">
            <label>Periode Gaji</label>
            <select value={periode} onChange={e => setPeriode(e.target.value)}>
              {PERIODE_OPTIONS.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>

          {/* Kehadiran row */}
          <div className="mrow">
            <div className="mfield">
              <label>Hari Hadir</label>
              <input type="number" min={0} max={31} value={hadir} onChange={e => setHadir(+e.target.value)} />
            </div>
            <div className="mfield">
              <label>Keterlambatan (×)</label>
              <input type="number" min={0} value={telat} onChange={e => setTelat(+e.target.value)} />
              <span className="hint">Potongan {IDR(pengaturan.potongan_per_telat)}/kali</span>
            </div>
          </div>

          {/* Lembur */}
          <div className="mfield">
            <label>Jam Lembur</label>
            <div className="lembur-input">
              <input type="number" min={0} step={0.5} value={lembur} onChange={e => setLembur(+e.target.value)} />
              <span className="lembur-calc">× {IDR(pengaturan.tarif_lembur)}/jam = <strong>{IDR(lembur_total)}</strong></span>
            </div>
          </div>

          {/* Kalkulasi preview */}
          <div className="calc-preview">
            <div className="calc-row"><span>Gaji Pokok</span><span>{IDR(pengaturan.gaji_pokok)}</span></div>
            <div className="calc-row plus"><span>+ Lembur</span><span>{IDR(lembur_total)}</span></div>
            {potongan_total > 0 && (
              <div className="calc-row minus"><span>− Potongan Telat</span><span>{IDR(potongan_total)}</span></div>
            )}
            <div className="calc-divider"/>
            <div className="calc-row total"><span>Total Gaji</span><span>{IDR(total_gaji)}</span></div>
          </div>

          {/* Status */}
          <div className="mrow">
            <div className="mfield">
              <label>Status Pembayaran</label>
              <select value={status} onChange={e => setStatus(e.target.value as StatusGaji)}>
                <option>Sudah Dibayar</option>
                <option>Belum Dibayar</option>
                <option>Proses</option>
              </select>
            </div>
            {status === "Sudah Dibayar" && (
              <div className="mfield">
                <label>Tanggal Bayar</label>
                <input type="date" value={tglBayar} onChange={e => setTglBayar(e.target.value)} />
              </div>
            )}
          </div>

          {/* Catatan */}
          <div className="mfield">
            <label>Catatan (opsional)</label>
            <textarea rows={2} placeholder="cth. Bonus akhir tahun..." value={catatan} onChange={e => setCatatan(e.target.value)} />
          </div>

          <div className="mactions">
            <button className="btn-secondary" onClick={onClose}>Batal</button>
            <button className="btn-primary" onClick={handleSave}><ISave /> Simpan & Catat</button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay { position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fadeIn 0.15s; }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        .modal-card { background:#0f172a;border:1px solid rgba(99,102,241,0.25);border-radius:16px;width:min(100%,720px);max-width:100%;padding:1.75rem;display:flex;flex-direction:column;gap:1.25rem;animation:slideUp 0.2s;max-height:calc(100vh - 2rem);overflow-y:auto; }
        @keyframes slideUp { from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1} }
        .mh { display:flex;align-items:flex-start;justify-content:space-between;gap:1rem; }
        .mh-left { display:flex;align-items:center;gap:10px; }
        .mh-icon { width:36px;height:36px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);border-radius:9px;display:flex;align-items:center;justify-content:center;color:#818cf8; }
        .mh h2 { font-size:1rem;font-weight:800;color:#fff;margin:0 0 2px; }
        .mh p { font-size:0.78rem;color:#64748b;margin:0; }
        .btn-icon-sm { background:none;border:none;color:#64748b;cursor:pointer;padding:4px;display:flex;align-items:center; }
        .btn-icon-sm:hover { color:#fff; }
        .mform { display:flex;flex-direction:column;gap:1rem; }
        .mfield { display:flex;flex-direction:column;gap:4px;flex:1; }
        .mrow { display:grid;grid-template-columns:1fr 1fr;gap:1rem; }
        label { font-size:0.78rem;font-weight:700;color:#64748b; }
        .hint { font-size:0.72rem;color:#475569; }
        input, select, textarea { width:100%;padding:0.65rem 0.85rem;background:rgba(15,23,42,0.8);border:1px solid rgba(51,65,85,0.8);border-radius:8px;color:#e2e8f0;font-size:0.875rem;transition:border 0.2s; }
        input:focus, select:focus, textarea:focus { border-color:#6366f1;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.15); }
        textarea { resize:vertical;font-family:inherit; }
        .lembur-input { display:flex;flex-direction:column;gap:6px; }
        .lembur-calc { font-size:0.8rem;color:#94a3b8; }
        .lembur-calc strong { color:#4ade80; }
        .calc-preview { background:rgba(15,23,42,0.6);border:1px solid rgba(51,65,85,0.6);border-radius:10px;padding:1rem;display:flex;flex-direction:column;gap:6px; }
        .calc-row { display:flex;justify-content:space-between;font-size:0.84rem;color:#94a3b8; }
        .calc-row.plus span:last-child { color:#4ade80; }
        .calc-row.minus span:last-child { color:#f87171; }
        .calc-row.total { font-size:1rem;font-weight:800;color:#fff; }
        .calc-divider { height:1px;background:rgba(51,65,85,0.8);margin:4px 0; }
        .mactions { display:flex;justify-content:flex-end;gap:0.75rem;padding-top:0.25rem; }
        .btn-secondary { padding:0.65rem 1.2rem;background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.8);border-radius:8px;color:#94a3b8;font-size:0.875rem;font-weight:600;cursor:pointer; }
        .btn-secondary:hover { color:#e2e8f0; }
        .btn-primary { display:flex;align-items:center;gap:6px;padding:0.65rem 1.3rem;background:#6366f1;border:none;border-radius:8px;color:#fff;font-size:0.875rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.3); }
        .btn-primary:hover { background:#4f46e5; }
        @media (max-width:500px) { .mrow { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GajiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("id");

  const [karyawan, setKaryawan] = useState<KaryawanInfo | null>(null);
  const [tab, setTab]             = useState<"info"|"riwayat"|"slip"|"pengaturan">("info");

  useEffect(() => {
    if (!userId || typeof window === "undefined") return;

    const loadKaryawan = async () => {
      const stored = window.sessionStorage.getItem(`karyawan_${userId}`);
      if (stored) {
        try {
          setKaryawan(JSON.parse(stored));
          return;
        } catch (err) {
          console.error("Failed to parse stored karyawan", err);
        }
      }

      const { data, error } = await supabase
        .from("users")
        .select("id, nama, role, no_hp, email")
        .eq("id", userId)
        .single();

      if (!error && data) {
        setKaryawan({
          id: data.id,
          nama: data.nama ?? MOCK_KARYAWAN.nama,
          role: data.role ?? MOCK_KARYAWAN.role,
          nomor_wa: data.no_hp ?? data.nomor_wa ?? MOCK_KARYAWAN.nomor_wa,
          email: data.email ?? MOCK_KARYAWAN.email,
        });
      }
    };

    loadKaryawan();
  }, [userId]);
  const [riwayat, setRiwayat]     = useState<RiwayatGaji[]>(MOCK_RIWAYAT);
  const [pengaturan, setPengaturan] = useState<PengaturanGaji>(MOCK_PENGATURAN);

  // Modals
  const [modalDetail, setModalDetail]         = useState<RiwayatGaji | null>(null);
  const [modalTambah, setModalTambah]         = useState(false);

  // Pengaturan form state
  const [pg, setPg] = useState({ ...MOCK_PENGATURAN });

  const handleSavePengaturan = () => {
    setPengaturan({ ...pg });
    alert("Pengaturan gaji disimpan!");
  };

  const handleSaveRiwayat = (r: Omit<RiwayatGaji, "id">) => {
    const newR: RiwayatGaji = { ...r, id: `r${Date.now()}` };
    setRiwayat(prev => [newR, ...prev]);
    setModalTambah(false);
    setTab("riwayat");
  };

  const sudahBayar = riwayat.filter(r => r.status === "Sudah Dibayar").length;

  if (!userId) {
    return (
      <div className="pg">
        <div className="topbar">
          <button className="btn-back" onClick={() => router.back()}>
            <IBack /> Kembali
          </button>
        </div>
        <div className="empty" style={{ padding: "2rem", color: "#fff" }}>
          Data karyawan tidak ditemukan. Kembali ke halaman Manajemen dan pilih karyawan terlebih dahulu.
        </div>
      </div>
    );
  }

  if (!karyawan) {
    return (
      <div className="pg">
        <div className="topbar">
          <button className="btn-back" onClick={() => router.back()}>
            <IBack /> Kembali
          </button>
        </div>
        <div className="empty" style={{ padding: "2rem", color: "#fff" }}>
          Memuat data karyawan...
        </div>
      </div>
    );
  }

  return (
    <div className="pg">
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div className="topbar">
        <button className="btn-back" onClick={() => router.back()}>
          <IBack /> Kembali
        </button>
      </div>

      {/* ── Header karyawan ─────────────────────────────────────── */}
      <div className="emp-header glass">
        <div className="emp-avatar">{karyawan.nama.charAt(0)}</div>
        <div className="emp-info">
          <div className="emp-nama">{karyawan.nama}</div>
          <div className="emp-meta">
            <span className="badge-role">{karyawan.role}</span>
            <span>·</span>
            <a href={`https://wa.me/62${karyawan.nomor_wa.slice(1)}`} target="_blank" rel="noreferrer" className="wa-link">{karyawan.nomor_wa}</a>
            <span>·</span>
            <span>{karyawan.email}</span>
          </div>
        </div>
        {/* quick stats */}
        <div className="emp-stats">
          <div className="emp-stat">
            <span className="emp-stat-num">{IDR(pengaturan.gaji_pokok)}</span>
            <span className="emp-stat-label">Gaji Pokok</span>
          </div>
          <div className="emp-stat-sep"/>
          <div className="emp-stat">
            <span className="emp-stat-num">{riwayat.length}</span>
            <span className="emp-stat-label">Total Catatan</span>
          </div>
          <div className="emp-stat-sep"/>
          <div className="emp-stat">
            <span className="emp-stat-num stat-green">{sudahBayar}</span>
            <span className="emp-stat-label">Sudah Dibayar</span>
          </div>
        </div>
      </div>

      {/* ── Tab ─────────────────────────────────────────────────── */}
      <div className="tabs glass">
        {(["info","riwayat","slip","pengaturan"] as const).map(t => (
          <button
            key={t}
            className={`tab-btn ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            { t === "info" ? "Informasi Gaji"
            : t === "riwayat" ? "Riwayat Gaji"
            : t === "slip" ? "Slip Gaji"
            : "Pengaturan" }
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════
          TAB: INFORMASI GAJI
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "info" && (
        <div className="content glass">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Gaji Pokok</span>
              <span className="info-val">{IDR(pengaturan.gaji_pokok)}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tarif Lembur</span>
              <span className="info-val">{IDR(pengaturan.tarif_lembur)}<span className="info-unit"> / jam</span></span>
            </div>
            <div className="info-item">
              <span className="info-label">Potongan Telat</span>
              <span className="info-val">{IDR(pengaturan.potongan_per_telat)}<span className="info-unit"> / kali</span></span>
            </div>
            <div className="info-item">
              <span className="info-label">Tanggal Gajian</span>
              <span className="info-val">Setiap tanggal <strong>{pengaturan.tanggal_gajian}</strong></span>
            </div>
            <div className="info-item">
              <span className="info-label">Metode Bayar</span>
              <span className="info-val">{pengaturan.metode_bayar}</span>
            </div>
            {pengaturan.metode_bayar === "Transfer Bank" && (
              <>
                <div className="info-item">
                  <span className="info-label">Bank</span>
                  <span className="info-val">{pengaturan.nama_bank}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">No. Rekening</span>
                  <span className="info-val" style={{fontFamily:"monospace"}}>{pengaturan.nomor_rekening}</span>
                </div>
              </>
            )}
          </div>

          <div className="btn-row">
            <button className="btn-outline" onClick={() => setTab("pengaturan")}>
              <IEdit /> Edit Pengaturan Gaji
            </button>
            <button className="btn-primary-lg" onClick={() => setModalTambah(true)}>
              <ICalc /> Hitung & Catat Gaji Bulan Ini
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: RIWAYAT GAJI
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "riwayat" && (
        <div className="content glass">
          <div className="rw-toolbar">
            <span className="rw-count">{riwayat.length} catatan gaji</span>
            <button className="btn-primary-lg" onClick={() => setModalTambah(true)}>
              <IPlus /> Tambah Catatan Gaji
            </button>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Hadir</th>
                  <th>Telat</th>
                  <th>Lembur</th>
                  <th>Total Gaji</th>
                  <th>Status</th>
                  <th>Tanggal Bayar</th>
                  <th className="th-c">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {riwayat.length === 0 ? (
                  <tr><td colSpan={8} className="empty">Belum ada catatan gaji.</td></tr>
                ) : riwayat.map(r => (
                  <tr key={r.id}>
                    <td className="fw6">{r.periode}</td>
                    <td>{r.hadir} hari</td>
                    <td>{r.telat}×</td>
                    <td>
                      <div>{r.lembur_jam} jam</div>
                      <div className="sub-green">+{IDR(r.lembur_jam * r.tarif_lembur)}</div>
                    </td>
                    <td className="fw7">{IDR(r.total_gaji)}</td>
                    <td><span className={`status-badge ${STATUS_COLOR[r.status]}`}>{r.status}</span></td>
                    <td className="text-muted">{r.tanggal_bayar ? new Date(r.tanggal_bayar).toLocaleDateString("id-ID") : "—"}</td>
                    <td className="td-c">
                      <button className="btn-detail" onClick={() => setModalDetail(r)}>Detail</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: SLIP GAJI (ringkasan cepat)
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "slip" && (
        <div className="content glass">
          <p className="tab-desc">Pilih periode untuk mencetak atau mengirim slip gaji.</p>
          <div className="slip-list">
            {riwayat.map(r => (
              <div key={r.id} className="slip-row-card">
                <div>
                  <div className="fw6">{r.periode}</div>
                  <div className="text-muted">{IDR(r.total_gaji)}</div>
                </div>
                <span className={`status-badge ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                <div className="slip-row-actions">
                  <button className="btn-detail" onClick={() => setModalDetail(r)}><IDown /> Download</button>
                  <button className="btn-detail" onClick={() => setModalDetail(r)}><IWA /> Kirim WA</button>
                </div>
              </div>
            ))}
            {riwayat.length === 0 && <div className="empty">Belum ada slip tersedia.</div>}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          TAB: PENGATURAN
      ═══════════════════════════════════════════════════════════════ */}
      {tab === "pengaturan" && (
        <div className="content glass">
          <div className="form-grid">
            <div className="form-field">
              <label>Gaji Pokok (Rp)</label>
              <input type="number" value={pg.gaji_pokok} onChange={e => setPg(p => ({ ...p, gaji_pokok: +e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Tarif Lembur (Rp/jam)</label>
              <input type="number" value={pg.tarif_lembur} onChange={e => setPg(p => ({ ...p, tarif_lembur: +e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Potongan per Keterlambatan (Rp)</label>
              <input type="number" value={pg.potongan_per_telat} onChange={e => setPg(p => ({ ...p, potongan_per_telat: +e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Tanggal Gajian (1–31)</label>
              <input type="number" min={1} max={31} value={pg.tanggal_gajian} onChange={e => setPg(p => ({ ...p, tanggal_gajian: +e.target.value }))} />
            </div>
            <div className="form-field">
              <label>Metode Pembayaran</label>
              <select value={pg.metode_bayar} onChange={e => setPg(p => ({ ...p, metode_bayar: e.target.value as MetodeBayar }))}>
                <option>Transfer Bank</option>
                <option>Cash</option>
                <option>GoPay</option>
                <option>OVO</option>
                <option>DANA</option>
              </select>
            </div>
          </div>

          {pg.metode_bayar === "Transfer Bank" && (
            <div className="form-grid" style={{marginTop:"1rem"}}>
              <div className="form-field">
                <label>Nama Bank</label>
                <input type="text" value={pg.nama_bank} onChange={e => setPg(p => ({ ...p, nama_bank: e.target.value }))} />
              </div>
              <div className="form-field">
                <label>Nomor Rekening</label>
                <input type="text" value={pg.nomor_rekening} onChange={e => setPg(p => ({ ...p, nomor_rekening: e.target.value }))} />
              </div>
            </div>
          )}

          <div className="btn-row" style={{marginTop:"1.5rem"}}>
            <button className="btn-primary-lg" onClick={handleSavePengaturan}>
              <ISave /> Simpan Pengaturan
            </button>
          </div>
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────────────── */}
      {modalDetail && (
        <ModalDetail
          r={modalDetail}
          nama={karyawan.nama}
          nomor_wa={karyawan.nomor_wa}
          onClose={() => setModalDetail(null)}
        />
      )}
      {modalTambah && (
        <ModalTambahGaji
          pengaturan={pengaturan}
          onClose={() => setModalTambah(false)}
          onSave={handleSaveRiwayat}
        />
      )}

      <style jsx>{`
        .pg { padding:2rem;max-width:1100px;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem; }
        .glass { background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.6);border-radius:14px;backdrop-filter:blur(10px); }

        /* Top bar */
        .topbar { display:flex;align-items:center; }
        .btn-back { display:flex;align-items:center;gap:6px;background:none;border:none;color:#64748b;font-size:0.875rem;font-weight:600;cursor:pointer;padding:6px 0;transition:color 0.15s; }
        .btn-back:hover { color:#e2e8f0; }

        /* Emp header */
        .emp-header { padding:1.5rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap; }
        .emp-avatar { width:52px;height:52px;border-radius:14px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.3);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#a5b4fc;flex-shrink:0; }
        .emp-nama { font-size:1.15rem;font-weight:800;color:#fff;margin-bottom:4px; }
        .emp-meta { display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:0.8rem;color:#64748b; }
        .badge-role { background:rgba(99,102,241,0.15);color:#a5b4fc;border:1px solid rgba(99,102,241,0.25);padding:2px 10px;border-radius:100px;font-size:0.72rem;font-weight:700; }
        .wa-link { color:#4ade80;text-decoration:none; }
        .wa-link:hover { text-decoration:underline; }
        .emp-stats { margin-left:auto;display:flex;align-items:center;gap:1.5rem; }
        .emp-stat { display:flex;flex-direction:column;align-items:flex-end;gap:2px; }
        .emp-stat-num { font-size:1rem;font-weight:800;color:#fff; }
        .emp-stat-num.stat-green { color:#4ade80; }
        .emp-stat-label { font-size:0.7rem;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:0.4px; }
        .emp-stat-sep { width:1px;height:32px;background:rgba(51,65,85,0.8); }

        /* Tabs */
        .tabs { display:flex;gap:0;overflow-x:auto;padding:0.375rem; }
        .tab-btn { padding:0.6rem 1.25rem;background:none;border:none;border-radius:9px;color:#64748b;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s;white-space:nowrap; }
        .tab-btn:hover { color:#e2e8f0;background:rgba(51,65,85,0.4); }
        .tab-active { background:rgba(99,102,241,0.15)!important;color:#a5b4fc!important;border:1px solid rgba(99,102,241,0.2); }

        /* Content */
        .content { padding:1.5rem; }
        .tab-desc { font-size:0.875rem;color:#64748b;margin:0 0 1.25rem; }

        /* Info grid */
        .info-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem; }
        .info-item { display:flex;flex-direction:column;gap:4px;padding:1rem;background:rgba(15,23,42,0.5);border:1px solid rgba(51,65,85,0.5);border-radius:10px; }
        .info-label { font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px; }
        .info-val { font-size:1rem;font-weight:700;color:#e2e8f0; }
        .info-unit { font-size:0.78rem;color:#64748b;font-weight:400; }

        /* Buttons */
        .btn-row { display:flex;gap:0.75rem;flex-wrap:wrap; }
        .btn-outline { display:flex;align-items:center;gap:6px;padding:0.7rem 1.25rem;background:transparent;border:1px solid rgba(99,102,241,0.35);border-radius:9px;color:#a5b4fc;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.2s; }
        .btn-outline:hover { background:rgba(99,102,241,0.1); }
        .btn-primary-lg { display:flex;align-items:center;gap:6px;padding:0.7rem 1.3rem;background:#6366f1;border:none;border-radius:9px;color:#fff;font-size:0.875rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.3);transition:all 0.2s; }
        .btn-primary-lg:hover { background:#4f46e5;transform:translateY(-1px); }

        /* Riwayat */
        .rw-toolbar { display:flex;align-items:center;justify-content:space-between;margin-bottom:1.25rem;flex-wrap:wrap;gap:0.75rem; }
        .rw-count { font-size:0.8rem;color:#64748b;font-weight:600; }
        .table-scroll { overflow-x:auto; }
        table { width:100%;border-collapse:collapse; }
        th { padding:0.8rem 0.9rem;font-size:0.72rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;text-align:left;border-bottom:1px solid rgba(51,65,85,0.6);white-space:nowrap; }
        th.th-c { text-align:center; }
        td { padding:0.85rem 0.9rem;font-size:0.875rem;color:#cbd5e1;border-bottom:1px solid rgba(30,41,59,0.7);vertical-align:middle; }
        td.td-c { text-align:center; }
        td.fw6 { font-weight:600;color:#e2e8f0; }
        td.fw7 { font-weight:700;color:#fff; }
        td.text-muted { color:#64748b; }
        .sub-green { font-size:0.72rem;color:#4ade80;margin-top:2px; }
        .empty { text-align:center;padding:2.5rem;color:#64748b;font-size:0.875rem; }
        .status-badge { display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:0.72rem;font-weight:700; }
        .status-badge::before { content:'';width:6px;height:6px;border-radius:50%;display:inline-block; }
        .status-paid { background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid rgba(74,222,128,0.2); }
        .status-paid::before { background:#4ade80;box-shadow:0 0 5px rgba(74,222,128,0.5); }
        .status-unpaid { background:rgba(248,113,113,0.1);color:#f87171;border:1px solid rgba(248,113,113,0.2); }
        .status-unpaid::before { background:#f87171; }
        .status-process { background:rgba(251,191,36,0.1);color:#fbbf24;border:1px solid rgba(251,191,36,0.2); }
        .status-process::before { background:#fbbf24; }
        .btn-detail { padding:5px 12px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.25);border-radius:6px;color:#a5b4fc;font-size:0.78rem;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:4px;transition:all 0.15s; }
        .btn-detail:hover { background:rgba(99,102,241,0.2);color:#c7d2fe; }

        /* Slip list */
        .slip-list { display:flex;flex-direction:column;gap:0.75rem; }
        .slip-row-card { display:flex;align-items:center;gap:1rem;padding:1rem 1.25rem;background:rgba(15,23,42,0.5);border:1px solid rgba(51,65,85,0.5);border-radius:10px;flex-wrap:wrap; }
        .slip-row-actions { margin-left:auto;display:flex;gap:6px; }

        /* Form settings */
        .form-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem; }
        .form-field { display:flex;flex-direction:column;gap:5px; }
        .form-field label { font-size:0.78rem;font-weight:700;color:#64748b; }
        .form-field input, .form-field select { padding:0.65rem 0.9rem;background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.7);border-radius:8px;color:#e2e8f0;font-size:0.875rem;transition:border 0.2s; }
        .form-field input:focus, .form-field select:focus { border-color:#6366f1;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.15); }

        @media (max-width:768px) {
          .pg { padding:1rem; }
          .emp-stats { display:none; }
          .emp-header { flex-direction:column;align-items:flex-start; }
        }
      `}</style>
    </div>
  );
}