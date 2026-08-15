-- Migration: Add mapped_by columns and RLS Policies for candidate self-application

-- 1. Add mapped_by and mapped_by_role columns to mapped_candidates
ALTER TABLE public.mapped_candidates 
ADD COLUMN IF NOT EXISTS mapped_by UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS mapped_by_role TEXT CHECK (mapped_by_role IN ('admin', 'faculty', 'student'));

-- 2. Performance index
CREATE INDEX IF NOT EXISTS idx_mapped_candidates_mapped_by ON public.mapped_candidates(mapped_by);

-- 3. Update Row Level Security Policies for mapped_candidates
DROP POLICY IF EXISTS "Students can view their own mappings" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Students can view their own mapped_candidates" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Students can insert their own applied mappings" ON public.mapped_candidates;
DROP POLICY IF EXISTS "Students can delete their own applied mappings" ON public.mapped_candidates;

-- Re-create: Students can SELECT their own mappings
CREATE POLICY "Students can view their own mappings" ON public.mapped_candidates
  FOR SELECT USING (auth.uid() = student_id);

-- Policy: Allow students to INSERT their own applications
CREATE POLICY "Students can insert their own applied mappings" ON public.mapped_candidates
  FOR INSERT WITH CHECK (
    auth.uid() = student_id 
    AND status = 'applied'
    AND mapped_by_role = 'student'
    AND (mapped_by = auth.uid() OR mapped_by IS NULL)
  );

-- Policy: Allow students to DELETE/cancel their own applications
CREATE POLICY "Students can delete their own applied mappings" ON public.mapped_candidates
  FOR DELETE USING (
    auth.uid() = student_id 
    AND status = 'applied'
    AND mapped_by_role = 'student'
  );
