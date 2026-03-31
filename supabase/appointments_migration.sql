-- =============================================
-- Clinical Co-Pilot: Appointments Migration
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- 1. Create appointments table
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  requested_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_requested_time ON appointments(requested_time);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Doctors can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own appointments" ON appointments
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own appointments" ON appointments
  FOR DELETE USING (auth.uid() = doctor_id);

-- MVP: Anonymous access for testing
CREATE POLICY "Allow anonymous insert appointments for MVP" ON appointments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select appointments for MVP" ON appointments
  FOR SELECT USING (true);

CREATE POLICY "Allow anonymous update appointments for MVP" ON appointments
  FOR UPDATE USING (true);
