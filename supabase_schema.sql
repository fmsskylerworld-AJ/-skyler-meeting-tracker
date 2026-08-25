-- ========================================================
-- SKYLER WORLD MEETING TRACKER - SUPABASE DATABASE SCHEMA
-- ========================================================

-- 1. Create MEETINGS Table
CREATE TABLE IF NOT EXISTS public.meetings (
    id TEXT PRIMARY KEY,
    unit TEXT NOT NULL,
    s_no INTEGER NOT NULL DEFAULT 1,
    department TEXT NOT NULL,
    meeting_name TEXT NOT NULL,
    frequency TEXT NOT NULL,
    reporting_day TEXT NOT NULL,
    lead_by TEXT,
    attendees TEXT[] DEFAULT '{}'::TEXT[],
    scheduled_time TEXT NOT NULL DEFAULT '10:00',
    alarm_enabled BOOLEAN NOT NULL DEFAULT true,
    is_active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create MEETING_LOGS Table
CREATE TABLE IF NOT EXISTS public.meeting_logs (
    id TEXT PRIMARY KEY,
    meeting_id TEXT NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
    meeting_name TEXT NOT NULL,
    unit TEXT NOT NULL,
    department TEXT NOT NULL,
    completed_date TEXT NOT NULL, -- YYYY-MM-DD
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    photos TEXT[] DEFAULT '{}'::TEXT[],
    mom TEXT,
    actual_attendees TEXT[] DEFAULT '{}'::TEXT[],
    lead_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_meeting_date UNIQUE (meeting_id, completed_date)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_logs ENABLE ROW LEVEL SECURITY;

-- 4. Helper Functions for RBAC & Approval Checks (Case-Insensitive)
CREATE OR REPLACE FUNCTION public.is_approved_user(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id
          AND (is_active = true OR is_active IS NULL)
          AND (LOWER(approval_status) = 'approved' OR role = 'Admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = user_id
          AND role = 'Admin'
          AND (is_active = true OR is_active IS NULL)
          AND (LOWER(approval_status) = 'approved' OR role = 'Admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 5. RLS Policies for public.meetings
DROP POLICY IF EXISTS "Allow public read access to meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow public insert/update/delete access to meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow approved users to view all meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow approved users to view meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow Admins only to insert meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow Admins only to update meetings" ON public.meetings;
DROP POLICY IF EXISTS "Allow Admins only to delete meetings" ON public.meetings;

CREATE POLICY "Allow approved users to view all meetings"
    ON public.meetings FOR SELECT
    TO authenticated
    USING (
      public.is_approved_user(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (LOWER(approval_status) = 'approved' OR role = 'Admin')
      )
    );

CREATE POLICY "Allow Admins only to insert meetings"
    ON public.meetings FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Allow Admins only to update meetings"
    ON public.meetings FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Allow Admins only to delete meetings"
    ON public.meetings FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- 6. RLS Policies for public.meeting_logs
DROP POLICY IF EXISTS "Allow public read access to meeting_logs" ON public.meeting_logs;
DROP POLICY IF EXISTS "Allow public insert/update/delete access to meeting_logs" ON public.meeting_logs;
DROP POLICY IF EXISTS "Allow approved users to view meeting_logs" ON public.meeting_logs;
DROP POLICY IF EXISTS "Allow Admins only to insert meeting_logs" ON public.meeting_logs;
DROP POLICY IF EXISTS "Allow Admins only to update meeting_logs" ON public.meeting_logs;
DROP POLICY IF EXISTS "Allow Admins only to delete meeting_logs" ON public.meeting_logs;

CREATE POLICY "Allow approved users to view meeting_logs"
    ON public.meeting_logs FOR SELECT
    TO authenticated
    USING (
      public.is_approved_user(auth.uid()) OR
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND (LOWER(approval_status) = 'approved' OR role = 'Admin')
      )
    );

CREATE POLICY "Allow Admins only to insert meeting_logs"
    ON public.meeting_logs FOR INSERT
    TO authenticated
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Allow Admins only to update meeting_logs"
    ON public.meeting_logs FOR UPDATE
    TO authenticated
    USING (public.is_admin(auth.uid()))
    WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Allow Admins only to delete meeting_logs"
    ON public.meeting_logs FOR DELETE
    TO authenticated
    USING (public.is_admin(auth.uid()));

-- 7. Storage Bucket Security Policies for meeting-proofs
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-proofs', 'meeting-proofs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Allow public select on meeting-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public insert/upload on meeting-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on meeting-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow approved users select on meeting-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow Admins upload on meeting-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow Admins update on meeting-proofs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow Admins delete on meeting-proofs bucket" ON storage.objects;

CREATE POLICY "Allow approved users select on meeting-proofs bucket"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'meeting-proofs');

CREATE POLICY "Allow Admins upload on meeting-proofs bucket"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'meeting-proofs' AND public.is_admin(auth.uid()));

CREATE POLICY "Allow Admins update on meeting-proofs bucket"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'meeting-proofs' AND public.is_admin(auth.uid()))
    WITH CHECK (bucket_id = 'meeting-proofs' AND public.is_admin(auth.uid()));

CREATE POLICY "Allow Admins delete on meeting-proofs bucket"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'meeting-proofs' AND public.is_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_meetings_unit ON public.meetings(unit);
CREATE INDEX IF NOT EXISTS idx_meeting_logs_meeting_date ON public.meeting_logs(meeting_id, completed_date);
