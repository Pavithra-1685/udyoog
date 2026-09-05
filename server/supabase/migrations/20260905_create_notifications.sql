-- Migration: Create notifications table for UDYOOG Real-time Notifications

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_job_id UUID REFERENCES public.positions(id) ON DELETE SET NULL,
  related_application_id UUID REFERENCES public.mapped_candidates(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can read own or role notifications" ON public.notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can read own or role notifications" ON public.notifications
  FOR SELECT USING (
    auth.uid() = user_id
    OR user_id IS NULL
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' AND type LIKE '%admin%'
    )
    OR (
      (auth.jwt() -> 'user_metadata' ->> 'role') = 'faculty' AND type LIKE '%faculty%'
    )
  );

CREATE POLICY "Authenticated users can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' OR auth.role() = 'anon'
  );

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (
    auth.uid() = user_id OR user_id IS NULL
  );
