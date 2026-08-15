-- ============================================
-- TARGETED FIX: Correct all user roles
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Fix faculty account: profile role must match JWT role
UPDATE public.profiles 
SET role = 'faculty'::user_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'sculptureart457@gmail.com');

-- 2. Fix admin account: set both profile role AND JWT role
UPDATE public.profiles 
SET role = 'admin'::user_role
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'yuvashankar2211@gmail.com');

UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'yuvashankar2211@gmail.com';

-- 3. Backfill email for admin if missing
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id AND p.email IS NULL;

-- 4. VERIFY — confirm everything is correct now
SELECT 
  u.email,
  u.raw_user_meta_data ->> 'role' AS jwt_role,
  p.role AS profile_role,
  p.registration_no
FROM auth.users u
LEFT JOIN public.profiles p ON p.user_id = u.id
ORDER BY u.created_at;
