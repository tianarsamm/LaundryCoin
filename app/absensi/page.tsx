'use client'

import Image from 'next/image'
import { useEffect } from 'react'
import { useAbsensi } from '@/lib/supabase/hooks/useAbsensi'

function formatJam(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar',
  })
}

function formatTanggal() {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

function urlBase64ToUint8Array(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export default function AbsensiPage() {
  const {
    todayLog, loading, submitting, error, success, setError, setSuccess,
    videoRef, canvasRef, fotoPreview, kameraAktif,
    jarak, dalamRadius, lokasiLoading,
    cekLokasi, bukaKamera, ambilFoto, resetFoto, submit,
  } = useAbsensi()

  async function registerPush() {
    try {
      const reg = await navigator.serviceWorker.ready
      const existing = await reg.pushManager.getSubscription()
      if (existing) return
      const res = await fetch('/api/push-subscribe/vapid-key')
      const { publicKey } = await res.json()
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = sub.toJSON()
      await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      })
    } catch (e) {
      console.error('Push registration error:', e)
    }
  }

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      void registerPush()
    }
  }, [])

  const sudahCheckin = !!todayLog.checkin
  const sudahCheckout = !!todayLog.checkout
  const selesaiHariIni = sudahCheckin && sudahCheckout
  const tipeAbsensi: 'checkin' | 'checkout' =
    sudahCheckin && !sudahCheckout ? 'checkout' : 'checkin'

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid rgba(59,130,246,0.2)',
            borderTopColor: '#3b82f6',
            animation: 'spin .8s linear infinite',
            margin: '0 auto 12px',
          }} />
          <p style={{ color: '#475569', fontSize: 14 }}>Memuat data absensi...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20,
    padding: 20,
  }

  const innerCardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14,
    padding: 14,
    flex: 1,
    textAlign: 'center',
  }

  const btnBase: React.CSSProperties = {
    width: '100%', padding: '13px 16px', borderRadius: 14,
    fontSize: 14, fontWeight: 600, cursor: 'pointer',
    transition: 'all .2s', border: 'none',
    fontFamily: 'var(--font-dm-sans, DM Sans, sans-serif)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }

  return (
    <div
      className="absensi-page"
      style={{
        maxWidth: 440,
        margin: '0 auto',
        padding: '24px 16px 48px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse-dot { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.8)} }

        .abs-pulse { width:8px;height:8px;border-radius:50%;background:#4ade80;animation:pulse-dot 1.5s ease-in-out infinite;display:inline-block }

        .abs-btn-outline {
          background:transparent;
          border:1px solid rgba(255,255,255,0.12);
          color:#94a3b8;
          width:100%;
          padding:13px;
          border-radius:14px;
          font-size:14px;
          font-weight:600;
          cursor:pointer;
          transition:all .2s;
          font-family:inherit;
          box-sizing:border-box;
        }
        .abs-btn-outline:hover:not(:disabled) { background:rgba(255,255,255,0.06);color:#e2e8f0 }
        .abs-btn-outline:disabled { opacity:.35;cursor:not-allowed }

        .abs-btn-dark {
          background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.1);
          color:#cbd5e1;
          width:100%;
          padding:13px;
          border-radius:14px;
          font-size:13px;
          font-weight:500;
          cursor:pointer;
          transition:all .2s;
          font-family:inherit;
          box-sizing:border-box;
        }
        .abs-btn-dark:hover { background:rgba(255,255,255,0.11) }

        /* ── Responsive ── */
        @media (max-width: 480px) {
          .absensi-page {
            padding: 16px 12px 36px !important;
            gap: 12px !important;
          }
          .absensi-page .abs-page-title {
            font-size: 22px !important;
          }
          .absensi-page .abs-page-subtitle {
            font-size: 12px !important;
          }
          .abs-btn-outline,
          .abs-btn-dark {
            padding: 11px !important;
            font-size: 13px !important;
            border-radius: 12px !important;
          }
          .absensi-page .abs-card {
            padding: 16px !important;
            border-radius: 16px !important;
          }
          .absensi-page .abs-inner-card {
            padding: 12px !important;
          }
          .absensi-page .abs-checkin-time {
            font-size: 20px !important;
          }
        }

        @media (max-width: 360px) {
          .absensi-page {
            padding: 12px 10px 32px !important;
          }
          .absensi-page .abs-page-title {
            font-size: 20px !important;
          }
          .abs-btn-outline,
          .abs-btn-dark {
            padding: 10px !important;
            font-size: 12px !important;
            border-radius: 10px !important;
          }
          .absensi-page .abs-checkin-time {
            font-size: 18px !important;
          }
        }
      `}</style>

      {/* Header */}
      <div style={{ paddingTop: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span className="abs-pulse" />
          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>Sistem aktif</span>
        </div>
        <h1
          className="abs-page-title"
          style={{
            fontFamily: 'var(--font-sora, Sora, sans-serif)',
            fontSize: 26,
            fontWeight: 700,
            color: '#f1f5f9',
            margin: '0 0 4px',
          }}
        >
          Absensi
        </h1>
        <p className="abs-page-subtitle" style={{ fontSize: 13, color: '#475569', margin: 0 }}>
          {formatTanggal()}
        </p>
      </div>

      {/* Notif sukses */}
      {success && (
        <div style={{
          background: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(74,222,128,0.2)',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: '#4ade80', fontSize: 16 }}>✓</span>
          <p style={{ color: '#4ade80', fontSize: 14, fontWeight: 500, margin: 0, flex: 1 }}>{success}</p>
          <button
            onClick={() => setSuccess(null)}
            style={{ background: 'none', border: 'none', color: '#4ade80', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
          >✕</button>
        </div>
      )}

      {/* Notif error */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(248,113,113,0.2)',
          borderRadius: 14,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <span style={{ color: '#f87171', fontSize: 16 }}>!</span>
          <p style={{ color: '#f87171', fontSize: 14, margin: 0, flex: 1 }}>{error}</p>
          <button
            onClick={() => setError(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0 }}
          >✕</button>
        </div>
      )}

      {/* Status card */}
      <div className="abs-card" style={cardStyle}>
        <p style={{
          fontSize: 11,
          color: '#475569',
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          margin: '0 0 12px',
        }}>
          Status hari ini
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="abs-inner-card" style={innerCardStyle}>
            <p style={{ fontSize: 11, color: '#475569', margin: '0 0 8px', fontWeight: 500 }}>Check In</p>
            {todayLog.checkin ? (
              <>
                <p
                  className="abs-checkin-time"
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f1f5f9',
                    fontFamily: 'var(--font-sora, Sora)',
                    margin: '0 0 6px',
                  }}
                >
                  {formatJam(todayLog.checkin.created_at)}
                </p>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 20,
                  background: todayLog.checkin.status === 'late' ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)',
                  color: todayLog.checkin.status === 'late' ? '#f87171' : '#4ade80',
                  border: `1px solid ${todayLog.checkin.status === 'late' ? 'rgba(248,113,113,0.2)' : 'rgba(74,222,128,0.2)'}`,
                }}>
                  {todayLog.checkin.status === 'late' ? 'Terlambat' : 'Tepat waktu'}
                </span>
              </>
            ) : (
              <p style={{ fontSize: 24, color: '#1e293b', margin: 0 }}>—</p>
            )}
          </div>
          <div className="abs-inner-card" style={innerCardStyle}>
            <p style={{ fontSize: 11, color: '#475569', margin: '0 0 8px', fontWeight: 500 }}>Check Out</p>
            {todayLog.checkout ? (
              <p
                className="abs-checkin-time"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f1f5f9',
                  fontFamily: 'var(--font-sora, Sora)',
                  margin: 0,
                }}
              >
                {formatJam(todayLog.checkout.created_at)}
              </p>
            ) : (
              <p style={{ fontSize: 24, color: '#1e293b', margin: 0 }}>—</p>
            )}
          </div>
        </div>
      </div>

      {/* Selesai */}
      {selesaiHariIni && (
        <div className="abs-card" style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px' }}>
          <p style={{ fontSize: 24, margin: '0 0 8px' }}>🎉</p>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px' }}>
            Absensi hari ini selesai
          </p>
          <p style={{ fontSize: 13, color: '#475569', margin: 0 }}>Sampai jumpa besok!</p>
        </div>
      )}

      {/* Form absensi */}
      {!selesaiHariIni && (
        <div className="abs-card" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: 18 }}>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: '#f1f5f9' }}>
              {tipeAbsensi === 'checkin' ? '⬇️ Check In' : '⬆️ Check Out'}
            </span>
            <span style={{ fontSize: 12, color: '#334155' }}>2 langkah</span>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

          {/* Step 1: Lokasi */}
          <div>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#475569',
              margin: '0 0 8px',
            }}>
              1 — Verifikasi lokasi
            </p>
            <button className="abs-btn-outline" onClick={cekLokasi} disabled={lokasiLoading}>
              {lokasiLoading ? 'Mengecek...' : 'Cek Lokasi Sekarang'}
            </button>
            {jarak !== null && (
              <div style={{
                marginTop: 8,
                padding: 12,
                borderRadius: 12,
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: dalamRadius ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${dalamRadius ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}`,
                color: dalamRadius ? '#4ade80' : '#f87171',
              }}>
                {dalamRadius ? '✓' : '✗'}
                <span>{dalamRadius ? `Dalam area toko (${jarak}m)` : `Di luar area toko (${jarak}m)`}</span>
              </div>
            )}
          </div>

          {/* Step 2: Foto */}
          <div>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '.08em',
              textTransform: 'uppercase',
              color: '#475569',
              margin: '0 0 8px',
            }}>
              2 — Foto selfie
            </p>

            {!kameraAktif && !fotoPreview && (
              <button
                className="abs-btn-dark"
                onClick={bukaKamera}
                disabled={!dalamRadius}
                style={{ opacity: !dalamRadius ? 0.35 : 1, cursor: !dalamRadius ? 'not-allowed' : 'pointer' }}
              >
                Buka Kamera
              </button>
            )}

            {kameraAktif && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', aspectRatio: '4/3' }}>
                  <video
                    ref={videoRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    autoPlay
                    muted
                    playsInline
                  />
                </div>
                <button style={{ ...btnBase, background: '#f1f5f9', color: '#0d1117' }} onClick={ambilFoto}>
                  📸 Ambil Foto
                </button>
              </div>
            )}

            {fotoPreview && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ borderRadius: 14, overflow: 'hidden', aspectRatio: '4/3' }}>
                  <Image
                    src={fotoPreview}
                    alt="Preview"
                    width={800}
                    height={600}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
                <button className="abs-btn-dark" onClick={resetFoto}>Ulangi Foto</button>
              </div>
            )}
          </div>

          <canvas ref={canvasRef} style={{ display: 'none' }} />

          {/* Submit */}
          <button
            onClick={() => submit(tipeAbsensi)}
            disabled={submitting || !fotoPreview || !dalamRadius}
            style={{
              ...btnBase,
              marginTop: 4,
              background: submitting || !fotoPreview || !dalamRadius
                ? 'rgba(255,255,255,0.06)'
                : tipeAbsensi === 'checkin'
                  ? 'linear-gradient(135deg,#3b82f6,#2563eb)'
                  : 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: submitting || !fotoPreview || !dalamRadius ? '#334155' : '#fff',
              boxShadow: submitting || !fotoPreview || !dalamRadius
                ? 'none'
                : tipeAbsensi === 'checkin'
                  ? '0 4px 20px rgba(59,130,246,0.3)'
                  : '0 4px 20px rgba(239,68,68,0.3)',
              cursor: submitting || !fotoPreview || !dalamRadius ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting
              ? 'Menyimpan...'
              : tipeAbsensi === 'checkin'
                ? 'Konfirmasi Check In'
                : 'Konfirmasi Check Out'}
          </button>
        </div>
      )}
    </div>
  )
}