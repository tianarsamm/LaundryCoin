# 404 Error on /api/notifications/send - Debugging Checklist

## Quick Diagnosis

### ✅ Step 1: Check Browser Console
When logged in, you should see:
```
[NotificationProvider] Service worker ready
[NotificationProvider] FCM token: d8rlIs2BnSd3K3xwg3ZS...
[NotificationProvider] Token saved successfully
[Device Registration Success]
```

If you see **only** `[Device Registration Success]` but not "Token saved", then:
- Problem: Supabase table `user_devices` doesn't exist
- Solution: Run SQL from NOTIFIKASI_SETUP.md

### ✅ Step 2: Check Vercel Logs
```
1. Vercel Dashboard → Your Project → Deployments
2. Click "Functions" tab
3. Look for Function: `api/notifications/send`
4. Expand and read error logs
```

**Expected log on first request**:
```
[Firebase Admin] Initialized successfully
[Notification API] Sending to X device(s)
[Notification API] Result: X success, 0 failure
```

**If you see error**:
```
[Firebase Admin] Initialization failed: Missing Firebase environment variables
```
→ Go to VERCEL_ENV_SETUP.md, Step 3-4

### ✅ Step 3: Test API Endpoint Directly

**In browser console** (after login):
```javascript
fetch('/api/notifications/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (await supabase.auth.getSession()).data.session.access_token
  },
  body: JSON.stringify({
    title: 'Test',
    body: 'Testing notification API'
  })
})
.then(r => r.json())
.then(console.log)
```

**Expected response**:
```json
{
  "success": true,
  "message": "Notification sent to all super admins",
  "successCount": 1,
  "failureCount": 0
}
```

**If 404**:
- Firebase initialization failed during build
- Check Vercel deployment logs

**If 503**:
- Firebase environment variables missing/invalid
- Check VERCEL_ENV_SETUP.md

### ✅ Step 4: Verify Environment Variables in Vercel

```
Vercel Dashboard → Settings → Environment Variables

Required variables (all must be present):
☐ FIREBASE_PROJECT_ID
☐ FIREBASE_CLIENT_EMAIL  
☐ FIREBASE_PRIVATE_KEY (starts with "-----BEGIN PRIVATE KEY-----")
☐ SUPABASE_SERVICE_ROLE_KEY (starts with "eyJ")
☐ NEXT_PUBLIC_FIREBASE_VAPID_KEY
```

If any are missing → Add them following VERCEL_ENV_SETUP.md

## Common Issues & Fixes

### Issue 1: "Firebase initialization failed: Missing Firebase environment variables"

**Root cause**: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY not set in Vercel

**Fix**:
1. Open Vercel Dashboard
2. Go to Settings → Environment Variables
3. Add missing variables from VERCEL_ENV_SETUP.md
4. Redeploy: Deployments → Select latest → "Redeploy"

### Issue 2: "Firebase initialization failed: invalid private key"

**Root cause**: FIREBASE_PRIVATE_KEY format incorrect

**Example of WRONG format**:
```
-----BEGIN PRIVATE KEY-----
MIIEvQIBA...
-----END PRIVATE KEY-----
```
(Actual newlines - doesn't work on Vercel)

**Example of CORRECT format**:
```
-----BEGIN PRIVATE KEY-----\nMIIEvQIBA...\n-----END PRIVATE KEY-----\n
```
(Escaped newlines - works everywhere)

**Fix**:
1. Delete FIREBASE_PRIVATE_KEY from Vercel
2. Copy from Firebase JSON download again
3. Paste into Vercel as-is (keep the `\n` characters)
4. Redeploy

### Issue 3: 500 Error "Gagal mengambil data device super admin"

**Root cause**: SUPABASE_SERVICE_ROLE_KEY wrong or expired

**Fix**:
1. Go to Supabase Dashboard
2. Project Settings → API → Service role key (NOT anon key!)
3. Copy fresh token
4. Update in Vercel
5. Redeploy

### Issue 4: No FCM token in console logs

**Root cause**: `user_devices` table doesn't exist in Supabase

**Fix**:
1. Open Supabase Dashboard → SQL Editor
2. Run all queries from NOTIFIKASI_SETUP.md
3. Clear browser cache
4. Log out and back in

### Issue 5: FCM token saves but notification not sent

**Root cause**: User is not super_admin or has no devices registered

**Fix**:
1. Check user role in Supabase: `SELECT role FROM users WHERE id = 'YOUR_USER_ID'`
2. Must be `super_admin`
3. Check devices: `SELECT * FROM user_devices WHERE user_id = 'YOUR_USER_ID'`
4. If empty, log out and back in to re-register

## After Fixing

### Verify Everything Works

1. **Clear local data**:
   - DevTools → Application → Clear Storage → Clear All

2. **Restart browser** (full restart, not just refresh)

3. **Log in again**

4. **Check console logs**:
   ```
   [NotificationProvider] Service worker ready
   [NotificationProvider] FCM token: ...
   [NotificationProvider] Token saved successfully  
   [Device Registration Success]
   ```

5. **Test sending notification** (from another super admin):
   ```javascript
   // In browser console
   const sendNotif = async () => {
     const {data: {session}} = await supabase.auth.getSession();
     const r = await fetch('/api/notifications/send', {
       method: 'POST',
       headers: {
         'Content-Type': 'application/json',
         'Authorization': 'Bearer ' + session.access_token
       },
       body: JSON.stringify({title: 'Test', body: 'Works!'})
     });
     return r.json();
   };
   sendNotif().then(console.log);
   ```

6. **Should receive notification** after a few seconds

## Getting Help

If still failing after this checklist:

1. **Check Vercel Function logs**:
   ```
   Vercel Dashboard → Deployments → [Latest] → Functions → api/notifications/send
   ```
   Copy the FULL error message

2. **Check Supabase logs**:
   ```
   Supabase Dashboard → Logs → Function logs
   Filter: search for "notification"
   ```

3. **Verify local .env.local has all variables** (if testing locally):
   ```bash
   echo $FIREBASE_PRIVATE_KEY  # Should not be empty
   echo $SUPABASE_SERVICE_ROLE_KEY  # Should not be empty
   ```

## Key Files Modified

- `src/lib/firebase/admin.ts` - Added error handling for initialization
- `app/api/notifications/send/route.ts` - Added Firebase validation check
- `VERCEL_ENV_SETUP.md` - Step-by-step environment setup guide (NEW)
- `VERCEL_ERROR_DEBUGGING.md` - This file (NEW)
