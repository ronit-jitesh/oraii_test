-- =============================================
-- MindOS — Brainwave Gamification Tables
-- Run this in Supabase SQL Editor
-- =============================================

-- Journal entries (persists across sessions)
CREATE TABLE IF NOT EXISTS mindos_journal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  prompt TEXT,
  wave TEXT,
  mood_state TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Session history
CREATE TABLE IF NOT EXISTS mindos_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_id TEXT NOT NULL,
  wave TEXT NOT NULL,
  soundscape TEXT,
  duration_secs INT,
  xp_earned INT,
  completed_at TIMESTAMPTZ DEFAULT now()
);

-- XP + streak progress (one row per user, upserted on each XP award)
CREATE TABLE IF NOT EXISTS mindos_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  xp INT DEFAULT 0,
  streak INT DEFAULT 0,
  last_active DATE,
  daily_xp_today INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE mindos_journal  ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindos_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mindos_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users own their mindos_journal"
  ON mindos_journal FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their mindos_sessions"
  ON mindos_sessions FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own their mindos_progress"
  ON mindos_progress FOR ALL USING (auth.uid() = user_id);

-- ── Indexes ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_mindos_journal_user
  ON mindos_journal(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_mindos_sessions_user
  ON mindos_sessions(user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_mindos_progress_user
  ON mindos_progress(user_id);
