DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Role based profile access" ON profiles
  FOR SELECT USING (
    auth.uid() = user_id 
    OR 
    (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty')
  );
