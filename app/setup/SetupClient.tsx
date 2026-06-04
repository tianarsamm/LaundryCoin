// app/setup/SetupClient.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;

interface FormData {
  nama:      string;
  username:  string;
  email:     string;
  password:  string;
  confirm:   string;
  no_hp:     string;
  nama_toko: string;
  lat:       string;
  lng:       string;
}

export default function SetupClient() {
  const router = useRouter();

  const [checking, setChecking] = useState(true); // cek apakah super admin sudah ada
  const [step,     setStep]     = useState<Step>(1);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [showPass, setShowPass] = useState(false);

  const [form, setForm] = useState<FormData>({
    nama: "", username: "", email: "", password: "", confirm: "", no_hp: "",
    nama_toko: "Laundry Coin", lat: "", lng: "",
  });

  // ── Cek apakah super admin sudah ada — jika ya, redirect ──
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase
        .from("users")
        .select("id")
        .eq("role", "super_admin")
        .eq("is_active", true)
        .limit(1);

      if ((data?.length ?? 0) > 0) {
        router.replace("/dashboard");
      } else {
        setChecking(false);
      }
    };
    check();
  }, [router]);

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      setError(null);
    };

  // ── Step 1 → 2 ──
  // ── Step 1 → 2 ──
const handleStep1 = (e: React.FormEvent) => {
  e.preventDefault();

  if (!form.nama.trim()) {
    return setError("Nama lengkap wajib diisi.");
  }

  if (!form.username.trim()) {
    return setError("Username wajib diisi.");
  }

  if (form.username.length < 4) {
    return setError("Username minimal 4 karakter.");
  }

  if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    return setError(
      "Username hanya boleh huruf, angka, dan underscore (_)."
    );
  }

  if (form.password.length < 8) {
    return setError("Password minimal 8 karakter.");
  }

  if (form.password !== form.confirm) {
    return setError("Password dan konfirmasi tidak cocok.");
  }

  setError(null);
  setStep(2);
};

  // ── Step 2 → 3 ──
  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || lat < -90  || lat > 90)  return setError("Latitude tidak valid (-90 hingga 90).");
    if (isNaN(lng) || lng < -180 || lng > 180) return setError("Longitude tidak valid (-180 hingga 180).");
    setError(null);
    setStep(3);
  };

  // ── Step 3: submit ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let userId: string;

      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,

        options: {
            data: {
            nama: form.nama.trim(),
            username: form.username.trim(),
            no_hp: form.no_hp.trim() || null,
            role: "super_admin",
            },
        },
        });

      if (
        authError?.message?.includes("already registered") ||
        authError?.message?.includes("User already registered")
      ) {
        // Akun Auth sudah ada → login saja
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email:    form.email.trim(),
            password: form.password,
          });
        if (loginError || !loginData.user)
          throw new Error("Email sudah terdaftar tapi password salah. Hapus akun lama di Supabase Auth.");
        userId = loginData.user.id;
      } else if (authError || !authData.user) {
        throw new Error(authError?.message ?? "Gagal membuat akun.");
      } else {
        userId = authData.user.id;
      }

      // 2. Cek apakah profil sudah ada
      // 2. Simpan / update profil super admin
const { error: profileError } = await supabase
  .from("users")
  .upsert({
    id: userId,
    username: form.username.trim(),
    email: form.email.trim(),
    nama: form.nama.trim(),
    no_hp: form.no_hp.trim() || null,
    role: "super_admin",
    rotation_index: null,
    is_active: true,
  });

