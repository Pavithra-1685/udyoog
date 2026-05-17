-- Add CGPA fields to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS semester_cgpa JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS cgpa FLOAT DEFAULT 0.0;

-- Optional: Function to calculate average CGPA from semester_cgpa if needed
-- But let's keep it simple and just add the columns for now.

