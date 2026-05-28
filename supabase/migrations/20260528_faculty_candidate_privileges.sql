-- Database Migration: Career Pathway Enhancements & Safe Column Rename
-- Renames registration_no to sif_no, adds resume_url, and upgrades RPCs for Faculty Candidate Creation

-- 1. Safely rename registration_no to sif_no in profiles table
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'registration_no'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN registration_no TO sif_no;
  END IF;
END $$;

-- 2. Safely add resume_url column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS resume_url TEXT;

-- 3. Safely rename the index
ALTER INDEX IF EXISTS public.idx_profiles_registration_no RENAME TO idx_profiles_sif_no;
CREATE INDEX IF NOT EXISTS idx_profiles_sif_no ON public.profiles(sif_no);

-- 4. Copy existing metadata registration_no to sif_no in auth.users to preserve all historical accounts
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || jsonb_build_object('sif_no', raw_user_meta_data->>'registration_no')
WHERE raw_user_meta_data ? 'registration_no'
  AND NOT (raw_user_meta_data ? 'sif_no');

-- 5. Recreate handle_new_user() sync function to read sif_no with registration_no fallback
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  role_val public.user_role;
BEGIN
  -- Safely parse the role
  BEGIN
    role_val := (new.raw_user_meta_data->>'role')::public.user_role;
  EXCEPTION WHEN OTHERS THEN
    role_val := 'admin'::public.user_role;
  END;

  INSERT INTO public.profiles (user_id, full_name, role, sif_no, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    COALESCE(role_val, 'admin'::public.user_role),
    COALESCE(new.raw_user_meta_data->>'sif_no', new.raw_user_meta_data->>'registration_no'),
    new.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    sif_no = EXCLUDED.sif_no,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-establish the sync trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- UPGRADED ADMIN/FACULTY SECURITY DEFINER FUNCTIONS (CRUD FOR CANDIDATES)
-- =========================================================================

-- Helper function to check role (redefined to support both admin email accounts)
CREATE OR REPLACE FUNCTION public.check_is_admin_or_faculty()
RETURNS boolean AS $$
DECLARE
  v_curr_email TEXT;
BEGIN
  -- Bypasses for the hardcoded system admin emails
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();
  IF v_curr_email = 'yuvashankar2211@gmail.com' OR v_curr_email = 'Rajarajan2994@gmail.com' THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'faculty')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 1. Create User RPC
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_password TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_reg_no TEXT
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_encrypted_password TEXT;
  v_curr_email TEXT;
  v_curr_role TEXT;
BEGIN
  -- Get current user email and role
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();
  SELECT role::text INTO v_curr_role FROM public.profiles WHERE user_id = auth.uid();

  -- Enforce that the executing user is an admin, faculty, or system email
  IF v_curr_email != 'yuvashankar2211@gmail.com' 
     AND v_curr_email != 'Rajarajan2994@gmail.com' 
     AND COALESCE(v_curr_role, '') != 'admin' 
     AND COALESCE(v_curr_role, '') != 'faculty' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators and faculty members can create accounts.';
  END IF;

  -- Faculty constraints: Faculty can ONLY create 'student' accounts.
  IF (v_curr_email != 'yuvashankar2211@gmail.com' AND v_curr_email != 'Rajarajan2994@gmail.com' AND COALESCE(v_curr_role, '') = 'faculty') THEN
    IF p_role != 'student' THEN
      RAISE EXCEPTION 'Unauthorized: Faculty members can only provision student accounts.';
    END IF;
  END IF;

  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users (mapping p_reg_no parameter to both key structures for compatibility)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    p_email,
    v_encrypted_password,
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    jsonb_build_object('full_name', p_full_name, 'role', p_role, 'sif_no', p_reg_no, 'registration_no', p_reg_no),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update User RPC
CREATE OR REPLACE FUNCTION public.admin_update_user(
  p_user_id UUID,
  p_full_name TEXT,
  p_role TEXT,
  p_reg_no TEXT,
  p_email TEXT
)
RETURNS VOID AS $$
DECLARE
  v_curr_email TEXT;
  v_curr_role TEXT;
  v_target_role TEXT;
