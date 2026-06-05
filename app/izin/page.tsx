"use client";

import { sendNotification } from "@/lib/notifications/sendNotification";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────
type LeaveType = "sakit" | "izin";
type LeaveStatus = "pending" | "approved" | "rejected";

interface LeaveRequest {
  id: string;
  leave_type: LeaveType;
  leave_status: LeaveStatus;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  catatan_admin: string | null;
  created_at: string;
  reviewed_at: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────
const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function hitungHari(mulai: string, selesai: string) {
  if (!mulai || !selesai) return 0;
  const d = (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86400000 + 1;
  return d > 0 ? d : 0;
}

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

const STATUS_CFG: Record<LeaveStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending: { label: "Menunggu", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)", dot: "#fbbf24" },
  approved: { label: "Disetujui", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)", dot: "#4ade80" },
  rejected: { label: "Ditolak", color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)", dot: "#f87171" },
};

const TYPE_CFG: Record<LeaveType, { label: string; icon: string; color: string }> = {
  sakit: { label: "Sakit", icon: "🤒", color: "#f87171" },
  izin: { label: "Izin", icon: "📋", color: "#60a5fa" },
};

// ─── Icons ────────────────────────────────────────────────────────
const IPlus = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
const IX = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const ICal = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8" /><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;

// ─── Modal Form Submit ────────────────────────────────────────────
function ModalSubmit({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<LeaveType>("sakit");
  const [mulai, setMulai] = useState(today);
  const [selesai, setSelesai] = useState(today);
  const [ket, setKet] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hari = hitungHari(mulai, selesai);
  const potongan = hari * 75_000;

  const handleSubmit = async () => {
    if (!ket.trim()) { setErr("Keterangan wajib diisi."); return; }
    if (hari <= 0) { setErr("Tanggal selesai harus setelah tanggal mulai."); return; }
    setLoading(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak ditemukan, silakan login ulang.");
      const { error } = await supabase.from("leave_requests").insert({
        user_id: user.id,
        leave_type: type,
        tanggal_mulai: mulai,
        tanggal_selesai: selesai,
        keterangan: ket.trim(),
      });
      if (error) throw error;

      // Kirim notifikasi ke super admin
      const userEmail = user?.email || "Karyawan";
      console.log("[DEBUG] Sending notification...");
      const result = await sendNotification({
        title: `Pengajuan ${type === "sakit" ? "Sakit" : "Izin"} Baru`,
        body: `${userEmail} mengajukan ${type} selama ${hari} hari`,
      });
      console.log("[DEBUG] Notification result:", result);
      onSuccess();
      onClose();
    } catch (e: any) {
      setErr(e?.message ?? "Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        {/* Header */}
        <div className="mhead">
          <div className="mhead-left">
            <div className="micon">📝</div>
            <div>
              <h2>Ajukan Izin / Sakit</h2>
              <p>Isi form berikut dan tunggu persetujuan admin</p>
            </div>
          </div>
          <button className="ibtn" onClick={onClose}><IX /></button>
        </div>

        {err && <div className="err-box">⚠ {err}</div>}

        {/* Tipe */}
        <div className="field">
          <label>Jenis Pengajuan</label>
          <div className="type-group">
            {(["sakit", "izin"] as LeaveType[]).map(t => (
              <button
                key={t}
                className={`type-btn ${type === t ? "type-active" : ""}`}
                onClick={() => setType(t)}
              >
                <span>{TYPE_CFG[t].icon}</span>
                {TYPE_CFG[t].label}
              </button>
            ))}
          </div>
        </div>

        {/* Tanggal */}
        <div className="row2">
          <div className="field">
            <label><ICal /> Tanggal Mulai</label>
            <input type="date" value={mulai} min={today} onChange={e => setMulai(e.target.value)} />
          </div>
          <div className="field">
            <label><ICal /> Tanggal Selesai</label>
            <input type="date" value={selesai} min={mulai} onChange={e => setSelesai(e.target.value)} />
          </div>
        </div>

        {/* Preview kalkulasi */}
        {hari > 0 && (
          <div className="calc-box">
            <div className="calc-row">
              <span>Durasi</span>
              <span><strong>{hari} hari</strong></span>
            </div>
            <div className="calc-row warn">
              <span>Potongan gaji</span>
              <span><strong>− {IDR(potongan)}</strong></span>
            </div>
            <div className="calc-note">Rp 75.000 × {hari} hari kerja</div>
          </div>
        )}

        {/* Keterangan */}
        <div className="field">
          <label>Keterangan <span className="req">*</span></label>
          <textarea
            rows={3}
            placeholder={type === "sakit" ? "cth. Demam tinggi, sudah ke dokter..." : "cth. Keperluan keluarga mendesak..."}
            value={ket}
            onChange={e => setKet(e.target.value)}
          />
          <span className="hint">{ket.length}/200 karakter</span>
        </div>

        <div className="mfoot">
          <button className="btn-sec" onClick={onClose}>Batal</button>
          <button className="btn-sec" onClick={handleSubmit} disabled={loading}>
            {loading ? "Mengirim..." : "Kirim Pengajuan"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi 0.15s}
        @keyframes fi{from{opacity:0}to{opacity:1}}
        .modal{background:#0f172a;border:1px solid rgba(51,65,85,0.7);border-radius:16px;width:100%;max-width:460px;padding:1.75rem;display:flex;flex-direction:column;gap:1.1rem;animation:su 0.2s}
        @keyframes su{from{transform:translateY(20px);opacity:0}to{transform:translateY(0);opacity:1}}
        .mhead{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem}
        .mhead-left{display:flex;align-items:center;gap:10px}
        .micon{width:38px;height:38px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
        .mhead h2{font-size:1rem;font-weight:800;color:#fff;margin:0 0 2px}
        .mhead p{font-size:0.76rem;color:#64748b;margin:0}
        .ibtn{background:none;border:none;color:#64748b;cursor:pointer;padding:4px;display:flex;align-items:center}
        .ibtn:hover{color:#fff}
        .err-box{padding:10px 14px;background:rgba(239,68,68,0.08);border:1px solid rgba(248,113,113,0.2);border-radius:10px;color:#f87171;font-size:0.82rem}
        .field{display:flex;flex-direction:column;gap:5px}
        .field label{font-size:0.75rem;font-weight:700;color:#64748b;display:flex;align-items:center;gap:5px}
        .req{color:#f87171}
        .hint{font-size:0.7rem;color:#475569}
        .row2{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
        input[type=date],textarea{width:100%;padding:0.65rem 0.85rem;background:rgba(15,23,42,0.8);border:1px solid rgba(51,65,85,0.7);border-radius:8px;color:#e2e8f0;font-size:0.875rem;transition:border 0.2s;font-family:inherit}
        input[type=date]:focus,textarea:focus{border-color:#6366f1;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.15)}
        textarea{resize:vertical}
        .type-group{display:flex;gap:8px}
        .type-btn{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:0.65rem;border-radius:10px;border:1px solid rgba(51,65,85,0.6);background:rgba(15,23,42,0.5);color:#64748b;font-size:0.875rem;font-weight:600;cursor:pointer;transition:all 0.15s}
        .type-active{border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.12);color:#a5b4fc}
        .calc-box{padding:1rem;background:rgba(15,23,42,0.6);border:1px solid rgba(51,65,85,0.5);border-radius:10px;display:flex;flex-direction:column;gap:6px}
        .calc-row{display:flex;justify-content:space-between;font-size:0.84rem;color:#94a3b8}
        .calc-row.warn strong{color:#f87171}
        .calc-note{font-size:0.72rem;color:#475569}
        .mfoot{display:flex;justify-content:flex-end;gap:0.75rem;padding-top:0.25rem}
        .btn-sec{padding:0.65rem 1.2rem;background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.8);border-radius:8px;color:#94a3b8;font-size:0.875rem;font-weight:600;cursor:pointer}
        @media (max-width: 768px) {
          .pg { padding: 1.25rem; gap: 1rem; }
          .header { flex-direction: column; align-items: flex-start; gap: 0.75rem; }
          .header h1 { font-size: 1.4rem; }
          .header p { font-size: 0.8rem; }
          .btn-add { width: 100%; justify-content: center; padding: 0.6rem 1rem; font-size: 0.82rem; }
          .stats { grid-template-columns: repeat(2, 1fr); gap: 0.625rem; }
          .stat-card { padding: 0.9rem; border-radius: 10px; }
          .stat-num { font-size: 1.2rem; }
          .stat-lbl { font-size: 0.65rem; }
          .card { border-radius: 12px; }
          .item { padding: 0.9rem 1rem; gap: 10px; }
          .item-icon { width: 32px; height: 32px; font-size: 1rem; }
          .item-type { font-size: 0.85rem; }
          .item-badge { font-size: 0.65rem; padding: 2px 7px; }
          .item-dates { font-size: 0.75rem; }
          .item-dur { font-size: 0.65rem; padding: 1px 5px; }
          .item-ket { font-size: 0.75rem; }
          .item-pot { font-size: 0.82rem; }
          .item-date-sub { font-size: 0.68rem; }
        }
        @media (max-width: 640px) {
          .pg { padding: 1rem; gap: 0.875rem; padding-bottom: 3.5rem; }
          .header h1 { font-size: clamp(1.2rem, 1.8vw, 1.5rem); }
          .header p { font-size: 0.77rem; }
          .btn-add { padding: 0.55rem 0.9rem; font-size: 0.8rem; }
          .notif-success { padding: 10px 14px; font-size: 0.8rem; border-radius: 10px; }
          .stats { grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
          .stat-card { padding: 0.8rem; border-radius: 9px; }
          .stat-num { font-size: 1.1rem; }
          .stat-lbl { font-size: 0.6rem; letter-spacing: 0.3px; }
          .item { padding: 0.8rem 0.9rem; }
          .item-icon { width: 30px; height: 30px; }
          .item-type { font-size: 0.8rem; }
          .item-badge { font-size: 0.6rem; padding: 1px 6px; }
          .item-dates { font-size: 0.72rem; gap: 4px; }
          .item-dur { font-size: 0.6rem; padding: 1px 4px; }
          .item-ket { font-size: 0.72rem; }
          .item-admin-note { font-size: 0.75rem; padding: 4px 8px; }
          .item-pot { font-size: 0.8rem; }
          .item-date-sub { font-size: 0.65rem; }
          .btn-add-sm { padding: 0.5rem 0.9rem; font-size: 0.78rem; }
          .empty { padding: 2.5rem 0.75rem; }
          .empty-icon { font-size: 1.8rem; }
        }
        @media (max-width: 480px) {
          .pg { padding: 0.75rem; }
          .header h1 { font-size: 1.3rem; letter-spacing: -0.2px; }
          .header p { font-size: 0.75rem; }
          .btn-add { padding: 0.5rem 0.8rem; font-size: 0.75rem; }
          .stats { grid-template-columns: 1fr; gap: 0.5rem; }
          .stat-card { padding: 0.75rem; }
          .stat-num { font-size: 1rem; }
          .stat-lbl { font-size: 0.58rem; }
          .item { padding: 0.7rem 0.8rem; gap: 8px; }
          .item-icon { width: 28px; height: 28px; font-size: 0.95rem; }
          .item-type { font-size: 0.75rem; }
          .item-dates { font-size: 0.68rem; }
          .item-ket { font-size: 0.68rem; }
          .item-right { gap: 3px; }
          .btn-add-sm { padding: 0.45rem 0.8rem; font-size: 0.75rem; }
        }
        @media (max-width: 360px) {
          .pg { padding: 0.5rem; }
          .header h1 { font-size: 1.2rem; }
          .stats { grid-template-columns: 1fr; }
          .item { padding: 0.6rem 0.7rem; }
          .item-icon { width: 26px; height: 26px; }
        }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function IzinSakitPage() {
  const [list, setList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

      const { data, error } = await supabase
        .from("leave_requests")
        .select("id,leave_type,leave_status,tanggal_mulai,tanggal_selesai,keterangan,catatan_admin,created_at,reviewed_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setList((data ?? []) as LeaveRequest[]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleSuccess = () => {
    setSuccess("Pengajuan berhasil dikirim! Menunggu persetujuan admin.");
    fetchList();
    setTimeout(() => setSuccess(null), 5000);
  };

  const pending = list.filter(l => l.leave_status === "pending").length;
  const approved = list.filter(l => l.leave_status === "approved").length;

  return (
    <div className="pg">
      {modal && <ModalSubmit onClose={() => setModal(false)} onSuccess={handleSuccess} />}

      {/* Header */}
      <div className="header">
        <div>
          <h1>Izin & Sakit</h1>
          <p>Ajukan ketidakhadiran dan pantau statusnya</p>
        </div>
        <button className="btn-add" onClick={() => setModal(true)}>
          <IPlus /> Ajukan Izin / Sakit
        </button>
      </div>

      {/* Success notif */}
      {success && (
        <div className="notif-success">
          <span>✓</span>
          <p>{success}</p>
          <button onClick={() => setSuccess(null)}><IX /></button>
        </div>
      )}

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <span className="stat-num">{list.length}</span>
          <span className="stat-lbl">Total Pengajuan</span>
        </div>
        <div className="stat-card">
          <span className="stat-num warn">{pending}</span>
          <span className="stat-lbl">Menunggu</span>
        </div>
        <div className="stat-card">
          <span className="stat-num green">{approved}</span>
          <span className="stat-lbl">Disetujui</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{IDR(approved * 75_000)}</span>
          <span className="stat-lbl">Est. Potongan</span>
        </div>
      </div>

      {/* List */}
      <div className="card">
        {loading && (
          <div className="loading"><div className="spin" /><span>Memuat data…</span></div>
        )}

        {!loading && list.length === 0 && (
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p>Belum ada pengajuan izin atau sakit.</p>
            <button className="btn-add-sm" onClick={() => setModal(true)}>
              <IPlus /> Buat Pengajuan Pertama
            </button>
          </div>
        )}

        {!loading && list.map((item, i) => {
          const hari = hitungHari(item.tanggal_mulai, item.tanggal_selesai);
          const potongan = hari * 75_000;
          const st = STATUS_CFG[item.leave_status];
          const tp = TYPE_CFG[item.leave_type];

          return (
            <div key={item.id} className={`item ${i < list.length - 1 ? "item-border" : ""}`}>
              {/* Left */}
              <div className="item-icon">{tp.icon}</div>

              {/* Body */}
              <div className="item-body">
                <div className="item-top">
                  <span className="item-type">{tp.label}</span>
                  <span className="item-badge" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                    <span className="item-dot" style={{ background: st.dot }} />
                    {st.label}
                  </span>
                </div>
                <div className="item-dates">
                  {formatTgl(item.tanggal_mulai)}
                  {item.tanggal_mulai !== item.tanggal_selesai && (
                    <> — {formatTgl(item.tanggal_selesai)}</>
                  )}
                  <span className="item-dur">{hari} hari</span>
                </div>
                <div className="item-ket">"{item.keterangan}"</div>
                {item.catatan_admin && (
                  <div className="item-admin-note">
                    💬 Admin: {item.catatan_admin}
                  </div>
                )}
              </div>

              {/* Right */}
              <div className="item-right">
                <div className="item-pot" style={{ color: item.leave_status === "approved" ? "#f87171" : "#475569" }}>
                  {item.leave_status === "approved" ? `− ${IDR(potongan)}` : IDR(potongan)}
                </div>
                <div className="item-date-sub">
                  {new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .pg{padding:1.5rem;max-width:700px;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem;padding-bottom:4rem}
        .header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .header h1{font-size:1.5rem;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-0.3px}
        .header p{font-size:0.85rem;color:#64748b;margin:0}
        .btn-add{display:flex;align-items:center;gap:7px;padding:0.65rem 1.2rem;background:#6366f1;border:none;border-radius:9px;color:#fff;font-size:0.875rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.3);transition:all 0.2s;white-space:nowrap}
        .btn-add:hover{background:#4f46e5;transform:translateY(-1px)}
        .notif-success{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(34,197,94,0.1);border:1px solid rgba(74,222,128,0.2);border-radius:12px;color:#4ade80;font-size:0.875rem}
        .notif-success p{margin:0;flex:1}
        .notif-success button{background:none;border:none;color:#4ade80;cursor:pointer;display:flex;align-items:center;padding:2px}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem}
        .stat-card{padding:1rem;background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.5);border-radius:12px;display:flex;flex-direction:column;gap:3px}
        .stat-num{font-size:1.3rem;font-weight:800;color:#fff}
        .stat-num.warn{color:#fbbf24}
        .stat-num.green{color:#4ade80}
        .stat-lbl{font-size:0.68rem;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.4px}
        .card{background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.5);border-radius:14px;overflow:hidden}
        .loading{display:flex;align-items:center;gap:10px;padding:2rem;color:#475569;font-size:0.875rem}
        .spin{width:18px;height:18px;border:2px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem 1rem;color:#475569;text-align:center}
        .empty-icon{font-size:2rem}
        .empty p{font-size:0.875rem;margin:0}
        .btn-add-sm{display:flex;align-items:center;gap:6px;padding:0.55rem 1rem;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.25);border-radius:8px;color:#a5b4fc;font-size:0.82rem;font-weight:600;cursor:pointer}
        .item{display:flex;align-items:flex-start;gap:12px;padding:1rem 1.25rem;transition:background 0.15s}
        .item:hover{background:rgba(99,102,241,0.03)}
        .item-border{border-bottom:1px solid rgba(30,41,59,0.8)}
        .item-icon{width:36px;height:36px;border-radius:10px;background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.5);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;margin-top:2px}
        .item-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}
        .item-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .item-type{font-size:0.9rem;font-weight:700;color:#e2e8f0}
        .item-badge{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border-radius:100px;font-size:0.7rem;font-weight:700}
        .item-dot{width:5px;height:5px;border-radius:50%;display:inline-block}
        .item-dates{font-size:0.8rem;color:#64748b;display:flex;align-items:center;gap:6px}
        .item-dur{background:rgba(30,41,59,0.6);padding:1px 7px;border-radius:5px;font-size:0.68rem;color:#475569;font-weight:600}
        .item-ket{font-size:0.8rem;color:#94a3b8;font-style:italic}
        .item-admin-note{font-size:0.78rem;color:#fbbf24;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);border-radius:6px;padding:5px 10px}
        .item-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0}
        .item-pot{font-size:0.85rem;font-weight:700}
        .item-date-sub{font-size:0.72rem;color:#334155}
        @media(max-width:600px){.stats{grid-template-columns:repeat(2,1fr)}}
      `}</style>
    </div>
  );
}