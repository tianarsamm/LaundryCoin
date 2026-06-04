# Vercel Environment Variables Setup Guide

## Problem
API endpoint `/api/notifications/send` returns 404 on Vercel because Firebase Admin SDK fails to initialize due to missing or incorrectly formatted environment variables.

## Required Environment Variables

You need to set these 5 variables in Vercel Dashboard:

### 1. FIREBASE_PROJECT_ID
- **Source**: Firebase Console → Project Settings → General
- **Value**: Your Firebase project ID (e.g., `laundry-coin`)
- **Type**: Public (ok to expose)

### 2. FIREBASE_CLIENT_EMAIL
- **Source**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- **Value**: The `client_email` field from downloaded JSON
- **Example**: `firebase-adminsdk-xxxxx@laundry-coin.iam.gserviceaccount.com`
- **Type**: Public (ok to expose)

### 3. FIREBASE_PRIVATE_KEY ⚠️ CRITICAL
- **Source**: Firebase Console → Project Settings → Service Accounts → Generate New Private Key
- **Value**: The `private_key` field from downloaded JSON
- **Format**: MUST replace actual newlines with `\n`
  ```
  Original in JSON:
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIB...\n...\n-----END PRIVATE KEY-----\n"
  
  Paste into Vercel as-is (keep the \n characters)
  ```
- **Type**: Secret (DO NOT expose)
- **Verification**: Should start with `-----BEGIN PRIVATE KEY-----` and end with `-----END PRIVATE KEY-----\n`

### 4. SUPABASE_SERVICE_ROLE_KEY
- **Source**: Supabase Dashboard → Project Settings → API → Service role key
- **Value**: The long token string starting with `eyJ...`
- **Type**: Secret (DO NOT expose)
- **Note**: Different from ANON key!

### 5. NEXT_PUBLIC_FIREBASE_VAPID_KEY
- **Source**: Firebase Console → Project Settings → Cloud Messaging → Web push certificates → Key pair
- **Value**: Your Web push certificate public key
- **Type**: Public (ok to expose - `NEXT_PUBLIC_` prefix means it's accessible on client)

## Step-by-Step Setup in Vercel

### 1. Go to Vercel Dashboard
```
https://vercel.com/dashboard → Select your project
```

### 2. Navigate to Settings
```
Settings → Environment Variables
```

### 3. Add Each Variable

For each variable below, click "Add Environment Variable":

#### Firebase Variables
```
Name: FIREBASE_PROJECT_ID
Value: [your-project-id]
Environment: Production, Preview, Development
```

```
Name: FIREBASE_CLIENT_EMAIL
Value: firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
Environment: Production, Preview, Development
```

```
Name: FIREBASE_PRIVATE_KEY
Value: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...[FULL KEY WITH \n]\n-----END PRIVATE KEY-----\n"
Environment: Production, Preview, Development
Encryption: YES (Secret)
```

#### Supabase Variable
```
Name: SUPABASE_SERVICE_ROLE_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Environment: Production, Preview, Development
Encryption: YES (Secret)
```

#### Firebase Web Push
```
Name: NEXT_PUBLIC_FIREBASE_VAPID_KEY
Value: [your-vapid-key]
Environment: Production, Preview, Development
```

### 4. Save & Deploy
- After adding all variables, save changes
- Redeploy your app: Go to Deployments → Select latest → Redeploy
- OR trigger new deployment by pushing to git

## Verification After Deployment

### Check 1: Vercel Build Logs
```
1. Go to Vercel Dashboard → Deployments
2. Click on latest deployment
3. Look for "[Firebase Admin] Initialized successfully" in Function logs
```

### Check 2: Test API Endpoint
```bash
# Get your session token first (from browser console)
curl -X POST https://laundry-coin.vercel.app/api/notifications/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer [YOUR_SESSION_TOKEN]" \
  -d '{
    "title": "Test Notification",
    "body": "This is a test message"
  }'
```

### Check 3: Browser Console
After login, check browser console for:
```
[Firebase Admin] Initialized successfully
[NotificationProvider] Token saved successfully
[Device Registration Success]
```

## Troubleshooting

### Error: "missing Firebase environment variables"
**Solution**: One or more Firebase variables are not set. Double-check all 5 variables are added.

### Error: "Firebase initialization failed: invalid private key"
**Possible causes**:
1. Private key not formatted correctly (missing `\n`)
2. Private key copied with extra quotes
3. Private key truncated (too short)

**Solution**: 
- Delete and re-add FIREBASE_PRIVATE_KEY
- Ensure it starts with `-----BEGIN` and ends with `-----\n`
- No extra quotes around the entire value

### Error: "Gagal mengambil data device super admin" (500 error)
**Cause**: SUPABASE_SERVICE_ROLE_KEY is wrong or invalid

**Solution**: 
- Go to Supabase dashboard
- Copy Service role key again (not anon key)
- Make sure it starts with `eyJ...`

### Still getting 404 after deployment?
1. Check that deployment shows green checkmark
2. Wait 5 minutes after redeployment (CDN cache)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Check Vercel Function logs for errors

## Security Notes

✅ Safe to expose in code:
- FIREBASE_PROJECT_ID
- FIREBASE_CLIENT_EMAIL
- NEXT_PUBLIC_FIREBASE_VAPID_KEY (has `NEXT_PUBLIC_` prefix)

❌ Keep secret:
- FIREBASE_PRIVATE_KEY
- SUPABASE_SERVICE_ROLE_KEY

Vercel marks these as "Encrypted" in dashboard - they won't be logged or exposed.

## Testing Locally

Add to `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Server-only (not exposed to browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Test with:
```bash
npm run build  # Check for Firebase initialization
npm run start
```

Then test API:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Test"}'
```
