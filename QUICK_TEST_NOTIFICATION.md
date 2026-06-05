# Quick Testing: Super Admin Notification

## 📱 Step 1: Pastikan Super Admin Terregistrasi

Jalankan query ini di Supabase:

```sql
-- Cek super admin dengan device terdaftar
SELECT 
  u.id,
  u.email,
  u.full_name,
  COUNT(ud.id) as device_count,
  STRING_AGG(ud.device_type, ', ') as devices,
  MAX(ud.updated_at) as last_update
FROM users u
LEFT JOIN user_devices ud ON u.id = ud.user_id
WHERE u.role = 'super_admin' AND u.is_active = true
GROUP BY u.id, u.email, u.full_name
ORDER BY MAX(ud.updated_at) DESC;
```

Catat **user_id** super admin yang akan di-test.

---

## 🧪 Step 2: Test Notification (3 Cara)

### Cara A: Karyawan Ajukan Izin (PALING MUDAH)

1. **Logout dari super admin**
2. **Login sebagai karyawan biasa**
3. Pergi ke: **Izin & Sakit** → **Ajukan Izin**
4. Isi form:
   - Jenis: Izin
   - Tanggal Mulai: Hari ini
   - Tanggal Selesai: Besok
   - Keterangan: "Test notifikasi"
5. Klik **Kirim Pengajuan**

**Hasil yang diharapkan**:
- ✅ Toast "Pengajuan berhasil dikirim" muncul
- ✅ Notification muncul di **super admin device** (browser atau mobile)
- ✅ Pesan: "Pengajuan Izin Baru" - "Karyawan mengajukan izin selama X hari"

---

### Cara B: Manual API Test (Pakai cURL/Postman)

**1. Ambil super admin JWT token**

Buka **DevTools** (F12) saat super admin sudah login:

```javascript
// Paste di Console
const { data: { session } } = await supabase.auth.getSession();
console.log("JWT Token:", session.access_token);
// Copy hasilnya
```

**2. Test API notification**

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "title": "Test Notification",
    "body": "Ini adalah pesan test dari API"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Notification sent to all super admins",
  "successCount": 1,
  "failureCount": 0
}
```

---

### Cara C: Manual Check Browser Console

**1. Super admin login**

Buka **DevTools** (F12) → **Console** tab

**2. Cari logs berikut** (harus ada semua):

```
✅ [NotificationProvider] ✅ Notification permission granted
✅ [NotificationProvider] ✅ Service worker registered
✅ [NotificationProvider] ✅ FCM token received
✅ [Device Registration Success]
```

**3. Jika tidak ada, cek**:
- Notification permission di browser → harus "Allow"
- Service worker di DevTools → Application tab → Service Workers
- FCM token ada di network request `/api/push-subscribe/`

---

## 📊 Step 3: Verifikasi di Database

Setelah super admin login, jalankan:

```sql
-- Cek token terbaru
SELECT 
  user_id,
  device_type,
  fcm_token,
  device_name,
  updated_at
FROM user_devices
WHERE user_id = 'PASTE_SUPER_ADMIN_ID_HERE'
ORDER BY updated_at DESC
LIMIT 5;
```

**Harus menunjukkan**:
- 1 row dengan `device_type = 'web'` (atau android/ios)
- `fcm_token` **TIDAK KOSONG**
- `updated_at` **recent** (beberapa menit lalu)

---

## 🔍 Debugging Jika Notifikasi Tidak Muncul

| Issue | Debug Steps |
|-------|------------|
| **Notification permission denied** | Browser → Settings → Notifications → Allow for laundry-coin |
| **Service worker error** | DevTools → Application → Service Workers → Check for errors |
| **Token null/empty** | Check network request to `/api/push-subscribe/vapid-key/` |
| **API returns 404** | Verify super admin `role = 'super_admin'` & `is_active = true` |
| **API returns 503** | Firebase Admin SDK not initialized → check env vars |

---

## ✅ Checklist Completion

- [ ] Super admin user_id tercatat
- [ ] Device sudah registered dengan token
- [ ] Pilih testing method (A, B, atau C)
- [ ] Notifikasi muncul ✅
- [ ] Database query menunjukkan token terbaru

---

**Next Steps**:
1. Jalankan salah satu testing method di atas
2. Screenshot hasil jika ada masalah
3. Paste hasil database query
4. Saya akan help debug jika ada error
