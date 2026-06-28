// app/login/page.tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

const ERROR_MESSAGES: Record<string, string> = {
  no_profile: "Akun Anda tidak ditemukan. Hubungi owner.",
  inactive:   "Akun Anda telah dinonaktifkan. Hubungi owner.",
  forbidden:  "Anda tidak memiliki akses ke halaman tersebut.",
};

function LoginForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const nextPath     = searchParams.get("next") || "/dashboard";
  const errorParam   = searchParams.get("error");

  const [email,    setEmail]    = useState("");
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

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    });

    if (authError || !data.user) {
      setLoading(false);
      setError("Email atau password salah.");
      return;
    }

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

    void supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", data.user.id);

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="card">
      <div className="card-border" />
      <div className="accent-line" />

      {/* Logo */}
      <div className="logo-row">
        <div className="logo-mark">
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <rect x="4" y="8" width="24" height="18" rx="4" fill="url(#lg)" fillOpacity="0.25"/>
            <path d="M4 14h24" stroke="url(#lg)" strokeWidth="1.5"/>
            <circle cx="10" cy="21" r="2.5" fill="url(#lg)" fillOpacity="0.45"/>
            <circle cx="16" cy="21" r="2.5" fill="url(#lg)"/>
            <circle cx="22" cy="21" r="2.5" fill="url(#lg)" fillOpacity="0.25"/>
            <path d="M11 8V6a5 5 0 0110 0v2" stroke="url(#lg)" strokeWidth="1.8" strokeLinecap="round"/>
            <defs>
              <linearGradient id="lg" x1="4" y1="6" x2="28" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#818cf8"/><stop offset="1" stopColor="#22d3ee"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="logo-text">
          <span className="logo-name">Laundry<em>Coin</em></span>
          <span className="logo-tag">PREMIUM FINANCE</span>
        </div>
      </div>

      {/* Heading */}
      <div className="heading">
        <h1>Selamat Datang</h1>
        <p>Masuk dengan akun yang diberikan oleh owner</p>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box" role="alert">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{flexShrink:0}}>
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
            <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="form">
        <div className="field">
          <label htmlFor="email">Email</label>
          <div className="input-wrap">
            <svg className="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="4" width="20" height="16" rx="3" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M2 7l10 7 10-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            <input
              id="email" type="email" placeholder="budi@gmail.com"
              value={email} onChange={e => setEmail(e.target.value)}
              required autoComplete="email" disabled={loading}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-wrap">
            <svg className="field-icon" width="14" height="14" viewBox="0 0 24 24" fill="none">
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
            <button type="button" className="eye-btn" onClick={() => setShowPass(v => !v)} tabIndex={-1}>
              {showPass
                ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/><path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 12s3.5-7 9-7 9 7 9 7-3.5 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
              }
            </button>
          </div>
        </div>

        <button type="submit" className="btn-submit" disabled={loading}>
          <span className="btn-bg" />
          {loading ? (
            <span className="btn-content"><span className="spinner" />Memverifikasi…</span>
          ) : (
            <span className="btn-content">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Masuk ke Sistem
            </span>
          )}
        </button>
      </form>

      <p className="footer-note">Belum punya akun? Hubungi owner untuk didaftarkan.</p>

      <style jsx>{`
        /* ── Card ── */
        .card {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 420px;
          background: var(--login-card-bg);
          border-radius: 24px;
          padding: 2.75rem 2.5rem 2.25rem;
          display: flex;
          flex-direction: column;
          gap: 1.6rem;
          animation: riseIn 0.45s cubic-bezier(0.22,1,0.36,1) both;
          box-shadow: var(--login-card-shadow);
        }
        @keyframes riseIn {
          from { opacity:0; transform: translateY(28px) scale(0.97); }
          to   { opacity:1; transform: translateY(0) scale(1); }
        }

        /* shimmer border */
        .card-border {
          position: absolute;
          inset: 0;
          border-radius: 24px;
          padding: 1px;
          background: var(--login-card-border);
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }

        /* top accent */
        .accent-line {
          position: absolute;
          top: 0; left: 10%; right: 10%;
          height: 1px;
          background: linear-gradient(90deg, transparent, #818cf8 30%, #22d3ee 70%, transparent);
          border-radius: 0 0 4px 4px;
          opacity: 0.7;
        }

        /* ── Logo ── */
        .logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          animation: riseIn 0.45s 0.05s cubic-bezier(0.22,1,0.36,1) both;
        }
        .logo-mark {
          width: 44px; height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.08));
          border: 1px solid rgba(129,140,248,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 20px rgba(99,102,241,0.12);
        }
        .logo-text {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .logo-name {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--login-logo-name);
          letter-spacing: -0.2px;
          font-family: var(--font-display, 'Georgia', serif);
        }
        .logo-name em {
          font-style: normal;
          background: linear-gradient(90deg, #818cf8, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .logo-tag {
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 2.5px;
          color: rgba(129,140,248,0.6);
          text-transform: uppercase;
        }

        /* ── Heading ── */
        .heading {
          animation: riseIn 0.45s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }
        .heading h1 {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--login-heading);
          margin: 0 0 6px;
          letter-spacing: -0.5px;
          line-height: 1.15;
          font-family: var(--font-display, 'Georgia', serif);
        }
        .heading p {
          color: var(--login-subtext);
          font-size: 0.85rem;
          margin: 0;
          line-height: 1.5;
        }

        /* ── Error ── */
        .error-box {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          padding: 12px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          color: #ef4444;
          font-size: 0.82rem;
          font-weight: 500;
          line-height: 1.5;
          animation: shake 0.35s ease;
        }
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20%      { transform: translateX(-5px); }
          60%      { transform: translateX(4px); }
          80%      { transform: translateX(-2px); }
        }

        /* ── Form ── */
        .form {
          display: flex;
          flex-direction: column;
          gap: 1.1rem;
          animation: riseIn 0.45s 0.15s cubic-bezier(0.22,1,0.36,1) both;
        }
        .field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .field label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--login-label);
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }
        .input-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .field-icon {
          position: absolute;
          left: 14px;
          color: var(--login-icon);
          pointer-events: none;
          transition: color 0.2s;
        }
        .input-wrap:focus-within .field-icon {
          color: #818cf8;
        }
        .input-wrap input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.6rem;
          background: var(--login-input-bg);
          border: 1px solid var(--login-input-border);
          border-radius: 12px;
          color: var(--login-input-text);
          font-size: 0.9rem;
          transition: all 0.2s ease;
          outline: none;
        }
        .input-wrap input::placeholder {
          color: var(--login-placeholder);
        }
        .input-wrap input:focus {
          border-color: rgba(129,140,248,0.5);
          background: var(--login-input-bg-focus);
          box-shadow:
            0 0 0 3px rgba(99,102,241,0.12),
            inset 0 1px 0 rgba(255,255,255,0.03);
        }
        .input-wrap input:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .eye-btn {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          color: var(--login-icon);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.15s;
          border-radius: 4px;
        }
        .eye-btn:hover { color: var(--login-subtext); }

        /* ── Submit button ── */
        .btn-submit {
          position: relative;
          width: 100%;
          padding: 0.9rem;
          background: transparent;
          border: none;
          border-radius: 13px;
          cursor: pointer;
          margin-top: 0.3rem;
          overflow: hidden;
          transition: transform 0.15s ease, box-shadow 0.2s ease;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(99,102,241,0.35);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.65; cursor: not-allowed; }
        .btn-bg {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 40%, #312e81 100%);
          border-radius: 13px;
          transition: opacity 0.2s;
        }
        .btn-submit:hover:not(:disabled) .btn-bg {
          background: linear-gradient(135deg, #818cf8 0%, #6366f1 40%, #4338ca 100%);
        }
        .btn-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.2px;
        }

        /* ── Spinner ── */
        .spinner {
          width: 15px; height: 15px;
          border: 2px solid rgba(255,255,255,0.25);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.65s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── Footer ── */
        .footer-note {
          text-align: center;
          font-size: 0.78rem;
          color: var(--login-subtext);
          margin: 0;
          animation: riseIn 0.45s 0.2s cubic-bezier(0.22,1,0.36,1) both;
        }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .card { padding: 2.25rem 2rem 1.95rem; border-radius: 20px; gap: 1.4rem; max-width: 100%; }
          .logo-mark { width: 40px; height: 40px; }
          .logo-name { font-size: 0.95rem; }
          .logo-tag { font-size: 0.55rem; letter-spacing: 2px; }
          .heading h1 { font-size: 1.5rem; margin-bottom: 4px; }
          .heading p { font-size: 0.8rem; }
          .error-box { font-size: 0.78rem; padding: 10px 12px; }
          .form { gap: 1rem; }
          .field label { font-size: 0.72rem; }
          .input-wrap input { padding: 0.75rem 1rem 0.75rem 2.4rem; font-size: 0.88rem; border-radius: 10px; }
          .field-icon { left: 12px; }
          .eye-btn { right: 10px; }
          .btn-submit { padding: 0.8rem; border-radius: 11px; }
          .btn-content { font-size: 0.85rem; }
          .spinner { width: 13px; height: 13px; border-width: 1.5px; }
          .footer-note { font-size: 0.75rem; }
        }
        @media (max-width: 640px) {
          .card { padding: 2rem 1.75rem 1.75rem; border-radius: 18px; gap: 1.2rem; width: 100%; }
          .logo-mark { width: 36px; height: 36px; }
          .logo-name { font-size: 0.9rem; }
          .logo-tag { font-size: 0.52rem; }
          .heading h1 { font-size: clamp(1.3rem, 1.8vw, 1.5rem); margin-bottom: 3px; }
          .heading p { font-size: 0.77rem; }
          .error-box { font-size: 0.75rem; padding: 10px 12px; gap: 7px; border-radius: 8px; }
          .form { gap: 0.9rem; }
          .field label { font-size: 0.7rem; }
          .input-wrap input { padding: 0.7rem 0.9rem 0.7rem 2.3rem; font-size: 0.85rem; }
          .field-icon { left: 11px; width: 13px; height: 13px; }
          .eye-btn { right: 9px; padding: 3px; }
          .btn-submit { padding: 0.75rem; border-radius: 10px; }
          .btn-content { font-size: 0.82rem; gap: 6px; }
          .spinner { width: 12px; height: 12px; border-width: 1.5px; }
          .footer-note { font-size: 0.72rem; }
        }
        @media (max-width: 480px) {
          .card { padding: 1.75rem 1.5rem 1.5rem; border-radius: 16px; gap: 1rem; }
          .logo-mark { width: 34px; height: 34px; border-radius: 10px; }
          .logo-name { font-size: 0.85rem; }
          .logo-tag { font-size: 0.5rem; letter-spacing: 1.5px; }
          .heading h1 { font-size: 1.3rem; }
          .heading p { font-size: 0.75rem; }
          .error-box { font-size: 0.72rem; padding: 9px 11px; gap: 6px; }
          .form { gap: 0.85rem; }
          .field label { font-size: 0.68rem; }
          .input-wrap input { padding: 0.65rem 0.85rem 0.65rem 2.2rem; font-size: 0.82rem; }
          .field-icon { left: 10px; width: 12px; height: 12px; }
          .eye-btn { right: 8px; padding: 2px; }
          .btn-submit { padding: 0.7rem; }
          .btn-content { font-size: 0.8rem; gap: 5px; }
          .spinner { width: 11px; height: 11px; }
          .footer-note { font-size: 0.7rem; }
        }
        @media (max-width: 400px) {
          .card { padding: 1.5rem 1.25rem; border-radius: 14px; gap: 0.9rem; }
          .heading h1 { font-size: 1.2rem; }
          .logo-mark { width: 32px; height: 32px; }
          .input-wrap input { padding: 0.6rem 0.8rem 0.6rem 2.1rem; font-size: 0.8rem; }
          .btn-submit { padding: 0.65rem; }
          .btn-content { font-size: 0.78rem; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="bg-base" />
      <div className="bg-grid" />
      <div className="bg-glow g1" />
      <div className="bg-glow g2" />
      <div className="bg-glow g3" />

      <Suspense fallback={
        <div style={{
          width: 420, maxWidth: "100%",
          background: "var(--login-card-bg)",
          borderRadius: 24,
          padding: "2.75rem 2.5rem",
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 360,
          border: "1px solid rgba(99,102,241,0.12)",
        }}>
          <div style={{
            width: 28, height: 28,
            border: "2.5px solid rgba(129,140,248,0.2)",
            borderTopColor: "#818cf8",
            borderRadius: "50%",
            animation: "spin 0.65s linear infinite",
          }} />
        </div>
      }>
        <LoginForm />
      </Suspense>

      <style jsx>{`
        /* ── CSS Variables: Dark mode (default) ── */
        .login-page {
          --login-card-bg:          linear-gradient(160deg, rgba(17,24,39,0.97) 0%, rgba(9,14,27,0.99) 100%);
          --login-card-shadow:
            0 0 0 1px rgba(99,102,241,0.12),
            0 32px 80px rgba(0,0,0,0.5),
            0 8px 24px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.04);
          --login-card-border:      linear-gradient(135deg, rgba(129,140,248,0.5) 0%, rgba(34,211,238,0.15) 40%, rgba(99,102,241,0.05) 60%, rgba(129,140,248,0.3) 100%);
          --login-logo-name:        #e2e8f0;
          --login-heading:          #f1f5f9;
          --login-subtext:          rgba(148,163,184,0.75);
          --login-label:            rgba(148,163,184,0.7);
          --login-icon:             rgba(100,116,139,0.7);
          --login-placeholder:      rgba(100,116,139,0.5);
          --login-input-bg:         rgba(15,23,42,0.6);
          --login-input-bg-focus:   rgba(15,23,42,0.8);
          --login-input-border:     rgba(51,65,85,0.7);
          --login-input-text:       #e2e8f0;
          --login-page-bg:          #06090f;
          --login-grid-dot:         rgba(129,140,248,0.06);

          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          position: relative;
          overflow: hidden;
        }

        /* ── CSS Variables: Light mode override ── */
        :global(.light) .login-page {
          --login-card-bg:          linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.99) 100%);
          --login-card-shadow:
            0 0 0 1px rgba(99,102,241,0.12),
            0 32px 80px rgba(0,0,0,0.1),
            0 8px 24px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.8);
          --login-card-border:      linear-gradient(135deg, rgba(99,102,241,0.3) 0%, rgba(34,211,238,0.1) 40%, rgba(99,102,241,0.05) 60%, rgba(99,102,241,0.2) 100%);
          --login-logo-name:        #0f172a;
          --login-heading:          #0f172a;
          --login-subtext:          #64748b;
          --login-label:            #64748b;
          --login-icon:             #94a3b8;
          --login-placeholder:      #cbd5e1;
          --login-input-bg:         rgba(241,245,249,0.8);
          --login-input-bg-focus:   rgba(255,255,255,0.95);
          --login-input-border:     rgba(203,213,225,0.8);
          --login-input-text:       #0f172a;
          --login-page-bg:          #f1f5f9;
          --login-grid-dot:         rgba(99,102,241,0.06);
        }

        /* Deep dark base */
        .bg-base {
          position: fixed;
          inset: 0;
          background: var(--login-page-bg);
          z-index: 0;
          transition: background 0.3s ease;
        }

        /* Subtle dot grid */
        .bg-grid {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: radial-gradient(var(--login-grid-dot) 1px, transparent 1px);
          background-size: 28px 28px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
        }

        /* Atmospheric glows */
        .bg-glow {
          position: fixed;
          border-radius: 50%;
          filter: blur(90px);
          pointer-events: none;
          z-index: 0;
        }
        .g1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(99,102,241,0.1), transparent 65%);
          top: -200px; right: -150px;
          animation: drift 14s ease-in-out infinite alternate;
        }
        .g2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(34,211,238,0.07), transparent 65%);
          bottom: -150px; left: -100px;
          animation: drift 18s ease-in-out infinite alternate-reverse;
        }
        .g3 {
          width: 300px; height: 300px;
          background: radial-gradient(circle, rgba(139,92,246,0.08), transparent 65%);
          top: 40%; left: 50%;
          transform: translate(-50%, -50%);
        }
        @keyframes drift {
          from { transform: translate(0, 0); }
          to   { transform: translate(30px, 20px); }
        }
        @keyframes drift3 {
          from { transform: translate(-50%, -50%) scale(1); }
          to   { transform: translate(-50%, -50%) scale(1.15); }
        }
        .g3 { animation: drift3 10s ease-in-out infinite alternate; }
      `}</style>
    </div>
  );
}