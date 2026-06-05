# Fix: Super Admin Tidak Menerima Notifikasi Pengajuan Perizinan

## 🔍 Masalah yang Ditemukan

Ketika super admin login, notifikasi pengajuan perizinan tidak muncul di notification panel, padahal:
- ✅ Sistem notifikasi sudah berjalan untuk user yang membuat aplikasi
- ✅ Super admin permission sudah OK
- ✅ FCM setup sudah benar

## 🐛 Root Cause

**File**: `src/lib/firebase/register-device.ts`

**Masalah**: Upsert menggunakan `onConflict: "user_id,fcm_token"`

```typescript
// ❌ SEBELUMNYA (BERMASALAH)
onConflict: "user_id,fcm_token"
```

**Akibat**:
1. Super admin login pertama kali → FCM token `ABC123` disimpan
2. Super admin refresh halaman → FCM token berubah menjadi `DEF456`
3. Saat upsert token baru, sistem cek: "user_id + fcm_token DEF456 sudah ada?"
4. **TIDAK ADA** kombinasi itu → Insert baru (harusnya update)
5. Tapi terjadi conflict karena upsert logic tidak tepat
6. **RESULT**: Token baru `DEF456` tidak tersimpan atau terjadi error

## ✅ Fix yang Diterapkan

**Ubah conflict key** dari `"user_id,fcm_token"` menjadi `"user_id,device_type"`

```typescript
// ✅ SETELAH (FIXED)
onConflict: "user_id,device_type"
```

**Alasan**:
- Setiap super admin bisa punya multiple devices (web, mobile, tablet)
- Tapi hanya 1 token aktif per device type per saat
- Ketika token refresh: **update** token lama dengan yang baru
- Tidak ada conflict lagi

## 📋 Langkah Verifikasi di Supabase

### Step 1: Cek Table Structure

Masuk ke **Supabase Console** → **SQL Editor** → Jalankan:

```sql
-- Cek struktur tabel user_devices
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_devices'
ORDER BY ordinal_position;
```

**Expected Result**:
```
user_id        | uuid      | NO
device_type    | text      | NO
fcm_token      | text      | NO
device_name    | text      | YES
updated_at     | timestamp | NO
```

### Step 2: Cek Unique Constraint

```sql
-- Cek apakah ada unique constraint di (user_id, device_type)
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'user_devices'
  AND constraint_type = 'UNIQUE';
```

**Jika belum ada, buat constraint**:

```sql
-- Hapus constraint lama jika ada
ALTER TABLE user_devices
DROP CONSTRAINT IF EXISTS user_devices_user_id_device_type_key;

-- Tambah unique constraint baru
ALTER TABLE user_devices
ADD CONSTRAINT user_devices_user_id_device_type_key 
UNIQUE (user_id, device_type);
```

### Step 3: Verifikasi RLS Policy

```sql
-- Cek RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_devices';
```

Harus ada policy minimal:
- **read_devices**: SELECT - user bisa baca device sendiri
- **write_devices**: INSERT/UPDATE/DELETE - user bisa modifikasi device sendiri

### Step 4: Bersihkan Duplicate Tokens (Optional)

Jika ada super admin dengan multiple devices/tokens, cleanup dulu:

```sql
-- Lihat duplikat
SELECT 
  user_id, 
  device_type, 
  COUNT(*) as count
FROM user_devices
GROUP BY user_id, device_type
HAVING COUNT(*) > 1;

-- Jika ada duplikat, keep yang paling baru
DELETE FROM user_devices
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, device_type) id
  FROM user_devices
  ORDER BY user_id, device_type, updated_at DESC
);
```

## 🧪 Testing Notifikasi Super Admin

### Cara Test 1: Manual API Call (Pakai Postman)

1. **Login sebagai super admin** → Catat FCM token dari browser console
   ```javascript
   // Buka F12 → Console
   // Lihat log: [Device Registration Success]
   ```

2. **Verifikasi token tersimpan**:
   ```sql
   SELECT user_id, fcm_token, device_type, updated_at 
   FROM user_devices
   WHERE user_id = 'super-admin-id-here'
   ORDER BY updated_at DESC;
   ```

3. **Test notification API** (dari terminal atau Postman):
   ```bash
   curl -X POST http://localhost:3000/api/notifications/send \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -d '{
       "title": "Test Notification",
       "body": "Ini adalah pesan test"
     }'
   ```

### Cara Test 2: Trigger Aplikasi Perizinan

1. Login sebagai **karyawan biasa**
2. Pergi ke halaman **Izin & Sakit** → **Ajukan Izin**
3. Isi form dan kirim
4. **Lihat notifikasi muncul** di super admin device

### Expected Result

```
✅ Notification Permission: GRANTED
✅ Service Worker: REGISTERED
✅ FCM Token: SAVED in user_devices table
✅ Token conflict: RESOLVED (onConflict fixed)
✅ Notification muncul di panel saat izin diajukan
```

## 🔧 Troubleshooting

| Masalah | Penyebab | Solusi |
|---------|---------|--------|
| Token tidak tersimpan | Conflict issue | Verifikasi constraint & jalankan SQL cleanup |
| Notifikasi tidak muncul | Permission denied | Klik "Allow" saat browser minta permission |
| Multiple tokens per device | Upsert error | Cleanup duplikat dengan SQL query di atas |
| Super admin tidak terdeteksi | Role check gagal | Cek `users.role == 'super_admin'` & `is_active = true` |

## 📝 Ringkasan Perubahan

**File**: `src/lib/firebase/register-device.ts`

```diff
- onConflict: "user_id,fcm_token"
+ onConflict: "user_id,device_type"
```

**Status**: ✅ **APPLIED** (Device registration akan berfungsi dengan baik)

## 📋 Checklist Before Go-Live

- [ ] Jalankan SQL di Supabase untuk add constraint
- [ ] Super admin login → Cek console log `[Device Registration Success]`
- [ ] Verifikasi token ada di DB: `SELECT * FROM user_devices WHERE user_id = 'xxx'`
- [ ] Karyawan ajukan izin → Super admin terima notifikasi
- [ ] Test multiple super admins → Semua harus terima notifikasi
- [ ] Test token refresh (F5 reload) → Token tetap update dengan benar

---

**Terakhir diupdate**: June 5, 2026
**Status**: 🟢 FIX APPLIED - Testing needed
