-- =============================================
-- ORAII Patient Portal — Database Migration
-- 5 new tables + RLS policies
-- =============================================

-- mood_logs: daily mood check-in (1-10 scale + journal)
CREATE TABLE IF NOT EXISTS mood_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mood_score INT CHECK (mood_score BETWEEN 1 AND 10),
  journal_entry TEXT,
  activities TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- chat_messages: ORAII chatbot conversation history
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- emergency_contacts: patient's emergency contacts + Stanley-Brown plan
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  relationship TEXT,
  is_primary BOOLEAN DEFAULT false,
  safety_plan JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- screening_results: PHQ-9/GAD-7 self-administered by patient
CREATE TABLE IF NOT EXISTS screening_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  instrument TEXT NOT NULL,
  item_scores INT[] NOT NULL,
  total_score INT NOT NULL,
  severity_label TEXT NOT NULL,
  synced_to_doctor BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- finding_purpose_entries: Ikigai/ACT/MI reflections
CREATE TABLE IF NOT EXISTS finding_purpose_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Row Level Security
-- =============================================

ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE screening_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE finding_purpose_entries ENABLE ROW LEVEL SECURITY;

-- Patients own their data
CREATE POLICY "Patients own their mood_logs" ON mood_logs
  FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Patients own their chat_messages" ON chat_messages
  FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Patients own their emergency_contacts" ON emergency_contacts
  FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Patients own their screening_results" ON screening_results
  FOR ALL USING (auth.uid() = patient_id);

CREATE POLICY "Patients own their finding_purpose_entries" ON finding_purpose_entries
  FOR ALL USING (auth.uid() = patient_id);

-- Doctor read access to screening_results (cross-portal sync)
CREATE POLICY "Doctors can read patient screening_results" ON screening_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = screening_results.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mood_logs_patient ON mood_logs(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_patient ON chat_messages(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screening_results_patient ON screening_results(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_patient ON emergency_contacts(patient_id);
CREATE INDEX IF NOT EXISTS idx_finding_purpose_patient ON finding_purpose_entries(patient_id, created_at DESC);