BEGIN
  -- Get current user email and role
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();
  SELECT role::text INTO v_curr_role FROM public.profiles WHERE user_id = auth.uid();

  -- Get target user role from profiles
  SELECT role::text INTO v_target_role FROM public.profiles WHERE user_id = p_user_id;

  -- Enforce authorization (Admins, Faculty, or admin emails)
  IF v_curr_email != 'yuvashankar2211@gmail.com' 
     AND v_curr_email != 'Rajarajan2994@gmail.com' 
     AND COALESCE(v_curr_role, '') != 'admin' 
     AND COALESCE(v_curr_role, '') != 'faculty' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators and faculty members can edit users.';
  END IF;

  -- Faculty constraints:
  -- 1. Faculty can only edit student profiles
  -- 2. Faculty cannot change a student to any other role
  IF (v_curr_email != 'yuvashankar2211@gmail.com' AND v_curr_email != 'Rajarajan2994@gmail.com' AND COALESCE(v_curr_role, '') = 'faculty') THEN
    IF COALESCE(v_target_role, '') != 'student' THEN
      RAISE EXCEPTION 'Unauthorized: Faculty members can only edit student accounts.';
    END IF;
    IF p_role != 'student' THEN
      RAISE EXCEPTION 'Unauthorized: Faculty members cannot change user roles.';
    END IF;
  END IF;

  -- Update auth.users email and metadata (storing both keys for maximum safety)
  UPDATE auth.users
  SET 
    email = p_email,
    raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'role', p_role, 'sif_no', p_reg_no, 'registration_no', p_reg_no)
  WHERE id = p_user_id;

  -- Update profiles
  UPDATE public.profiles
  SET
    full_name = p_full_name,
    role = p_role::public.user_role,
    sif_no = p_reg_no,
    email = p_email
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Delete User RPC
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_curr_email TEXT;
  v_curr_role TEXT;
  v_target_role TEXT;
BEGIN
  -- Get current user email and role
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();
  SELECT role::text INTO v_curr_role FROM public.profiles WHERE user_id = auth.uid();

  -- Get target user role from profiles
  SELECT role::text INTO v_target_role FROM public.profiles WHERE user_id = p_user_id;

  -- Enforce authorization
  IF v_curr_email != 'yuvashankar2211@gmail.com' 
     AND v_curr_email != 'Rajarajan2994@gmail.com' 
     AND COALESCE(v_curr_role, '') != 'admin' 
     AND COALESCE(v_curr_role, '') != 'faculty' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators and faculty members can delete users.';
  END IF;

  -- Faculty constraints: Faculty can ONLY delete student accounts
  IF (v_curr_email != 'yuvashankar2211@gmail.com' AND v_curr_email != 'Rajarajan2994@gmail.com' AND COALESCE(v_curr_role, '') = 'faculty') THEN
    IF COALESCE(v_target_role, '') != 'student' THEN
      RAISE EXCEPTION 'Unauthorized: Faculty members can only delete student accounts.';
    END IF;
  END IF;

  -- Safety rule: Admin profiles cannot be deleted by anyone using this RPC
  IF COALESCE(v_target_role, '') = 'admin' THEN
    RAISE EXCEPTION 'Unauthorized: Administrator accounts cannot be deleted through user management.';
  END IF;

  -- Delete from auth.users (which cascades to profiles)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- =========================================================================
-- ANONYMOUS-SAFE PROFILE LOOKUP FOR LOGIN PRE-CHECK
-- This allows the login form to verify sif_no/employee_id before sign-in.
-- Returns only email and role (no sensitive data). SECURITY DEFINER bypasses RLS.
-- =========================================================================
CREATE OR REPLACE FUNCTION public.lookup_profile_by_sif_no(p_sif_no TEXT)
RETURNS TABLE(email TEXT, role TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.email::TEXT, p.role::TEXT
  FROM public.profiles p
  WHERE p.sif_no = p_sif_no
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
