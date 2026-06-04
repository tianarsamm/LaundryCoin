# OS-Level Notifications Guide

## Overview

Sistem notifikasi sudah di-optimize untuk muncul di **OS level** (notification system):
- ✅ **Android**: Muncul di notification center & lock screen
- ✅ **iOS**: Muncul di notification center & lock screen (via PWA)
- ✅ **Web**: Muncul sebagai browser notification
- ✅ **Desktop**: Muncul di system tray

## How It Works

### 1. Background Message (App Tertutup)
```
Admin sends notification
    ↓
Firebase Cloud Messaging
    ↓
Service Worker receives (background)
    ↓
showNotification() called
    ↓
OS-level notification appears
```

### 2. Foreground Message (App Terbuka)
```
Admin sends notification
    ↓
Firebase onMessage() fires
    ↓
2 notifications:
   ├─ Toast pop-up (dalam app)
   └─ OS notification (jika browser support)
```

### 3. Notification Click
```
User clicks notification
    ↓
notificationclick event fires
    ↓
App opens/navigates to specified page
    ↓
Notification dismissed
```

---

## Mobile Setup (Android/iOS)

### Prerequisites

1. **Add to Home Screen** (untuk PWA)
   - Open app in browser
   - Menu → "Add to Home Screen"
   - Launch from home screen

2. **Grant Notification Permission**
   - First login akan auto-prompt permission
   - Tap "Allow" untuk enable notifications

3. **Keep Service Worker Active**
   - App tidak harus open untuk receive notifications
   - Service worker berjalan di background

### What You'll See

**When notification received:**
```
┌─────────────────────────────┐
│ Laundry Coin              ✕  │
├─────────────────────────────┤
│ 📋 Izin Baru Ditambahkan    │
│ Karyawan mengajukan izin    │
│ untuk 3 hari                │
└─────────────────────────────┘
```

**Click notification:**
- App opens/navigates to izin page
- Notification dismissed

---

## Web Setup

### Browser Compatibility

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full |
| Firefox | ✅ Full |
| Safari | ⚠️ Limited (PWA only) |
| Edge | ✅ Full |
| Opera | ✅ Full |

### Enable Notifications

1. **First Login**
   - Browser will show permission prompt
   - Click "Allow" (or your browser equivalent)

2. **If Permission Denied**
   - Click address bar → permission icon
   - Change notification setting to "Allow"
   - Or go to Settings → Site Settings → Notifications

3. **Test**
   ```javascript
   // Check permission status
   console.log('Permission:', Notification.permission);
   // Should print: "Permission: granted"
   ```

---

## Notification Features

### 1. Persistent Notifications
- Won't auto-dismiss
- Requires user interaction (click or close)
- Useful for important actions like leave approvals

### 2. Unique Tag System
- Only 1 "laundry-notification" can show at a time
- New notification replaces old one
- Prevents notification spam

### 3. Renotify Flag
- Notification vibrates/sounds even if already shown
- User sees updates for important events

### 4. Mobile Vibration
- Pattern: 200ms vibrate, 100ms pause, 200ms vibrate
- Provides tactile feedback on phone

### 5. Action Links
- Notification click navigates to relevant page
- `/manajemen/izin` for leave requests
- Customizable per notification type

---

## Testing Checklist

### ✅ Web Notification Test

1. **Open in Desktop Browser**
   ```
   1. Login to app
   2. Permission prompt appears
   3. Click "Allow"
   ```

2. **Send Notification**
   ```javascript
   // Console
   fetch('/api/notifications/send', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       title: 'Test Notification',
       body: 'This should appear as OS notification'
     })
   }).then(r => r.json()).then(console.log)
   ```

3. **Verify**
   - OS notification appears (top-right or system tray)
   - Click notification → app opens
   - Console shows: `✅ OS Notification shown successfully`

### ✅ Mobile Notification Test (Android)

1. **Setup PWA**
   - Chrome → Menu → "Install app"
   - Or: Chrome → Menu → "Add to Home Screen"
   - Launch from home screen

2. **Close App**
   - Swipe up from bottom → Close all apps
   - OR: Don't open app

3. **Send Notification**
   - From web browser/desktop, trigger notification
   - Check phone notification center

