-- =============================================
-- Clinical Co-Pilot: Patient Management Migration
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  age INT,
  primary_complaint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);

-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patients
CREATE POLICY "Users can view own patients" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patients" ON patients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patients" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patients" ON patients
  FOR DELETE USING (auth.uid() = user_id);

-- MVP: Allow anonymous access for testing
CREATE POLICY "Allow anonymous insert patients for MVP" ON patients
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select patients for MVP" ON patients
  FOR SELECT USING (true);

-- 2. Add patient_id to sessions (nullable for backward compatibility)
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS patient_id UUID REFERENCES patients(id);
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON sessions(patient_id);
