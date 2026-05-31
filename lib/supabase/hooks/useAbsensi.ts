'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { TodayAttendance } from '@/lib/supabase/types'

// Hitung jarak dua koordinat (meter) — Haversine
function hitungJarak(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export function useAbsensi() {
  const [todayLog, setTodayLog] = useState<TodayAttendance>({ checkin: null, checkout: null })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Kamera
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [fotoBlob, setFotoBlob] = useState<Blob | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [kameraAktif, setKameraAktif] = useState(false)

  // GPS
  const [jarak, setJarak] = useState<number | null>(null)
  const [dalamRadius, setDalamRadius] = useState<boolean | null>(null)
  const [lokasiLoading, setLokasiLoading] = useState(false)
  const koordinatRef = useRef<{ lat: number; lng: number } | null>(null)

  // Ambil absensi hari ini
  const fetchTodayLog = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/absensi')
    const json = await res.json()
    if (!res.ok) { setError(json.error); setLoading(false); return }
    setTodayLog(json)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTodayLog() }, [fetchTodayLog])

  // Cek lokasi
  const cekLokasi = useCallback(async () => {
    setLokasiLoading(true)
    setError(null)
    try {
      // Ambil store config
      const res = await fetch('/api/absensi/store-config')
      const { store } = await res.json()

      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 10000
        })
      )

      const { latitude, longitude } = pos.coords
      koordinatRef.current = { lat: latitude, lng: longitude }

      const meter = hitungJarak(latitude, longitude, store.lat, store.lng)
      setJarak(meter)
      setDalamRadius(meter <= store.radius_meter)
    } catch (e: unknown) {
      const msg = e instanceof GeolocationPositionError
        ? 'GPS tidak bisa diakses. Pastikan izin lokasi diaktifkan.'
        : 'Gagal mengecek lokasi.'
      setError(msg)
    } finally {
      setLokasiLoading(false)
    }
  }, [])

  // Buka kamera
  const bukaKamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 }
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setKameraAktif(true)
      setFotoBlob(null)
      setFotoPreview(null)
    } catch {
      setError('Kamera tidak bisa diakses. Pastikan izin kamera diaktifkan.')
    }
  }, [])

  // Tutup kamera
  const tutupKamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setKameraAktif(false)
  }, [])

  // Ambil foto
  const ambilFoto = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)

    canvas.toBlob(blob => {
      if (!blob) return
      setFotoBlob(blob)
      setFotoPreview(URL.createObjectURL(blob))
      tutupKamera()
    }, 'image/jpeg', 0.85)
  }, [tutupKamera])

  // Reset foto
  const resetFoto = useCallback(() => {
    setFotoBlob(null)
    setFotoPreview(null)
    bukaKamera()
  }, [bukaKamera])

  // Submit absensi
  const submit = useCallback(async (type: 'checkin' | 'checkout') => {
    if (!fotoBlob) { setError('Foto belum diambil'); return }
    if (!koordinatRef.current) { setError('Lokasi belum dicek'); return }
    if (!dalamRadius) { setError('Anda berada di luar area toko'); return }

    setSubmitting(true)
    setError(null)

    try {
      // 1. Upload foto
      const form = new FormData()
      form.append('foto', fotoBlob, `absensi-${Date.now()}.jpg`)
      const uploadRes = await fetch('/api/absensi/upload-foto', { method: 'POST', body: form })
      const { url, error: uploadErr } = await uploadRes.json()
      if (uploadErr) throw new Error(uploadErr)

      // 2. Simpan log
      const { lat, lng } = koordinatRef.current
      const res = await fetch('/api/absensi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          latitude: lat,
          longitude: lng,
          distance_meter: jarak,
          photo_url: url,
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
          },
        }),
      })

      const json = await res.json()
      if (!res.ok) throw new Error(json.error)

      setSuccess(type === 'checkin' ? 'Check in berhasil!' : 'Check out berhasil!')
      setFotoBlob(null)
      setFotoPreview(null)
      await fetchTodayLog()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setSubmitting(false)
    }
  }, [fotoBlob, dalamRadius, jarak, fetchTodayLog])

  // Cleanup stream saat unmount
  useEffect(() => () => { tutupKamera() }, [tutupKamera])

  return {
    todayLog, loading, submitting, error, success, setError, setSuccess,
    videoRef, canvasRef, fotoPreview, kameraAktif,
    jarak, dalamRadius, lokasiLoading,
    cekLokasi, bukaKamera, ambilFoto, resetFoto, submit,
  }
}