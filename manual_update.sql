-- 1. Add missing columns for Batch and Projects
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS batch TEXT,
ADD COLUMN IF NOT EXISTS projects JSONB DEFAULT '[]'::jsonb;

-- 2. Fix the Student Directory visibility (RLS Policy update)
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Role based profile access" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
  );
