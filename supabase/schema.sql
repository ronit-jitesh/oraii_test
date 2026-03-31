-- =============================================
-- Clinical Co-Pilot Database Schema
-- Run this in Supabase Dashboard → SQL Editor
-- =============================================

-- Sessions table: stores recorded sessions with SOAP notes
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  transcript TEXT NOT NULL,
  soap_note JSONB,
  entities JSONB,
  role_analysis JSONB,
  note_format TEXT DEFAULT 'soap',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create index for faster user queries
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own sessions" ON sessions
  FOR DELETE USING (auth.uid() = user_id);

-- For MVP testing without auth, allow anonymous inserts
CREATE POLICY "Allow anonymous inserts for MVP" ON sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow anonymous select for MVP" ON sessions
  FOR SELECT USING (true);
