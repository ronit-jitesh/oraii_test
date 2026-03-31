-- =============================================
-- Clinical Intelligence OS: Outcome Assessments
-- Validated PHQ-9 & GAD-7 Instrument Tracking
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Create outcome_assessments table
CREATE TABLE IF NOT EXISTS outcome_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,

  -- Instrument type
  instrument TEXT NOT NULL CHECK (instrument IN ('PHQ-9', 'GAD-7')),

  -- Individual item responses (array of 0-3 integers)
  item_scores JSONB NOT NULL DEFAULT '[]',

  -- Computed totals
  total_score INT NOT NULL DEFAULT 0,
  severity_label TEXT NOT NULL DEFAULT 'Minimal',

  -- Timestamps
  administered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_outcome_patient_id ON outcome_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_outcome_user_id ON outcome_assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_outcome_instrument ON outcome_assessments(instrument);
CREATE INDEX IF NOT EXISTS idx_outcome_administered_at ON outcome_assessments(administered_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE outcome_assessments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies (matching project pattern)
CREATE POLICY "Users can view own assessments" ON outcome_assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments" ON outcome_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own assessments" ON outcome_assessments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own assessments" ON outcome_assessments
  FOR DELETE USING (auth.uid() = user_id);

-- MVP: Anonymous access for testing
CREATE POLICY "Allow anonymous insert assessments for MVP" ON outcome_assessments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select assessments for MVP" ON outcome_assessments
  FOR SELECT USING (true);
