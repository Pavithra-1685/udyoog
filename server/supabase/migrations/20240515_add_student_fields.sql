-- Update profiles table to support roles and student-specific fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'student', 'faculty');
    END IF;
END $$;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS registration_no TEXT,
ADD COLUMN IF NOT EXISTS branch TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS graduation TEXT,
ADD COLUMN IF NOT EXISTS home_location TEXT,
ADD COLUMN IF NOT EXISTS preferred_locations TEXT[],
ADD COLUMN IF NOT EXISTS github_url TEXT,
ADD COLUMN IF NOT EXISTS leetcode_url TEXT,
ADD COLUMN IF NOT EXISTS codechef_url TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;

-- Add index for registration_no as it will be used for login
CREATE INDEX IF NOT EXISTS idx_profiles_registration_no ON profiles(registration_no);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