if (profileError) {
  throw new Error(
    "Gagal simpan profil super admin: " + profileError.message
  );
}

      // 3. Store config — hanya insert jika belum ada
      const { data: existingStore } = await supabase
        .from("store_config").select("id").limit(1);

      if (!existingStore || existingStore.length === 0) {
        await supabase.from("store_config").insert({
          nama_toko:    form.nama_toko.trim() || "Laundry Coin",
          lat:          parseFloat(form.lat),
          lng:          parseFloat(form.lng),
          radius_meter: 100,
          updated_by:   userId,
        });
      }

      // 4. Pastikan sudah login
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email:    form.email.trim(),
          password: form.password,
        });
        if (loginError) throw new Error("Setup berhasil tapi gagal login otomatis.");
      }

      // 5. Update last_login
      await supabase.from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);

      router.push("/dashboard");
      router.refresh();

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan, coba lagi.");
      setLoading(false);
    }
  };

  // ── Loading saat cek super admin ──
  if (checking) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex",
        alignItems: "center", justifyContent: "center",
        flexDirection: "column", gap: "16px",
        color: "var(--color-text-muted)",
      }}>
        <div style={{
          width: 36, height: 36,
          border: "3px solid rgba(255,255,255,0.08)",
          borderTopColor: "var(--color-primary)",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }} />
        <p style={{ margin: 0, fontSize: "0.9rem" }}>Memeriksa sistem…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const steps = [
    { num: 1, label: "Akun Owner" },
    { num: 2, label: "Lokasi Toko" },
    { num: 3, label: "Konfirmasi" },
  ];

  const passwordChecks = [
    { label: "Minimal 8 karakter",    ok: form.password.length >= 8 },
    { label: "Huruf besar & kecil",   ok: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) },
    { label: "Angka atau simbol",     ok: /[0-9!@#$%^&*]/.test(form.password) },
  ];

  return (
    <div className="setup-page">
      <div className="bg-glow glow-1" />
      <div className="bg-glow glow-2" />

      <div className="setup-card glass-panel">

        {/* Logo */}
        <div className="setup-logo">
          <div className="logo-icon">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="4" fill="url(#sg)" fillOpacity="0.2"/>
              <path d="M4 14h24" stroke="url(#sg)" strokeWidth="1.5"/>
              <circle cx="10" cy="21" r="2.5" fill="url(#sg)" fillOpacity="0.4"/>
              <circle cx="16" cy="21" r="2.5" fill="url(#sg)"/>
              <circle cx="22" cy="21" r="2.5" fill="url(#sg)" fillOpacity="0.25"/>
              <path d="M11 8V6a5 5 0 0110 0v2" stroke="url(#sg)" strokeWidth="1.8" strokeLinecap="round"/>
              <defs>
                <linearGradient id="sg" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/><stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <p className="logo-name">Laundry Coin</p>
            <p className="logo-sub">SETUP AWAL SISTEM</p>
          </div>
        </div>

        <div className="setup-intro">
          <h1>Selamat Datang, Owner!</h1>
          <p>Lengkapi data berikut untuk mengaktifkan sistem.<br/>Proses ini hanya dilakukan sekali.</p>
        </div>

        {/* Step indicator */}
        <div className="step-bar">
          {steps.map((s, i) => (
            <div key={s.num} className="step-item">
              <div className={`step-circle ${step > s.num ? "done" : step === s.num ? "active" : ""}`}>
                {step > s.num ? (
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : s.num}
              </div>
              <span className={`step-label ${step === s.num ? "active" : ""}`}>{s.label}</span>
              {i < steps.length - 1 && <div className={`step-line ${step > s.num ? "done" : ""}`} />}
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="error-box" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* ── STEP 1: Akun Owner ── */}
        {step === 1 && (
          <form onSubmit={handleStep1} className="form">
            <div className="section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Data Akun Owner
            </div>

            <div className="field">
              <label>Nama Lengkap <span className="req">*</span></label>
              <input type="text" placeholder="Nama owner" value={form.nama} onChange={set("nama")} required />
            </div>
            <div className="field">
                <label>Username <span className="req">*</span></label>

                <input
                    type="text"
                    placeholder="username_owner"
                    value={form.username}
                    onChange={set("username")}
                    required
                    autoComplete="username"
                />

                <span className="hint">
                    Hanya huruf, angka, dan underscore (_)
                </span>
                </div>
            <div className="field">
              <label>Email <span className="req">*</span></label>
              <input type="email" placeholder="email@example.com" value={form.email} onChange={set("email")} required autoComplete="email" />
            </div>
            <div className="field">
              <label>No. HP <span className="opt">(opsional)</span></label>
              <input type="tel" placeholder="08xxxxxxxxxx" value={form.no_hp} onChange={set("no_hp")} />
            </div>
            <div className="field-row">
              <div className="field">
                <label>Password <span className="req">*</span></label>
                <div className="pass-wrap">
                  <input type={showPass ? "text" : "password"} placeholder="Min. 8 karakter"
                    value={form.password} onChange={set("password")} required minLength={8} />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                    {showPass
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                    }
                  </button>
                </div>
              </div>
              <div className="field">
                <label>Konfirmasi Password <span className="req">*</span></label>
                <input type={showPass ? "text" : "password"} placeholder="Ulangi password"
                  value={form.confirm} onChange={set("confirm")} required />
              </div>
            </div>

            <div className="pass-strength">
              {passwordChecks.map((c, i) => (
                <div key={i} className={`strength-item ${c.ok ? "ok" : ""}`}>
                  <span className="strength-dot" />{c.label}
                </div>
              ))}
            </div>

            <button type="submit" className="btn-primary">
              Lanjut ke Lokasi Toko
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        )}

        {/* ── STEP 2: Lokasi Toko ── */}
        {step === 2 && (
          <form onSubmit={handleStep2} className="form">
            <div className="section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Lokasi & Identitas Toko
            </div>

            <div className="field">
              <label>Nama Toko <span className="req">*</span></label>
              <input type="text" placeholder="Laundry Coin" value={form.nama_toko} onChange={set("nama_toko")} required />
            </div>

            <div className="info-box">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0, marginTop:2}}>
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <div>
                <strong>Cara ambil koordinat GPS toko:</strong>
                <ol>
                  <li>Buka <a href="https://maps.google.com" target="_blank" rel="noopener noreferrer">Google Maps</a></li>
                  <li>Arahkan ke lokasi toko Anda</li>
                  <li>Klik kanan pada titik toko → salin koordinat</li>
                </ol>
                Koordinat ini digunakan untuk validasi lokasi absensi karyawan (radius 100 meter).
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Latitude <span className="req">*</span></label>
                <input type="number" step="any" placeholder="-8.687247" value={form.lat} onChange={set("lat")} required />
                <span className="hint">Angka negatif untuk Lintang Selatan</span>
              </div>
              <div className="field">
                <label>Longitude <span className="req">*</span></label>
                <input type="number" step="any" placeholder="115.237121" value={form.lng} onChange={set("lng")} required />
                <span className="hint">Angka positif untuk Bujur Timur</span>
              </div>
            </div>

            <div className="btn-row">
              <button type="button" className="btn-back" onClick={() => { setStep(1); setError(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Kembali
              </button>
              <button type="submit" className="btn-primary">
                Lanjut ke Konfirmasi
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: Konfirmasi ── */}
        {step === 3 && (
          <form onSubmit={handleSubmit} className="form">
            <div className="section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Konfirmasi Data
            </div>

            <div className="confirm-grid">
              <div className="confirm-section">
                <p className="confirm-title">Akun Owner</p>
                <div className="confirm-row"><span>Nama</span><strong>{form.nama}</strong></div>
                <div className="confirm-row"><span>Email</span><strong>{form.email}</strong></div>
                <div className="confirm-row"><span>No. HP</span><strong>{form.no_hp || "—"}</strong></div>
                <div className="confirm-row"><span>Password</span><strong>{"•".repeat(form.password.length)}</strong></div>
              </div>
              <div className="confirm-section">
                <p className="confirm-title">Info Toko</p>
                <div className="confirm-row"><span>Nama Toko</span><strong>{form.nama_toko}</strong></div>
                <div className="confirm-row"><span>Latitude</span><strong>{form.lat}</strong></div>
                <div className="confirm-row"><span>Longitude</span><strong>{form.lng}</strong></div>
                <div className="confirm-row"><span>Radius Absensi</span><strong>100 meter</strong></div>
              </div>
            </div>

            <div className="confirm-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0, marginTop:2}}>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8"/>
              </svg>
              Setelah setup selesai, Anda akan langsung masuk sebagai Super Admin. Karyawan hanya bisa didaftarkan melalui menu Manajemen Karyawan.
            </div>

            <div className="btn-row">
              <button type="button" className="btn-back" onClick={() => { setStep(2); setError(null); }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M11 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Kembali
              </button>
              <button type="submit" className="btn-primary btn-success" disabled={loading}>
                {loading ? (
                  <><span className="spinner" /> Menyimpan…</>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                      <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Aktifkan Sistem
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      <style jsx>{`
        .setup-page {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          padding: 2rem 1rem; position: relative; overflow: hidden;
        }
        .bg-glow {
          position: fixed; border-radius: 50%;
          filter: blur(130px); pointer-events: none; z-index: 0;
        }
        .glow-1 { width: 500px; height: 500px; background: radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%); top: -150px; right: -100px; }
        .glow-2 { width: 400px; height: 400px; background: radial-gradient(circle, rgba(16,185,129,0.08), transparent 70%); bottom: -100px; left: -100px; }

        .setup-card {
          position: relative; z-index: 1;
          width: 100%; max-width: 560px; padding: 2.5rem;
          display: flex; flex-direction: column; gap: 1.5rem;
          animation: fadeUp 0.4s ease;
        }
        @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

        .setup-logo { display: flex; align-items: center; gap: 12px; }
        .logo-icon {
          width: 46px; height: 46px;
          display: flex; align-items: center; justify-content: center;
          background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.2);
          border-radius: 13px; flex-shrink: 0;
        }
        .logo-name { font-family: var(--font-display); font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; }
        .logo-sub { font-size: 0.65rem; font-weight: 700; color: var(--color-primary-dim); letter-spacing: 2px; margin: 0; }

        .setup-intro { text-align: center; }
        .setup-intro h1 { font-family: var(--font-display); font-size: clamp(1.5rem, 3vw, 1.9rem); font-weight: 800; color: #fff; margin: 0 0 6px; letter-spacing: -0.4px; }
        .setup-intro p { color: var(--color-text-muted); font-size: 0.88rem; margin: 0; line-height: 1.6; }

        .step-bar { display: flex; align-items: center; justify-content: center; }
        .step-item { display: flex; align-items: center; flex-direction: column; gap: 6px; }
        .step-circle {
          width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.82rem; font-weight: 700;
          background: rgba(255,255,255,0.04); border: 1.5px solid rgba(255,255,255,0.1);
          color: var(--color-text-muted); transition: all 0.3s ease; position: relative; z-index: 1;
        }
        .step-circle.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; box-shadow: 0 0 16px rgba(99,102,241,0.45); }
        .step-circle.done   { background: var(--color-success); border-color: var(--color-success); color: #fff; }
        .step-label { font-size: 0.72rem; font-weight: 600; color: var(--color-text-muted); white-space: nowrap; }
        .step-label.active { color: var(--color-text); }
        .step-line { width: 70px; height: 1.5px; background: rgba(255,255,255,0.07); margin: 0 6px; margin-bottom: 22px; transition: background 0.3s; }
        .step-line.done { background: var(--color-success); opacity: 0.5; }

        .error-box { display: flex; align-items: center; gap: 8px; padding: 11px 14px; background: var(--color-danger-dim); border: 1px solid rgba(244,63,94,0.22); border-radius: var(--radius-sm); color: #fda4af; font-size: 0.85rem; font-weight: 500; }

        .form { display: flex; flex-direction: column; gap: 1rem; }
        .section-title { display: flex; align-items: center; gap: 8px; font-size: 0.78rem; font-weight: 700; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; padding-bottom: 6px; border-bottom: 1px solid rgba(255,255,255,0.05); }
        .field { display: flex; flex-direction: column; gap: 5px; }
        .field label { font-size: 0.82rem; font-weight: 700; color: var(--color-text-muted); }
        .req { color: var(--color-danger); margin-left: 2px; }
        .opt { font-weight: 400; font-size: 0.76rem; }
        .field input { width: 100%; padding: 0.72rem 1rem; background: rgba(30,41,59,0.55); border: 1px solid var(--color-border); border-radius: var(--radius-sm); color: var(--color-text); font-size: 0.9rem; transition: all 0.2s ease; }
        .field input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-primary-glow); outline: none; }
        .hint { font-size: 0.75rem; color: var(--color-text-muted); }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.875rem; }

        .pass-wrap { position: relative; }
        .pass-wrap input { padding-right: 40px; }
        .eye-btn { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--color-text-muted); cursor: pointer; display: flex; align-items: center; padding: 4px; transition: color 0.15s; }
        .eye-btn:hover { color: var(--color-text); }

        .pass-strength { display: flex; gap: 14px; flex-wrap: wrap; padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); border-radius: var(--radius-sm); }
        .strength-item { display: flex; align-items: center; gap: 6px; font-size: 0.75rem; color: var(--color-text-muted); transition: color 0.2s; }
        .strength-item.ok { color: var(--color-success); }
        .strength-dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; flex-shrink: 0; }

        .info-box { display: flex; gap: 10px; padding: 12px 14px; background: rgba(99,102,241,0.06); border: 1px solid rgba(99,102,241,0.14); border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 0.8rem; line-height: 1.6; }
        .info-box strong { color: var(--color-text); display: block; margin-bottom: 4px; }
        .info-box ol { margin: 4px 0 6px 16px; padding: 0; }
        .info-box ol li { margin-bottom: 2px; }
        .info-box a { color: var(--color-primary-dim); text-decoration: underline; }

        .confirm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .confirm-section { padding: 14px 16px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06); border-radius: var(--radius-sm); display: flex; flex-direction: column; gap: 8px; }
        .confirm-title { font-size: 0.72rem; font-weight: 700; color: var(--color-primary-dim); text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px; }
        .confirm-row { display: flex; justify-content: space-between; gap: 8px; font-size: 0.82rem; }
        .confirm-row span { color: var(--color-text-muted); flex-shrink: 0; }
        .confirm-row strong { color: var(--color-text); text-align: right; word-break: break-all; }
        .confirm-note { display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px; background: rgba(16,185,129,0.06); border: 1px solid rgba(16,185,129,0.15); border-radius: var(--radius-sm); color: var(--color-text-muted); font-size: 0.8rem; line-height: 1.6; }

        .btn-row { display: flex; gap: 10px; margin-top: 4px; }
        .btn-primary { flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 0.82rem 1.2rem; background: var(--color-primary); color: #fff; font-weight: 700; font-size: 0.92rem; border-radius: var(--radius-sm); border: none; cursor: pointer; transition: all 0.2s cubic-bezier(0.4,0,0.2,1); box-shadow: 0 4px 18px rgba(99,102,241,0.3); }
        .btn-primary:hover:not(:disabled) { background: #4f46e5; transform: translateY(-1px); box-shadow: 0 6px 22px rgba(99,102,241,0.4); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .btn-primary.btn-success { background: var(--color-success); box-shadow: 0 4px 18px rgba(16,185,129,0.3); }
        .btn-primary.btn-success:hover:not(:disabled) { background: #059669; box-shadow: 0 6px 22px rgba(16,185,129,0.4); }
        .btn-back { display: flex; align-items: center; gap: 6px; padding: 0.82rem 1.1rem; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); color: var(--color-text-muted); font-weight: 600; font-size: 0.88rem; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; white-space: nowrap; }
        .btn-back:hover { background: rgba(255,255,255,0.07); color: var(--color-text); }
        .spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-top-color: #fff; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 560px) {
          .setup-card { padding: 2rem 1.25rem; }
          .field-row, .confirm-grid { grid-template-columns: 1fr; }
          .step-line { width: 40px; }
          .pass-strength { flex-direction: column; gap: 6px; }
        }
      `}</style>
    </div>
  );
}