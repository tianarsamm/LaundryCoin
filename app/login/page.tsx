// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  no_profile: "Akun Anda tidak ditemukan. Hubungi owner.",
  inactive:   "Akun Anda telah dinonaktifkan. Hubungi owner.",
  forbidden:  "Anda tidak memiliki akses ke halaman tersebut.",
};

export default function LoginPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const nextPath     = searchParams.get("next") || "/dashboard";
  const errorParam   = searchParams.get("error");

  const [email,    setEmail]    = useState("");   // ← ganti dari username
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error,    setError]    = useState<string | null>(
    errorParam ? (ERROR_MESSAGES[errorParam] ?? "Terjadi kesalahan.") : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // 1. Login langsung ke Supabase Auth pakai email
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (authError || !data.user) {
      setLoading(false);
      setError("Email atau password salah.");
      return;
    }

    // 2. Cek profil di public.users (aktif/tidak)
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id, is_active, nama, role")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Akun Anda tidak ditemukan. Hubungi owner.");
      return;
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("Akun Anda telah dinonaktifkan. Hubungi owner.");
      return;
    }

    // 3. Update last_login (fire and forget)
    supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);

    // 4. Redirect
    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="login-page">
      <div className="bg-glow glow-1" />
      <div className="bg-glow glow-2" />

      <div className="login-card glass-panel">
        {/* Logo */}
        <div className="login-logo">
          <div className="logo-icon">
            <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="24" height="18" rx="4" fill="url(#lg)" fillOpacity="0.2"/>
              <path d="M4 14h24" stroke="url(#lg)" strokeWidth="1.5"/>
              <circle cx="10" cy="21" r="2.5" fill="url(#lg)" fillOpacity="0.4"/>
              <circle cx="16" cy="21" r="2.5" fill="url(#lg)"/>
              <circle cx="22" cy="21" r="2.5" fill="url(#lg)" fillOpacity="0.25"/>
              <path d="M11 8V6a5 5 0 0110 0v2" stroke="url(#lg)" strokeWidth="1.8" strokeLinecap="round"/>
              <defs>
                <linearGradient id="lg" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1"/><stop offset="1" stopColor="#06b6d4"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <p className="logo-name">Laundry Coin</p>
            <p className="logo-sub">PREMIUM FINANCE</p>
          </div>
        </div>

        <div className="login-heading">
          <h1>Masuk ke Sistem</h1>
          <p>Gunakan email dan password yang diberikan oleh owner</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="error-box" role="alert">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="form">
          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email</label>
            <div className="input-wrap">
              <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input
                id="email" type="email" placeholder="cth. budi@gmail.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <svg className="input-icon" width="15" height="15" viewBox="0 0 24 24" fill="none">
                <rect x="5" y="10" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="12" cy="15.5" r="1.5" fill="currentColor"/>
              </svg>
              <input
                id="password" type={showPass ? "text" : "password"}
                placeholder="Masukkan password"
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" disabled={loading}
              />
              <button type="button" className="eye-btn"
                onClick={() => setShowPass(v => !v)} tabIndex={-1}>
                {showPass
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? (
              <><span className="spinner" /> Memverifikasi…</>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Masuk
              </>
            )}
          </button>
        </form>

        <p className="login-footer">
          Belum punya akun? Hubungi owner untuk didaftarkan.
        </p>
      </div>

      <style jsx>{`
        .login-page { min-height:100vh; display:flex; align-items:center; justify-content:center; padding:1.5rem; position:relative; overflow:hidden; }
        .bg-glow { position:fixed; border-radius:50%; filter:blur(120px); pointer-events:none; z-index:0; }
        .glow-1 { width:500px; height:500px; background:radial-gradient(circle, rgba(99,102,241,0.12), transparent 70%); top:-150px; right:-100px; }
        .glow-2 { width:400px; height:400px; background:radial-gradient(circle, rgba(6,182,212,0.08), transparent 70%); bottom:-100px; left:-100px; }
        .login-card { position:relative; z-index:1; width:100%; max-width:400px; padding:2.5rem; display:flex; flex-direction:column; gap:1.5rem; animation:fadeUp 0.35s ease; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        .login-logo { display:flex; align-items:center; gap:12px; }
        .logo-icon { width:46px; height:46px; display:flex; align-items:center; justify-content:center; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); border-radius:13px; flex-shrink:0; }
        .logo-name { font-family:var(--font-display); font-size:1.1rem; font-weight:800; color:#fff; margin:0; }
        .logo-sub { font-size:0.65rem; font-weight:700; color:var(--color-primary-dim); letter-spacing:2px; margin:0; }
        .login-heading h1 { font-family:var(--font-display); font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 5px; letter-spacing:-0.3px; }
        .login-heading p { color:var(--color-text-muted); font-size:0.87rem; margin:0; }
        .error-box { display:flex; align-items:center; gap:8px; padding:11px 14px; background:var(--color-danger-dim); border:1px solid rgba(244,63,94,0.22); border-radius:var(--radius-sm); color:#fda4af; font-size:0.85rem; font-weight:500; }
        .form { display:flex; flex-direction:column; gap:1rem; }
        .field { display:flex; flex-direction:column; gap:5px; }
        .field label { font-size:0.82rem; font-weight:700; color:var(--color-text-muted); }
        .input-wrap { position:relative; display:flex; align-items:center; }
        .input-icon { position:absolute; left:13px; color:var(--color-text-muted); pointer-events:none; }
        .input-wrap input { width:100%; padding:0.75rem 1rem 0.75rem 2.5rem; background:rgba(30,41,59,0.55); border:1px solid var(--color-border); border-radius:var(--radius-sm); color:var(--color-text); font-size:0.9rem; transition:all 0.2s ease; }
        .input-wrap input:focus { border-color:var(--color-primary); box-shadow:0 0 0 3px var(--color-primary-glow); outline:none; }
        .input-wrap input:disabled { opacity:0.5; cursor:not-allowed; }
        .eye-btn { position:absolute; right:11px; background:none; border:none; color:var(--color-text-muted); cursor:pointer; display:flex; align-items:center; padding:4px; transition:color 0.15s; }
        .eye-btn:hover { color:var(--color-text); }
        .btn-login { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; padding:0.85rem; background:var(--color-primary); color:#fff; font-weight:700; font-size:0.93rem; border-radius:var(--radius-sm); border:none; cursor:pointer; margin-top:4px; transition:all 0.2s cubic-bezier(0.4,0,0.2,1); box-shadow:0 4px 18px rgba(99,102,241,0.3); }
        .btn-login:hover:not(:disabled) { background:#4f46e5; transform:translateY(-1px); box-shadow:0 6px 22px rgba(99,102,241,0.4); }
        .btn-login:active:not(:disabled) { transform:translateY(0); }
        .btn-login:disabled { opacity:0.6; cursor:not-allowed; transform:none; }
        .spinner { width:16px; height:16px; border:2px solid rgba(255,255,255,0.3); border-top-color:#fff; border-radius:50%; animation:spin 0.7s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }
        .login-footer { text-align:center; font-size:0.8rem; color:var(--color-text-muted); margin:0; }
        @media (max-width:440px) { .login-card { padding:2rem 1.25rem; } }
      `}</style>
    </div>
  );
}