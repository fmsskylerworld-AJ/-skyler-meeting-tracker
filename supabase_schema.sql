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
    photos TEXT[] DEFAULT '{}'::TEXT[], -- Public URLs from Supabase Storage
    mom TEXT,
    actual_attendees TEXT[] DEFAULT '{}'::TEXT[],
    lead_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_meeting_date UNIQUE (meeting_id, completed_date)
);

-- 3. Enable Row Level Security (RLS) for Future Auth Integration
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies (Allow Read / Write for Anon Key)
CREATE POLICY "Allow public read access to meetings" 
    ON public.meetings FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update/delete access to meetings" 
    ON public.meetings FOR ALL USING (true);

CREATE POLICY "Allow public read access to meeting_logs" 
    ON public.meeting_logs FOR SELECT USING (true);

CREATE POLICY "Allow public insert/update/delete access to meeting_logs" 
    ON public.meeting_logs FOR ALL USING (true);

-- 5. Create Storage Bucket for Meeting Proof Photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('meeting-proofs', 'meeting-proofs', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Storage Bucket Security Policies
CREATE POLICY "Allow public select on meeting-proofs bucket" 
    ON storage.objects FOR SELECT 
    USING (bucket_id = 'meeting-proofs');

CREATE POLICY "Allow public insert/upload on meeting-proofs bucket" 
    ON storage.objects FOR INSERT 
    WITH CHECK (bucket_id = 'meeting-proofs');

CREATE POLICY "Allow public delete on meeting-proofs bucket" 
    ON storage.objects FOR DELETE 
    USING (bucket_id = 'meeting-proofs');

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_meetings_unit ON public.meetings(unit);
CREATE INDEX IF NOT EXISTS idx_meeting_logs_meeting_date ON public.meeting_logs(meeting_id, completed_date);
