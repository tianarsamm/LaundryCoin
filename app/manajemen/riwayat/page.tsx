"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

type KaryawanInfo = {
  id: string;
  nama: string;
  role: string;
  nomor_wa: string;
  email: string;
};

type AttendanceLog = {
  id: string;
  user_id: string;
  type: "checkin" | "checkout" | string;
  created_at: string;
  photo_url?: string | null;
  distance_meter?: number | null;
  status?: string | null;
};

// Group logs by date
function groupByDate(logs: AttendanceLog[]) {
  const map: Record<string, AttendanceLog[]> = {};
  logs.forEach((l) => {
    const d = new Date(l.created_at).toLocaleDateString("id-ID", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!map[d]) map[d] = [];
    map[d].push(l);
  });
  return map;
}

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit", minute: "2-digit",
  });
}

function getDurasi(checkin: AttendanceLog, checkout: AttendanceLog | undefined) {
  if (!checkout) return null;
  const diff = new Date(checkout.created_at).getTime() - new Date(checkin.created_at).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}j ${m}m`;
}

// Stats
function computeStats(logs: AttendanceLog[]) {
  const days = new Set(logs.map(l => new Date(l.created_at).toDateString())).size;
  const checkins = logs.filter(l => l.type === "checkin");
  const late = checkins.filter(l => l.status === "late").length;
  const ontime = checkins.length - late;
  return { days, checkins: checkins.length, late, ontime };
}

export default function RiwayatPage() {
  const searchParams = useSearchParams();
  const id = searchParams?.get("id");

  const [karyawan, setKaryawan] = useState<KaryawanInfo | null>(null);
  const [riwayat, setRiwayat] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<"all" | "checkin" | "checkout">("all");
  const [photoModal, setPhotoModal] = useState<string | null>(null);

  // Load karyawan from sessionStorage
  useEffect(() => {
    if (!id) return;
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(`karyawan_${id}`) : null;
      if (raw) setKaryawan(JSON.parse(raw) as KaryawanInfo);
    } catch {}
  }, [id]);

  // Fetch attendance logs
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data, error: err } = await supabase
          .from("attendance_logs")
          .select("id, user_id, type, created_at, photo_url, distance_meter, status")
          .eq("user_id", id)
          .order("created_at", { ascending: false })
          .limit(200);
        if (err) throw err;
        setRiwayat((data || []) as AttendanceLog[]);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const filtered = filterType === "all" ? riwayat : riwayat.filter(l => l.type === filterType);
  const grouped = groupByDate(filtered);
  const stats = computeStats(riwayat);

  return (
    <div className="pg">
      {/* ── Photo Modal ─────────────────────────────────────────── */}
      {photoModal && (
        <div className="photo-overlay" onClick={() => setPhotoModal(null)}>
          <div className="photo-modal">
            <button className="photo-close" onClick={() => setPhotoModal(null)}>✕</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photoModal} alt="Foto absensi" className="photo-img" />
          </div>
        </div>
      )}

      {/* ── Back + Title ─────────────────────────────────────────── */}
      <div className="topbar">
        <Link href="/manajemen" className="btn-back" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "10px" }}>
        <span style={{
            width: "36px", height: "36px", borderRadius: "8px",
            border: "1px solid rgba(51,65,85,0.6)",
            background: "rgba(15,23,42,0.6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#64748b", flexShrink: 0,
            transition: "border-color 0.15s, transform 0.2s",
        }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
        </span>
        <span style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
            {/* <span style={{ fontSize: "11px", color: "#334155", lineHeight: 1 }}>Manajemen Karyawan</span> */}
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0", lineHeight: 1 }}>Kembali</span>
        </span>
        </Link>
        <div className="topbar-label">Riwayat Absensi</div>
      </div>

      {/* ── No param ─────────────────────────────────────────────── */}
      {!id && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>Parameter karyawan tidak ditemukan.</p>
          <Link href="/manajemen" className="btn-primary-sm">Ke Manajemen</Link>
        </div>
      )}

      {id && (
        <>
          {/* ── Karyawan Card ───────────────────────────────────── */}
          {karyawan ? (
            <div className="karyawan-card">
              <div className="karyawan-avatar">{karyawan.nama.charAt(0).toUpperCase()}</div>
              <div className="karyawan-info">
                <div className="karyawan-nama">{karyawan.nama}</div>
                <div className="karyawan-sub">
                  <span className="badge-role">{karyawan.role}</span>
                  <span className="dot">·</span>
                  <span>{karyawan.email}</span>
                  <span className="dot">·</span>
                  <a href={`https://wa.me/62${karyawan.nomor_wa.slice(1)}`} target="_blank" rel="noreferrer" className="wa-link">
                    {karyawan.nomor_wa}
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="karyawan-card ghost">
              <div className="karyawan-avatar ghost-av">?</div>
              <div className="karyawan-info">
                <div className="karyawan-nama" style={{color:"#475569"}}>Data karyawan tidak tersedia</div>
                <div className="karyawan-sub">Buka dari halaman Manajemen Karyawan</div>
              </div>
            </div>
          )}

          {/* ── Stats row ───────────────────────────────────────── */}
          {!loading && riwayat.length > 0 && (
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-num">{stats.days}</div>
                <div className="stat-label">Hari Hadir</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{stats.checkins}</div>
                <div className="stat-label">Total Check In</div>
              </div>
              <div className="stat-card">
                <div className="stat-num green">{stats.ontime}</div>
                <div className="stat-label">Tepat Waktu</div>
              </div>
              <div className="stat-card">
                <div className="stat-num red">{stats.late}</div>
                <div className="stat-label">Terlambat</div>
              </div>
            </div>
          )}

          {/* ── Filter + count ──────────────────────────────────── */}
          <div className="toolbar">
            <div className="filter-group">
              {(["all","checkin","checkout"] as const).map(f => (
                <button
                  key={f}
                  className={`filter-btn ${filterType === f ? "filter-active" : ""}`}
                  onClick={() => setFilterType(f)}
                >
                  {f === "all" ? "Semua" : f === "checkin" ? "Check In" : "Check Out"}
                </button>
              ))}
            </div>
            <span className="count-badge">{filtered.length} log</span>
          </div>

          {/* ── Loading ─────────────────────────────────────────── */}
          {loading && (
            <div className="loading-wrap">
              <div className="spinner" />
              <span>Memuat riwayat…</span>
            </div>
          )}

          {/* ── Error ───────────────────────────────────────────── */}
          {error && (
            <div className="error-box">
              <span>⚠</span> {error}
            </div>
          )}

          {/* ── Empty ───────────────────────────────────────────── */}
          {!loading && !error && filtered.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>Belum ada data riwayat absensi.</p>
            </div>
          )}

          {/* ── Timeline ────────────────────────────────────────── */}
          {!loading && !error && filtered.length > 0 && (
            <div className="timeline">
              {Object.entries(grouped).map(([date, logs]) => {
                const checkin  = logs.find(l => l.type === "checkin");
                const checkout = logs.find(l => l.type === "checkout");
                const durasi   = checkin ? getDurasi(checkin, checkout) : null;

                return (
                  <div key={date} className="day-group">
                    {/* Date header */}
                    <div className="day-header">
                      <div className="day-line" />
                      <span className="day-label">{date}</span>
                      {durasi && <span className="day-durasi">⏱ {durasi}</span>}
                      <div className="day-line" />
                    </div>

                    {/* Log items */}
                    <div className="day-logs">
                      {logs.map((log) => {
                        const isIn  = log.type === "checkin";
                        const isOut = log.type === "checkout";
                        const isLate = log.status === "late";

                        return (
                          <div key={log.id} className={`log-card ${isIn ? "log-in" : "log-out"}`}>
                            {/* Left accent */}
                            <div className={`log-accent ${isIn ? "accent-in" : "accent-out"}`} />

                            {/* Icon */}
                            <div className={`log-icon ${isIn ? "icon-in" : "icon-out"}`}>
                              {isIn ? (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 19V5M5 12l7-7 7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 5v14M5 12l7 7 7-7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>

                            {/* Main info */}
                            <div className="log-body">
                              <div className="log-type-row">
                                <span className="log-type">{isIn ? "Check In" : isOut ? "Check Out" : log.type}</span>
                                {isIn && (
                                  <span className={`log-status ${isLate ? "status-late" : "status-ontime"}`}>
                                    {isLate ? "Terlambat" : "Tepat waktu"}
                                  </span>
                                )}
                              </div>
                              <div className="log-time">{formatJam(log.created_at)}</div>
                              {log.distance_meter != null && (
                                <div className="log-distance">
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
                                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
                                  </svg>
                                  {log.distance_meter} meter dari toko
                                </div>
                              )}
                            </div>

                            {/* Photo */}
                            {log.photo_url && (
                              <button
                                className="log-photo-btn"
                                onClick={() => setPhotoModal(log.photo_url!)}
                                title="Lihat foto"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={log.photo_url} alt="foto" className="log-thumb" />
                                <div className="log-photo-overlay">
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                    <path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="white" strokeWidth="1.8"/>
                                    <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.8"/>
                                  </svg>
                                </div>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        /* ── Layout ─────────────────────────────────────────────── */
        .pg { padding:1.5rem; max-width:680px; margin:0 auto; display:flex; flex-direction:column; gap:1rem; padding-bottom:4rem; }

        /* ── Topbar ─────────────────────────────────────────────── */
        .topbar { display:flex; align-items:center; gap:1rem; }
        .btn-back { display:flex; align-items:center; gap:6px; color:#64748b; font-size:0.85rem; font-weight:600; text-decoration:none; transition:color 0.15s; padding:6px 0; }
        .btn-back:hover { color:#e2e8f0; }
        .topbar-label { font-size:0.75rem; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:0.8px; margin-left:auto; }

        /* ── Karyawan Card ──────────────────────────────────────── */
        .karyawan-card { display:flex; align-items:center; gap:14px; padding:1.25rem; background:rgba(15,23,42,0.7); border:1px solid rgba(51,65,85,0.6); border-radius:16px; }
        .karyawan-card.ghost { opacity:0.5; }
        .karyawan-avatar { width:52px; height:52px; border-radius:14px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.25); display:flex; align-items:center; justify-content:center; font-size:1.4rem; font-weight:800; color:#a5b4fc; flex-shrink:0; }
        .ghost-av { background:rgba(51,65,85,0.3); color:#475569; }
        .karyawan-nama { font-size:1.05rem; font-weight:700; color:#f1f5f9; margin-bottom:5px; }
        .karyawan-sub { display:flex; align-items:center; gap:7px; flex-wrap:wrap; font-size:0.78rem; color:#64748b; }
        .badge-role { background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.2); padding:2px 8px; border-radius:100px; font-size:0.7rem; font-weight:700; }
        .dot { color:#1e293b; }
        .wa-link { color:#4ade80; text-decoration:none; }
        .wa-link:hover { text-decoration:underline; }

        /* ── Stats ──────────────────────────────────────────────── */
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:0.75rem; }
        .stat-card { padding:1rem; background:rgba(15,23,42,0.6); border:1px solid rgba(51,65,85,0.5); border-radius:12px; display:flex; flex-direction:column; gap:3px; }
        .stat-num { font-size:1.5rem; font-weight:800; color:#fff; }
        .stat-num.green { color:#4ade80; }
        .stat-num.red { color:#f87171; }
        .stat-label { font-size:0.68rem; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:0.4px; }

        /* ── Toolbar ─────────────────────────────────────────────── */
        .toolbar { display:flex; align-items:center; justify-content:space-between; gap:0.75rem; flex-wrap:wrap; }
        .filter-group { display:flex; gap:4px; background:rgba(15,23,42,0.6); border:1px solid rgba(51,65,85,0.5); border-radius:10px; padding:4px; }
        .filter-btn { padding:5px 14px; border-radius:7px; border:none; background:none; color:#64748b; font-size:0.78rem; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .filter-btn:hover { color:#e2e8f0; }
        .filter-active { background:rgba(99,102,241,0.2); color:#a5b4fc !important; }
        .count-badge { font-size:0.75rem; color:#475569; font-weight:600; }

        /* ── Loading / Error / Empty ─────────────────────────────── */
        .loading-wrap { display:flex; align-items:center; gap:10px; color:#475569; font-size:0.875rem; padding:1.5rem 0; }
        .spinner { width:20px; height:20px; border:2px solid rgba(99,102,241,0.2); border-top-color:#6366f1; border-radius:50%; animation:spin 0.7s linear infinite; flex-shrink:0; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .error-box { padding:1rem 1.25rem; background:rgba(239,68,68,0.08); border:1px solid rgba(248,113,113,0.2); border-radius:12px; color:#f87171; font-size:0.875rem; display:flex; gap:8px; align-items:flex-start; }
        .empty-state { display:flex; flex-direction:column; align-items:center; gap:0.75rem; padding:3rem 1rem; color:#475569; text-align:center; }
        .empty-icon { font-size:2rem; }
        .empty-state p { font-size:0.9rem; margin:0; }
        .btn-primary-sm { padding:0.55rem 1.25rem; background:#6366f1; border-radius:8px; color:#fff; font-size:0.85rem; font-weight:600; text-decoration:none; }

        /* ── Timeline ───────────────────────────────────────────── */
        .timeline { display:flex; flex-direction:column; gap:1.5rem; }
        .day-group { display:flex; flex-direction:column; gap:0.65rem; }

        /* Date header */
        .day-header { display:flex; align-items:center; gap:10px; }
        .day-line { flex:1; height:1px; background:rgba(30,41,59,0.8); }
        .day-label { font-size:0.75rem; font-weight:700; color:#475569; white-space:nowrap; text-transform:capitalize; }
        .day-durasi { font-size:0.72rem; color:#6366f1; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); padding:2px 8px; border-radius:6px; white-space:nowrap; }

        /* Log card */
        .day-logs { display:flex; flex-direction:column; gap:8px; }
        .log-card { display:flex; align-items:center; gap:12px; padding:0.9rem 1rem 0.9rem 0; background:rgba(15,23,42,0.6); border:1px solid rgba(51,65,85,0.5); border-radius:12px; overflow:hidden; transition:border-color 0.15s; position:relative; }
        .log-card:hover { border-color:rgba(99,102,241,0.3); }

        /* Accent bar */
        .log-accent { width:3px; height:100%; position:absolute; left:0; top:0; flex-shrink:0; }
        .accent-in { background:linear-gradient(180deg,#3b82f6,#2563eb); }
        .accent-out { background:linear-gradient(180deg,#f43f5e,#e11d48); }

        /* Icon */
        .log-icon { width:32px; height:32px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-left:14px; }
        .icon-in  { background:rgba(59,130,246,0.12); color:#60a5fa; border:1px solid rgba(59,130,246,0.2); }
        .icon-out { background:rgba(244,63,94,0.1); color:#fb7185; border:1px solid rgba(244,63,94,0.15); }

        /* Body */
        .log-body { flex:1; min-width:0; }
        .log-type-row { display:flex; align-items:center; gap:8px; margin-bottom:3px; }
        .log-type { font-size:0.875rem; font-weight:700; color:#e2e8f0; }
        .log-time { font-size:1.05rem; font-weight:800; color:#fff; font-variant-numeric:tabular-nums; margin-bottom:4px; }
        .log-distance { display:flex; align-items:center; gap:4px; font-size:0.72rem; color:#475569; }

        /* Status badge */
        .log-status { font-size:0.68rem; font-weight:700; padding:2px 8px; border-radius:100px; }
        .status-ontime { background:rgba(74,222,128,0.1); color:#4ade80; border:1px solid rgba(74,222,128,0.2); }
        .status-late   { background:rgba(248,113,113,0.1); color:#f87171; border:1px solid rgba(248,113,113,0.2); }

        /* Photo */
        .log-photo-btn { width:52px; height:52px; border-radius:10px; overflow:hidden; border:none; cursor:pointer; padding:0; position:relative; flex-shrink:0; margin-right:12px; }
        .log-thumb { width:100%; height:100%; object-fit:cover; display:block; }
        .log-photo-overlay { position:absolute; inset:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; opacity:0; transition:opacity 0.15s; }
        .log-photo-btn:hover .log-photo-overlay { opacity:1; }

        /* ── Photo Modal ────────────────────────────────────────── */
        .photo-overlay { position:fixed; inset:0; z-index:100; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.15s; }
        @keyframes fadeIn { from{opacity:0}to{opacity:1} }
        .photo-modal { position:relative; max-width:500px; width:100%; animation:scaleIn 0.2s; }
        @keyframes scaleIn { from{transform:scale(0.9);opacity:0}to{transform:scale(1);opacity:1} }
        .photo-close { position:absolute; top:-14px; right:-14px; width:32px; height:32px; border-radius:50%; background:#1e293b; border:1px solid rgba(51,65,85,0.8); color:#94a3b8; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; z-index:1; }
        .photo-close:hover { color:#fff; }
        .photo-img { width:100%; border-radius:14px; display:block; }

        /* ── Responsive ─────────────────────────────────────────── */
        @media(max-width:500px) {
          .stats-row { grid-template-columns:repeat(2,1fr); }
          .karyawan-sub { flex-direction:column; align-items:flex-start; gap:3px; }
          .dot { display:none; }
        }
      `}</style>
    </div>
  );
}