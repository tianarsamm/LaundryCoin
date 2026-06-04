# Setup Notifikasi untuk Super Admin

## 📋 Checklist Setup Supabase

Jalankan SQL queries berikut di **Supabase SQL Editor** untuk membuat table dan RLS policies yang diperlukan:

### 1. Create `user_devices` Table

```sql
-- Drop existing table if any
DROP TABLE IF EXISTS public.user_devices CASCADE;

-- Create user_devices table
CREATE TABLE public.user_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_type TEXT NOT NULL DEFAULT 'web',
  user_agent TEXT,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, device_type)
);

-- Create index for faster queries
CREATE INDEX idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX idx_user_devices_device_type ON public.user_devices(device_type);
```

### 2. Enable RLS on `user_devices` Table

```sql
-- Enable Row Level Security
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own devices
CREATE POLICY "users_can_read_own_devices"
ON public.user_devices
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to insert their own devices
CREATE POLICY "users_can_insert_own_devices"
ON public.user_devices
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own devices
CREATE POLICY "users_can_update_own_devices"
ON public.user_devices
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own devices
CREATE POLICY "users_can_delete_own_devices"
ON public.user_devices
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow service role to read all devices (for sending notifications)
CREATE POLICY "service_role_can_read_all_devices"
ON public.user_devices
FOR SELECT
TO service_role
USING (true);
```

### 3. Update `menu_permissions` Table (for menu toggle feature)

```sql
-- If menu_permissions table doesn't exist yet, create it
CREATE TABLE IF NOT EXISTS public.menu_permissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  menu_key TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, menu_key)
);

-- Create index
CREATE INDEX idx_menu_permissions_user_id ON public.menu_permissions(user_id);
```

---

## 🔐 Environment Variables yang Diperlukan

Pastikan `.env.local` memiliki:

```env
# Firebase Client Config (PUBLIC)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyDuw1caz_6olLHXveJZSx9gpNJ0pF-GXe8
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=laundry-coin-ad6eb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=laundry-coin-ad6eb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=laundry-coin-ad6eb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=144371384449
NEXT_PUBLIC_FIREBASE_APP_ID=1:144371384449:web:b2638b708c7502ee5d0d80
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here

# Firebase Admin Config (SECRET - server only)
FIREBASE_PROJECT_ID=laundry-coin-ad6eb
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@laundry-coin-ad6eb.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## 🧪 Testing Flow

### 1. Client Side - Register Device (Auto on login for super admin)

Dipanggil otomatis di `useAuth.ts`:
```typescript
if (userProfile.role === "super_admin") {
  await registerDevice(authUser.id);
}
```

### 2. Server Side - Send Notification

Call API endpoint:
```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Laporan Harian",
    "body": "Laporan absensi bulan ini telah siap",
    "userId": "specific-user-id" // optional, jika omit akan ke semua super admin
  }'
```

### 3. Response Examples

**Success (single user):**
```json
{
  "success": true,
  "successCount": 1,
  "failureCount": 0
}
```

**Success (broadcast to all super admins):**
```json
{
  "success": true,
  "message": "Notification sent to all super admins",
  "successCount": 3,
  "failureCount": 0
}
```

**Error cases:**
```json
{
  "error": "Only super admin can send notifications"  // 403
}

{
  "error": "User has no registered devices"  // 404
}

{
  "error": "Failed to send notification"  // 500
}
```

---

## 📱 Frontend Integration

Notifikasi ditampilkan di 3 kondisi:

1. **App Open (Foreground)** - Perlu custom handler di `useEffect` atau Firebase config
2. **App Minimized (Background)** - Ditangani oleh `firebase-messaging-sw.js`
3. **App Closed** - Ditangani oleh `sw.js` (push notifications)

Saat user click notifikasi:
- Jika app open → focus ke app
- Jika app closed → buka app dari home page

---

## 🛠️ Troubleshooting

### Notifikasi tidak diterima?

1. **Check FCM Token**
   ```sql
   SELECT user_id, fcm_token, device_type, last_used 
   FROM user_devices 
   WHERE user_id = 'your-user-id';
   ```

2. **Check User Role**
   ```sql
   SELECT id, role, is_active 
   FROM users 
   WHERE id = 'your-user-id';
   ```

3. **Check API Logs**
   - Buka Network tab di DevTools
   - Cari request ke `/api/notifications/send`
   - Periksa response error

4. **Browser Console**
   - Buka F12 → Console
   - Cari logs dengan prefix `[FCM]`, `[Device Registration]`, etc.

### Permission Denied?

- Pastikan super_admin approve notifikasi permission saat login
- Reset permission: Settings → Site Settings → Notifications → Clear

---

## ✅ Security Checklist

- [x] Only super admin can send notifications (validated in API)
- [x] FCM tokens stored per user in database
- [x] RLS policies restrict access to own devices
- [x] Service role key only for backend
- [x] API endpoint requires authentication token
- [ ] TODO: Rate limiting pada API endpoint
- [ ] TODO: Audit log untuk notification sent

---

## 📊 Database Schema

```
users (existing)
├── id (UUID)
├── email
├── role (super_admin | admin)
└── is_active (boolean)

user_devices (new)
├── id (UUID)
├── user_id (UUID) → users.id
├── fcm_token (TEXT)
├── device_type (web|android|ios)
├── user_agent (TEXT)
├── last_used (timestamp)
└── created_at (timestamp)

menu_permissions (for toggleable menus)
├── id (UUID)
├── user_id (UUID) → users.id
├── menu_key (TEXT)
└── is_enabled (boolean)
```

