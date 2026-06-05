"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { useNotify } from "@/hooks/useNotify";
import { sendNotification } from "@/lib/notifications/sendNotification";

// ─── Types ────────────────────────────────────────────────────────
type LeaveType = "sakit" | "izin";
type LeaveStatus = "pending" | "approved" | "rejected";
type FilterTab = "pending" | "approved" | "rejected" | "all";

interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  leave_status: LeaveStatus;
  tanggal_mulai: string;
  tanggal_selesai: string;
  keterangan: string;
  catatan_admin: string | null;
  created_at: string;
  reviewed_at: string | null;
  // joined
  nama?: string;
  email?: string;
  role?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────
const IDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

function hitungHari(mulai: string, selesai: string) {
  const d = (new Date(selesai).getTime() - new Date(mulai).getTime()) / 86400000 + 1;
  return d > 0 ? d : 0;
}

function formatTgl(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_CFG: Record<LeaveStatus, { label: string; color: string; bg: string; border: string }> = {
  pending: { label: "Menunggu", color: "#fbbf24", bg: "rgba(251,191,36,0.1)", border: "rgba(251,191,36,0.25)" },
  approved: { label: "Disetujui", color: "#4ade80", bg: "rgba(74,222,128,0.1)", border: "rgba(74,222,128,0.2)" },
  rejected: { label: "Ditolak", color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.2)" },
};

const TYPE_CFG: Record<LeaveType, { label: string; icon: string }> = {
  sakit: { label: "Sakit", icon: "🤒" },
  izin: { label: "Izin", icon: "📋" },
};

// ─── Icons ────────────────────────────────────────────────────────
const ICheck = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const IXIcon = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
const IX = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;

// ─── Modal Review ─────────────────────────────────────────────────
function ModalReview({
  item, onClose, onDone,
}: {
  item: LeaveRequest;
  onClose: () => void;
  onDone: () => void;
}) {
  const { notify } = useNotify();
  const [action, setAction] = useState<"approved" | "rejected" | null>(null);
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const hari = hitungHari(item.tanggal_mulai, item.tanggal_selesai);
  const potongan = hari * 75_000;

  const handleSubmit = async () => {
    if (!action) { setErr("Pilih tindakan terlebih dahulu."); return; }
    setLoading(true); setErr(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("leave_requests")
        .update({
          leave_status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          catatan_admin: catatan.trim() || null,
        })
        .eq("id", item.id);
      if (error) throw error;

      // 1. Kirim notifikasi PUSH ke user yang mengajukan (hanya push, tidak in-app di super admin)
      await sendNotification({
        title: action === "approved" ? "Pengajuan Disetujui ✓" : "Pengajuan Ditolak",
        body: action === "approved"
          ? `Pengajuan ${TYPE_CFG[item.leave_type].label} Anda telah disetujui.`
          : `Pengajuan ${TYPE_CFG[item.leave_type].label} Anda ditolak.${catatan ? ` Catatan: ${catatan}` : ""}`,
        userId: item.user_id,
      });

      // 2. Notifikasi ke super admin (in-app only, jangan push karena dia sudah online)
      await notify({
        title: `Izin ${action === "approved" ? "Disetujui" : "Ditolak"}`,
        body: `Anda telah ${action === "approved" ? "menyetujui" : "menolak"} pengajuan ${TYPE_CFG[item.leave_type].label} dari ${item.nama}.`,
        type: "info",
        inAppOnly: true,
      });

      onDone();
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
            <div className="micon">{TYPE_CFG[item.leave_type].icon}</div>
            <div>
              <h2>Review Pengajuan</h2>
              <p>{item.nama ?? "Karyawan"} · {TYPE_CFG[item.leave_type].label}</p>
            </div>
          </div>
          <button className="ibtn" onClick={onClose}><IX /></button>
        </div>

        {err && <div className="err-box">⚠ {err}</div>}

        {/* Detail pengajuan */}
        <div className="detail-box">
          <div className="detail-row">
            <span>Karyawan</span>
            <span><strong>{item.nama}</strong> <span className="role-pill">{item.role}</span></span>
          </div>
          <div className="detail-row">
            <span>Jenis</span>
            <span>{TYPE_CFG[item.leave_type].label}</span>
          </div>
          <div className="detail-row">
            <span>Tanggal</span>
            <span>
              {formatTgl(item.tanggal_mulai)}
              {item.tanggal_mulai !== item.tanggal_selesai && <> — {formatTgl(item.tanggal_selesai)}</>}
            </span>
          </div>
          <div className="detail-row">
            <span>Durasi</span>
            <span><strong>{hari} hari</strong></span>
          </div>
          <div className="detail-row warn">
            <span>Potongan gaji</span>
            <span><strong>− {IDR(potongan)}</strong></span>
          </div>
          <div className="detail-divider" />
          <div className="detail-ket">
            <span>Keterangan karyawan:</span>
            <p>"{item.keterangan}"</p>
          </div>
        </div>

        {/* Pilih tindakan */}
        <div className="field">
          <label>Tindakan Admin</label>
          <div className="action-group">
            <button
              className={`action-btn approve ${action === "approved" ? "action-active-approve" : ""}`}
              onClick={() => setAction("approved")}
            >
              <ICheck /> Setujui
            </button>
            <button
              className={`action-btn reject ${action === "rejected" ? "action-active-reject" : ""}`}
              onClick={() => setAction("rejected")}
            >
              <IXIcon /> Tolak
            </button>
          </div>
        </div>

        {/* Catatan admin */}
        <div className="field">
          <label>Catatan Admin <span className="opt">(opsional)</span></label>
          <textarea
            rows={2}
            placeholder="cth. Sudah dikonfirmasi, semoga lekas sembuh..."
            value={catatan}
            onChange={e => setCatatan(e.target.value)}
          />
        </div>

        <div className="mfoot">
          <button className="btn-sec" onClick={onClose}>Batal</button>
          <button
            className={`btn-pri ${action === "rejected" ? "btn-danger" : ""}`}
            onClick={handleSubmit}
            disabled={loading || !action}
          >
            {loading ? "Menyimpan..." : action === "approved" ? "✓ Setujui" : action === "rejected" ? "✕ Tolak" : "Pilih tindakan"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .overlay{position:fixed;inset:0;z-index:60;background:rgba(0,0,0,0.75);backdrop-filter:blur(6px);display:flex;align-items:center;justify-content:center;padding:1rem;animation:fi 0.15s}
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
        .detail-box{background:rgba(15,23,42,0.6);border:1px solid rgba(51,65,85,0.5);border-radius:12px;padding:1rem;display:flex;flex-direction:column;gap:8px}
        .detail-row{display:flex;justify-content:space-between;align-items:center;font-size:0.84rem;color:#94a3b8}
        .detail-row strong{color:#e2e8f0}
        .detail-row.warn strong{color:#f87171}
        .detail-divider{height:1px;background:rgba(51,65,85,0.6)}
        .detail-ket span{font-size:0.75rem;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.5px}
        .detail-ket p{font-size:0.84rem;color:#94a3b8;margin:5px 0 0;font-style:italic;line-height:1.5}
        .role-pill{background:rgba(99,102,241,0.12);color:#a5b4fc;border:1px solid rgba(99,102,241,0.2);padding:1px 7px;border-radius:6px;font-size:0.68rem;font-weight:700;margin-left:5px}
        .field{display:flex;flex-direction:column;gap:5px}
        .field label{font-size:0.75rem;font-weight:700;color:#64748b}
        .opt{font-weight:400;color:#334155}
        .action-group{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .action-btn{display:flex;align-items:center;justify-content:center;gap:7px;padding:0.7rem;border-radius:10px;font-size:0.875rem;font-weight:700;cursor:pointer;transition:all 0.15s}
        .approve{background:rgba(15,23,42,0.5);border:1px solid rgba(74,222,128,0.2);color:#64748b}
        .reject {background:rgba(15,23,42,0.5);border:1px solid rgba(248,113,113,0.2);color:#64748b}
        .action-active-approve{background:rgba(74,222,128,0.12);border-color:rgba(74,222,128,0.4);color:#4ade80}
        .action-active-reject {background:rgba(248,113,113,0.1);border-color:rgba(248,113,113,0.4);color:#f87171}
        textarea{width:100%;padding:0.65rem 0.85rem;background:rgba(15,23,42,0.8);border:1px solid rgba(51,65,85,0.7);border-radius:8px;color:#e2e8f0;font-size:0.875rem;transition:border 0.2s;font-family:inherit;resize:vertical}
        textarea:focus{border-color:#6366f1;outline:none;box-shadow:0 0 0 3px rgba(99,102,241,0.15)}
        .mfoot{display:flex;justify-content:flex-end;gap:0.75rem;padding-top:0.25rem}
        .btn-sec{padding:0.65rem 1.2rem;background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.8);border-radius:8px;color:#94a3b8;font-size:0.875rem;font-weight:600;cursor:pointer}
        .btn-sec:hover{color:#e2e8f0}
        .btn-pri{padding:0.65rem 1.4rem;background:#6366f1;border:none;border-radius:8px;color:#fff;font-size:0.875rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.3);transition:all 0.15s}
        .btn-pri:hover{background:#4f46e5}
        .btn-pri.btn-danger{background:#e11d48;box-shadow:0 4px 14px rgba(225,29,72,0.3)}
        .btn-pri.btn-danger:hover{background:#be123c}
        .btn-pri:disabled{opacity:0.4;cursor:not-allowed}
      `}</style>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────
export default function AdminIzinPage() {
  const { notify } = useNotify();
  const [list, setList] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<FilterTab>("pending");
  const [review, setReview] = useState<LeaveRequest | null>(null);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("leave_requests")
        .select(`
          id, user_id, leave_type, leave_status,
          tanggal_mulai, tanggal_selesai, keterangan,
          catatan_admin, created_at, reviewed_at,
          users:user_id ( nama, email, role )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data ?? []).map((d: any) => ({
        ...d,
        nama: d.users?.nama,
        email: d.users?.email,
        role: d.users?.role,
      })) as LeaveRequest[];

      setList(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const handleDone = () => {
    // Toast sekarang ditangani oleh ToastContainer via useNotify di ModalReview
    fetchList();
  };

  const filtered = tab === "all" ? list : list.filter(l => l.leave_status === tab);

  const counts = {
    all: list.length,
    pending: list.filter(l => l.leave_status === "pending").length,
    approved: list.filter(l => l.leave_status === "approved").length,
    rejected: list.filter(l => l.leave_status === "rejected").length,
  };

  const totalPotongan = list
    .filter(l => l.leave_status === "approved")
    .reduce((acc, l) => acc + hitungHari(l.tanggal_mulai, l.tanggal_selesai) * 75_000, 0);

  return (
    <div className="pg">
      {review && <ModalReview item={review} onClose={() => setReview(null)} onDone={handleDone} />}

      {/* Header */}
      <div className="header">
        <div>
          <h1>Manajemen Izin & Sakit</h1>
          <p>Review dan setujui pengajuan dari karyawan</p>
        </div>
        {counts.pending > 0 && (
          <div className="pending-badge">
            {counts.pending} menunggu review
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <span className="stat-num">{counts.all}</span>
          <span className="stat-lbl">Total Pengajuan</span>
        </div>
        <div className="stat-card">
          <span className="stat-num warn">{counts.pending}</span>
          <span className="stat-lbl">Menunggu</span>
        </div>
        <div className="stat-card">
          <span className="stat-num green">{counts.approved}</span>
          <span className="stat-lbl">Disetujui</span>
        </div>
        <div className="stat-card">
          <span className="stat-num red">{IDR(totalPotongan)}</span>
          <span className="stat-lbl">Total Potongan</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {(["pending", "all", "approved", "rejected"] as FilterTab[]).map(t => (
          <button
            key={t}
            className={`tab ${tab === t ? "tab-active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "pending" ? "Menunggu" : t === "all" ? "Semua" : t === "approved" ? "Disetujui" : "Ditolak"}
            {counts[t] > 0 && (
              <span className={`tab-count ${t === "pending" ? "count-warn" : ""}`}>{counts[t]}</span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="card">
        {loading && (
          <div className="loading"><div className="spin" /><span>Memuat data…</span></div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="empty">
            <div className="empty-icon">{tab === "pending" ? "✅" : "📋"}</div>
            <p>{tab === "pending" ? "Tidak ada pengajuan yang menunggu review." : "Belum ada data."}</p>
          </div>
        )}

        {!loading && filtered.map((item, i) => {
          const hari = hitungHari(item.tanggal_mulai, item.tanggal_selesai);
          const potongan = hari * 75_000;
          const st = STATUS_CFG[item.leave_status];
          const tp = TYPE_CFG[item.leave_type];

          return (
            <div key={item.id} className={`item ${i < filtered.length - 1 ? "item-border" : ""}`}>
              <div className="item-icon">{tp.icon}</div>

              <div className="item-body">
                <div className="item-top">
                  <span className="item-nama">{item.nama ?? "—"}</span>
                  <span className="role-pill">{item.role}</span>
                  <span className="item-type-pill">{tp.label}</span>
                </div>
                <div className="item-dates">
                  {formatTgl(item.tanggal_mulai)}
                  {item.tanggal_mulai !== item.tanggal_selesai && <> — {formatTgl(item.tanggal_selesai)}</>}
                  <span className="dur-pill">{hari} hari · − {IDR(potongan)}</span>
                </div>
                <div className="item-ket">"{item.keterangan}"</div>
                {item.catatan_admin && (
                  <div className="admin-note">💬 {item.catatan_admin}</div>
                )}
              </div>

              <div className="item-right">
                <span className="status-badge" style={{ color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                  {st.label}
                </span>
                {item.leave_status === "pending" && (
                  <button className="btn-review" onClick={() => setReview(item)}>
                    Review →
                  </button>
                )}
                <span className="item-date">{new Date(item.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}</span>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .pg{padding:1.5rem;max-width:800px;margin:0 auto;display:flex;flex-direction:column;gap:1.25rem;padding-bottom:4rem}
        .header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap}
        .header h1{font-size:1.5rem;font-weight:800;color:#fff;margin:0 0 4px;letter-spacing:-0.3px}
        .header p{font-size:0.85rem;color:#64748b;margin:0}
        .pending-badge{display:flex;align-items:center;padding:0.5rem 1rem;background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.25);border-radius:9px;color:#fbbf24;font-size:0.82rem;font-weight:700;white-space:nowrap;animation:pulse 2s ease-in-out infinite}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
        .stats{display:grid;grid-template-columns:repeat(4,1fr);gap:0.75rem}
        .stat-card{padding:1rem;background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.5);border-radius:12px;display:flex;flex-direction:column;gap:3px}
        .stat-num{font-size:1.3rem;font-weight:800;color:#fff}
        .stat-num.warn{color:#fbbf24}
        .stat-num.green{color:#4ade80}
        .stat-num.red{color:#f87171}
        .stat-lbl{font-size:0.68rem;color:#475569;font-weight:600;text-transform:uppercase;letter-spacing:0.4px}
        .tabs{display:flex;gap:4px;background:rgba(15,23,42,0.6);border:1px solid rgba(51,65,85,0.5);border-radius:11px;padding:4px;width:fit-content}
        .tab{padding:6px 16px;border-radius:8px;border:none;background:none;color:#64748b;font-size:0.82rem;font-weight:600;cursor:pointer;transition:all 0.15s;display:flex;align-items:center;gap:6px}
        .tab:hover{color:#e2e8f0}
        .tab-active{background:rgba(99,102,241,0.15);color:#a5b4fc}
        .tab-count{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:rgba(51,65,85,0.6);font-size:0.65rem;font-weight:800}
        .count-warn{background:rgba(251,191,36,0.2);color:#fbbf24}
        .card{background:rgba(15,23,42,0.7);border:1px solid rgba(51,65,85,0.5);border-radius:14px;overflow:hidden}
        .loading{display:flex;align-items:center;gap:10px;padding:2rem;color:#475569;font-size:0.875rem}
        .spin{width:18px;height:18px;border:2px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0}
        @keyframes spin{to{transform:rotate(360deg)}}
        .empty{display:flex;flex-direction:column;align-items:center;gap:0.75rem;padding:3rem 1rem;color:#475569;text-align:center}
        .empty-icon{font-size:2rem}
        .empty p{font-size:0.875rem;margin:0}
        .item{display:flex;align-items:flex-start;gap:12px;padding:1.1rem 1.25rem;transition:background 0.15s}
        .item:hover{background:rgba(99,102,241,0.03)}
        .item-border{border-bottom:1px solid rgba(30,41,59,0.8)}
        .item-icon{width:36px;height:36px;border-radius:10px;background:rgba(30,41,59,0.6);border:1px solid rgba(51,65,85,0.5);display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;margin-top:2px}
        .item-body{flex:1;min-width:0;display:flex;flex-direction:column;gap:5px}
        .item-top{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
        .item-nama{font-size:0.9rem;font-weight:700;color:#e2e8f0}
        .role-pill{background:rgba(99,102,241,0.12);color:#a5b4fc;border:1px solid rgba(99,102,241,0.2);padding:1px 7px;border-radius:6px;font-size:0.68rem;font-weight:700}
        .item-type-pill{background:rgba(30,41,59,0.6);color:#64748b;border:1px solid rgba(51,65,85,0.5);padding:1px 7px;border-radius:6px;font-size:0.68rem;font-weight:700}
        .item-dates{font-size:0.8rem;color:#64748b;display:flex;align-items:center;gap:7px;flex-wrap:wrap}
        .dur-pill{background:rgba(248,113,113,0.08);color:#f87171;border:1px solid rgba(248,113,113,0.15);padding:1px 8px;border-radius:5px;font-size:0.68rem;font-weight:700}
        .item-ket{font-size:0.8rem;color:#94a3b8;font-style:italic}
        .admin-note{font-size:0.78rem;color:#fbbf24;background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.15);border-radius:6px;padding:5px 10px}
        .item-right{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
        .status-badge{padding:3px 10px;border-radius:100px;font-size:0.7rem;font-weight:700}
        .btn-review{padding:5px 12px;background:rgba(99,102,241,0.12);border:1px solid rgba(99,102,241,0.25);border-radius:7px;color:#a5b4fc;font-size:0.78rem;font-weight:700;cursor:pointer;transition:all 0.15s;white-space:nowrap}
        .btn-review:hover{background:rgba(99,102,241,0.2);color:#c7d2fe}
        .item-date{font-size:0.7rem;color:#334155}
        
        @media (max-width: 768px) {
          .pg { padding: 1.25rem; gap: 1rem; }
          .header { flex-direction: column; }
          .header h1 { font-size: 1.35rem; }
          .stats { grid-template-columns: repeat(2, 1fr); gap: 0.625rem; }
          .tabs { overflow-x: auto; gap: 3px; }
          .item { padding: 0.95rem 1.1rem; gap: 10px; }
        }
        @media (max-width: 600px) {
          .stats { grid-template-columns: repeat(2,1fr); }
          .tabs { width: 100%; overflow-x: auto; }
        }
        @media (max-width: 480px) {
          .pg { padding: 0.75rem; }
          .stats { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}