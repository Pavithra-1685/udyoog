-- Migration: Create mapped_candidates table and Admin User CRUD functions

-- 1. Create mapped_candidates table to store candidate mappings
CREATE TABLE IF NOT EXISTS public.mapped_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  position_id UUID NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'mapped' CHECK (status IN ('mapped', 'applied', 'interviewing', 'offered', 'rejected', 'placed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, position_id)
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_mapped_candidates_student ON public.mapped_candidates(student_id);
CREATE INDEX IF NOT EXISTS idx_mapped_candidates_position ON public.mapped_candidates(position_id);
CREATE INDEX IF NOT EXISTS idx_mapped_candidates_status ON public.mapped_candidates(status);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.mapped_candidates ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies
DROP POLICY IF EXISTS "Admins and Faculty can manage mapped_candidates" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Students can view their own mapped_candidates" ON public.mapped_candidates;

-- Policy: Admins and Faculty can manage mappings
CREATE POLICY "Admins and Faculty can manage mapped_candidates" ON public.mapped_candidates
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  );

-- Policy: Students can only view their own mappings
CREATE POLICY "Students can view their own mapped_candidates" ON public.mapped_candidates
  FOR SELECT USING (
    auth.uid() = student_id
  );


-- ========================================================
-- ADMIN SECURITY PRIVILEGES (CRUD FOR STUDENTS & FACULTY)
-- These allow the logged-in admin to CRUD auth.users and profiles
-- ========================================================

-- Helper to decrypt password if required
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Admin Create User function
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
BEGIN
  -- Get current user email from auth.users
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();

  -- Enforce that the executing user is an admin OR has the admin email
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) AND v_curr_email != 'yuvashankar2211@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can create users.';
  END IF;

  v_encrypted_password := crypt(p_password, gen_salt('bf'));

  -- Insert into auth.users
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
    jsonb_build_object('full_name', p_full_name, 'role', p_role, 'registration_no', p_reg_no),
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


-- Admin Update User function
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
BEGIN
  -- Get current user email from auth.users
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();

  -- Enforce that the executing user is an admin OR has the admin email
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) AND v_curr_email != 'yuvashankar2211@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can edit users.';
  END IF;

  -- Update auth.users email and metadata
  UPDATE auth.users
  SET 
    email = p_email,
    raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'role', p_role, 'registration_no', p_reg_no)
  WHERE id = p_user_id;

  -- Update profiles
  UPDATE public.profiles
  SET
    full_name = p_full_name,
    role = p_role::public.user_role,
    registration_no = p_reg_no,
    email = p_email
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Admin Delete User function
CREATE OR REPLACE FUNCTION public.admin_delete_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_curr_email TEXT;
BEGIN
  -- Get current user email from auth.users
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();

  -- Enforce that the executing user is an admin OR has the admin email
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) AND v_curr_email != 'yuvashankar2211@gmail.com' THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can delete users.';
  END IF;

  -- Delete from auth.users (which cascades to profiles!)
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
