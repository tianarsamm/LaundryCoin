# Android Notification Panel Setup & Testing

## Apa yang Sudah Di-Fix

Notifikasi sekarang akan muncul **di notification panel Android** (area di atas header):

```
📦 Notification Panel
├─ 🔔 Laundry Coin - Izin Baru Ditambahkan
│  └─ Karyawan mengajukan izin untuk 3 hari
└─ 🔔 Laundry Coin - Izin Disetujui
   └─ Izin Anda telah disetujui oleh admin
```

**Ketika user swipe down dari atas** → notification panel terbuka → terlihat semua notifikasi

---

## Setup di HP Android

### Step 1: Install PWA
```
1. Buka Chrome
2. Kunjungi: https://laundry-coin.vercel.app
3. Menu (⋮) → "Install app" 
   atau "Add to Home Screen"
4. Tap "Install" → App ditambah ke home screen
```

### Step 2: Grant Notification Permission
```
1. Launch app dari home screen
2. Permission popup akan muncul
3. Tap "Allow" untuk enable notifications
4. ✅ Done!
```

### Step 3: Verify Setup
Buka browser console (F12) dan lihat:
```
[NotificationProvider] ✅ Notification permission granted
[NotificationProvider] ✅ Service worker registered
[NotificationProvider] ✅ FCM token received
[Device Registration Success]
```

---

## Testing Notification Panel

### Test Foreground (App Terbuka)
```
1. Launch app
2. Keep app visible
3. From admin account, kirim notification
4. You should see:
   - Toast pop-up di dalam app (top-right)
   - OS notification juga muncul (di notification panel)
```

### Test Background (App Tertutup)
```
1. Launch app
2. Minimize/swipe away app
3. From admin account, kirim notification
4. Look at phone:
   ✅ Notification PASTI muncul di notification panel
   ✅ Phone mungkin vibrate (jika enabled)
   ✅ Phone mungkin make sound (jika enabled)
```

### Test Notification Click
```
1. Ada notification di panel
2. Tap notification
3. App harus:
   - Buka/focus
   - Navigate ke /manajemen/izin page
   - Notification dismiss
```

---

## What to Expect

### Visual

**Notification Panel (Swipe down dari atas)**
```
Laundry Coin
📋 Izin Baru Ditambahkan
   Karyawan mengajukan izin untuk 3 hari

[Swipe left to dismiss]
```

### Behavior

| Action | Result |
|--------|--------|
| **Notification arrives** | Phone vibrates (200-100-200ms pattern) |
| **Sound enabled** | Notification sound plays |
| **Tap notification** | App opens & navigates to izin page |
| **Swipe left** | Notification dismissed |
| **Manual dismiss** | Notification removed from panel |

### Duration

- Notification stays in panel **until user dismisses** (tidak auto-dismiss)
- Multiple notifications stack di panel
- Older notifications dapat di-scroll untuk lihat

---

## Troubleshooting

### ❌ Notification Not Appearing

**Cause 1: Permission Denied**
```
Check: Notification.permission → Should be "granted"

If denied:
1. Settings → Apps → Chrome → Permissions
2. Find "Notifications" → Enable
3. OR: Settings → Advanced → Site Settings → Notifications
   → Find laundry-coin → Enable
```

**Cause 2: Service Worker Not Registered**
```
Check: navigator.serviceWorker.ready
→ Should resolve successfully

If failed:
1. Hard refresh: Ctrl+Shift+R
2. Check browser console for errors
3. Try re-installing app
```

**Cause 3: FCM Token Not Saved**
```
Check: SELECT * FROM user_devices WHERE user_id = 'xxx'

If empty:
1. Logout completely
2. Clear app data (Settings → Apps → Chrome → Storage)
3. Hard refresh
4. Login again & allow notification permission
```

### ❌ Notification Appears But Dismissed Immediately

**Cause:** `requireInteraction: false` or different config

**Fix:** Check that in service worker:
```javascript
requireInteraction: true  // ← Must be true
```

### ❌ App Doesn't Open When Tapping Notification

**Cause:** Click handler not working properly

**Fix:** 
1. Check browser console for `[Firebase SW] 👆 User clicked`
2. Check that `/manajemen/izin` URL is valid
3. Hard refresh & re-test

### ⚠️ Only Getting Toast, Not OS Notification

**This is normal if:**
- App is currently open (foreground)
- Toast is the foreground notification
- OS notification also sent but may not be visible

**To verify both:**
1. In console, check for `[NotificationProvider] Foreground message`
2. Also check notification panel by swiping down
3. Both should appear

---

## Console Logs to Watch

### ✅ Success Logs (Good!)

```javascript
[NotificationProvider] ✅ Notification permission granted
[NotificationProvider] ✅ Service worker registered
[NotificationProvider] ✅ FCM token received
[Firebase SW] 📢 Showing notification to panel
[Firebase SW] ✅ Notification added to panel
[Firebase SW] 👆 User clicked notification
```

### ⚠️ Warning Logs

```javascript
[NotificationProvider] ⚠️ Notification permission denied by user
[NotificationProvider] Notifications not supported
```

### ❌ Error Logs

```javascript
[Firebase Admin] Initialization failed
[Firebase SW] ❌ Failed to show notification
[NotificationProvider] Failed to save token
```

---

## Advanced: Customize Notification

### Change Notification Sound
Edit `app/api/notifications/send/route.ts`:
```typescript
sound: "default"  // or custom sound name
```

### Change Vibration Pattern
Edit multiple files:
- `public/firebase-messaging-sw.js`
- `app/api/notifications/send/route.ts`

```typescript
vibrate: [200, 100, 200]  // Pattern in milliseconds
// Example: [100, 50, 100, 50, 200] for different pattern
```

### Change Color
Edit `app/api/notifications/send/route.ts`:
```typescript
color: "#FF5733"  // Different hex color
```

---

## Device Requirements

**Minimum:**
- Android 5.0+
- Chrome 50+
- 50MB free storage

**Recommended:**
- Android 8.0+
- Chrome latest
- 100MB free storage

---

## Files Modified

| File | Change |
|------|--------|
| `public/firebase-messaging-sw.js` | ✅ Improved notification display |
| `app/api/notifications/send/route.ts` | ✅ Optimized for Android |
| `app/layout.tsx` | ✅ Added manifest.json link |
| `public/manifest.json` | ✅ NEW - PWA configuration |

---

## Next Steps

1. **Install PWA** to phone
2. **Grant notification permission**
3. **Test with different scenarios:**
   - App open
   - App closed
   - Screen off
4. **Verify notification appears in panel**
5. **Test tap notification → navigate**

---

## Support

- **Setup issues?** Check browser console logs
- **Notification not received?** Check Supabase `user_devices` table
- **App not opening?** Check Vercel function logs

**Common:** Hard refresh (Ctrl+Shift+R) fixes most issues!
