# Notification System Integration Guide

## Overview

Sistem notifikasi yang baru sudah siap untuk digunakan. Ketika admin mengirim izin/absensi, notifikasi akan muncul sebagai **custom toast pop-up** di device super admin.

## Architecture

### Components

1. **NotificationProvider** (`components/NotificationProvider.tsx`)
   - Registers service worker
   - Gets FCM token
   - Listens to foreground messages
   - Emits custom `notification:received` event

2. **NotificationToast** (`components/NotificationToast.tsx`)
   - Displays custom toast pop-up
   - Auto-dismisses after 5 seconds
   - Shows in top-right corner
   - Supports multiple notifications in queue

3. **sendNotification** (`lib/notifications/sendNotification.ts`)
   - Helper function to send notifications
   - Calls `/api/notifications/send` endpoint
   - Convenience functions for common scenarios

### Flow

```
Admin input izin/absensi
    ↓
Call sendNotification()
    ↓
POST /api/notifications/send
    ↓
Firebase Admin SDK sends to FCM
    ↓
Super admin device receives message
    ↓
If app is open (foreground):
  → NotificationProvider detects via onMessage()
  → Emits custom event
  → NotificationToast displays pop-up
    
If app is closed (background):
  → Service worker receives via onBackgroundMessage()
  → Shows browser notification
  → Click opens app
```

## Usage Examples

### Example 1: Simple Notification from Button

```typescript
import { sendNotification } from '@/lib/notifications/sendNotification';

export function SomeComponent() {
  const handleSendNotif = async () => {
    const result = await sendNotification({
      title: 'Izin Baru',
      body: 'Joni telah mengajukan izin sakit untuk hari Jumat'
    });
    
    if (result.success) {
      console.log(`Notif terkirim ke ${result.successCount} device`);
    } else {
      console.error('Error:', result.error);
    }
  };

  return (
    <button onClick={handleSendNotif}>
      Kirim Notifikasi
    </button>
  );
}
```

### Example 2: Using Convenience Functions

```typescript
import { 
  notifyPermissionUpdate,
  notifyAbsenceUpdate 
} from '@/lib/notifications/sendNotification';

// Ketika izin baru dibuat
await notifyPermissionUpdate('created', 'Joni Supiansyah', 'Sakit');

// Ketika izin disetujui
await notifyPermissionUpdate('approved', 'Joni Supiansyah');

// Ketika karyawan check-in
await notifyAbsenceUpdate('checked_in', 'Joni Supiansyah', '08:00');

// Ketika karyawan check-out
await notifyAbsenceUpdate('checked_out', 'Joni Supiansyah', '17:00');
```

### Example 3: Integration with Form Submission

```typescript
'use client';

import { useState } from 'react';
import { sendNotification } from '@/lib/notifications/sendNotification';

export function CreatePermissionForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save to database
      const response = await fetch('/api/permissions', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save');

      // 2. Send notification to super admins
      const notifResult = await sendNotification({
        title: 'Izin Baru Ditambahkan',
        body: `${formData.employeeName} mengajukan izin: ${formData.reason}`
      });

      if (notifResult.success) {
        console.log('Notifikasi terkirim!');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Mengirim...' : 'Ajukan Izin & Kirim Notifikasi'}
      </button>
    </form>
  );
}
```

## Styling the Toast

Toast dapat dikustomisasi dengan mengubah `NotificationToast.tsx`:

```typescript
// Untuk mengubah warna berdasarkan tipe
notification.type === 'success'  // Green
notification.type === 'error'    // Red
notification.type === 'warning'  // Yellow
notification.type === 'info'     // Blue (default)
```

## Testing

### Test 1: Foreground Message (App Terbuka)

1. Login sebagai super admin
2. Biarkan app terbuka di browser
3. Dari admin lain (atau console), jalankan:
   ```javascript
   fetch('/api/notifications/send', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       title: 'Test Notifikasi',
       body: 'Ini adalah test notifikasi'
     })
   }).then(r => r.json()).then(console.log)
   ```
4. Lihat pop-up muncul di top-right corner

### Test 2: Background Message (App Tertutup)

1. Login sebagai super admin
2. **Tutup browser tab** (tapi jangan logout browser)
3. Kirim notifikasi dari admin lain
4. Lihat **browser notification** muncul (jika OS memperbolehkan)
5. Click notifikasi akan membuka app

### Test 3: Multiple Notifications

1. Send 3-4 notifikasi dalam interval 1 detik
2. Lihat semua muncul di stack
3. Auto-remove setelah 5 detik

## Troubleshooting

### Notifikasi tidak muncul di foreground

**Kemungkinan penyebab:**
1. Service worker tidak registered
2. FCM token tidak saved

**Solusi:**
```javascript
// Check di console
// Harus ada log:
// [NotificationProvider] Service worker ready
// [NotificationProvider] Token saved successfully
// [Device Registration Success]
```

### Notifikasi tidak muncul di background

**Kemungkinan penyebab:**
1. Browser notification permission belum "Allow"
2. user_devices table kosong

**Solusi:**
1. Check browser notification permission
2. Login ulang untuk re-register device
3. Verify di Supabase: `SELECT * FROM user_devices`

### Toast muncul tapi langsung hilang

- Toast auto-dismiss setelah 5 detik, itu normal
- Ubah duration di `NotificationToast.tsx` line 28 jika perlu lebih lama

## Files Modified/Created

- ✅ `components/NotificationToast.tsx` - Custom toast UI (NEW)
- ✅ `components/NotificationProvider.tsx` - Updated untuk emit custom event
- ✅ `app/layout.tsx` - Add NotificationToast component
- ✅ `lib/notifications/sendNotification.ts` - Add convenience functions
- ✅ `public/firebase-messaging-sw.js` - Add error handling

## Next Steps

1. Integrate `sendNotification()` di halaman izin (`app/izin/page.tsx`)
2. Integrate di halaman absensi (`app/absensi/page.tsx`)
3. Add button "Kirim Notifikasi" di form submission
4. Test dengan super admin device lain
5. Customize toast styling sesuai brand

## API Reference

### sendNotification(options)

```typescript
interface SendNotificationOptions {
  title: string;      // Judul notifikasi (required)
  body: string;       // Isi notifikasi (required)
  userId?: string;    // Jika kosong, kirim ke semua super admin
}

// Returns
{
  success: boolean;
  message?: string;
  error?: string;
  successCount?: number;  // Berapa device yang menerima
  failureCount?: number;  // Berapa device yang gagal
}
```

### notifyPermissionUpdate(actionType, employeeName, reason?)

```typescript
type ActionType = 'created' | 'updated' | 'approved' | 'rejected';

await notifyPermissionUpdate(
  'created',
  'Joni Supiansyah',
  'Sakit kepala'
);
```

### notifyAbsenceUpdate(actionType, employeeName, time?)

```typescript
type ActionType = 'checked_in' | 'checked_out';

await notifyAbsenceUpdate(
  'checked_in',
  'Joni Supiansyah',
  '08:00 WIB'
);
```

## Performance Notes

- Toast notifications stored in component state, auto-cleanup
- No database queries for displaying toast
- FCM handles message delivery optimization
- Service worker runs in separate thread (non-blocking)

## Security Notes

- Only super_admin role can receive notifications (enforced server-side)
- Notifications sent over HTTPS to Vercel
- Firebase Admin SDK private key never exposed to client
- FCM tokens stored in Supabase with RLS policies
