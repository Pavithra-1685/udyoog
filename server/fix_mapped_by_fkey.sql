-- SQL Fix: Ensure mapped_candidates.mapped_by foreign key allows NULL and does not block mapping if user profile is missing
-- Run this script in your Supabase SQL Editor if needed.

BEGIN;

-- 1. Drop existing foreign key constraint if it exists
ALTER TABLE IF EXISTS public.mapped_candidates
DROP CONSTRAINT IF EXISTS mapped_candidates_mapped_by_fkey;

-- 2. Add Foreign Key Constraint with ON DELETE SET NULL referencing profiles(user_id)
ALTER TABLE public.mapped_candidates
ADD CONSTRAINT mapped_candidates_mapped_by_fkey
FOREIGN KEY (mapped_by) 
REFERENCES public.profiles(user_id) 
ON DELETE SET NULL;

COMMIT;