4. **Verify**
   - Notification appears in notification center
   - Vibration/sound plays
   - Click → App opens with correct page

### ✅ Background Message Test

1. **Login and allow notifications**
2. **Minimize/close browser**
3. **Send notification from admin account**
4. **Verify**
   - Phone shows notification (even app closed)
   - Click opens app
   - Check console after reopening:
     ```
     [Firebase SW] Received background message:
     [Firebase SW] ✅ OS Notification shown successfully
     ```

---

## Customization

### Change Notification Duration
- Currently: `requireInteraction: true` (stays until user acts)
- To auto-dismiss: Change in `public/firebase-messaging-sw.js`

```javascript
// Before (stays)
requireInteraction: true,

// After (dismisses after 5 sec)
requireInteraction: false,
```

### Change Notification Color
- Android: Modify `color: "#6366f1"` in API route
- Web: Done via CSS in toast component

### Change Vibration Pattern
- Modify `vibrate: [200, 100, 200]` in:
  - `public/firebase-messaging-sw.js`
  - `app/api/notifications/send/route.ts`

Pattern: `[vibrate_ms, pause_ms, vibrate_ms, ...]`

### Change Notification Sound
- Android: Uses device default sound
- To customize: Requires Android app config

---

## Troubleshooting

### Notification not appearing on phone?

**Check 1: Permission**
```javascript
console.log(Notification.permission);
// Should be: "granted"
```

If "denied":
- Go to phone Settings → Apps → Chrome → Permissions → Notifications
- Enable notifications

**Check 2: Service Worker**
```javascript
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('SW registered:', regs.length > 0))
```

If false:
- Hard refresh: Ctrl+Shift+R
- Check browser console for errors

**Check 3: FCM Token**
```javascript
// Check Supabase
SELECT * FROM user_devices WHERE user_id = 'your_id'
```

If empty:
- Logout & login again
- Check browser console for token

**Check 4: Vercel Logs**
```
Vercel Dashboard → Deployments → Functions
→ api/notifications/send → Check error logs
```

### Notification appears but not clickable?

- Check if `requireInteraction` is set correctly
- Verify `fcmOptions.link` is set

### Notification dismissed immediately?

- Check `requireInteraction: true` is set
- May be auto-dismissed if `renotify: false`

### Notification not showing on Safari/iOS?

- Safari PWA support is limited
- Works better with third-party services (Firebase Cloud Functions)
- Consider native iOS app for better support

---

## Console Logs to Watch For

### ✅ Success Logs

```javascript
[NotificationProvider] ✅ Notification permission granted
[NotificationProvider] ✅ Service worker registered
[NotificationProvider] ✅ FCM token received
[Device Registration Success]
[Firebase SW] ✅ OS Notification shown successfully
```

### ⚠️ Warning Logs

```javascript
[NotificationProvider] ⚠️ Notification permission denied by user
[NotificationProvider] Notifications not supported
```

### ❌ Error Logs

```javascript
[Firebase Admin] Initialization failed
[Firebase SW] ❌ Error showing notification
[NotificationProvider] Failed to save token
```

---

## Performance Notes

- Service worker runs independent of app (efficient)
- Notifications don't consume significant battery
- FCM handles message delivery optimization
- Background notifications work with ~95% reliability

---

## Browser Notification Settings

### Windows
- Settings → System → Notifications & actions
- Find Chrome/Firefox → Toggle on

### macOS
- System Preferences → Notifications
- Find Chrome/Firefox → Allow notifications

### Android
- Settings → Apps → Chrome → Permissions → Notifications
- Toggle on

### iOS (Safari PWA)
- Settings → Notifications
- Find app → Allow notifications

---

## Next Steps

1. **Test on Mobile**
   - Add to home screen (Android)
   - Grant notification permission
   - Verify notification appears

2. **Test Different Scenarios**
   - App open vs closed
   - Multiple notifications
   - Different permission states

3. **Monitor Production**
   - Check Vercel function logs regularly
   - Monitor FCM delivery rates
   - Track user engagement

---

## References

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Web Push Notifications](https://developer.mozilla.org/en-US/docs/Web/API/notification)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Notifications](https://web.dev/notifications/)
