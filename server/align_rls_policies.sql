-- Migration: Align RLS Policies for Profiles, Placements, Companies, and Positions

-- ========================================================
-- 1. Helper function to check role (to avoid RLS recursion)
-- ========================================================
CREATE OR REPLACE FUNCTION public.check_is_admin_or_faculty()
RETURNS boolean AS $$
DECLARE
  v_curr_email TEXT;
BEGIN
  -- Bypasses for the hardcoded system admin email
  SELECT email INTO v_curr_email FROM auth.users WHERE id = auth.uid();
  IF v_curr_email = 'yuvashankar2211@gmail.com' THEN
    RETURN TRUE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'faculty')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ========================================================
-- 2. ALIGN PROFILES RLS
-- ========================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Role based profile access" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Faculty can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

-- Policy: Anyone authenticated can SELECT profiles (allows student lookup, directory views)
CREATE POLICY "Anyone authenticated can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Policy: Admin can do ALL actions on all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR public.check_is_admin_or_faculty()
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
    OR public.check_is_admin_or_faculty()
  );

-- Policy: Users can update their own profile details
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can insert their own profile details
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ========================================================
-- 3. ALIGN PLACEMENTS (MAPPED CANDIDATES) RLS
-- ========================================================
ALTER TABLE public.mapped_candidates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Faculty can manage mapped_candidates" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Students can view their own mapped_candidates" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Admins and Faculty can manage mappings" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Students can view their own mappings" ON public.mapped_candidates;

-- Policy: Admins and Faculty have full access to manage mappings (The shared pool)
CREATE POLICY "Admins and Faculty can manage mappings" ON public.mapped_candidates
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  );

-- Policy: Students can view their own mappings
CREATE POLICY "Students can view their own mappings" ON public.mapped_candidates
  FOR SELECT USING (auth.uid() = student_id);


-- ========================================================
-- 4. ALIGN COMPANIES RLS
-- ========================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins and Faculty can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Admins and Faculty can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Everyone authenticated can view companies" ON public.companies;

-- Policy: Admins and Faculty can manage all companies
CREATE POLICY "Admins and Faculty can manage companies" ON public.companies
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  );

-- Policy: Everyone authenticated can view companies
CREATE POLICY "Everyone authenticated can view companies" ON public.companies
  FOR SELECT USING (auth.uid() IS NOT NULL);


-- ========================================================
-- 5. ALIGN POSITIONS RLS
-- ========================================================
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone authenticated can view open positions" ON public.positions;
DROP POLICY IF EXISTS "Everyone authenticated can view positions" ON public.positions;
DROP POLICY IF EXISTS "Admins and Faculty can manage positions" ON public.positions;

-- Policy: Admins and Faculty can manage all positions
CREATE POLICY "Admins and Faculty can manage positions" ON public.positions
  FOR ALL USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  )
  WITH CHECK (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
  );

-- Policy: Everyone authenticated can view positions
CREATE POLICY "Everyone authenticated can view positions" ON public.positions
  FOR SELECT USING (auth.uid() IS NOT NULL);
