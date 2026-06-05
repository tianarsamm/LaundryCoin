# Testing: Notifikasi Absensi Check In/Out

## 🧪 Cara Test Notifikasi Absensi

### Setup Awal

1. **Login sebagai Super Admin**
   - Buka di browser besar (desktop)
   - Verify console log: `[Device Registration Success]`
   - Buka F12 → Application → Service Workers (harus ada)

2. **Siapkan Karyawan**
   - Buka di device/browser lain
   - Login sebagai karyawan biasa
   - Pergi ke halaman **Absensi**

---

## ✅ Test Scenario 1: Check In

### Karyawan Side
1. Di halaman **Absensi**, klik tombol **Check In**
2. Allowkan location access (jika diminta)
3. Klik **Confirm Check In**
4. Toast muncul: "✓ Check in berhasil"

### Super Admin Side
**Harusnya muncul notifikasi:**
```
📱 Notification Panel
├─ Laundry Coin
├─ Check In
└─ [Nama Karyawan] — HH:MM WITA
```

---

## ✅ Test Scenario 2: Check Out

### Karyawan Side
1. Tunggu beberapa detik
2. Klik tombol **Check Out** (tombol yang sebelumnya disable)
3. Klik **Confirm Check Out**
4. Toast muncul: "✓ Check out berhasil"

### Super Admin Side
**Harusnya muncul notifikasi:**
```
📱 Notification Panel
├─ Laundry Coin
├─ Check Out
└─ [Nama Karyawan] — HH:MM WITA
```

---

## 🔍 Debug Checklist

| Langkah | Expected | Actual | ✓/✗ |
|---------|----------|--------|-----|
| Karyawan: Check in button work | Toast success | | |
| Karyawan: Data saved to DB | attendance_logs entry | | |
| Super admin: Notification muncul | Panel notification | | |
| Notification click: Navigate | Open /manajemen/izin | | |
| Multiple check in/out: Notif muncul | 2+ notification | | |

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Notification tidak muncul | Verify FCM token di DB: `SELECT * FROM user_devices WHERE user_id='xxx'` |
| Check in gagal | Verify location permission di browser |
| Notification lambat | Check network tab (Absensi API response) |
| Notification panel empty | Browser notification permission harus "Allow" |

---

## 📊 Database Verification

Jalankan query ini di Supabase SQL Editor:

```sql
-- Cek attendance logs terbaru
SELECT 
  user_id,
  type,
  status,
  created_at
FROM attendance_logs
ORDER BY created_at DESC
LIMIT 10;

-- Cek FCM tokens super admin
SELECT 
  user_id,
  device_type,
  fcm_token,
  updated_at
FROM user_devices
WHERE user_id IN (
  SELECT id FROM users WHERE role = 'super_admin'
);
```

---

## ✅ Completion Checklist

- [ ] Karyawan check in → Notifikasi muncul
- [ ] Karyawan check out → Notifikasi muncul
- [ ] Multiple users: Semua notifikasi diterima super admin
- [ ] Notification click: Buka /manajemen/izin
- [ ] Logo notification: Kuning (Laundry coin)

---

**Testing Status**: 🟢 Ready
**Last Updated**: June 5, 2026
