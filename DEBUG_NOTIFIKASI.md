# Debug: Notifikasi Tidak Muncul

## 🔍 Checklist Debugging (Urut dari Top-Down)

### Step 1: Pastikan Notifikasi Sudah Dikirim dari Backend
**Problem**: API endpoint tidak dipanggil atau notifikasi tidak dikirim.

**Test di Browser Console**:
```javascript
// 1. Dapatkan userId Anda
const userId = localStorage.getItem('userId') || 'unknown';
console.log('User ID:', userId);

// 2. Test API dengan fetch
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Notifikasi',
    body: 'Ini adalah test notifikasi dari browser console',
    userId: userId  // Opsional - kosongkan untuk broadcast ke semua super admin
  })
});

const result = await response.json();
console.log('API Response:', result);
console.log('Status:', response.status);
```

**Expected Response**:
- ✅ `status: 200` dengan `{ success: true, sentCount: X }`
- ❌ `status: 404` = User belum register device
- ❌ `status: 403` = Bukan super admin
- ❌ `status: 503` = Firebase not initialized

---

### Step 2: Cek Firebase Token Sudah Tersimpan
**Problem**: Service worker terdaftar tapi token tidak ada di DB.

**Di Supabase Console**:
```sql
SELECT * FROM user_devices;
```

**Expected**:
- Minimal ada 1 baris dengan user_id Anda
- fcm_token tidak kosong (mulai dengan karakter alphanumeric)
- device_type = 'web'

**Jika tidak ada data**:
1. Buka DevTools → Console
2. Cek apakah ada error `[NotificationProvider]`
3. Verifikasi `Notification.permission` adalah `'granted'`
   ```javascript
   console.log('Permission:', Notification.permission);
   ```

---

### Step 3: Verifikasi Service Worker Aktif
**Problem**: Service worker tidak menerima pesan background.

**Di DevTools → Application → Service Workers**:
1. Pastikan `firebase-messaging-sw.js` ada status ✅ activated
2. Cek "Skip waiting for this service worker to complete"

**Di Console**:
```javascript
// Cek service worker registration
navigator.serviceWorker.ready.then(reg => {
  console.log('SW Registered:', reg.scope);
  console.log('SW State:', reg.active?.state);
});
```

**Test Service Worker Listener**:
```javascript
// Tambah listener sementara untuk debug
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('[Main Thread] Message from SW:', event.data);
  });
}
```

---

### Step 4: Cek Apakah Notifikasi Diterima oleh Firebase
**Problem**: Firebase tidak mengirim notifikasi ke device.

**Di Firebase Console → Cloud Messaging → Sent Messages**:
1. Klik tab "Cloud Messaging"
2. Cek apakah ada entry untuk `laundry-notification`
3. Lihat status: Sent/Failed

**Alternative - Check di Server Logs**:
```bash
# Kalau gunakan terminal/SSH ke server
tail -f /var/log/firebase-admin.log | grep notification
```

---

### Step 5: Cek Notification Dimunculkan ke OS Panel
**Problem**: Notifikasi diterima tapi tidak ditampilkan.

**Di Browser DevTools → Application → Notifications**:
- Lihat apakah ada log `[Firebase SW] ✅ Notification added to panel`

**Alternative - Buka DevTools Service Worker Console**:
1. DevTools → Application → Service Workers
2. Klik "Inspect" di service worker
3. Buka Console tab
4. Kirim notifikasi ulang dari API
5. Lihat log dari Service Worker:
   ```
   [Firebase SW] 📢 Showing notification to panel: ...
   [Firebase SW] ✅ Notification added to panel
   ```

---

## 🛠️ Solusi Umum

### Problem: Status 404 "User has no registered devices"
**Kemungkinan Penyebab**:
1. Token tidak tersimpan di DB
2. Device type tidak cocok (misal: mobile vs web)

**Solusi**:
```javascript
// Cek di console
localStorage.getItem('notification_permission_denied');
// Jika ada value 'true', berarti user menolak notifikasi

// Reset permission
// 1. Di Chrome: Settings → Privacy → Site Settings → Notifications
// 2. Find localhost → Clear
// 3. Refresh browser
// 4. Accept permission lagi
```

---

### Problem: Status 503 "Firebase not initialized"
**Penyebab**: Env variables tidak set di server.

