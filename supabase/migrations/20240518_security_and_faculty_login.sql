-- 1. Add email to profiles for Employee ID login mapping
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Helper function to check role (to avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.check_is_admin_or_faculty()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'faculty')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update RLS Policies for Companies to prevent student leakage
-- First drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view their own companies" ON companies;

-- Allow Admins and Faculty to see all companies
DROP POLICY IF EXISTS "Admins and Faculty can view all companies" ON companies;
CREATE POLICY "Admins and Faculty can view all companies" ON companies
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR auth.uid() = user_id
    OR public.check_is_admin_or_faculty()
  );

-- 4. Update RLS Policies for Activities to prevent student leakage
DROP POLICY IF EXISTS "Users can view activities for their companies" ON activities;

DROP POLICY IF EXISTS "Admins and Faculty can view all activities" ON activities;
CREATE POLICY "Admins and Faculty can view all activities" ON activities
  FOR SELECT USING (
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR auth.uid() = user_id
    OR public.check_is_admin_or_faculty()
  );

-- 5. Update RLS Policies for Positions (Students SHOULD see these, as they are jobs)
DROP POLICY IF EXISTS "Users can view positions for their companies" ON positions;

DROP POLICY IF EXISTS "Everyone authenticated can view open positions" ON positions;
CREATE POLICY "Everyone authenticated can view open positions" ON positions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 5. Trigger to sync email from auth.users to profiles on signup
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

  INSERT INTO public.profiles (user_id, full_name, role, registration_no, email)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', ''), 
    COALESCE(role_val, 'admin'::public.user_role),
    new.raw_user_meta_data->>'registration_no',
    new.email
  )
  ON CONFLICT (user_id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    registration_no = EXCLUDED.registration_no,
    email = EXCLUDED.email;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Backfill emails and roles for existing profiles (One-time sync)
UPDATE profiles p
SET 
  email = u.email,
  role = CASE 
    -- JWT role is the source of truth — never override it
    WHEN (u.raw_user_meta_data ->> 'role') = 'admin' THEN 'admin'::user_role
    WHEN (u.raw_user_meta_data ->> 'role') = 'faculty' THEN 'faculty'::user_role
    WHEN (u.raw_user_meta_data ->> 'role') = 'student' THEN 'student'::user_role
    -- Fallback: if no JWT role, use registration_no as hint
    WHEN p.registration_no IS NOT NULL THEN 'student'::user_role
    ELSE COALESCE(p.role, 'admin'::user_role)
  END
FROM auth.users u
WHERE p.user_id = u.id;

-- 7. Finalize RLS for Profiles (Extra inclusive for Admin)
DROP POLICY IF EXISTS "Role based profile access" ON profiles;
DROP POLICY IF EXISTS "Admins and Faculty can view all profiles" ON profiles;

CREATE POLICY "Admins and Faculty can view all profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
    OR public.check_is_admin_or_faculty()
    OR NOT EXISTS (SELECT 1 FROM profiles WHERE role = 'admin')
  );
 