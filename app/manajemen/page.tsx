"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

// ─── Types ───────────────────────────────────────────────────────────────────
type Role = "super_admin" | "admin" | "kasir" | "operator";

interface Karyawan {
  id: string;
  username: string;
  email: string;
  nama: string;
  role: Role;
  nomor_wa: string;
  is_active: boolean;
  last_login: string | null;
}

// (removed unused MOCK sample data)

// Supabase row type for users table
type SupabaseUserRow = {
  id: string;
  username: string;
  email: string;
  nama: string;
  role: Role;
  no_hp?: string | null;
  is_active: boolean;
  last_login?: string | null;
};

const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  kasir: "Kasir",
  operator: "Operator",
};
const ROLE_COLOR: Record<Role, string> = {
  super_admin: "badge-super-admin",
  admin:       "badge-admin",
  kasir:       "badge-kasir",
  operator:    "badge-operator",
};

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconPlus   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>;
const IconEdit   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconTrash  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>;
const IconMoney  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="2" y="6" width="20" height="14" rx="3" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="13" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M6 10h.01M18 10h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconCal    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.8"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconSearch = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.8"/><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconEye    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>;
const IconEyeOff = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;
const IconX      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>;
const IconUser   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>;

// ─── Modal: Tambah / Edit Karyawan ────────────────────────────────────────────
function ModalKaryawan({
  onClose, onSave, initial,
}: {
  onClose: () => void;
  onSave: (k: Partial<Karyawan> & { password?: string }) => void;
  initial?: Karyawan;
}) {
  const isEdit = !!initial;
  const [username, setUsername] = useState(initial?.username ?? "");
  const [email,    setEmail]    = useState(initial?.email    ?? "");
  const [nama,     setNama]     = useState(initial?.nama     ?? "");
  const [role,     setRole]     = useState<Role>(initial?.role ?? "admin");
  const [nowa,     setNowa]     = useState(initial?.nomor_wa  ?? "");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [active,   setActive]   = useState(initial?.is_active ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      username, email, nama, role,
      nomor_wa: nowa, is_active: active,
      ...(password ? { password } : {}),
    });
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-panel">
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon"><IconUser /></div>
            <div>
              <h2>{isEdit ? "Edit Karyawan" : "Tambah Karyawan"}</h2>
              <p>{isEdit ? `Mengedit data ${initial?.nama}` : "Buat akun baru untuk karyawan"}</p>
            </div>
          </div>
          <button className="btn-icon" onClick={onClose}><IconX /></button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {!isEdit ? (
            <div className="field-row">
              <div className="field">
                <label>Username <span className="req">*</span></label>
                <div className="input-wrap">
                  <input type="text" placeholder="cth. Admin01" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <span className="field-hint">Untuk identitas di sistem</span>
              </div>
              <div className="field">
                <label>Email <span className="req">*</span></label>
                <div className="input-wrap">
                  <input type="email" placeholder="cth. budi@gmail.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <span className="field-hint">Digunakan untuk login</span>
              </div>
            </div>
          ) : (
            <div className="field-row">
              <div className="field">
                <label>Username</label>
                <div className="input-wrap"><input type="text" value={username} disabled /></div>
              </div>
              <div className="field">
                <label>Email</label>
                <div className="input-wrap"><input type="email" value={email} disabled /></div>
              </div>
            </div>
          )}

          <div className="field">
            <label>Nama Lengkap <span className="req">*</span></label>
            <div className="input-wrap">
              <input type="text" placeholder="cth. Budi Santoso" value={nama} onChange={e => setNama(e.target.value)} required />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Role <span className="req">*</span></label>
              <select value={role} onChange={e => setRole(e.target.value as Role)} required>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="kasir">Kasir</option>
                <option value="operator">Operator</option>
              </select>
            </div>
            <div className="field">
              <label>Nomor WhatsApp <span className="req">*</span></label>
              <div className="input-wrap">
                <input type="tel" placeholder="08xxxxxxxxxx" value={nowa} onChange={e => setNowa(e.target.value)} required />
              </div>
            </div>
          </div>

          <div className="field">
            <label>
              {isEdit ? "Password Baru" : "Password"}{" "}
              {!isEdit && <span className="req">*</span>}
            </label>
            <div className="input-wrap">
              <input
                type={showPw ? "text" : "password"}
                placeholder={isEdit ? "Kosongkan jika tidak diubah" : "Buat password karyawan"}
                value={password} onChange={e => setPassword(e.target.value)}
                required={!isEdit}
              />
              <button type="button" className="eye-btn" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                {showPw ? <IconEyeOff /> : <IconEye />}
              </button>
            </div>
            {!isEdit && (
              <span className="field-hint">Min. 8 karakter, kombinasi huruf besar, huruf kecil, dan angka.</span>
            )}
          </div>

          {isEdit && (
            <div className="field">
              <label>Status Akun</label>
              <div className="toggle-wrap">
                <button type="button" className={`toggle ${active ? "toggle-on" : "toggle-off"}`} onClick={() => setActive(v => !v)}>
                  <span className="toggle-thumb" />
                </button>
                <span className={active ? "toggle-label-on" : "toggle-label-off"}>{active ? "Aktif" : "Nonaktif"}</span>
              </div>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn-primary">{isEdit ? "Simpan Perubahan" : "Buat Akun"}</button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.6); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.15s ease; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .modal-card { width:100%; max-width:540px; padding:2rem; display:flex; flex-direction:column; gap:1.5rem; animation:slideUp 0.2s ease; }
        @keyframes slideUp { from { transform:translateY(24px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .modal-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; }
        .modal-title-wrap { display:flex; align-items:center; gap:12px; }
        .modal-icon { width:42px; height:42px; background:rgba(99,102,241,0.12); border:1px solid rgba(99,102,241,0.2); border-radius:11px; display:flex; align-items:center; justify-content:center; color:var(--color-primary); flex-shrink:0; }
        .modal-header h2 { font-family:var(--font-display); font-size:1.15rem; font-weight:800; color:#fff; margin:0 0 3px; }
        .modal-header p { font-size:0.8rem; color:var(--color-text-muted); margin:0; }
        .modal-form { display:flex; flex-direction:column; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:5px; flex:1; min-width:0; }
        .field label { font-size:0.8rem; font-weight:700; color:var(--color-text-muted); }
        .req { color:#f87171; }
        .field-hint { font-size:0.75rem; color:var(--color-text-muted); opacity:0.7; }
        .field-row { display:grid; grid-template-columns:1fr 1fr; gap:1rem; }
        .input-wrap { position:relative; display:flex; align-items:center; }
        .input-wrap input, .field select { width:100%; padding:0.7rem 0.9rem; background:rgba(30,41,59,0.55); border:1px solid var(--color-border); border-radius:var(--radius-sm); color:var(--color-text); font-size:0.875rem; transition:all 0.2s; }
        .input-wrap input:focus, .field select:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary-glow); outline:none; }
        .input-wrap input:disabled { opacity:0.45; cursor:not-allowed; }
        .field select { appearance:none; cursor:pointer; }
        .eye-btn { position:absolute; right:10px; background:none; border:none; color:var(--color-text-muted); cursor:pointer; padding:4px; display:flex; align-items:center; }
        .toggle-wrap { display:flex; align-items:center; gap:10px; }
        .toggle { position:relative; width:44px; height:24px; border-radius:12px; border:none; cursor:pointer; transition:background 0.25s; padding:0; }
        .toggle-on { background:var(--color-primary); }
        .toggle-off { background:rgba(71,85,105,0.6); }
        .toggle-thumb { position:absolute; top:3px; width:18px; height:18px; background:#fff; border-radius:50%; transition:left 0.25s; }
        .toggle-on .toggle-thumb { left:23px; }
        .toggle-off .toggle-thumb { left:3px; }
        .toggle-label-on { font-size:0.82rem; font-weight:600; color:#4ade80; }
        .toggle-label-off { font-size:0.82rem; font-weight:600; color:#94a3b8; }
        .modal-actions { display:flex; justify-content:flex-end; gap:0.75rem; padding-top:0.5rem; }
        .btn-secondary { padding:0.65rem 1.2rem; background:rgba(51,65,85,0.5); border:1px solid var(--color-border); border-radius:var(--radius-sm); color:var(--color-text-muted); font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .btn-secondary:hover { background:rgba(71,85,105,0.5); color:var(--color-text); }
        .btn-primary { padding:0.65rem 1.4rem; background:var(--color-primary); border:none; border-radius:var(--radius-sm); color:#fff; font-size:0.875rem; font-weight:700; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 14px rgba(99,102,241,0.3); }
        .btn-primary:hover { background:#4f46e5; transform:translateY(-1px); }
        .btn-icon { background:none; border:none; color:var(--color-text-muted); cursor:pointer; padding:4px; display:flex; align-items:center; transition:color 0.15s; }
        .btn-icon:hover { color:var(--color-text); }
        @media (max-width:500px) { .field-row { grid-template-columns:1fr; } }
      `}</style>
    </div>
  );
}

// ─── Modal: Konfirmasi Hapus ──────────────────────────────────────────────────
function ModalHapus({ karyawan, onClose, onConfirm }: { karyawan: Karyawan; onClose: () => void; onConfirm: () => void }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-card glass-panel">
        <div className="hapus-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <h2>Hapus Karyawan?</h2>
        <p>Akun <strong>{karyawan.nama}</strong> ({karyawan.email}) akan dihapus permanen dan tidak dapat dipulihkan.</p>
        <div className="hapus-actions">
          <button className="btn-secondary" onClick={onClose}>Batal</button>
          <button className="btn-danger" onClick={onConfirm}>Ya, Hapus</button>
        </div>
      </div>
      <style jsx>{`
        .modal-overlay { position:fixed; inset:0; z-index:50; background:rgba(0,0,0,0.65); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:1rem; animation:fadeIn 0.15s; }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .modal-card { width:100%; max-width:380px; padding:2rem; display:flex; flex-direction:column; align-items:center; gap:1rem; text-align:center; animation:slideUp 0.2s; }
        @keyframes slideUp { from { transform:translateY(16px); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .hapus-icon { width:60px; height:60px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; color:#f43f5e; }
        h2 { font-family:var(--font-display); font-size:1.2rem; font-weight:800; color:#fff; margin:0; }
        p { font-size:0.875rem; color:var(--color-text-muted); margin:0; line-height:1.5; }
        p strong { color:var(--color-text); }
        .hapus-actions { display:flex; gap:0.75rem; width:100%; margin-top:0.5rem; }
        .btn-secondary { flex:1; padding:0.7rem; background:rgba(51,65,85,0.5); border:1px solid var(--color-border); border-radius:var(--radius-sm); color:var(--color-text-muted); font-size:0.875rem; font-weight:600; cursor:pointer; transition:all 0.2s; }
        .btn-secondary:hover { background:rgba(71,85,105,0.5); color:var(--color-text); }
        .btn-danger { flex:1; padding:0.7rem; background:#e11d48; border:none; border-radius:var(--radius-sm); color:#fff; font-size:0.875rem; font-weight:700; cursor:pointer; transition:all 0.2s; }
        .btn-danger:hover { background:#be123c; }
      `}</style>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ManajemenKaryawanPage() {
  const router = useRouter();
  const [list, setList] = useState<Karyawan[]>([]);
  const [search, setSearch] = useState("");

  const [modalAdd, setModalAdd] = useState(false);
  const [modalEdit, setModalEdit] = useState<Karyawan | null>(null);
  const [modalHapus, setModalHapus] = useState<Karyawan | null>(null);

  // Ambil data karyawan (yang berrole admin)
  const fetchKaryawan = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "admin")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        alert("Gagal mengambil data karyawan");
        return;
      }

      const mapped: Karyawan[] = (data || []).map((u: SupabaseUserRow) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        nama: u.nama,
        role: u.role,
        nomor_wa: u.no_hp || "",
        is_active: u.is_active,
        last_login: u.last_login,
      }));

      setList(mapped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => fetchKaryawan());
  }, []);

  const filtered = list.filter(
    (k) =>
      k.nama.toLowerCase().includes(search.toLowerCase()) ||
      k.username.toLowerCase().includes(search.toLowerCase()) ||
      k.email.toLowerCase().includes(search.toLowerCase()) ||
      k.role.includes(search.toLowerCase())
  );

  // ── NAVIGASI KE HALAMAN GAJI ─────────────────────────────────
  // Simpan data karyawan ke sessionStorage supaya GajiPage bisa
  // membacanya tanpa perlu fetch ulang / props drilling.
  const handleKelolahGaji = (k: Karyawan) => {
    sessionStorage.setItem(
      `karyawan_${k.id}`,
      JSON.stringify({
        id:       k.id,
        nama:     k.nama,
        role:     ROLE_LABEL[k.role],
        nomor_wa: k.nomor_wa,
        email:    k.email,
      })
    );
    router.push(`/manajemen/gaji?id=${k.id}`);
  };

  const handleAdd = async (data: Partial<Karyawan> & { password?: string }) => {
    try {
      const res = await fetch("/api/karyawan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          username: data.username,
          password: data.password,
          nama: data.nama,
          no_hp: data.nomor_wa,
          role: data.role,
        }),
      });

      const json = await res.json();
      if (!json?.success) {
        alert("Gagal membuat karyawan: " + (json?.error ?? "server error"));
        return;
      }
      await fetchKaryawan();
      setModalAdd(false);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat membuat karyawan.");
    }
  };

  const handleEdit = async (data: Partial<Karyawan> & { password?: string }) => {
    if (!modalEdit) return;
    try {
      const { error } = await supabase
        .from("users")
        .update({ nama: data.nama, no_hp: data.nomor_wa, role: data.role, is_active: data.is_active })
        .eq("id", modalEdit.id);
      if (error) { console.error(error); alert("Gagal update karyawan"); return; }
      await fetchKaryawan();
      setModalEdit(null);
    } catch (err) { console.error(err); alert("Terjadi kesalahan saat update"); }
  };

  const handleHapus = async () => {
    if (!modalHapus) return;
    try {
      const { error } = await supabase.from("users").delete().eq("id", modalHapus.id);
      if (error) { console.error(error); alert("Gagal menghapus karyawan"); return; }
      await fetchKaryawan();
      setModalHapus(null);
    } catch (err) { console.error(err); alert("Terjadi kesalahan saat menghapus"); }
  };

  const aktif    = list.filter((k) => k.is_active).length;
  const nonaktif = list.length - aktif;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Manajemen Karyawan</h1>
          <p>Kelola akun dan data seluruh karyawan sistem</p>
        </div>
        <button className="btn-add" onClick={() => setModalAdd(true)}>
          <IconPlus />
          Tambah Karyawan
        </button>
      </div>

      <div className="stats-row">
        <div className="stat-card glass-panel">
          <span className="stat-num">{list.length}</span>
          <span className="stat-label">Total Karyawan</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-num stat-green">{aktif}</span>
          <span className="stat-label">Aktif</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-num stat-red">{nonaktif}</span>
          <span className="stat-label">Nonaktif</span>
        </div>
        <div className="stat-card glass-panel">
          <span className="stat-num stat-blue">{list.filter(k => k.role === "admin").length}</span>
          <span className="stat-label">Admin</span>
        </div>
      </div>

      <div className="table-card glass-panel">
        <div className="toolbar">
          <div className="search-wrap">
            <IconSearch />
            <input
              type="text" placeholder="Cari nama, username, email, atau role…"
              value={search} onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className="count-label">{filtered.length} karyawan</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Karyawan</th>
                <th>Role</th>
                <th>Nomor WhatsApp</th>
                <th>Status</th>
                <th className="th-center">Kelola Gaji</th>
                <th className="th-center">Riwayat Absensi</th>
                <th className="th-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="empty">Tidak ada karyawan ditemukan.</td></tr>
              ) : filtered.map((k, i) => (
                <tr key={k.id} className={!k.is_active ? "row-inactive" : ""}>
                  <td className="td-num">{i + 1}</td>
                  <td>
                    <div className="karyawan-cell">
                      <div className="avatar">{k.nama.charAt(0).toUpperCase()}</div>
                      <div>
                        <div className="karyawan-nama">{k.nama}</div>
                        <div className="karyawan-meta">@{k.username} · {k.email}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className={`badge ${ROLE_COLOR[k.role]}`}>{ROLE_LABEL[k.role]}</span></td>
                  <td>
                    <a href={`https://wa.me/62${k.nomor_wa.slice(1)}`} target="_blank" rel="noreferrer" className="wa-link">
                      {k.nomor_wa}
                    </a>
                  </td>
                  <td>
                    <span className={`status ${k.is_active ? "status-active" : "status-inactive"}`}>
                      {k.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  {/* ── TOMBOL KELOLA GAJI — pakai handleKelolahGaji ── */}
                  <td className="td-center">
                    <button
                      className="action-btn action-money"
                      title={`Kelola Gaji ${k.nama}`}
                      onClick={() => handleKelolahGaji(k)}
                    >
                      <IconMoney />
                    </button>
                  </td>
                  <td className="td-center">
                    <button className="action-btn action-cal" title="Riwayat Absensi"><IconCal /></button>
                  </td>
                  <td className="td-center">
                    <div className="action-group">
                      <button className="action-btn action-edit" title="Edit" onClick={() => setModalEdit(k)}><IconEdit /></button>
                      <button className="action-btn action-trash" title="Hapus" onClick={() => setModalHapus(k)}><IconTrash /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalAdd   && <ModalKaryawan onClose={() => setModalAdd(false)}   onSave={handleAdd} />}
      {modalEdit  && <ModalKaryawan onClose={() => setModalEdit(null)}   onSave={handleEdit} initial={modalEdit} />}
      {modalHapus && <ModalHapus   karyawan={modalHapus} onClose={() => setModalHapus(null)} onConfirm={handleHapus} />}

      <style jsx>{`
        .page { padding:2rem; display:flex; flex-direction:column; gap:1.5rem; max-width:1200px; margin:0 auto; }
        .page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:1rem; flex-wrap:wrap; }
        .page-header h1 { font-family:var(--font-display); font-size:1.65rem; font-weight:800; color:#fff; margin:0 0 4px; letter-spacing:-0.4px; }
        .page-header p { font-size:0.875rem; color:var(--color-text-muted); margin:0; }
        .btn-add { display:flex; align-items:center; gap:8px; padding:0.7rem 1.3rem; background:var(--color-primary); border:none; border-radius:var(--radius-sm); color:#fff; font-weight:700; font-size:0.875rem; cursor:pointer; transition:all 0.2s; box-shadow:0 4px 16px rgba(99,102,241,0.3); white-space:nowrap; }
        .btn-add:hover { background:#4f46e5; transform:translateY(-1px); }
        .stats-row { display:grid; grid-template-columns:repeat(4,1fr); gap:1rem; }
        .stat-card { padding:1.2rem 1.5rem; display:flex; flex-direction:column; gap:4px; }
        .stat-num { font-family:var(--font-display); font-size:1.8rem; font-weight:800; color:#fff; }
        .stat-num.stat-green { color:#4ade80; }
        .stat-num.stat-red   { color:#f87171; }
        .stat-num.stat-blue  { color:#60a5fa; }
        .stat-label { font-size:0.78rem; color:var(--color-text-muted); font-weight:600; text-transform:uppercase; letter-spacing:0.5px; }
        .table-card { padding:0; overflow:hidden; }
        .toolbar { display:flex; align-items:center; justify-content:space-between; padding:1.25rem 1.5rem; border-bottom:1px solid var(--color-border); gap:1rem; flex-wrap:wrap; }
        .search-wrap { display:flex; align-items:center; gap:10px; background:rgba(30,41,59,0.55); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:0.6rem 1rem; color:var(--color-text-muted); flex:1; max-width:400px; }
        .search-wrap input { background:none; border:none; outline:none; color:var(--color-text); font-size:0.875rem; width:100%; }
        .search-wrap input::placeholder { color:var(--color-text-muted); }
        .count-label { font-size:0.8rem; color:var(--color-text-muted); font-weight:600; white-space:nowrap; }
        .table-scroll { overflow-x:auto; }
        table { width:100%; border-collapse:collapse; }
        thead tr { background:rgba(15,23,42,0.4); }
        th { padding:0.9rem 1rem; text-align:left; font-size:0.75rem; font-weight:700; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.5px; white-space:nowrap; border-bottom:1px solid var(--color-border); }
        th.th-center { text-align:center; }
        tbody tr { border-bottom:1px solid rgba(30,41,59,0.6); transition:background 0.15s; }
        tbody tr:last-child { border-bottom:none; }
        tbody tr:hover { background:rgba(99,102,241,0.04); }
        tbody tr.row-inactive { opacity:0.55; }
        td { padding:0.9rem 1rem; font-size:0.875rem; color:var(--color-text); vertical-align:middle; }
        td.td-num { color:var(--color-text-muted); font-size:0.8rem; width:40px; }
        td.td-center { text-align:center; }
        .empty { text-align:center; padding:2.5rem; color:var(--color-text-muted); font-size:0.875rem; }
        .karyawan-cell { display:flex; align-items:center; gap:10px; }
        .avatar { width:34px; height:34px; border-radius:10px; background:rgba(99,102,241,0.15); border:1px solid rgba(99,102,241,0.2); display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.875rem; color:var(--color-primary); flex-shrink:0; }
        .karyawan-nama { font-weight:600; color:var(--color-text); font-size:0.875rem; }
        .karyawan-meta { font-size:0.73rem; color:var(--color-text-muted); margin-top:2px; }
        .badge { display:inline-flex; padding:3px 10px; border-radius:100px; font-size:0.73rem; font-weight:700; letter-spacing:0.2px; }
        .badge-super-admin { background:rgba(147,51,234,0.14); color:#c084fc; border:1px solid rgba(147,51,234,0.25); }
        .badge-admin       { background:rgba(99,102,241,0.15); color:#a5b4fc; border:1px solid rgba(99,102,241,0.25); }
        .badge-kasir       { background:rgba(16,185,129,0.12); color:#6ee7b7; border:1px solid rgba(16,185,129,0.2); }
        .badge-operator    { background:rgba(245,158,11,0.12); color:#fcd34d; border:1px solid rgba(245,158,11,0.2); }
        .status { display:inline-flex; align-items:center; gap:5px; font-size:0.78rem; font-weight:600; }
        .status::before { content:''; width:6px; height:6px; border-radius:50%; display:inline-block; }
        .status-active::before  { background:#4ade80; box-shadow:0 0 6px rgba(74,222,128,0.5); }
        .status-inactive::before { background:#94a3b8; }
        .status-active  { color:#4ade80; }
        .status-inactive { color:#94a3b8; }
        .wa-link { color:var(--color-text-muted); text-decoration:none; font-size:0.85rem; transition:color 0.15s; }
        .wa-link:hover { color:#4ade80; }
        .action-btn { width:30px; height:30px; border-radius:8px; border:1px solid var(--color-border); background:rgba(30,41,59,0.4); color:var(--color-text-muted); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:all 0.15s; }
        .action-btn:hover { border-color:transparent; color:#fff; transform:translateY(-1px); }
        .action-money:hover { background:rgba(16,185,129,0.2); color:#6ee7b7; }
        .action-cal:hover   { background:rgba(6,182,212,0.2);  color:#67e8f9; }
        .action-edit:hover  { background:rgba(99,102,241,0.2); color:#a5b4fc; }
        .action-trash:hover { background:rgba(244,63,94,0.15); color:#fda4af; }
        .action-group { display:inline-flex; gap:6px; align-items:center; }
        @media (max-width:768px) {
          .page { padding:1rem; }
          .stats-row { grid-template-columns:repeat(2,1fr); }
          .page-header { flex-direction:column; }
          .btn-add { width:100%; justify-content:center; }
        }
      `}</style>
    </div>
  );
}