**Solusi - Set env variables**:
```bash
# .env.local
FIREBASE_PROJECT_ID=laundry-coin-ad6eb
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@laundry-coin-ad6eb.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

---

### Problem: Notifikasi tidak muncul di Windows/Mac
**Kemungkinan**:
1. Browser di-minimize → notifikasi ke taskbar/dock saja
2. `requireInteraction: true` → notifikasi tidak auto-dismiss
3. Cek permission di sistem:
   - **Windows**: Settings → Notifications & actions → Check app
   - **Mac**: System Preferences → Notifications → Browser app

---

## 📊 Full Debugging Trace

Jalankan kode ini di console untuk logging lengkap:

```javascript
// ✅ Enable debug logging
window.debugNotifications = true;

// ✅ Test FCM Token
console.group('🔍 FCM Token Check');
navigator.serviceWorker.ready.then(async (reg) => {
  const messaging = firebase.messaging();
  try {
    const token = await firebase.messaging().getToken({
      vapidKey: 'AIzaSyDuw1caz_6olLHXveJZSx9gpNJ0pF-GXe8'
    });
    console.log('✅ Current FCM Token:', token.slice(0, 20) + '...');
  } catch (e) {
    console.error('❌ Token fetch failed:', e);
  }
});
console.groupEnd();

// ✅ Listen ke foreground messages
console.group('🔍 Foreground Message Listener');
firebase.messaging().onMessage((payload) => {
  console.log('✅ Foreground message received:', payload);
});
console.groupEnd();

// ✅ Check notification permission
console.group('🔍 Notification Permission');
console.log('Permission status:', Notification.permission);
console.log('Can show notification:', Notification.permission === 'granted');
console.groupEnd();

// ✅ List all service workers
console.group('🔍 Service Workers');
navigator.serviceWorker.getRegistrations().then(registrations => {
  console.log(`Found ${registrations.length} service workers:`, registrations);
  registrations.forEach(reg => {
    console.log('- Scope:', reg.scope);
    console.log('- Active:', reg.active?.state);
    console.log('- Waiting:', reg.waiting?.state);
    console.log('- Installing:', reg.installing?.state);
  });
});
console.groupEnd();
```

---

## 🎯 Testing Flow

1. **Setup**:
   - [ ] Open browser DevTools
   - [ ] Navigate to app
   - [ ] Wait for logs: "✅ FCM token received"
   - [ ] Check Supabase: `SELECT * FROM user_devices`

2. **Send Test Notification**:
   ```javascript
   // Copy-paste di browser console
   await fetch('/api/notifications/send', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       title: '🧪 Test',
       body: 'Notifikasi test - seharusnya muncul sekarang',
       userId: 'your-user-id-here'
     })
   }).then(r => r.json()).then(console.log)
   ```

3. **Observe**:
   - [ ] Service Worker console → Check for `[Firebase SW]` logs
   - [ ] OS notification panel → Look for notification
   - [ ] Click notification → Should open app

4. **If Fails**:
   - [ ] Check each error log
   - [ ] Verify Step 1-5 checklist di atas
   - [ ] Check server logs via `docker logs` atau SSH

---

## 📝 Common Issues & Fixes

| Issue | Cause | Fix |
|-------|-------|-----|
| Token not saved | Permission denied | Settings → Site Settings → Allow notifications |
| 404 No devices | User never opened app | Open app once, wait for registration |
| Silent notification | `silent: true` in config | Check `firebase-messaging-sw.js` line ~50 |
| No sound/vibration | Device muted | Check OS sound settings |
| Desktop notification hidden | Behind app window | Check taskbar/notification center |
| FCM token keeps changing | Token refresh loop | Check browser privacy settings |

---

## 🚀 Quick Test Commands

```bash
# Test API di terminal
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Notifikasi",
    "body": "Ini dari curl command",
    "userId": "YOUR_USER_ID"
  }'

# Check service worker logs
# (DevTools → Application → Service Workers → Click "Inspect" → Console tab)
```

---

## 📞 Next Steps Jika Semua Sudah OK

Jika debugging trace menunjukkan semua OK tapi notifikasi masih tidak muncul:

1. **Cek Browser Settings**:
   - Buka `chrome://settings/notifications`
   - Pastikan `localhost:3000` ada di "Allow"

2. **Restart Everything**:
   - Close DevTools
   - Refresh page (Ctrl+F5 untuk cache clear)
   - Coba kirim notifikasi lagi

3. **Check Logs di Server**:
   ```bash
   # Kalau pakai Docker
   docker logs your-container-name | grep -i notification
   ```

4. **Enable Firebase Debug**:
   ```javascript
   firebase.initializeApp(config);
   // Add debug logging
   if (firebase.messaging()) {
     firebase.messaging().enableLogging = true;
   }
   ```
