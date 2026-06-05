-- Step 1: Cek table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'user_devices'
ORDER BY ordinal_position;

-- Step 2: Cek unique constraints
SELECT 
  constraint_name,
  constraint_type,
  column_name
FROM information_schema.constraint_column_usage ccu
JOIN information_schema.table_constraints tc 
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'user_devices'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- Step 3: Cek existing devices
SELECT 
  user_id, 
  device_type, 
  fcm_token,
  device_name,
  updated_at,
  COUNT(*) OVER (PARTITION BY user_id, device_type) as token_count
FROM user_devices
ORDER BY updated_at DESC
LIMIT 20;

-- Step 4: Cek super admin users
SELECT 
  id,
  email,
  role,
  is_active,
  full_name
FROM users
WHERE role = 'super_admin' AND is_active = true
LIMIT 10;
